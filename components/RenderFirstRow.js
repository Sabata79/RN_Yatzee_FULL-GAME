import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGame } from '../components/GameContext';
import { useStopwatch } from 'react-timer-hook'; 
import styles from '../styles/styles';

const RenderFirstRow = () => {
  const { gameStarted, gameEnded, setElapsedTimeContext, isGameSaved, setIsGameSaved} = useGame();
  const { seconds, start, reset, pause } = useStopwatch({
    autoStart: false, 
  });

  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (gameStarted && !hasStarted) {
      start();
      setHasStarted(true);  
    } else if (gameEnded) {
        pause();  
      setElapsedTimeContext(seconds);  
      if (isGameSaved) { 
        reset();  
        setElapsedTimeContext(0);
        setHasStarted(false);
        setIsGameSaved(false);
      }
    }
  }, [gameStarted, gameEnded, seconds, start, reset, setElapsedTimeContext, isGameSaved, hasStarted]);

  return (
    <View style={styles.firstRow}>
      <View style={styles.firstRowItem}>
        <Text style={styles.firstRowCategoryText}>Minor</Text>
      </View>

      <View style={styles.firstRowItem}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="timer"
            size={22}
            color="#ccc9c9"
            style={{ marginRight: 10, marginTop: 3 }}
          />
          <Text style={styles.firstRowCategoryText}>
            {seconds}s
          </Text>
        </View>
      </View>

      <View style={styles.firstRowItem}>
        <Text style={styles.firstRowCategoryText}>Major</Text>
      </View>
    </View>
  );
};

export default RenderFirstRow;
