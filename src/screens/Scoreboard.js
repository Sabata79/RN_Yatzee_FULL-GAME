/**
 * Scoreboard - Screen for displaying player rankings and player cards.
 *
 * JSDoc comments and inline code comments must always be in English.
 * This file displays the leaderboard and allows viewing player cards.
 * @author Sabata79
 * @since 2025-08-29
 */
// Scoreboard screen: shows player rankings (all time, monthly, weekly) and allows viewing player cards
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import * as SecureStore from 'expo-secure-store';
import PlayerCard from '../components/PlayerCard';
import { useGame } from '../constants/GameContext';
import { avatars } from '../constants/AvatarPaths';
import { dbOnValue } from '../services/Firebase';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';


export default function Scoreboard() {
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
    if (!avatar) return styles.defaultAvatarIcon;
    if (avatar.level === 'Beginner') return styles.beginnerAvatar;
    if (avatar.level === 'Advanced') return styles.advancedAvatar;
    return styles.avatar;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/diceBackground.webp')}
        style={styles.background}
      >
        <View style={styles.overlay}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={{
              // Enough bottom padding: safe area + tabbar + small buffer
              paddingBottom: insets.bottom + tabBarHeight + 16,
              // Optional: add top padding if needed
              // paddingTop: 8,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.tabContainer}>
            <TouchableOpacity
              style={scoreType === 'allTime' ? styles.activeTab : styles.inactiveTab}
              onPress={() => setScoreType('allTime')}
            >
              <Text style={styles.tabText}>All Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={scoreType === 'monthly' ? styles.activeTab : styles.inactiveTab}
              onPress={() => setScoreType('monthly')}
            >
              <Text style={styles.tabText}>Monthly</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={scoreType === 'weekly' ? styles.activeTab : styles.inactiveTab}
              onPress={() => setScoreType('weekly')}
            >
              <Text style={styles.tabText}>Weekly</Text>
            </TouchableOpacity>
          </View>

          {scores.length === 0 ? (
            <Text style={styles.scoreboardText}>No scores yet</Text>
          ) : (
            <DataTable style={styles.scoreboardContainer}>
              <DataTable.Header>
                <DataTable.Title style={[styles.rankHeaderCell]}>
                  <Text style={styles.scoreboardHeader}>Rank #</Text>
                </DataTable.Title>
                <DataTable.Title style={[styles.playerHeaderCell]}>
                  <Text style={styles.scoreboardHeader}>Player</Text>
                </DataTable.Title>
                <DataTable.Title style={[styles.durationHeaderCell]}>
                  <Text style={styles.scoreboardHeader}>Duration</Text>
                </DataTable.Title>
                <DataTable.Title style={[styles.pointsHeaderCell]}>
                  <Text style={styles.scoreboardHeader}>Points</Text>
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
                    <DataTable.Cell style={[styles.rankCell]}>
                      {index === 0 && (
                        <View style={styles.medalWrapper}>
                          <Image source={require('../../assets/medals/firstMedal.webp')} style={styles.medal} />
                        </View>
                      )}
                      {index === 1 && (
                        <View style={styles.medalWrapper}>
                          <Image source={require('../../assets/medals/silverMedal.webp')} style={styles.medal} />
                        </View>
                      )}
                      {index === 2 && (
                        <View style={styles.medalWrapper}>
                          <Image source={require('../../assets/medals/bronzeMedal.webp')} style={styles.medal} />
                        </View>
                      )}
                      {index > 2 && <Text style={styles.rankText}>{index + 1}.</Text>}
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.playerCell]}>
                      <View style={styles.playerWrapper}>
                        {(() => {
                          const avatarSource = avatars.find((a) => a.path.endsWith(score.avatar))?.display;
                          return avatarSource ? (
                            <Image source={avatarSource} style={getAvatarStyle(score.avatar)} />
                          ) : (
                            <View style={styles.defaultAvatarIcon}>
                              <FontAwesome5 name="user" size={22} color="white" />
                            </View>
                          );
                        })()}
                        <Text style={styles.playerNameText}>{score.name}</Text>
                      </View>
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.durationCell]}>
                      <Text style={styles.durationText}>{score.duration}s</Text>
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.pointsCell]}>
                      <Text style={styles.pointsText}>{score.points}</Text>
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
    </SafeAreaView>
  );
}
