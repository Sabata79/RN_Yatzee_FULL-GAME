/**
 * EnergyTokenSystem — Manages player's energy token regeneration and persistence.
 * Centralized timer, AsyncStorage hydration, and Firebase syncing for tokens and nextTokenTime.
 * @module src/components/EnergyTokenSystem
 * @author Sabata79
 * @since 2025-09-24
 * @updated 2025-09-24
 */

// EnergyTokenSystem.js
import { useEffect, useRef, useState } from 'react';
import { View, Text, AppState } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import EnergyModal from './modals/EnergyModal';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/EnergyTokenStyles';
import { MAX_TOKENS } from '../constants/Game';
import { useGame } from '../constants/GameContext';
import { database, dbGet, dbSet } from '../services/Firebase';

const db = database();

// Token regeneration interval (production: 1.6 hours)
const REGEN_INTERVAL = 1.6 * 60 * 60 * 1000; // 1.6 hours in ms (production)

// Energy token regeneration system
const EnergyTokenSystem = ({ hidden }) => {
  const {
    playerId,
    tokens,
    setTokens,
    energyModalVisible,
    setEnergyModalVisible,
    nextTokenTime,
    setNextTokenTime,
    timeToNextToken,
    setTimeToNextToken,
  } = useGame();

  const [dataLoaded, setDataLoaded] = useState(false);

  // Refs to keep latest values for timers (avoid stale closures inside setInterval)
  const tokensRef = useRef(tokens);
  const nextTokenTimeRef = useRef(nextTokenTime);

  // Ref to keep track of previous token count
  const prevTokensRef = useRef(tokens);
  // Ref to mark recent manual token changes (to avoid race with auto-regen)
  const manualChangeRef = useRef(null);

  // Update nextTokenTime in Firebase
  const updateNextTokenTimeInFirebase = async (time) => {
    if (playerId) {
      try {
        // using modular helper
        await dbSet(`players/${playerId}/nextTokenTime`, time ? time.toISOString() : null);
      } catch (error) {
        console.error('Error updating nextTokenTime in Firebase:', error);
      }
    }
  };

  // Load saved data from AsyncStorage and Firebase
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Tokens
        const savedTokensString = await AsyncStorage.getItem('tokens');
        let savedTokens =
          savedTokensString === null ? MAX_TOKENS : parseInt(savedTokensString, 10);
        setTokens(savedTokens);

        // nextTokenTime (Firebase → fallback AsyncStorage)
        if (playerId) {
          // using modular helper to get snapshot
          const snapshot = await dbGet(`players/${playerId}/nextTokenTime`);
          if (snapshot.exists()) {
            const firebaseNextTokenTime = new Date(snapshot.val());
            if (!isNaN(firebaseNextTokenTime.getTime())) {
              setNextTokenTime(firebaseNextTokenTime);
            }
          } else {
            const savedNextTokenTimeString = await AsyncStorage.getItem('nextTokenTime');
              if (savedNextTokenTimeString) {
              const savedNextTokenTime = new Date(savedNextTokenTimeString);
              if (!isNaN(savedNextTokenTime.getTime())) {
                setNextTokenTime(savedNextTokenTime);
              }
            }
          }
        } else {
          const savedNextTokenTimeString = await AsyncStorage.getItem('nextTokenTime');
          if (savedNextTokenTimeString) {
            const savedNextTokenTime = new Date(savedNextTokenTimeString);
            if (!isNaN(savedNextTokenTime.getTime())) {
              setNextTokenTime(savedNextTokenTime);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load saved data:', e);
      } finally {
        setDataLoaded(true);
      }
    };

    loadSavedData();
  }, [setTokens, playerId]);

  // Save data to AsyncStorage and Firebase
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('tokens', (tokens ?? 0).toString());
        if (nextTokenTime) {
          await AsyncStorage.setItem('nextTokenTime', nextTokenTime.toISOString());
        }
        if (playerId) {
          // persist nextTokenTime and tokens to Firebase so other clients / restarts see the updated state
          await updateNextTokenTimeInFirebase(nextTokenTime);
          try {
            await dbSet(`players/${playerId}/tokens`, tokens ?? 0);
          } catch (err) {
            console.error('Failed to update tokens in Firebase:', err);
          }
        }
      } catch (e) {
        console.error('Failed to save data:', e);
      }
    };

    saveData();
  }, [tokens, nextTokenTime, playerId]);

  // keep refs in sync
  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);
  useEffect(() => {
    nextTokenTimeRef.current = nextTokenTime;
  }, [nextTokenTime]);

  // Reset nextTokenTime if tokens decrease
  useEffect(() => {
    if (!dataLoaded) return;
    if (tokens < prevTokensRef.current) {
      const now = new Date();
      const newNextTime = new Date(now.getTime() + REGEN_INTERVAL);
      setNextTokenTime(newNextTime);
      if (playerId) {
        updateNextTokenTimeInFirebase(newNextTime);
      }
      // mark manual change to avoid immediate auto-apply race
      manualChangeRef.current = Date.now();
    }
    prevTokensRef.current = tokens;
  }, [tokens, dataLoaded, playerId]);


  // Centralized token calculation used on load, resume and interval ticks
  const computeAndApplyTokens = async () => {
    try {
      const now = new Date();
      let currentTokens = typeof tokensRef.current === 'number' ? tokensRef.current : 0;
      let next = nextTokenTimeRef.current instanceof Date ? nextTokenTimeRef.current : (nextTokenTimeRef.current ? new Date(nextTokenTimeRef.current) : null);

      // If no nextTokenTime but tokens < MAX, schedule next generation
      if (!next && currentTokens < MAX_TOKENS) {
        const newNext = new Date(now.getTime() + REGEN_INTERVAL);
        setNextTokenTime(newNext);
        nextTokenTimeRef.current = newNext;
        if (playerId) await updateNextTokenTimeInFirebase(newNext);
        setTimeToNextToken('Calculating...');
        return;
      }

      if (currentTokens >= MAX_TOKENS) {
        setTimeToNextToken('');
        return;
      }

      if (!next || isNaN(next.getTime())) {
        setTimeToNextToken('Calculating...');
        return;
      }

      const diff = next - now;
      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeToNextToken(`${hours} h ${minutes} min ${seconds} s`);
        return;
      }

      // Avoid auto-applying tokens immediately after a manual change (race condition)
      if (manualChangeRef.current && Date.now() - manualChangeRef.current < 2000) {
        // skip this tick; let manual update settle
        return;
      }

      // time passed: compute how many tokens to add
      const diffTime = now - next;
      const secondsPassed = Math.floor(diffTime / 1000);
      const tokensToAdd = Math.floor(diffTime / REGEN_INTERVAL) + 1;
      console.log('Token regen check: secondsPassed=', secondsPassed, 'tokensToAdd=', tokensToAdd);
      // apply tokens using functional update to avoid overwriting concurrent manual changes
      setTokens((prev) => Math.min(prev + tokensToAdd, MAX_TOKENS));

      if (tokensRef.current + tokensToAdd < MAX_TOKENS) {
        const remainder = diffTime % REGEN_INTERVAL;
        const newNextTime = new Date(now.getTime() + (REGEN_INTERVAL - remainder));
        setNextTokenTime(newNextTime);
        nextTokenTimeRef.current = newNextTime;
        if (playerId) await updateNextTokenTimeInFirebase(newNextTime);
        const secondsUntilNext = Math.ceil((REGEN_INTERVAL - remainder) / 1000);
        console.log('Next token scheduled in sec:', secondsUntilNext, 'at', newNextTime);
        setTimeToNextToken('Token ready!');
      } else {
        setNextTokenTime(null);
        nextTokenTimeRef.current = null;
        if (playerId) await updateNextTokenTimeInFirebase(null);
          // compute new token count based on the stable snapshot value
          const newTokenCount = Math.min(currentTokens + tokensToAdd, MAX_TOKENS);
          // set tokens and update ref immediately
          setTokens(newTokenCount);
          tokensRef.current = newTokenCount;
        setTimeToNextToken('Token ready!');
      }
    } catch (e) {
      console.error('Error computing tokens:', e);
    }
  };

  // Run compute on interval and on resume
  useEffect(() => {
    // run once immediately when data loaded
    if (dataLoaded) computeAndApplyTokens();

    const interval = setInterval(() => {
      computeAndApplyTokens();
    }, 1000);

    const handleAppState = (nextAppState) => {
      if (nextAppState === 'active') {
        computeAndApplyTokens();
      }
    };
    const sub = AppState.addEventListener ? AppState.addEventListener('change', handleAppState) : null;

    return () => {
      clearInterval(interval);
      try {
        if (sub && typeof sub.remove === 'function') sub.remove();
        else if (AppState.removeEventListener) AppState.removeEventListener('change', handleAppState);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded, playerId]);

  const progress = tokens ? tokens / MAX_TOKENS : 0;

  // Render the energy container
  if (hidden) return null;
  return (
    <View style={styles.energyContainer}>
      <View style={styles.progressWrap}>
        <MaterialCommunityIcons
          name="flash"
          size={30}
          color="gold"
          style={styles.energyIconOverlay}
        />
        <ProgressBar progress={progress} color="green" style={styles.progressBar} />
        <View style={styles.progressOverlay}>
          <Text style={styles.tokenText}>{tokens} / {MAX_TOKENS}</Text>
        </View>
      </View>
      <EnergyModal
        visible={energyModalVisible}
        onClose={() => setEnergyModalVisible(false)}
        tokens={tokens}
        maxTokens={MAX_TOKENS}
        timeToNextToken={timeToNextToken}
      />
    </View>
  );
};

export default EnergyTokenSystem;
