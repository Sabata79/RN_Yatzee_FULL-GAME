import Header from './Header';
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
// Scoreboard screen: shows player rankings (all time, monthly, weekly) and allows viewing player cards
import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, Image, Animated } from 'react-native';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import scoreboardStyles from '../styles/ScoreboardScreenStyles';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import * as SecureStore from 'expo-secure-store';
import PlayerCard from '../components/PlayerCard';
import { useGame } from '../constants/GameContext';
import { avatars } from '../constants/AvatarPaths';
import { dbOnValue } from '../services/Firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';


export default function Scoreboard() {
  const [tabVisible, setTabVisible] = useState(true);
  const tabAnim = useState(new Animated.Value(0))[0]; // 0 = näkyvissä, -60 = piilossa
  const scrollOffset = useRef(0);
  const [scores, setScores] = useState([]);
  const [scoreType, setScoreType] = useState('allTime');
  const [userId, setUserId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const { viewingPlayerId, viewingPlayerName, setViewingPlayerId, setViewingPlayerName } = useGame();

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();


  useEffect(() => {
  // Fetch userId from secure storage
    SecureStore.getItemAsync('user_id').then((storedUserId) => {
      if (storedUserId) setUserId(storedUserId);
    });

    const handle = (snapshot) => {
      const playersData = snapshot.val();
      const tmpScores = [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentWeek = getWeekNumber(new Date());

      if (playersData) {
        Object.keys(playersData).forEach(playerId => {
          const player = playersData[playerId];
          if (player.scores) {
            let scoresToUse = [];

            if (scoreType === 'monthly') {
              scoresToUse = Object.values(player.scores).filter(score => {
                const parts = score.date.split('.');
                if (parts.length !== 3) return false;
                const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (isNaN(d)) return false;
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              });
            } else if (scoreType === 'weekly') {
              scoresToUse = Object.values(player.scores).filter(score => {
                const parts = score.date.split('.');
                if (parts.length !== 3) return false;
                const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (isNaN(d)) return false;
                return getWeekNumber(d) === currentWeek;
              });
            } else {
              scoresToUse = Object.values(player.scores);
            }

            if (scoresToUse.length > 0) {
              let bestScore = null;
              scoresToUse.forEach(score => {
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
                tmpScores.push({
                  ...bestScore,
                  name: player.name,
                  playerId,
                  avatar: player.avatar || null,
                  scores: Object.values(player.scores),
                });
              }
            }
          }
        });

        const sorted = tmpScores.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.duration !== b.duration) return a.duration - b.duration;
          return new Date(a.date) - new Date(b.date);
        });

        setScores(sorted);
      } else {
        setScores([]);
      }
    };

    const unsubscribe = dbOnValue('players', handle);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [scoreType]);

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
              transform: [{ translateY: tabAnim }],
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
                transform: [{ translateY: tabAnim }],
                position: 'absolute',
                top: 70, // headerin korkeus px
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
            contentContainerStyle={{
              paddingTop: 120, // header + tabit
              paddingBottom: insets.bottom + tabBarHeight + 16,
            }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={event => {
              const currentOffset = event.nativeEvent.contentOffset.y;
              const diff = currentOffset - scrollOffset.current;
              if (diff > 10) {
                // Scrollataan alas, piilota header+tabit
                Animated.timing(tabAnim, {
                  toValue: -120,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
              } else if (diff < -10) {
                // Scrollataan ylös, näytä header+tabit
                Animated.timing(tabAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start();
              }
              scrollOffset.current = currentOffset;
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

                  return (
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
                                  <FontAwesome5 name="user" size={22} color="white" />
                                </View>
                              );
                            }
                          })()}
                          <Text style={scoreboardStyles.playerNameText}>{score.name}</Text>
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
