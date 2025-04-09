import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, Modal, Image } from 'react-native';
import { DataTable } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import { database } from './Firebase';
import { ref, onValue } from 'firebase/database';
import * as SecureStore from 'expo-secure-store';
import PlayerCard from './PlayerCard';
import { useGame } from '../components/GameContext';
import { avatars } from '../constants/AvatarPaths';

export default function Scoreboard({ navigation }) {
  const [scores, setScores] = useState([]);
  const [scoreType, setScoreType] = useState('allTime');
  const [userId, setUserId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const { setViewingPlayerIdContext, setViewingPlayerNameContext, avatarUrl, viewingPlayerAvatar } = useGame();
  const userAvatar = avatars.find((avatar) => avatar.path === avatarUrl)?.display;

  useEffect(() => {
    SecureStore.getItemAsync('user_id').then((storedUserId) => {
      if (storedUserId) {
        setUserId(storedUserId);
      }
    });

    getScoreboardData();
  }, [scoreType]);

  const getScoreboardData = () => {
    const playersRef = ref(database, 'players');
    onValue(playersRef, snapshot => {
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
              // Filter by month
              scoresToUse = Object.values(player.scores).filter(score => {
                const dateParts = score.date.split('.');
                if (dateParts.length === 3) {
                  const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                  const scoreDate = new Date(formattedDate);
                  if (isNaN(scoreDate)) return false;
                  return scoreDate.getMonth() === currentMonth && scoreDate.getFullYear() === currentYear;
                }
                return false;
              });
            } else if (scoreType === 'allTime') {
              scoresToUse = Object.values(player.scores);
            } else if (scoreType === 'weekly') {
              // Filter by week
              scoresToUse = Object.values(player.scores).filter(score => {
                const dateParts = score.date.split('.');
                if (dateParts.length === 3) {
                  const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                  const scoreDate = new Date(formattedDate);
                  if (isNaN(scoreDate)) {
                    console.error('Virheellinen päivämäärä:', score.date);
                    return false; // Invalid date
                  }
                  return getWeekNumber(scoreDate) === currentWeek; // Get week number of the year
                }
                return false;
              });
            }

            if (scoresToUse.length > 0) {
              let bestScore = null;
              scoresToUse.forEach(score => {
                if (!bestScore ||
                  score.points > bestScore.points ||
                  (score.points === bestScore.points && score.duration < bestScore.duration) ||
                  (score.points === bestScore.points && score.duration === bestScore.duration && new Date(score.date) < new Date(bestScore.date))) {
                  bestScore = score;
                }
              });

              if (bestScore) {
                tmpScores.push({
                  ...bestScore,
                  name: player.name,
                  playerId: playerId,
                  avatar: player.avatar || null,
                  scores: Object.values(player.scores)
                });
              }
            }
          }
        });

        const sortedScores = tmpScores.sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          if (a.duration !== b.duration) {
            return a.duration - b.duration;
          }
          return new Date(a.date) - new Date(b.date);
        });
        setScores(sortedScores);
      }
    });
  };

  // Function to get the week number of the year (ISO 8601)
  function getWeekNumber(date) {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    const firstThursday = tempDate.getTime();
    tempDate.setMonth(0);
    tempDate.setDate(1);
    const weekNumber = Math.ceil(((firstThursday - tempDate) / 86400000 + 1) / 7);
    return weekNumber;
  }

  const handlePlayerCard = (playerId, playerName, playerScores) => {
    setSelectedPlayer({ playerId, playerName, playerScores });
    setModalVisible(true);
    setViewingPlayerIdContext(playerId);
    setViewingPlayerNameContext(playerName);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPlayer(null);
    setViewingPlayerIdContext('');
    setViewingPlayerNameContext('');
  };

  const isBeginnerAvatar = (avatarPath) => {
    const avatar = avatars.find(av => av.path === avatarPath);
    return avatar && avatar.level === 'Beginner';
  };

  return (
    <ImageBackground source={require('../assets/diceBackground.jpg')} style={styles.background}>
      <View style={styles.overlay}>
        <ScrollView style={styles.container}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={scoreType === 'allTime' ? styles.activeTab : styles.inactiveTab}
              onPress={() => setScoreType('allTime')} >
              <Text style={styles.tabText}>All Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={scoreType === 'monthly' ? styles.activeTab : styles.inactiveTab}
              onPress={() => setScoreType('monthly')}>
              <Text style={styles.tabText}>Monthly</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={scoreType === 'weekly' ? styles.activeTab : styles.inactiveTab}
              onPress={() => setScoreType('weekly')}>
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
                    key={score.playerId}
                    onPress={() => handlePlayerCard(score.playerId, score.name, score.scores)}
                    style={isCurrentUser ? { backgroundColor: '#d3bd867a' } : {}}
                  >
                    <DataTable.Cell style={[styles.rankCell]}>
                      {index === 0 && (
                        <View style={styles.medalWrapper}>
                          <Image source={require('../assets/medals/firstMedal.png')} style={styles.medal} />
                        </View>
                      )}
                      {index === 1 && (
                        <View style={styles.medalWrapper}>
                          <Image source={require('../assets/medals/silverMedal.png')} style={styles.medal} />
                        </View>
                      )}
                      {index === 2 && (
                        <View style={styles.medalWrapper}>
                          <Image source={require('../assets/medals/bronzeMedal.png')} style={styles.medal} />
                        </View>
                      )}
                      {index > 2 && <Text style={styles.rankText}>{index + 1}.</Text>}
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.playerCell]}>
                      <View style={styles.playerWrapper}>
                        {(() => {
                          const avatarSource = avatars.find((avatar) => avatar.path === score.avatar)?.display;
                          return avatarSource ? (
                            <Image source={avatarSource} style={[isBeginnerAvatar(score.avatar) ? styles.beginnerAvatar : styles.avatar]} />
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
        <View style={{ height: 80 }} />
        </ScrollView>
      </View>

      {/* PlayerCard modal for displaying selected player's details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        {selectedPlayer && (
          <PlayerCard
            playerId={selectedPlayer.playerId}
            playerName={selectedPlayer.playerName}
            playerScores={selectedPlayer.playerScores}
            isModalVisible={modalVisible}
            setModalVisible={closeModal}
          />
        )}
      </Modal>
    </ImageBackground>
  );
}
