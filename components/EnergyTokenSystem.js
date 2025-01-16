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



  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedTokens = await AsyncStorage.getItem('tokens');
        const savedNextTokenTime = await AsyncStorage.getItem('nextTokenTime');
        const savedVideoTokens = await AsyncStorage.getItem('videoTokens');
        const lastReset = await AsyncStorage.getItem('lastReset');

        const now = new Date();
        const resetTime = new Date(lastReset);

        if (lastReset && now - resetTime >= MILLISECONDS_IN_A_DAY) {
          await AsyncStorage.setItem('lastReset', now.toISOString());
          setVideoTokens(0);
        } else {
          setVideoTokens(parseInt(savedVideoTokens) || 0);
        }

        setTokens(parseInt(savedTokens) || MAX_TOKENS);
        setNextTokenTime(savedNextTokenTime ? new Date(savedNextTokenTime) : null);
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    };

    loadSavedData();
  }, []);


  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('tokens', tokens.toString());
        await AsyncStorage.setItem('nextTokenTime', nextTokenTime ? nextTokenTime.toISOString() : '');
        await AsyncStorage.setItem('videoTokens', videoTokens.toString());
      } catch (e) {
        console.error('Failed to save data:', e);
      }
    };

    saveData();
  }, [tokens, nextTokenTime, videoTokens]);

  useEffect(() => {
    const updateRemainingTime = () => {
      if (nextTokenTime) {
        const now = new Date();
        const diff = nextTokenTime - now;

        if (diff > 0) {
          const minutes = Math.floor((diff / 1000 / 60) % 60);
          const seconds = Math.floor((diff / 1000) % 60);
          setTimeToNextToken(`${minutes} min ${seconds} sec`);
        } else {
          setTimeToNextToken('Token ready!');
        }
      } else {
        setTimeToNextToken('Calculating...');
      }
    };

    const interval = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [nextTokenTime]);

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

  const progress = tokens / MAX_TOKENS;

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
      {/* Modal for No Energy */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={energyModalVisible}
        onRequestClose={() => {
          setEnergyModalVisible(!energyModalVisible);
        }}
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
                <Text style={[styles.energyModalMessage, { fontWeight: 'bold' }]}>Or..</Text>
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
