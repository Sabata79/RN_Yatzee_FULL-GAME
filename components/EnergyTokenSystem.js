import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/energyTokenStyles';
import { MAX_TOKENS, VIDEO_TOKEN_LIMIT, MILLISECONDS_IN_A_DAY } from '../constants/Game';
import Toast from 'react-native-toast-message';
import { useGame } from '../components/GameContext';

const EnergyTokenSystem = () => {
  const { tokens, setTokens, energyModalVisible, setEnergyModalVisible } = useGame();
  const [nextTokenTime, setNextTokenTime] = useState(null);
  const [timeToNextToken, setTimeToNextToken] = useState('');
  const [videoTokens, setVideoTokens] = useState(0);

  // Debug-lokit
  useEffect(() => {
    console.log('nextTokenTime:', nextTokenTime);
    console.log('timeToNextToken:', timeToNextToken);
  }, [nextTokenTime, timeToNextToken]);

  // Ladataan tallennetut tiedot
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedTokens = parseInt(await AsyncStorage.getItem('tokens')) || MAX_TOKENS;
        const savedNextTokenTime = await AsyncStorage.getItem('nextTokenTime');
        const savedVideoTokens = parseInt(await AsyncStorage.getItem('videoTokens')) || 0;
        const lastReset = await AsyncStorage.getItem('lastReset');

        const now = new Date();
        const resetTime = new Date(lastReset);

        if (lastReset && now - resetTime >= MILLISECONDS_IN_A_DAY) {
          await AsyncStorage.setItem('lastReset', now.toISOString());
          setVideoTokens(0);
        } else {
          setVideoTokens(savedVideoTokens);
        }

        if (tokens === null) {
          setTokens(savedTokens);
        }
        setNextTokenTime(savedNextTokenTime ? new Date(savedNextTokenTime) : null);
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    };

    loadSavedData();
  }, []);

  // Tallennetaan tiedot
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('tokens', (tokens ?? 0).toString());
        if (nextTokenTime) {
          await AsyncStorage.setItem('nextTokenTime', nextTokenTime.toISOString());
        }
        await AsyncStorage.setItem('videoTokens', (videoTokens ?? 0).toString());
      } catch (e) {
        console.error('Failed to save data:', e);
      }
    };

    saveData();
  }, [tokens, nextTokenTime, videoTokens]);

  // Asetetaan regenerointiaika, jos tokeneita <= 4
  useEffect(() => {
    if (tokens <= 4 && !nextTokenTime) {
      const now = new Date();
      const nextTime = new Date(now.getTime() + 4.8 * 60 * 60 * 1000); // 5 minuutin regenerointiaika
      setNextTokenTime(nextTime);
      console.log('Regenerointiaika asetettu:', nextTime);
    }
  }, [tokens, nextTokenTime]);

  // Päivitetään jäljellä oleva aika
  useEffect(() => {
    const updateRemainingTime = () => {
      if (tokens <= 4 && nextTokenTime instanceof Date && !isNaN(nextTokenTime.getTime())) {
        const now = new Date();
        const diff = nextTokenTime - now;

        if (diff > 0) {
          const hours = Math.floor(diff / 1000 / 60 / 60);
          const minutes = Math.floor((diff / 1000 / 60) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          setTimeToNextToken(`${hours} h ${minutes} min ${seconds} sec`);
        } else {
          setTimeToNextToken('Token ready!');
          setNextTokenTime(null); // Nollaa regenerointiaika
          setTokens((prev) => Math.min(prev + 1, MAX_TOKENS)); // Lisää yksi token
        }
      } else {
        setTimeToNextToken('Calculating...');
      }
    };

    const interval = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [tokens, nextTokenTime]);

  const handleWatchVideo = () => {
    Toast.show({
      type: 'success',
      text1: 'Watching Video...',
      text2: 'Please wait while we process your reward.',
      visibilityTime: 2000,
      position: 'top',
      onHide: () => {
        setTokens((prev) => Math.min(prev + 1, MAX_TOKENS));
        setVideoTokens((prev) => prev + 1);
        Toast.show({
          type: 'success',
          text1: 'Token Earned!',
          text2: 'Thank you! You earned 1 extra token.',
          visibilityTime: 3000,
          position: 'top',
          topOffset: 50,
        });
      },
    });
  };

  const progress = tokens ? tokens / MAX_TOKENS : 0;

  return (
    <View style={styles.energyContainer}>
      <Toast />
      <MaterialCommunityIcons name="flash" size={40} color="gold" style={styles.energyIcon} />
      <View style={styles.progressBarContainer}>
        <ProgressBar progress={progress} color="green" style={styles.progressBar} />
        <Text style={styles.tokenText}>
          {tokens}/{MAX_TOKENS}
        </Text>
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
            <Text style={styles.energyModalMessage}>You are out of energy tokens!</Text>

            {videoTokens < VIDEO_TOKEN_LIMIT && (
              <>
                <Pressable
                  style={styles.energyModalButton}
                  onPress={() => {
                    setEnergyModalVisible(false);
                    handleWatchVideo();
                  }}
                >
                  <Text style={styles.energyModalButtonText}>Watch Video for Energy Token</Text>
                </Pressable>
                <Text style={styles.energyModalFooterText}>
                  Video Tokens Used: {videoTokens}/{VIDEO_TOKEN_LIMIT}
                </Text>
              </>
            )}

            <Text style={styles.energyModalMessage}>
              Time to next token regeneration:
            </Text>
            <Text style={[styles.energyModalMessage, { fontWeight: 'bold' }]}>{timeToNextToken}</Text>

            <Pressable
              style={[styles.energyModalButton, styles.energyModalCloseButton]}
              onPress={() => setEnergyModalVisible(false)}
            >
              <Text style={styles.energyModalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EnergyTokenSystem;
