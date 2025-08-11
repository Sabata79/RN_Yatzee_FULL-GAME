// EnergyTokenSystem.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/EnergyTokenStyles';
import { MAX_TOKENS } from '../constants/Game';
import { useGame } from './GameContext';
import { database } from './Firebase';

const db = database();
const REGEN_INTERVAL = 2.4 * 60 * 60 * 1000;

const EnergyTokenSystem = () => {
  const {
    playerId,
    tokens,
    setTokens,
    // HUOM: videoTokens/setVideoTokens POISTETTU KÄYTÖSTÄ
    energyModalVisible,
    setEnergyModalVisible,
  } = useGame();

  const [nextTokenTime, setNextTokenTime] = useState(null);
  const [timeToNextToken, setTimeToNextToken] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Ref to keep track of previous token count
  const prevTokensRef = useRef(tokens);

  const updateNextTokenTimeInFirebase = async (time) => {
    if (playerId) {
      try {
        const nextTimeRef = db.ref(`players/${playerId}/nextTokenTime`);
        await nextTimeRef.set(time ? time.toISOString() : null);
      } catch (error) {
        console.error('Error updating nextTokenTime in Firebase:', error);
      }
    }
  };

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
          const nextTimeRef = db.ref(`players/${playerId}/nextTokenTime`);
          const snapshot = await nextTimeRef.once('value');
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
                console.log('Loaded nextTokenTime from AsyncStorage:', savedNextTokenTime);
              }
            }
          }
        } else {
          const savedNextTokenTimeString = await AsyncStorage.getItem('nextTokenTime');
          if (savedNextTokenTimeString) {
            const savedNextTokenTime = new Date(savedNextTokenTimeString);
            if (!isNaN(savedNextTokenTime.getTime())) {
              setNextTokenTime(savedNextTokenTime);
              console.log('Loaded nextTokenTime from AsyncStorage:', savedNextTokenTime);
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

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('tokens', (tokens ?? 0).toString());
        if (nextTokenTime) {
          await AsyncStorage.setItem('nextTokenTime', nextTokenTime.toISOString());
        }
        if (playerId) {
          await updateNextTokenTimeInFirebase(nextTokenTime);
        }
      } catch (e) {
        console.error('Failed to save data:', e);
      }
    };

    saveData();
  }, [tokens, nextTokenTime, playerId]);

  useEffect(() => {
    if (!dataLoaded) return;
    if (tokens < prevTokensRef.current) {
      const now = new Date();
      const newNextTime = new Date(now.getTime() + REGEN_INTERVAL);
      setNextTokenTime(newNextTime);
      console.log('Tokens decreased, resetting regeneration timer to:', newNextTime);
      if (playerId) {
        updateNextTokenTimeInFirebase(newNextTime);
      }
    }
    prevTokensRef.current = tokens;
  }, [tokens, dataLoaded, playerId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (tokens < MAX_TOKENS && nextTokenTime instanceof Date && !isNaN(nextTokenTime.getTime())) {
        const now = new Date();
        const diff = nextTokenTime - now;
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeToNextToken(`${hours} h ${minutes} min ${seconds} sec`);
        } else {
          const diffTime = now - nextTokenTime;
          const tokensToAdd = Math.floor(diffTime / REGEN_INTERVAL) + 1;
          setTokens((prevTokens) => {
            const newTokenCount = Math.min(prevTokens + tokensToAdd, MAX_TOKENS);
            return newTokenCount;
          });
          if (tokens + tokensToAdd < MAX_TOKENS) {
            const remainder = diffTime % REGEN_INTERVAL;
            const newNextTime = new Date(now.getTime() + (REGEN_INTERVAL - remainder));
            setNextTokenTime(newNextTime);
            if (playerId) {
              updateNextTokenTimeInFirebase(newNextTime);
            }
            console.log('Token(s) added, new nextTokenTime:', newNextTime);
            setTimeToNextToken('Token ready!');
          } else {
            setNextTokenTime(null);
            setTimeToNextToken('Token ready!');
          }
        }
      } else {
        setTimeToNextToken('Calculating...');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [tokens, nextTokenTime, playerId]);

  const progress = tokens ? tokens / MAX_TOKENS : 0;

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
          <Text style={styles.tokenText}>{tokens}/{MAX_TOKENS}</Text>
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={energyModalVisible}
        onRequestClose={() => setEnergyModalVisible(!energyModalVisible)}
      >
        <View style={styles.energyModalOverlay}>
          <View style={styles.energyModalContent}>
            <MaterialCommunityIcons name="flash" size={50} color="gold" style={styles.energyIcon} />
            {tokens === MAX_TOKENS ? (
              <>
                <Text style={styles.energyModalMessage}>You have full energy, have fun!</Text>
                <Pressable
                  style={[styles.energyModalButton, styles.energyModalCloseButton]}
                  onPress={() => setEnergyModalVisible(false)}
                >
                  <Text style={styles.energyModalCloseButtonText}>×</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={styles.energyModalCloseButton}
                  onPress={() => setEnergyModalVisible(false)}
                >
                  <Text style={styles.energyModalCloseButtonText}>×</Text>
                </Pressable>

                {/* Watch Video ja videolaskurit poistettu */}
                <Text style={styles.energyModalMessage}>Time to next token regeneration:</Text>
                <Text style={[styles.energyModalMessage, { fontWeight: 'bold' }]}>{timeToNextToken}</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EnergyTokenSystem;
