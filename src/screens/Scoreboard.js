/**
 * Scoreboard.js - Screen for displaying player rankings and player cards
 *
 * Streamlined version:
 * - Swipe between All Time / Monthly / Weekly (ScrollView + pagingEnabled)
 * - Tabs stay in sync with swipe; tab press scrolls pager
 * - Weekly is default (also reset on focus)
 * - Derives rows synchronously (useMemo), no drip-in renders
 * - Auto-scrolls to current user's row on the active page
 *
 * @module screens/Scoreboard
 * @author Sabata79 
 * @since 2025-09-06 (streamlined 2025-09-17)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ScrollView,
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
import { useFocusEffect } from '@react-navigation/native';
import Header from './Header';

const ROW_H = 56; // approx row height for getItemLayout/scroll math
const SCREEN_WIDTH = Dimensions.get('window').width;

const TYPE_TO_INDEX = { allTime: 0, monthly: 1, weekly: 2 };
const INDEX_TO_TYPE = ['allTime', 'monthly', 'weekly'];

const getDurationDotColor = (secs) =>
  secs > 300 ? COLORS.error : secs > 150 ? COLORS.warning : COLORS.success;

// ISO week helper
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

export default function Scoreboard() {
  // UI state
  const [scoreType, setScoreType] = useState('weekly'); // default Weekly
  const [userId, setUserId] = useState('');

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Pager + list refit
  const pagerRef = useRef(null);
  const listRefs = {
    allTime: useRef(null),
    monthly: useRef(null),
    weekly: useRef(null),
  };

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

  // Load user id once
  useEffect(() => {
    SecureStore.getItemAsync('user_id').then((storedUserId) => {
      if (storedUserId) setUserId(storedUserId);
    });
  }, []);

  // Ensure Weekly every time this screen focuses
  useFocusEffect(
    React.useCallback(() => {
      setScoreType('weekly');
    }, [])
  );

  // Laske kaikki kolme datasettiä yhdellä kertaa
  const { slices, indices } = useMemo(() => {
    if (!scoreboardData || scoreboardData.length === 0) {
      return {
        slices: { allTime: [], monthly: [], weekly: [] },
        indices: { allTime: -1, monthly: -1, weekly: -1 },
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);

    const makeFor = (mode) => {
      const filtered = scoreboardData
        .map((player) => {
          let pool = player.scores || [];
          if (mode === 'monthly') {
            pool = pool.filter((score) => {
              const parts = (score.date || '').split('.');
              if (parts.length !== 3) return false;
              const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              return !isNaN(d) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
          } else if (mode === 'weekly') {
            pool = pool.filter((score) => {
              const parts = (score.date || '').split('.');
              if (parts.length !== 3) return false;
              const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              return !isNaN(d) && getWeekNumber(d) === currentWeek;
            });
          }

          let best = null;
          for (const s of pool) {
            if (
              !best ||
              s.points > best.points ||
              (s.points === best.points && s.duration < best.duration) ||
              (s.points === best.points && s.duration === best.duration &&
                new Date(s.date) < new Date(best.date))
            ) {
              best = s;
            }
          }
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

      const slice = filtered.slice(0, NBR_OF_SCOREBOARD_ROWS);
      const idx = slice.findIndex((s) => s.playerId === userId);
      return { slice, idx };
    };

    const all  = makeFor('allTime');
    const mon  = makeFor('monthly');
    const week = makeFor('weekly');

    return {
      slices: { allTime: all.slice, monthly: mon.slice, weekly: week.slice },
      indices:{ allTime: all.idx,  monthly: mon.idx,  weekly: week.idx   },
    };
  }, [scoreboardData, userId]);

  // Synkkaa tabin klikkaus -> pager
  const goToType = (type) => {
    setScoreType(type);
    const page = TYPE_TO_INDEX[type] ?? 0;
    pagerRef.current?.scrollTo({ x: SCREEN_WIDTH * page, animated: true });
  };

  // Synkkaa pager swipe -> tab
  const onPageScrollEnd = ({ nativeEvent }) => {
    const page = Math.round(nativeEvent.contentOffset.x / nativeEvent.layoutMeasurement.width);
    const newType = INDEX_TO_TYPE[page] || 'allTime';
    if (newType !== scoreType) setScoreType(newType);
  };

  // Scroll to active tab page when scoreType changes (e.g., focus reset)
  useEffect(() => {
    const page = TYPE_TO_INDEX[scoreType] ?? 0;
    pagerRef.current?.scrollTo({ x: SCREEN_WIDTH * page, animated: true });
  }, [scoreType]);

  // Auto-scrollaa käyttäjän riviin aktiivisella sivulla
  useEffect(() => {
    const ref = listRefs[scoreType]?.current;
    const idx = indices[scoreType];
    if (!ref || idx < 0) return;
    requestAnimationFrame(() => {
      try {
        ref.scrollToIndex({ index: idx, animated: true });
      } catch {
        ref.scrollToOffset({ offset: ROW_H * idx, animated: true });
      }
    });
  }, [scoreType, indices]);

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

  // Tabs (kevyt, ei riippuvuutta erillisestä tabButton-tyylistä)
  const Tabs = () => (
    <View style={scoreboardStyles.tabContainer}>
      <TouchableOpacity
        style={[
          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
        scoreType === 'allTime' ? scoreboardStyles.activeTab : scoreboardStyles.inactiveTab,
        ]}
        onPress={() => goToType('allTime')}
      >
        <Text style={scoreboardStyles.tabText}>All Time</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
          scoreType === 'monthly' ? scoreboardStyles.activeTab : scoreboardStyles.inactiveTab,
        ]}
        onPress={() => goToType('monthly')}
      >
        <Text style={scoreboardStyles.tabText}>Monthly</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
          scoreType === 'weekly' ? scoreboardStyles.activeTab : scoreboardStyles.inactiveTab,
        ]}
        onPress={() => goToType('weekly')}
      >
        <Text style={scoreboardStyles.tabText}>Weekly</Text>
      </TouchableOpacity>
    </View>
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

  // Render each row (no animations)
  const renderItem = ({ item, index }) => {
    if (!item || index >= NBR_OF_SCOREBOARD_ROWS) return null;
    const isCurrentUser = item.playerId === userId;

    return (
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
    );
  };

  const keyExtractor = (item) => item.playerId;

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/diceBackground.webp')}
        style={scoreboardStyles.background}
      >
        <View style={scoreboardStyles.overlay}>
          <Header />
          <Tabs />

          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onPageScrollEnd}
          >
            {/* All Time */}
            <View style={{ width: SCREEN_WIDTH }}>
              <DataTable style={scoreboardStyles.scoreboardContainer}>
                {listTableHeader()}
              </DataTable>
              <FlatList
                ref={listRefs.allTime}
                data={slices.allTime}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: insets.bottom + tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
                initialNumToRender={NBR_OF_SCOREBOARD_ROWS}
                maxToRenderPerBatch={NBR_OF_SCOREBOARD_ROWS}
                windowSize={3}
                removeClippedSubviews={false}
                getItemLayout={(data, index) => ({ length: ROW_H, offset: ROW_H * index, index })}
              />
            </View>

            {/* Monthly */}
            <View style={{ width: SCREEN_WIDTH }}>
              <DataTable style={scoreboardStyles.scoreboardContainer}>
                {listTableHeader()}
              </DataTable>
              <FlatList
                ref={listRefs.monthly}
                data={slices.monthly}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: insets.bottom + tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
                initialNumToRender={NBR_OF_SCOREBOARD_ROWS}
                maxToRenderPerBatch={NBR_OF_SCOREBOARD_ROWS}
                windowSize={3}
                removeClippedSubviews={false}
                getItemLayout={(data, index) => ({ length: ROW_H, offset: ROW_H * index, index })}
              />
            </View>

            {/* Weekly */}
            <View style={{ width: SCREEN_WIDTH }}>
              <DataTable style={scoreboardStyles.scoreboardContainer}>
                {listTableHeader()}
              </DataTable>
              <FlatList
                ref={listRefs.weekly}
                data={slices.weekly}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: insets.bottom + tabBarHeight + 16 }}
                showsVerticalScrollIndicator={false}
                initialNumToRender={NBR_OF_SCOREBOARD_ROWS}
                maxToRenderPerBatch={NBR_OF_SCOREBOARD_ROWS}
                windowSize={3}
                removeClippedSubviews={false}
                getItemLayout={(data, index) => ({ length: ROW_H, offset: ROW_H * index, index })}
              />
            </View>
          </ScrollView>

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
