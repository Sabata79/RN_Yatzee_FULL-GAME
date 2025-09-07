/**
 * RenderFirstRow - Renders the top row of the game UI, including timer and category labels.
 *
 * This file displays the timer and category labels at the top of the game screen.
 * @author Sabata79
 * @since 2025-08-29
 */
import { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGame } from '../constants/GameContext';
import { useStopwatch } from 'react-timer-hook';
import firstRowStyles from '../styles/FirstRowStyles';

import COLORS from '../constants/colors';

// Renders the top row of the game UI, including timer and category labels
const RenderFirstRow = () => {
  // Game state and timer hooks
  const { gameStarted, gameEnded, setElapsedTimeContext, isGameSaved, setIsGameSaved } = useGame();
  const { totalSeconds, start, reset, pause } = useStopwatch({
    autoStart: false,
  });

  // Timer color logic
  let timerColor = COLORS.success;
  if (totalSeconds > 300) {
    timerColor = COLORS.error;
  } else if (totalSeconds > 150) {
    timerColor = COLORS.warning;
  }

  // Local state for timer and animation
  const [hasStarted, setHasStarted] = useState(false);
  const [glowAnim] = useState(new Animated.Value(1));
  const MAX_SECS = 9999; // Maximum seconds for timer

  // Effect: Start or stop timer and animation based on game state
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

  // Effect: Cap timer at MAX_SECS
  useEffect(() => {
    if (totalSeconds >= MAX_SECS) {
      pause();                       
      setElapsedTimeContext(MAX_SECS); 
    }
  }, [totalSeconds, pause, setElapsedTimeContext]);


  // Starts the glowing animation for the timer
  const startGlowEffect = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.3,
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

  // Stops the glowing animation and resets value
  const stopGlowEffect = () => {
    glowAnim.stopAnimation();
    glowAnim.setValue(1);
  };

  // Render the first row: Minor label, animated timer, Major label
  return (
    <View style={firstRowStyles.firstRow}>
      <View style={firstRowStyles.firstRowItem}>
        <Text style={firstRowStyles.firstRowCategoryText}>Minor</Text>
      </View>

      <View style={firstRowStyles.firstRowItem}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="timer"
            size={24}
            color={timerColor}
            style={{ marginRight: 15, marginTop: -6 }}
          />
          {/* Animated timer text with glow effect */}
          <Animated.Text style={[firstRowStyles.firstRowTimerText, { width: 60, textAlign: 'center', color: timerColor }, { transform: [{ scale: glowAnim }] }]}> 
            {Math.min(totalSeconds, MAX_SECS)} s
          </Animated.Text>
        </View>
      </View>

      <View style={firstRowStyles.firstRowItem}>
        <Text style={firstRowStyles.firstRowCategoryText}>Major</Text>
      </View>
    </View>
  );
};

export default RenderFirstRow;
