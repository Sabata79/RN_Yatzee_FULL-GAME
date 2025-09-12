/**
 * Scoreboard.js - Screen for displaying player rankings and player cards
 *
 * Scroll-aware row reveal (Animated.FlatList + viewability).
 * Tabs hide first, then header, using diffClamp + interpolate (useNativeDriver).
 *
 * @module screens/Scoreboard
 * @author ...
 * @since 2025-09-06 (stagger refactor 2025-09-12)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  Animated,
  FlatList,
} from 'react-native';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import scoreboardStyles from '../styles/ScoreboardScreenStyles';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import * as SecureStore from 'expo-secure-store';
import PlayerCard from '../components/PlayerCard';
import { useGame } from '../constants/GameContext';
import { avatars } from '../constants/AvatarPaths';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Header from './Header';

const AFlatList = Animated.createAnimatedComponent(FlatList);

// Layout constants
const HEADER_H = 70;
const TABS_H = 50;
const ROW_H = 56; // approx row height for auto-scroll

const getDurationDotColor = (secs) =>
  secs > 300 ? COLORS.error : secs > 150 ? COLORS.warning : COLORS.success;

export default function Scoreboard() {
  // Animated scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  // diffClamp ensures 0..HEADER_H+TABS_H
  const clampedY = Animated.diffClamp(scrollY, 0, HEADER_H + TABS_H);

  // Tabs hide first: 0..TABS_H -> translate 0..-TABS_H
  const tabsTranslateY = clampedY.interpolate({
    inputRange: [0, TABS_H],
    outputRange: [0, -TABS_H],
    extrapolate: 'clamp',
  });

  // Then header: TABS_H..(TABS_H+HEADER_H) -> 0..-HEADER_H
  const headerTranslateY = clampedY.interpolate({
    inputRange: [TABS_H, TABS_H + HEADER_H],
    outputRange: [0, -HEADER_H],
    extrapolate: 'clamp',
  });

  // Pulse for current user
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Data/state
  const [scores, setScores] = useState([]);
  const [scoreType, setScoreType] = useState('allTime'); // allTime | monthly | weekly
  const [userId, setUserId] = useState('');

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Refs
  const listRef = useRef(null);

  // Context
  const { setViewingPlayerId, setViewingPlayerName, scoreboardData } = useGame();

  // Insets
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Fast avatar lookup
  const avatarMap = useMemo(() => {
    const m = new Map();
    avatars.forEach((a) => {
      m.set(a.path, a);
      const parts = a.path.split('/');
      m.set(parts[parts.length - 1], a);
    });
    return m;
  }, []);

  // Per-row appearance anims
  const animMap = useRef(new Map()).current;  // key -> Animated.Value(0..1)
  const revealedSet = useRef(new Set()).current;

  const getAnimForKey = (key) => {
    if (!animMap.has(key)) animMap.set(key, new Animated.Value(0));
    return animMap.get(key);
  };

  // ISO week helper
  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Load user id once
  useEffect(() => {
    SecureStore.getItemAsync('user_id').then((storedUserId) => {
      if (storedUserId) setUserId(storedUserId);
    });
  }, []);

  // Filter/sort per scoreType
  useEffect(() => {
    if (!scoreboardData) {
      setScores([]);
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);

    const filtered = scoreboardData
      .map((player) => {
        let pool = player.scores || [];
        if (scoreType === 'monthly') {
          pool = pool.filter((score) => {
            const parts = (score.date || '').split('.');
            if (parts.length !== 3) return false;
            const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            return !isNaN(d) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          });
        } else if (scoreType === 'weekly') {
          pool = pool.filter((score) => {
            const parts = (score.date || '').split('.');
            if (parts.length !== 3) return false;
            const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            return !isNaN(d) && getWeekNumber(d) === currentWeek;
          });
        }

        let best = null;
        pool.forEach((s) => {
          if (
            !best ||
            s.points > best.points ||
            (s.points === best.points && s.duration < best.duration) ||
            (s.points === best.points && s.duration === best.duration &&
              new Date(s.date) < new Date(best.date))
          ) {
            best = s;
          }
        });

        if (!best) return null;
        return {
          ...best,
          name: player.name,
          playerId: player.playerId,
          avatar: player.avatar || null,
          scores: player.scores,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (a.duration !== b.duration) return a.duration - b.duration;
        return new Date(a.date) - new Date(b.date);
      });

    setScores(filtered);
    // reset reveal when data changes
    animMap.clear();
    revealedSet.clear();
  }, [scoreType, scoreboardData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to user + pulse
  useEffect(() => {
    if (!listRef.current || !userId || scores.length === 0) return;
    const idx = scores.findIndex((s) => s.playerId === userId);
    if (idx !== -1) {
      setTimeout(() => {
        listRef.current.scrollToOffset({
          offset: (HEADER_H + TABS_H + 10) + ROW_H * idx,
          animated: true,
        });
      }, 400);

      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.04, duration: 160, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    }
  }, [userId, scores, scaleAnim]);

  // Reveal rows when they become visible
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    viewableItems.forEach(({ item, index }) => {
      if (!item) return;
      const key = `${item.playerId}-${index}`;
      if (revealedSet.has(key)) return;
      revealedSet.add(key);

      const anim = getAnimForKey(key);
      Animated.timing(anim, {
        toValue: 1,
        duration: 260,
        delay: (index % 6) * 40,
        useNativeDriver: true,
      }).start();
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 40,
    minimumViewTime: 40,
  }).current;

  // Avatar style helper
  const getAvatarStyle = (avatarPath) => {
    const avatar =
      avatarMap.get(avatarPath) ||
      avatarMap.get((avatarPath || '').split('/').pop());
    if (!avatar) return scoreboardStyles.defaultAvatarIcon;
    if (avatar.level === 'Beginner') return scoreboardStyles.beginnerAvatar;
    if (avatar.level === 'Advanced') return scoreboardStyles.advancedAvatar;
    return scoreboardStyles.avatar;
  };

  // Modal open
  const openPlayerCard = (playerId, playerName, playerScores) => {
    setSelectedPlayer({ playerId, playerName, playerScores });
    setViewingPlayerId(playerId);
    setViewingPlayerName(playerName);
    requestAnimationFrame(() => setModalVisible(true));
  };

  // Sticky header + tabs (absolute)
  const renderStickyBars = () => (
    <>
      <Animated.View
        style={{
          transform: [{ translateY: headerTranslateY }],
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_H,
          zIndex: 20,
        }}
      >
        <Header />
      </Animated.View>

      <Animated.View
        style={[
          scoreboardStyles.tabContainer,
          {
            position: 'absolute',
            top: HEADER_H,
            left: 0,
            right: 0,
            height: TABS_H,
            zIndex: 10,
            transform: [{ translateY: tabsTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={scoreType === 'allTime' ? scoreboardStyles.activeTab : scoreboardStyles.inactiveTab}
          onPress={() => setScoreType('allTime')}
        >
          <Text style={scoreboardStyles.tabText}>All Time</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={scoreType === 'monthly' ? scoreboardStyles.activeTab : scoreboardStyles.inactiveTab}
          onPress={() => setScoreType('monthly')}
        >
          <Text style={scoreboardStyles.tabText}>Monthly</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={scoreType === 'weekly' ? scoreboardStyles.activeTab : scoreboardStyles.inactiveTab}
          onPress={() => setScoreType('weekly')}
        >
          <Text style={scoreboardStyles.tabText}>Weekly</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );

  // Table header row
  const listTableHeader = () => (
    <DataTable.Header>
      <DataTable.Title style={[scoreboardStyles.rankHeaderCell]}>
        <Text style={scoreboardStyles.scoreboardHeader}>Rank #</Text>
      </DataTable.Title>
      <DataTable.Title style={[scoreboardStyles.playerHeaderCell]}>
        <Text style={scoreboardStyles.scoreboardHeader}>Player</Text>
      </DataTable.Title>
      <DataTable.Title style={[scoreboardStyles.durationHeaderCell]}>
        <Text style={scoreboardStyles.scoreboardHeader}>Duration</Text>
      </DataTable.Title>
      <DataTable.Title style={[scoreboardStyles.pointsHeaderCell]}>
        <Text style={scoreboardStyles.scoreboardHeader}>Points</Text>
      </DataTable.Title>
    </DataTable.Header>
  );

  // Render each row with appear animation (+ pulse if current user)
  const renderItem = ({ item, index }) => {
    if (!item || index >= NBR_OF_SCOREBOARD_ROWS) return null;

    const key = `${item.playerId}-${index}`;
    const appear = getAnimForKey(key); // 0..1
    const isCurrentUser = item.playerId === userId;

    const rowTransforms = [
      { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
    ];
    if (isCurrentUser) rowTransforms.push({ scale: scaleAnim });

    return (
      <Animated.View
        style={{
          opacity: appear,
          transform: rowTransforms,
        }}
      >
        <DataTable.Row
          onPress={() => openPlayerCard(item.playerId, item.name, item.scores)}
          style={isCurrentUser ? { backgroundColor: '#d3bd867a' } : null}
        >
          <DataTable.Cell style={[scoreboardStyles.rankCell]}>
            {index === 0 && (
              <View style={scoreboardStyles.medalWrapper}>
                <Image source={require('../../assets/medals/firstMedal.webp')} style={scoreboardStyles.medal} />
              </View>
            )}
            {index === 1 && (
              <View style={scoreboardStyles.medalWrapper}>
                <Image source={require('../../assets/medals/silverMedal.webp')} style={scoreboardStyles.medal} />
              </View>
            )}
            {index === 2 && (
              <View style={scoreboardStyles.medalWrapper}>
                <Image source={require('../../assets/medals/bronzeMedal.webp')} style={scoreboardStyles.medal} />
              </View>
            )}
            {index > 2 && <Text style={scoreboardStyles.rankText}>{index + 1}.</Text>}
          </DataTable.Cell>

          <DataTable.Cell style={[scoreboardStyles.playerCell]}>
            <View style={scoreboardStyles.playerWrapper}>
              {(() => {
                const avatarObj =
                  avatarMap.get(item.avatar) ||
                  avatarMap.get((item.avatar || '').split('/').pop());
                if (avatarObj && avatarObj.display) {
                  return <Image source={avatarObj.display} style={getAvatarStyle(avatarObj.path)} />;
                }
                return (
                  <View style={scoreboardStyles.defaultAvatarIcon}>
                    <FontAwesome5 name="user" size={22} color="#d1d8e0" />
                  </View>
                );
              })()}
              <Text
                style={
                  isCurrentUser
                    ? [
                      scoreboardStyles.playerNameText,
                      {
                        color: COLORS.white,
                        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
                        fontSize: TYPOGRAPHY.fontSize.md,
                      },
                    ]
                    : scoreboardStyles.playerNameText
                }
              >
                {item.name}
              </Text>
            </View>
          </DataTable.Cell>

          <DataTable.Cell style={[scoreboardStyles.durationCell]}>
            <View style={scoreboardStyles.durationCellContent}>
              <View
                style={[
                  scoreboardStyles.timeDot,
                  { backgroundColor: getDurationDotColor(item.duration) },
                ]}
              />
              <Text style={scoreboardStyles.durationText}>{item.duration}s</Text>
            </View>
          </DataTable.Cell>


          <DataTable.Cell style={[scoreboardStyles.pointsCell]}>
            <Text style={scoreboardStyles.pointsText}>{item.points}</Text>
          </DataTable.Cell>
        </DataTable.Row>
      </Animated.View>
    );
  };

  const keyExtractor = (item, index) => `${item.playerId}-${index}`;

  const dataSlice = useMemo(
    () => scores.slice(0, NBR_OF_SCOREBOARD_ROWS),
    [scores]
  );

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/diceBackground.webp')}
        style={scoreboardStyles.background}
      >
        <View style={scoreboardStyles.overlay}>

          {renderStickyBars()}

          <AFlatList
            ref={listRef}
            data={dataSlice}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListHeaderComponent={() => (
              <View style={{ paddingTop: HEADER_H + TABS_H + 10 }}>
                <DataTable style={scoreboardStyles.scoreboardContainer}>
                  {listTableHeader()}
                </DataTable>
              </View>
            )}
            contentContainerStyle={{
              paddingBottom: insets.bottom + tabBarHeight + 16,
            }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
          />

          {modalVisible && selectedPlayer && (
            <PlayerCard
              playerId={selectedPlayer.playerId}
              playerName={selectedPlayer.playerName}
              playerScores={selectedPlayer.playerScores}
              isModalVisible={modalVisible}
              setModalVisible={(v) => {
                if (!v) {
                  setModalVisible(false);
                  setSelectedPlayer(null);
                  setViewingPlayerId('');
                  setViewingPlayerName('');
                } else {
                  setModalVisible(true);
                }
              }}
            />
          )}
        </View>
      </ImageBackground>
    </View>
  );
}
