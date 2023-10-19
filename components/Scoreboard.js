import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { DataTable } from 'react-native-paper';
import styles from '../styles/styles';
import { NBR_OF_SCOREBOARD_ROWS, SCOREBOARD_KEY } from '../constants/Game';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Scoreboard({ navigation }) {
  const [scores, setScores] = useState([]);
  const [latestScoreIndex, setLatestScoreIndex] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getScoreboardData();
    });
    return unsubscribe;
  }, [navigation]);

  const getScoreboardData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(SCOREBOARD_KEY);
      if (jsonValue !== null) {
        let tmpScores = JSON.parse(jsonValue);
        const sortedScores = tmpScores.slice().sort((a, b) => b.points - a.points);
        setScores(sortedScores);

        if (sortedScores.length > 0) {
          const latestScore = sortedScores[0];
          const latestScoreIndex = tmpScores.findIndex(score => score.key === latestScore.key);
          setLatestScoreIndex(latestScoreIndex);
        }
      }
    } catch (error) {
      console.log('Error: ' + error);
    }
  };

  const clearScoreboard = async () => {
    try {
      const keysToRemove = [SCOREBOARD_KEY];
      await AsyncStorage.multiRemove(keysToRemove);
      setScores([]);
      setLatestScoreIndex(null);
    } catch (error) {
      console.log('Error: ' + error);
    }
  };

  return (
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
            <DataTable.Row key={score.key}>
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
      {scores.length > 0 && (
        <View style={styles.resetButton}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => clearScoreboard()}
          >
            <Text style={styles.resetButtonText}>Clear scoreboard</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
