/**
 * RenderFirstRow – Stopwatch and section labels for the game header row.
 * Runs a stopwatch via react-timer-hook, writes elapsed seconds into GameContext,
 * pauses immediately when `rounds` reaches 0, and resets when `isGameSaved` toggles true.
 *
 * Usage:
 *   import RenderFirstRow from '@/components/RenderFirstRow';
 *
 *   <FlatList
 *     {...other props...}
 *     ListHeaderComponent={<RenderFirstRow rounds={rounds} />}
 *   />
 *
 * Props:
 *   @param {number} rounds - Remaining rounds; when 0, the stopwatch pauses and the final time is stored.
 *
 * Behavior:
 * - Starts the stopwatch when `gameStarted` becomes true (from GameContext).
 * - On `rounds === 0`: pauses the stopwatch and calls `setElapsedTimeContext(totalSeconds)`.
 * - On each tick: syncs `totalSeconds` to GameContext (capped at MAX_SECS).
 * - On `isGameSaved === true`: pauses + resets stopwatch, writes 0 to context, clears local glow animation.
 * - Timer color follows a "traffic light" scheme: <150s = success, 150–300s = warning, >300s = error.
 * - Includes a subtle glow animation while running.
 *
 * Dependencies:
 * - GameContext: { gameStarted, gameEnded, setElapsedTimeContext, isGameSaved, setIsGameSaved }
 * - react-timer-hook: useStopwatch
 * - react-native: Animated (glow), MaterialCommunityIcons (timer icon)
 *
 * @module components/RenderFirstRow
 * @author Sabata79
 * @since 2025-09-16
 */
import { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGame } from '../constants/GameContext';
import { useStopwatch } from 'react-timer-hook';
import firstRowStyles from '../styles/FirstRowStyles';
import COLORS from '../constants/colors';

export default function RenderFirstRow({ rounds = null }) {
  const { gameStarted, gameEnded, setElapsedTimeContext, isGameSaved, setIsGameSaved } = useGame();
  const { totalSeconds, start, reset, pause } = useStopwatch({ autoStart: false });

  // Timer color mapping
  let timerColor = COLORS.success;
  if (totalSeconds > 300) timerColor = COLORS.error;
  else if (totalSeconds > 150) timerColor = COLORS.warning;

  // Local glow effect
  const [glowAnim] = useState(new Animated.Value(1));
  const MAX_SECS = 9999;

  // Start on game start
  useEffect(() => {
    if (gameStarted) {
      start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [gameStarted, start, glowAnim]);

  // Stop immediately when rounds are over
  useEffect(() => {
    if (rounds === 0) {
      pause();
      setElapsedTimeContext(totalSeconds);
    }
  }, [rounds, pause, totalSeconds, setElapsedTimeContext]);

  // Cap to MAX_SECS and sync to context
  useEffect(() => {
    if (totalSeconds >= MAX_SECS) {
      pause();
      setElapsedTimeContext(MAX_SECS);
    } else {
      setElapsedTimeContext(totalSeconds);
    }
  }, [totalSeconds, pause, setElapsedTimeContext]);

  // Reset after score save
  useEffect(() => {
    if (isGameSaved) {
      pause();
      reset();
      setElapsedTimeContext(0);
      setIsGameSaved(false);
      glowAnim.stopAnimation();
      glowAnim.setValue(1);
    }
  }, [isGameSaved, pause, reset, setElapsedTimeContext, setIsGameSaved, glowAnim]);

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
