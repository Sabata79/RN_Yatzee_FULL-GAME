import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ImageBackground } from 'react-native';
import { DataTable } from 'react-native-paper';
import styles from '../styles/styles';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import { database } from '../components/Firebase'; 
import { ref, onValue } from 'firebase/database';
import * as Device from 'expo-device'; 

export default function Scoreboard({ navigation }) {
  const [scores, setScores] = useState([]);
  const [latestScoreIndex, setLatestScoreIndex] = useState(null);
  const [deviceId, setDeviceId] = useState(''); 

  useEffect(() => {
    // Get device ID
    if (Device.isDevice) {
      const deviceIdentifier = Device.osBuildId || Device.modelId || Device.osInternalBuildId;
      setDeviceId(deviceIdentifier);
    }

    const unsubscribe = navigation.addListener('focus', () => {
      getScoreboardData();
    });
    return unsubscribe;
  }, [navigation]);

  const getScoreboardData = () => {
    const playersRef = ref(database, 'players');
    onValue(playersRef, snapshot => {
      const playersData = snapshot.val();
      const tmpScores = [];

      if (playersData) {
        Object.keys(playersData).forEach(playerId => {
          const player = playersData[playerId];
          if (player.scores) {
            const maxScore = Math.max(...Object.values(player.scores).map(score => score.points));
            const highScore = Object.values(player.scores).find(score => score.points === maxScore);

            tmpScores.push({
              ...highScore,
              name: player.name,
              playerId: playerId,
            });
          }
        });

        const sortedScores = tmpScores.slice().sort((a, b) => b.points - a.points);
        setScores(sortedScores);

        if (sortedScores.length > 0) {
          const latestScore = sortedScores[0];
          const latestScoreIndex = tmpScores.findIndex(score => score.key === latestScore.key);
          setLatestScoreIndex(latestScoreIndex);
        }
      } else {
        setScores([]);
        setLatestScoreIndex(null);
      }
    });
  };

  return (
    <ImageBackground
      source={require('../assets/diceBackground.jpg')}
      style={styles.background}>
      <View style={styles.overlay}>
        <ScrollView style={styles.container}>
          <Text style={styles.buttonText}>Scoreboard</Text>
          {scores.length === 0 ? (
            <Text style={styles.scoreboardText}>No scores yet</Text>
          ) : (
            <DataTable style={styles.scoreBoardHeader}>
              <DataTable.Header>
                <DataTable.Title style={styles.cell}>
                  <Text style={styles.scoreboardText}>Position #</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.cell}>
                  <Text style={styles.scoreboardText}>Name</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.cell}>
                  <Text style={styles.scoreboardText}>Date</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.cell}>
                  <Text style={styles.scoreboardText}>Time</Text>
                </DataTable.Title>
                <DataTable.Title style={styles.cell}>
                  <Text style={styles.scoreboardText}>Points</Text>
                </DataTable.Title>
              </DataTable.Header>

              {scores.slice(0, NBR_OF_SCOREBOARD_ROWS).map((score, index) => (
                <DataTable.Row
                  key={score.key}
                  style={score.deviceId === deviceId ? { backgroundColor: 'yellow' } : {}}>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.scoreboardText}>{index + 1}.</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.scoreboardText}>{score.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.scoreboardText}>{score.date}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.scoreboardText}>{score.time}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.scoreboardText}>{score.points}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
}
