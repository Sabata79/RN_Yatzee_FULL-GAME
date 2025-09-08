/**
 * Scoreboard.js - Screen for displaying player rankings and player cards
 *
 * Contains the leaderboard and logic for viewing player cards and rankings.
 *
 * Usage:
 *   import Scoreboard from './Scoreboard';
 *   ...
 *   <Scoreboard />
 *
 * @module screens/Scoreboard
 * @author Sabata79
 * @since 2025-09-06
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import scoreboardStyles from '../styles/ScoreboardScreenStyles';
import { COLORS } from '../constants/colors';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import * as SecureStore from 'expo-secure-store';
import PlayerCard from '../components/PlayerCard';
import { useGame } from '../constants/GameContext';
import { avatars } from '../constants/AvatarPaths';
// ...existing code...
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Header from './Header';


export default function Scoreboard() {
  const tabAnim = useRef(new Animated.Value(0)).current; // 0 = näkyvissä, -50 = piilossa
  const headerAnim = useRef(new Animated.Value(0)).current; // 0 = näkyvissä, -70 = piilossa
  const scrollOffset = useRef(0);
  const [tabHidden, setTabHidden] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [scores, setScores] = useState([]); // filtered scoreboardData
  const [scoreType, setScoreType] = useState('allTime');
  const [userId, setUserId] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { viewingPlayerId, viewingPlayerName, setViewingPlayerId, setViewingPlayerName, scoreboardData } = useGame();

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Scrollaa automaattisesti pelaajan riville kun näkymä avataan
  const scrollViewRef = useRef(null);
  useEffect(() => {
    if (scrollViewRef.current && userId && scores.length > 0) {
      const idx = scores.findIndex(s => s.playerId === userId);
      if (idx !== -1) {
        setTimeout(() => {
          scrollViewRef.current.scrollTo({ y: 60 * idx, animated: true });
        }, 400);
      }
    }
  }, [userId, scores]);

  // Fetch userId from secure storage (once)
  useEffect(() => {
    SecureStore.getItemAsync('user_id').then((storedUserId) => {
      if (storedUserId) setUserId(storedUserId);
    });
  }, []);

  // Filter scoreboardData from context based on scoreType
  useEffect(() => {
    if (!scoreboardData) {
      setScores([]);
      return;
    }
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentWeek = getWeekNumber(new Date());

    const filterScores = (data) => {
      return data.map(player => {
        let filteredScores = [];
        if (scoreType === 'monthly') {
          filteredScores = player.scores.filter(score => {
            const parts = score.date.split('.');
            if (parts.length !== 3) return false;
            const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (isNaN(d)) return false;
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          });
        } else if (scoreType === 'weekly') {
          filteredScores = player.scores.filter(score => {
            const parts = score.date.split('.');
            if (parts.length !== 3) return false;
            const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            if (isNaN(d)) return false;
            return getWeekNumber(d) === currentWeek;
          });
        } else {
          filteredScores = player.scores;
        }
        // Pick best score for this player in this filter
        let bestScore = null;
        filteredScores.forEach(score => {
          if (
            !bestScore ||
            score.points > bestScore.points ||
            (score.points === bestScore.points && score.duration < bestScore.duration) ||
            (score.points === bestScore.points && score.duration === bestScore.duration &&
              new Date(score.date) < new Date(bestScore.date))
          ) {
            bestScore = score;
          }
        });
        if (bestScore) {
          return {
            ...bestScore,
            name: player.name,
            playerId: player.playerId,
            avatar: player.avatar || null,
            scores: player.scores,
          };
        }
        return null;
      }).filter(Boolean);
    };

    // Sort filtered scores
    const filtered = filterScores(scoreboardData).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (a.duration !== b.duration) return a.duration - b.duration;
      return new Date(a.date) - new Date(b.date);
    });
    setScores(filtered);
  }, [scoreType, scoreboardData]);

  // ISO week number (Mon–Sun)
  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // Sunday=7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Handle player card selection
  const handlePlayerCard = (playerId, playerName, playerScores) => {
    const player = { playerId, playerName, playerScores };
    setSelectedPlayer(player);
    setViewingPlayerId(playerId);
    setViewingPlayerName(playerName);
    requestAnimationFrame(() => setModalVisible(true));
  };

  // Get avatar style based on player level
  const getAvatarStyle = (avatarPath) => {
    const avatar = avatars.find((av) => av.path === avatarPath);
    if (!avatar) return scoreboardStyles.defaultAvatarIcon;
    if (avatar.level === 'Beginner') return scoreboardStyles.beginnerAvatar;
    if (avatar.level === 'Advanced') return scoreboardStyles.advancedAvatar;
    return scoreboardStyles.avatar;
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/diceBackground.webp')}
        style={scoreboardStyles.background}
      >
        <View style={scoreboardStyles.overlay}>
          <Animated.View
            style={{
              transform: [{ translateY: headerAnim }],
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 20,
            }}
          >
            <Header />
          </Animated.View>
          <Animated.View
            style={[
              scoreboardStyles.tabContainer,
              {
                transform: [{ translateY: Animated.add(Animated.add(headerAnim, new Animated.Value(70)), tabAnim) }],
                position: 'absolute',
                left: 0,
                right: 0,
                zIndex: 10,
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

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{
              paddingTop: 80, // header + tabit
              paddingBottom: insets.bottom + tabBarHeight + 16,
            }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={event => {
              const currentOffset = event.nativeEvent.contentOffset.y;
              // Scrollataan alas
              if (currentOffset > scrollOffset.current) {
                if (!tabHidden) {
                  Animated.timing(tabAnim, {
                    toValue: -50,
                    duration: 150,
                    useNativeDriver: true,
                  }).start(() => setTabHidden(true));
                } else if (!headerHidden) {
                  Animated.timing(headerAnim, {
                    toValue: -70,
                    duration: 150,
                    useNativeDriver: true,
                  }).start(() => setHeaderHidden(true));
                }
              }
              // Scrollataan ylös
              else if (currentOffset < scrollOffset.current) {
                if (headerHidden) {
                  Animated.timing(headerAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                  }).start(() => {
                    setHeaderHidden(false);
                    // Palautetaan myös tabAnim, jotta tabit eivät jää piiloon
                    Animated.timing(tabAnim, {
                      toValue: 0,
                      duration: 150,
                      useNativeDriver: true,
                    }).start(() => setTabHidden(false));
                  });
                } else if (tabHidden) {
                  Animated.timing(tabAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                  }).start(() => setTabHidden(false));
                }
              }
              scrollOffset.current = currentOffset;
            }}
            onContentSizeChange={(contentWidth, contentHeight) => {
              // Jos sisältö ei ylitä ruutua, palautetaan header ja tabit näkyviin
              const windowHeight = Dimensions.get('window').height;
              if (contentHeight <= windowHeight) {
                Animated.timing(headerAnim, {
                  toValue: 0,
                  duration: 150,
                  useNativeDriver: true,
                }).start(() => setHeaderHidden(false));
                Animated.timing(tabAnim, {
                  toValue: 0,
                  duration: 150,
                  useNativeDriver: true,
                }).start(() => setTabHidden(false));
              }
            }}
          >
            {scores.length === 0 ? (
              <Text style={scoreboardStyles.scoreboardText}>No scores yet</Text>
            ) : (
              <DataTable style={scoreboardStyles.scoreboardContainer}>
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

                {scores.slice(0, NBR_OF_SCOREBOARD_ROWS).map((score, index) => {
                  const isCurrentUser = score.playerId === userId;
                  const rowContent = (
                    <DataTable.Row
                      key={`${score.playerId}-${index}`}
                      onPress={() => handlePlayerCard(score.playerId, score.name, score.scores)}
                      style={isCurrentUser ? { backgroundColor: '#d3bd867a' } : {}}
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
                            const avatarObj = avatars.find((a) => a.path.endsWith(score.avatar));
                            if (avatarObj && avatarObj.display) {
                              return <Image source={avatarObj.display} style={getAvatarStyle(avatarObj.path)} />;
                            } else {
                              return (
                                <View style={scoreboardStyles.defaultAvatarIcon}>
                                  <FontAwesome5 name="user" size={22} color='#d1d8e0' />
                                </View>
                              );
                            }
                          })()}
                          <Text style={isCurrentUser ? [scoreboardStyles.playerNameText, { color: COLORS.success, fontWeight: 'bold' }] : scoreboardStyles.playerNameText}>
                            {score.name}
                          </Text>
                        </View>
                      </DataTable.Cell>
                      <DataTable.Cell style={[scoreboardStyles.durationCell]}>
                        <Text style={scoreboardStyles.durationText}>{score.duration}s</Text>
                      </DataTable.Cell>
                      <DataTable.Cell style={[scoreboardStyles.pointsCell]}>
                        <Text style={scoreboardStyles.pointsText}>{score.points}</Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  );
                  // Jos tämä on nykyinen käyttäjä, wräpätään Animated.Viewiin
                  if (isCurrentUser) {
                    return (
                      <Animated.View key={`anim-${score.playerId}-${index}`} style={{ transform: [{ scale: scaleAnim }] }}>
                        {rowContent}
                      </Animated.View>
                    );
                  } else {
                    return rowContent;
                  }
                })}
              </DataTable>
            )}
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
