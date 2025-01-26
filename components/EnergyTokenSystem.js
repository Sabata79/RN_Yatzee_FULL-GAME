import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/energyTokenStyles';
import { MAX_TOKENS, VIDEO_TOKEN_LIMIT } from '../constants/Game';
import Toast from 'react-native-toast-message';
import { useGame } from '../components/GameContext';

const EnergyTokenSystem = () => {

  const { tokens, setTokens, videoTokens, setVideoTokens, energyModalVisible, setEnergyModalVisible } = useGame();
  const [nextTokenTime, setNextTokenTime] = useState(null);
  const [timeToNextToken, setTimeToNextToken] = useState('');

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedVideoTokens = parseInt(await AsyncStorage.getItem('videoTokens')) || 0;
        setVideoTokens(savedVideoTokens);

        const savedTokens = parseInt(await AsyncStorage.getItem('tokens')) || 10;  // Oletusarvo 10
        setTokens(savedTokens);

        const lastReset = await AsyncStorage.getItem('lastVideoTokenReset');
        const now = new Date();
        const resetTime = new Date(lastReset);

        if (lastReset && now - resetTime >= 24 * 60 * 60 * 1000) {
          await AsyncStorage.setItem('lastVideoTokenReset', now.toISOString());
          setVideoTokens(0);
        }
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    };

    loadSavedData();
  }, [setTokens, setVideoTokens]);

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

  useEffect(() => {
    if (tokens <= 4 && !nextTokenTime) {
      const now = new Date();
      const nextTime = new Date(now.getTime() + 2.4 * 60 * 60 * 1000);
      setNextTokenTime(nextTime);
      console.log('Regenerointiaika asetettu:', nextTime);
    }
  }, [tokens, nextTokenTime]);

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
          setNextTokenTime(null);
          setTokens((prev) => Math.min(prev + 1, MAX_TOKENS));
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
      topOffset: 0,
      zIndex: 1000,
      onHide: () => {
        setTokens((prev) => Math.min(prev + 1, MAX_TOKENS));
        setVideoTokens((prev) => prev + 1);
        Toast.show({
          type: 'success',
          text1: 'Token Earned!',
          text2: 'Thank you! You earned 1 extra token.',
          visibilityTime: 3000,
          position: 'top',
          topOffset: 0,
          zIndex: 1000,
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
        <Pressable onPress={() => setEnergyModalVisible(true)}>
          <Text style={styles.tokenText}>
            {tokens}/{MAX_TOKENS}
          </Text>
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

            {/* Tarkistetaan, onko energia täynnä */}
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
                <Text style={styles.energyModalMessage}>You are out of energy tokens!</Text>
                {videoTokens < VIDEO_TOKEN_LIMIT && (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.energyModalButton,
                        pressed && styles.energyModalButtonPressed,
                      ]}
                      onPress={() => {
                        setEnergyModalVisible(false);
                        handleWatchVideo();
                      }}
                    >
                      <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="video-vintage" size={40} color="white" />
                      </View>
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


              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EnergyTokenSystem;
