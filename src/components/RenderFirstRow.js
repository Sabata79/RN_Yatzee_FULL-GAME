/**
 * RenderFirstRow - Renders the top row of the game UI, including timer and category labels.
 *
 * Shows an animated timer and "Minor / Major" labels.
 * Time is live-synced to GameContext every second while the game is running.
 * The timer is reset and started when the game starts, and paused when the game ends.
 *
 * @author Sabata79
 * @since 2025-08-29
 */
import { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStopwatch } from 'react-timer-hook';
import { useGame } from '../constants/GameContext';
import firstRowStyles from '../styles/FirstRowStyles';
import COLORS from '../constants/colors';

export default function RenderFirstRow() {
  const { gameStarted, gameEnded, setElapsedTimeContext } = useGame();

  // Stopwatch from react-timer-hook
  const { totalSeconds, start, reset, pause } = useStopwatch({ autoStart: false });

  // Local UI state
  const [hasStarted, setHasStarted] = useState(false);
  const [glowAnim] = useState(new Animated.Value(1));
  const MAX_SECS = 9999;

  // Timer color thresholds
  let timerColor = COLORS.success;
  if (totalSeconds > 300) {
    timerColor = COLORS.error;
  } else if (totalSeconds > 150) {
    timerColor = COLORS.warning;
  }

  // Start/stop timer and glow based on game state
  useEffect(() => {
    if (gameStarted && !hasStarted) {
      // Ensure timer starts from zero for each new game
      reset(0, false);
      start();
      setHasStarted(true);
      startGlowEffect();
    } else if (gameEnded && hasStarted) {
      pause();
      stopGlowEffect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, gameEnded, hasStarted, start, pause, reset]);

  // Live-sync totalSeconds to GameContext while the game is running
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      setElapsedTimeContext(totalSeconds);
    }
  }, [totalSeconds, gameStarted, gameEnded, setElapsedTimeContext]);

  // Cap timer at MAX_SECS as a safety guard
  useEffect(() => {
    if (totalSeconds >= MAX_SECS) {
      pause();
      setElapsedTimeContext(MAX_SECS);
    }
  }, [totalSeconds, pause, setElapsedTimeContext]);

  // Start glowing animation
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

  // Stop glowing animation
  const stopGlowEffect = () => {
    glowAnim.stopAnimation();
    glowAnim.setValue(1);
  };

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
          <Animated.Text
            style={[
              firstRowStyles.firstRowTimerText,
              { width: 60, textAlign: 'center', color: timerColor },
              { transform: [{ scale: glowAnim }] },
            ]}
          >
            {Math.min(totalSeconds, MAX_SECS)} s
          </Animated.Text>
        </View>
      </View>

      <View style={firstRowStyles.firstRowItem}>
        <Text style={firstRowStyles.firstRowCategoryText}>Major</Text>
      </View>
    </View>
  );
}
