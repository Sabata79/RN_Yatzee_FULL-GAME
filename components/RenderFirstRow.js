import React, { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGame } from '../components/GameContext';
import { useStopwatch } from 'react-timer-hook'; 
import styles from '../styles/styles';

const RenderFirstRow = () => {
  const { gameStarted, gameEnded, setElapsedTimeContext, isGameSaved, setIsGameSaved} = useGame();
  const { totalSeconds, start, reset, pause } = useStopwatch({
    autoStart: false, 
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [glowAnim] = useState(new Animated.Value(1)); 

  useEffect(() => {
    if (gameStarted && !hasStarted) {
      start();
      setHasStarted(true);  
      startGlowEffect();
    } else if (gameEnded) {
        pause();  
      setElapsedTimeContext(totalSeconds);  
      if (isGameSaved) { 
        reset();  
        setElapsedTimeContext(0);
        setHasStarted(false);
        setIsGameSaved(false);
        stopGlowEffect();
      }
    }
  }, [gameStarted, gameEnded, totalSeconds, start, reset, setElapsedTimeContext, isGameSaved, hasStarted]);

  const startGlowEffect = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.5, 
          duration: 500, 
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1, 
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopGlowEffect = () => {
    glowAnim.stopAnimation();
    glowAnim.setValue(1); // Palautetaan kirkastus normaaliin
  };

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
            color="#ffffff"
            style={{ marginRight: 5, marginTop: 3 }}
          />
          <Animated.Text style={[styles.firstRowCategoryText,{ width: 60, textAlign: 'center' },{ transform: [{ scale: glowAnim }] }]}>
            {totalSeconds}s
          </Animated.Text>
        </View>
      </View>

      <View style={styles.firstRowItem}>
        <Text style={styles.firstRowCategoryText}>Major</Text>
      </View>
    </View>
  );
};

export default RenderFirstRow;
