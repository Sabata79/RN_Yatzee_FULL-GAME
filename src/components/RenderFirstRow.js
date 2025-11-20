/**
 * RenderFirstRow – stopwatch and section labels for the game header row.
 * Keeps a lightweight local stopwatch and mirrors it into ElapsedTimeContext.
 * - Starts when gameStarted === true.
 * - Pauses when the game screen is not active.
 * - Resets when isGameSaved becomes true.
 *
 * @module RenderFirstRow
 * @author Sabata79
 * @since 2025-09-16 (updated 2025-11-20)
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGame } from '../constants/GameContext';
import { useElapsedTime } from '../constants/ElapsedTimeContext';
import firstRowStyles, { getFirstRowTopPadding } from '../styles/FirstRowStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import COLORS from '../constants/colors';

function RenderFirstRow() {
  // Game flags live in GameContext
  const {
    gameStarted,
    gameEnded,
    isGameSaved,
    setIsGameSaved,
    isGameScreenActive,
  } = useGame();

  // Elapsed seconds live in ElapsedTimeContext (for other consumers, e.g. ScoreModal)
  const { setElapsedTime, elapsedTime } = useElapsedTime();

  // Local stopwatch state for visual display.
  // Initialize from context so we continue where we left off when remounting.
  const [totalSeconds, setTotalSeconds] = useState(() => elapsedTime || 0);

  // Single interval ref to avoid multiple timers
  const intervalRef = useRef(null);

  // Glow animation
  const glowAnimRef = useRef(new Animated.Value(1));
  const glowAnim = glowAnimRef.current;

  const MAX_SECS = 9999;

  // Derive timer color based on totalSeconds (traffic light style)
  const timerColor =
    totalSeconds > 150 ? COLORS.error :
    totalSeconds > 100 ? COLORS.warning :
    COLORS.success;

  // Start glow animation when game starts (one-time per game)
  useEffect(() => {
    if (!gameStarted) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );

    loop.start();

    return () => {
      glowAnim.stopAnimation();
      glowAnim.setValue(1);
    };
  }, [gameStarted, glowAnim]);

  // Core stopwatch effect:
  // Runs a single interval when game is active & screen is active.
  useEffect(() => {
    const shouldRun =
      gameStarted &&
      !gameEnded &&
      isGameScreenActive;

    if (!shouldRun) {
      // Stop interval if it exists
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Avoid creating multiple intervals
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      setTotalSeconds((prev) => {
        if (prev >= MAX_SECS) return prev;
        const next = prev + 1;
        return next >= MAX_SECS ? MAX_SECS : next;
      });
    }, 1000);

    // Cleanup on unmount or when flags change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [gameStarted, gameEnded, isGameScreenActive]);

  // Mirror local totalSeconds -> ElapsedTimeContext,
  // but never move the context value backwards.
  useEffect(() => {
    if (totalSeconds <= 0) return;

    setElapsedTime((prev) => {
      if (totalSeconds <= prev) return prev;
      const clamped = totalSeconds >= MAX_SECS ? MAX_SECS : totalSeconds;
      return clamped;
    });
  }, [totalSeconds, setElapsedTime]);

  // When game is saved/reset, clear timer and state
  useEffect(() => {
    if (!isGameSaved) return;

    // Stop interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTotalSeconds(0);
    setElapsedTime(0);
    setIsGameSaved(false);

    glowAnim.stopAnimation();
    glowAnim.setValue(1);
  }, [isGameSaved, setElapsedTime, setIsGameSaved, glowAnim]);

  // When game ends, just stop the interval. ElapsedTime is already
  // kept in sync while ticking, so no extra write needed here.
  useEffect(() => {
    if (!gameEnded) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [gameEnded]);

  const insets = useSafeAreaInsets();
  const topPad = getFirstRowTopPadding(insets);

  return (
    <View style={[firstRowStyles.firstRow, { paddingTop: topPad }]}>
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

export default React.memo(RenderFirstRow);
