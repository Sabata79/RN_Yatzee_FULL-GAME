import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Pressable, Button } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/EnergyTokenStyles';
import { MAX_TOKENS, VIDEO_TOKEN_LIMIT } from '../constants/Game';
import { useGame } from '../components/GameContext';
import { ref, get, set } from 'firebase/database';
import { database } from '../components/Firebase';
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-3940256099942544/5224354917';
const REGEN_INTERVAL = 2.4 * 60 * 60 * 1000; // 2.4 tuntia ms:inä

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
  const [adLoaded, setAdLoaded] = useState(false);
  const [rewarded, setRewarded] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Ref to keep track of previous token count
  const prevTokensRef = useRef(tokens);

  const updateNextTokenTimeInFirebase = async (time) => {
    if (playerId) {
      try {
        const nextTimeRef = ref(database, `players/${playerId}/nextTokenTime`);
        await set(nextTimeRef, time ? time.toISOString() : null);
        console.log('Updated nextTokenTime in Firebase:', time);
      } catch (error) {
        console.error('Error updating nextTokenTime in Firebase:', error);
      }
    }
  };

  const loadNewAd = () => {
    const newAd = RewardedAd.createForAdRequest(adUnitId, {
      keywords: ['gaming', 'rewards'],
    });

    newAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAdLoaded(true);
    });

    newAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('🏆 User gets reward:', reward);
      setTokens((prev) => Math.min(prev + 1, MAX_TOKENS));
      setVideoTokens((prev) => prev + 1);
      setAdLoaded(false);
      loadNewAd();
    });

    newAd.addAdEventListener('closed', () => {
      setAdLoaded(false);
      loadNewAd();
    });

    setRewarded(newAd);
    newAd.load();
  };

  useEffect(() => {
    loadNewAd();
  }, []);

  const handleWatchVideo = () => {
    if (adLoaded && rewarded) {
      console.log('▶ Showing Ad...');
      rewarded.show();
    } else {
      console.log('⚠ Ad is not ready yet.');
    }
  };

  // Ladataan tiedot AsyncStoragesta ja Firebaseä varten
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedTokensString = await AsyncStorage.getItem('tokens');
        let savedTokens = savedTokensString === null ? MAX_TOKENS : parseInt(savedTokensString, 10);
        setTokens(savedTokens);

        const savedVideoTokensString = await AsyncStorage.getItem('videoTokens');
        let savedVideoTokens = savedVideoTokensString === null ? 0 : parseInt(savedVideoTokensString, 10);
        setVideoTokens(savedVideoTokens);

        if (playerId) {
          const nextTimeRef = ref(database, `players/${playerId}/nextTokenTime`);
          const snapshot = await get(nextTimeRef);
          if (snapshot.exists()) {
            const firebaseNextTokenTime = new Date(snapshot.val());
            if (!isNaN(firebaseNextTokenTime.getTime())) {
              setNextTokenTime(firebaseNextTokenTime);
              console.log('Loaded nextTokenTime from Firebase:', firebaseNextTokenTime);
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

  // Jos tokenit vähenevät manuaalisesti (esim. gameboard vähentää tokenin), 
  // resetoi regenerointiaika uudelleen.
  useEffect(() => {
    if (!dataLoaded) return;
    if (tokens < prevTokensRef.current) {
      const now = new Date();
      const newNextTime = new Date(now.getTime() + REGEN_INTERVAL);
      setNextTokenTime(newNextTime);
      console.log("Tokens decreased, resetting regeneration timer to:", newNextTime);
      if (playerId) {
        updateNextTokenTimeInFirebase(newNextTime);
      }
    }
    prevTokensRef.current = tokens;
  }, [tokens, dataLoaded, playerId]);

  // Päivitetään countdown ja lisätään token kun regenerointiaika on kulunut.
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
          // Lasketaan montako regenerointijaksoa on kulunut
          const diffTime = now - nextTokenTime;
          const tokensToAdd = Math.floor(diffTime / REGEN_INTERVAL) + 1;
          setTokens(prevTokens => {
            const newTokenCount = Math.min(prevTokens + tokensToAdd, MAX_TOKENS);
            return newTokenCount;
          });
          if (tokens + tokensToAdd < MAX_TOKENS) {
            // Uusi regenerointiaika sen perusteella, että osa ajasta on vielä kulunut
            const remainder = diffTime % REGEN_INTERVAL;
            const newNextTime = new Date(now.getTime() + (REGEN_INTERVAL - remainder));
            setNextTokenTime(newNextTime);
            if (playerId) {
              updateNextTokenTimeInFirebase(newNextTime);
            }
            console.log("Token(s) added, new nextTokenTime:", newNextTime);
            setTimeToNextToken("Token ready!");
          } else {
            setNextTokenTime(null);
            setTimeToNextToken("Token ready!");
          }
        }
      } else {
        setTimeToNextToken("Calculating...");
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
