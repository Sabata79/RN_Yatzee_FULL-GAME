/**
 * RenderFirstRow – Stopwatch and section labels for the game header row.
 *
 * - Kirjoittaa sekunnit ElapsedTimeContextiin (ei GameContextiin).
 * - Käynnistyy kun gameStarted === true.
 * - Pysäyttää kellon heti kun rounds === 0 (ja tallettaa ajan kontekstiin).
 * - Resetoi, kun isGameSaved muuttuu trueksi.
 *
 * @module components/RenderFirstRow
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

export default function RenderFirstRow({ rounds = null }) {
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
    totalSeconds > 300 ? COLORS.error :
    totalSeconds > 150 ? COLORS.warning :
    COLORS.success;

  // Käynnistä kello kun peli alkaa
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

  // Pysäytä kun kierrokset loppuvat TAI peli on merkitty päättyneeksi
  useEffect(() => {
    if (rounds === 0 || gameEnded) {
      pause();
      setElapsedTime(totalSeconds);
    }
  }, [rounds, gameEnded, pause, totalSeconds, setElapsedTime]);

  // Synkkaa jokaisella tikillä (ja katkaise MAX_SECS kohdalla)
  useEffect(() => {
    if (totalSeconds >= MAX_SECS) {
      pause();
      setElapsedTime(MAX_SECS);
    } else {
      // Vältä turhia päivityksiä jos arvo ei muutu
      if (elapsedTime !== totalSeconds) setElapsedTime(totalSeconds);
    }
  }, [totalSeconds, pause, setElapsedTime, elapsedTime]);

  // Resetoi kun peli on tallennettu/aloitetaan uusi
  useEffect(() => {
    if (isGameSaved) {
      pause();
      reset();
      setElapsedTime(0);
      setIsGameSaved(false);
      glowAnim.stopAnimation();
      glowAnim.setValue(1);
    }
  }, [isGameSaved, pause, reset, setElapsedTime, setIsGameSaved, glowAnim]);

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
