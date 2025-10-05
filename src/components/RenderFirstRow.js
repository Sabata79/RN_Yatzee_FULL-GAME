/**
 * RenderFirstRow – stopwatch and section labels for the game header row.
 * Writes elapsed seconds to ElapsedTimeContext (not GameContext).
 * Starts when gameStarted === true. Stops the timer when rounds === 0 (and saves time to context).
 * Resets when isGameSaved becomes true.
 *
 * Props:
 *  - none (uses context)
 *
 * @module RenderFirstRow
 * @author Sabata79
 * @since 2025-09-16 (updated 2025-09-18)
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStopwatch } from 'react-timer-hook';
import { useGame } from '../constants/GameContext';
import { useElapsedTime } from '../constants/ElapsedTimeContext';
import firstRowStyles from '../styles/FirstRowStyles';
import COLORS from '../constants/colors';

function RenderFirstRow() {
  // Game flags lives in GameContext
  const { gameStarted, gameEnded, isGameSaved, setIsGameSaved } = useGame();

  // Seconds live in ElapsedTimeContext
  const { setElapsedTime, elapsedTime } = useElapsedTime();

  const { totalSeconds, start, reset, pause } = useStopwatch({ autoStart: false });

  // Glow animaatio (kevyt)
  const glowAnimRef = useRef(new Animated.Value(1));
  const glowAnim = glowAnimRef.current;

  const MAX_SECS = 9999;

  // Väri liikennevaloilla
  const timerColor =
    totalSeconds > 150 ? COLORS.error :
    totalSeconds > 100 ? COLORS.warning :
    COLORS.success;

  // Käynnistä kello kun peli alkaa
  useEffect(() => {
    if (gameStarted) {
      // start() identity may change between renders from useStopwatch; we only
      // want to react to change in `gameStarted` (not function identity).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    }
    // Intentionally only depend on gameStarted
  }, [gameStarted]);

  useEffect(() => {
    if (gameEnded) {
      // pause() identity may change; only care that gameEnded toggled
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pause();
      setElapsedTime(totalSeconds);
    }
  }, [gameEnded, totalSeconds, setElapsedTime]);

  useEffect(() => {
    if (totalSeconds >= MAX_SECS) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pause();
      setElapsedTime(MAX_SECS);
    } else {
      if (elapsedTime !== totalSeconds) setElapsedTime(totalSeconds);
    }
    // Dependencies: totalSeconds, elapsedTime, setElapsedTime
    // pause() identity isn't relevant to triggering this effect
  }, [totalSeconds, elapsedTime, setElapsedTime]);

  useEffect(() => {
    if (isGameSaved) {
      // pause/reset identities not relevant; only isGameSaved matters
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pause();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      reset();
      setElapsedTime(0);
      setIsGameSaved(false);
      glowAnim.stopAnimation();
      glowAnim.setValue(1);
    }
  }, [isGameSaved, setElapsedTime, setIsGameSaved, glowAnim]);

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

export default React.memo(RenderFirstRow);
