import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, Modal, Image } from 'react-native';
import { DataTable } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import styles from '../styles/styles';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import { database } from './Firebase';
import { ref, onValue } from 'firebase/database';
import * as SecureStore from 'expo-secure-store';
import PlayerCard from './PlayerCard';
import { useGame } from '../components/GameContext';

export default function Scoreboard({ navigation }) {
  const [scores, setScores] = useState([]);
  const [scoreType, setScoreType] = useState('allTime');
  const [userId, setUserId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const { setViewingPlayerIdContext, setViewingPlayerNameContext } = useGame();

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

      if (playersData) {
        Object.keys(playersData).forEach(playerId => {
          const player = playersData[playerId];

          if (player.scores) {
            let scoresToUse = [];
            if (scoreType === 'monthly') {
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
                  scores: Object.values(player.scores)
                });
              }
            }
          }
        });

        const sortedScores = tmpScores.sort((a, b) => b.points - a.points);
        setScores(sortedScores);
      }
    });
  };

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

  return (
    <ImageBackground source={require('../assets/diceBackground.jpg')} style={styles.background}>
      <View style={styles.overlay}>
        <ScrollView style={styles.container}>
          <View style={styles.scoresHeaderContainer}>
            <Text style={styles.scoresHeaderText}>SCOREBOARD</Text>
          </View>

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
          </View>

          {scores.length === 0 ? (
            <Text style={styles.scoreboardText}>No scores yet</Text>
          ) : (
            <DataTable style={styles.scoreboardContainer}>
              <DataTable.Header>
                <DataTable.Title style={styles.cell}><Text style={styles.scoreboardHeader}>Rank #</Text></DataTable.Title>
                <DataTable.Title style={styles.cell}><Text style={styles.scoreboardHeader}>Name</Text></DataTable.Title>
                <DataTable.Title style={styles.cell}><Text style={styles.scoreboardHeader}>Duration</Text></DataTable.Title>
                <DataTable.Title style={styles.cell}><Text style={styles.scoreboardHeader}>Points</Text></DataTable.Title>
              </DataTable.Header>

              {scores.slice(0, NBR_OF_SCOREBOARD_ROWS).map((score, index) => {
                const isCurrentUser = score.playerId === userId;

                return (
                  <DataTable.Row
                    key={score.playerId}
                    onPress={() => handlePlayerCard(score.playerId, score.name, score.scores)}
                    style={isCurrentUser ? { backgroundColor: '#d3bd86' } : {}}
                  >
                    <DataTable.Cell style={styles.medalCell}>
                      {index === 0 && (
                        <View style={styles.imageWrapper}>
                          <Image source={require('../assets/medals/firstMedal.png')} style={styles.medal} />
                        </View>
                      )}
                      {index === 1 && (
                        <View style={styles.imageWrapper}>
                          <Image source={require('../assets/medals/silverMedal.png')} style={[styles.medal , {height: 40 , width: 40}]} />
                        </View>
                      )}
                      {index === 2 && (
                        <View style={styles.imageWrapper}>
                          <Image source={require('../assets/medals/bronzeMedal.png')} style={[styles.medal , {height: 35 , width: 35}]} />
                        </View>
                      )}
                      {index > 2 && <Text style={styles.scoreboardText}>{index + 1}.</Text>}
                    </DataTable.Cell>

                    <DataTable.Cell style={styles.cell}>
                      <Text style={styles.scoreboardText}>{score.name}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.cell}>
                      <Text style={styles.scoreboardText}>{score.duration}s</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.cell}>
                      <Text style={[styles.scoreboardText, { fontSize: 16 }]}>{score.points}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          )}
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
