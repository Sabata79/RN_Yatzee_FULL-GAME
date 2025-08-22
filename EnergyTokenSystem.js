// components/EnergyTokenSystem.js
import { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, Button } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/energyTokenStyles';
import { MAX_TOKENS, VIDEO_TOKEN_LIMIT } from '../constants/Game';
import { useGame } from '../components/GameContext';
import { dbGet, dbSet } from '../components/Firebase';

const REGEN_INTERVAL = 2.4 * 60 * 60 * 1000; // 2.4 h

const EnergyTokenSystem = () => {
  const {
    playerId,
    tokens,
    setTokens,
    videoTokens,
    setVideoTokens,
    energyModalVisible,
    setEnergyModalVisible,
  } = useGame();

  const [nextTokenTime, setNextTokenTime] = useState(null);
  const [timeToNextToken, setTimeToNextToken] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Edellinen token-määrä vertailuun
  const prevTokensRef = useRef(tokens);

  const updateNextTokenTimeInFirebase = async (time) => {
    if (!playerId) return;
    try {
      await dbSet(`players/${playerId}/nextTokenTime`, time ? time.toISOString() : null);
    } catch (error) {
      console.error('Error updating nextTokenTime in Firebase:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadNewAd, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Lataa tallennetut tiedot (AsyncStorage + Firebase nextTokenTime)
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // tokens
        const savedTokensString = await AsyncStorage.getItem('tokens');
        const savedTokens = savedTokensString === null ? MAX_TOKENS : parseInt(savedTokensString, 10);
        setTokens(savedTokens);

        // videoTokens (päivitetään myös 24h välein)
        const savedVideoTokensString = await AsyncStorage.getItem('videoTokens');
        const savedVideoTokens = savedVideoTokensString === null ? 0 : parseInt(savedVideoTokensString, 10);
        setVideoTokens(savedVideoTokens);

        // nextTokenTime -> Firebase etusijalla jos löytyy
        if (playerId) {
          const snapshot = await dbGet(`players/${playerId}/nextTokenTime`);
          if (snapshot.exists()) {
            const firebaseNextTokenTime = new Date(snapshot.val());
            if (!isNaN(firebaseNextTokenTime.getTime())) setNextTokenTime(firebaseNextTokenTime);
          } else {
            const savedNextTokenTimeString = await AsyncStorage.getItem('nextTokenTime');
            if (savedNextTokenTimeString) {
              const savedNextTokenTime = new Date(savedNextTokenTimeString);
              if (!isNaN(savedNextTokenTime.getTime())) setNextTokenTime(savedNextTokenTime);
            }
          }
        } else {
          const savedNextTokenTimeString = await AsyncStorage.getItem('nextTokenTime');
          if (savedNextTokenTimeString) {
            const savedNextTokenTime = new Date(savedNextTokenTimeString);
            if (!isNaN(savedNextTokenTime.getTime())) setNextTokenTime(savedNextTokenTime);
          }
        }

        // Päivittäinen nollaus videoTokens-arvolle
        const lastReset = await AsyncStorage.getItem('lastVideoTokenReset');
        const now = new Date();
        if (!lastReset) {
          await AsyncStorage.setItem('lastVideoTokenReset', now.toISOString());
          setVideoTokens(0);
        } else {
          const resetTime = new Date(lastReset);
          if (now - resetTime >= 24 * 60 * 60 * 1000) {
            await AsyncStorage.setItem('lastVideoTokenReset', now.toISOString());
            setVideoTokens(0);
          }
        }
      } catch (e) {
        console.error('Failed to load saved data:', e);
      } finally {
        setDataLoaded(true);
      }
    };

    loadSavedData();
  }, [setTokens, setVideoTokens, playerId]);

  // Tallenna muutokset (local + Firebase)
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('tokens', (tokens ?? 0).toString());
        if (nextTokenTime) {
          await AsyncStorage.setItem('nextTokenTime', nextTokenTime.toISOString());
        }
        await AsyncStorage.setItem('videoTokens', (videoTokens ?? 0).toString());

        if (playerId) {
          await updateNextTokenTimeInFirebase(nextTokenTime);
        }
      } catch (e) {
        console.error('Failed to save data:', e);
      }
    };
    saveData();
  }, [tokens, nextTokenTime, videoTokens, playerId]);

  // Aikatauluta nextTokenTime kun tokenit vähenee
  useEffect(() => {
    if (!dataLoaded) return;
    if (tokens < prevTokensRef.current) {
      const now = new Date();
      const newNextTime = new Date(now.getTime() + REGEN_INTERVAL);
      setNextTokenTime(newNextTime);
      if (playerId) updateNextTokenTimeInFirebase(newNextTime);
    }
    prevTokensRef.current = tokens;
  }, [tokens, dataLoaded, playerId]);

  // Countdown + automaattinen tokenien lisäys
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

          setTokens((prev) => {
            const newTotal = Math.min((prev ?? 0) + tokensToAdd, MAX_TOKENS);
            return newTotal;
          });

          if ((tokens ?? 0) + tokensToAdd < MAX_TOKENS) {
            const remainder = diffTime % REGEN_INTERVAL;
            const newNextTime = new Date(now.getTime() + (REGEN_INTERVAL - remainder));
            setNextTokenTime(newNextTime);
            if (playerId) updateNextTokenTimeInFirebase(newNextTime);
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
      <MaterialCommunityIcons name="flash" size={40} color="gold" style={styles.energyIcon} />
      <View style={styles.progressBarContainer}>
        <ProgressBar progress={progress} color="green" style={styles.progressBar} />
        <Pressable onPress={() => setEnergyModalVisible(true)}>
          <Text style={styles.tokenText}>{tokens}/{MAX_TOKENS}</Text>
          <Text style={styles.plusMark}>+</Text>
        </Pressable>
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
                <Text style={styles.energyModalMessage}>Need more tokens ?</Text>
                {videoTokens < VIDEO_TOKEN_LIMIT && (
                  <>
                    <Button title="Watch Video" onPress={handleWatchVideo} />
                    <Text style={styles.energyModalFooterText}>
                      Video Tokens Used: {videoTokens}/{VIDEO_TOKEN_LIMIT}
                    </Text>
                  </>
                )}
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
