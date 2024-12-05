import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ImageBackground, Modal, TouchableOpacity } from 'react-native';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import { database } from './Firebase';
import { ref, onValue } from 'firebase/database';
import * as SecureStore from 'expo-secure-store';

export default function Scoreboard({ navigation }) {
  const [scores, setScores] = useState([]); // State, joka tallentaa tulokset
  const [scoreType, setScoreType] = useState('allTime'); // Oletus on 'allTime'
  const [userId, setUserId] = useState(''); 
  const [modalVisible, setModalVisible] = useState(false);
  const [cachedScores, setCachedScores] = useState(null); 

  useEffect(() => {
    SecureStore.getItemAsync('user_id').then((storedUserId) => {
      if (storedUserId) {
        setUserId(storedUserId);
      }
    });

    const unsubscribe = navigation.addListener('focus', () => {
      getScoreboardData(); 
    });

    getScoreboardData(); 
    
    return unsubscribe;
  }, [navigation, scoreType]);

const getScoreboardData = () => {
  const playersRef = ref(database, 'players');
  onValue(playersRef, snapshot => {
    const playersData = snapshot.val();
    const tmpScores = [];
    const currentMonth = new Date().getMonth(); 
    const currentYear = new Date().getFullYear(); 

    if (playersData) {
      Object.keys(playersData).forEach(playerId => {
        if (playersData[playerId] && playersData[playerId].name) {
          const player = playersData[playerId];

          let scoresToUse = [];
          if (scoreType === 'monthly') {
            scoresToUse = Object.values(player.scores || {}).filter(score => {

              // Tarkistetaan, että 'score.date' on kelvollinen
              const dateParts = score.date.split('.'); 
              if (dateParts.length === 3) {
                // Muodostetaan uusi päivämäärä muodossa YYYY-MM-DD
                const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                const scoreDate = new Date(formattedDate);

                if (isNaN(scoreDate)) {
                  return false; 
                }

                return scoreDate.getMonth() === currentMonth && scoreDate.getFullYear() === currentYear;
              } else {
                return false;
              }
            });
          } else if (scoreType === 'allTime') {
            scoresToUse = Object.values(player.scores || []);
          }

          if (scoresToUse.length > 0) {
            let bestScore = null;
            scoresToUse.forEach(score => {
              if (!bestScore || score.points > bestScore.points) {
                bestScore = score;
              }
            });

            if (bestScore) {
              tmpScores.push({
                ...bestScore,
                name: player.name,
                playerId: playerId,
              });
            }
          }
        }
      });

      // Lajitellaan tulokset
      const sortedScores = tmpScores.sort((a, b) => b.points - a.points);

      setScores(sortedScores); 
    } else {
      setScores([]);
    }
  });
};

  return (
    <ImageBackground
      source={require('../assets/diceBackground.jpg')}
      style={styles.background}>
      <View style={styles.overlay}>
        <ScrollView style={styles.container}>
          <View style={styles.scoresHeaderContainer}>
            <Text style={styles.scoresHeaderText}>SCOREBOARD</Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={scoreType === 'allTime' ? styles.activeTab : styles.inactiveTab}
              onPress={() => setScoreType('allTime')}>
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
                <DataTable.Title style={styles.cell}>
                  <Text style={styles.scoreboardHeader}>Rank #</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.cell}>
                  <Text style={styles.scoreboardHeader}>Name</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.cell}>
                  <Text style={styles.scoreboardHeader}>Date</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.cell}>
                  <Text style={styles.scoreboardHeader}>Duration</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.cell}>
                  <Text style={styles.scoreboardHeader}>Points</Text>
                </DataTable.Title>
              </DataTable.Header>

              {scores.slice(0, NBR_OF_SCOREBOARD_ROWS).map((score, index) => (
                <DataTable.Row
                  key={score.key}
                  style={score.playerId === userId ? { borderWidth: 0.6, borderColor: 'red', backgroundColor: '#ffffff82' } : {}}>
                  <DataTable.Cell style={styles.cell}>
                    {index === 0 && <FontAwesome5 name="medal" size={30} color="gold" />}
                    {index === 1 && <FontAwesome5 name="medal" size={25} color="silver" />}
                    {index === 2 && <FontAwesome5 name="medal" size={20} color="brown" />}
                    {index > 2 && <Text style={styles.scoreboardText}>{index + 1}.</Text>}
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.scoreboardText}>{score.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={[styles.scoreboardText, { fontSize: 10 }]}>{score.date}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.scoreboardText}>{score.duration}s</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={[styles.scoreboardText, { fontSize: 14 }]}>{score.points}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setModalVisible(true)}>
          <FontAwesome5 name="info-circle" size={40} color="white" />
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalCenteredView}>
            <View style={styles.modalView}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseButtonText}>X</Text>
              </TouchableOpacity>

              <Text style={styles.modalText}>How Scores Are Compared</Text>
              <Text style={styles.modalSubText}>
                1. **Points**: Higher points are ranked first.
              </Text>
              <Text style={styles.modalSubText}>
                2. **Duration**: If points are equal, the score with the shorter duration comes first.
              </Text>
              <Text style={styles.modalSubText}>
                3. **Date/Time**: If both points and duration are equal, the score that was achieved earlier is ranked higher.
              </Text>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}
