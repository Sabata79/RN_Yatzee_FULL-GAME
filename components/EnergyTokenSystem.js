import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/energyTokenStyles';
import { MAX_TOKENS, VIDEO_TOKEN_LIMIT, MILLISECONDS_IN_A_DAY } from '../constants/Game';
import Toast from 'react-native-toast-message';

const EnergyTokenSystem = () => {
  const [tokens, setTokens] = useState(MAX_TOKENS);
  const [nextTokenTime, setNextTokenTime] = useState(null);
  const [timeToNextToken, setTimeToNextToken] = useState('');
  const [videoTokens, setVideoTokens] = useState(0);
  const [energyModalVisible, setModalVisible] = useState(false);

  // Game context
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

        if (savedNextTokenTime) {
          const nextTime = new Date(savedNextTokenTime);
          if (!isNaN(nextTime)) {
            setNextTokenTime(nextTime);
          } else {
            console.error('Invalid nextTokenTime format:', savedNextTokenTime);
            setNextTokenTime(null);
          }
        } else {
          const intervalTime = MILLISECONDS_IN_A_DAY / MAX_TOKENS;
          const newNextTokenTime = new Date(Date.now() + intervalTime);
          setNextTokenTime(newNextTokenTime);
          await AsyncStorage.setItem('nextTokenTime', newNextTokenTime.toISOString());
          console.log('New nextTokenTime set:', newNextTokenTime);
        }
      } catch (e) {
        console.error('Failed to load saved data:', e);
      }
    };

    loadSavedData();
  }, []);

  const handleWatchVideo = () => {
    if (videoTokens >= VIDEO_TOKEN_LIMIT) {
      Toast.show({
        type: 'error',
        text1: 'Limit Reached',
        text2: 'You have reached the daily limit for earning tokens by watching videos.',
        visibilityTime: 3000,
        position: 'top',
        topOffset: 50,
      });
      return;
    }

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
  }

  // Calculation of time
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

  // Token regeneration
  useEffect(() => {
    if (tokens < MAX_TOKENS) {
      const interval = setInterval(() => {
        if (nextTokenTime && new Date() >= nextTokenTime) {
          setTokens((prev) => Math.min(prev + 1, MAX_TOKENS));
          const intervalTime = MILLISECONDS_IN_A_DAY / MAX_TOKENS;
          setNextTokenTime(new Date(Date.now() + intervalTime));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [tokens, nextTokenTime]);

  const progress = tokens / MAX_TOKENS;

  return (
    <View style={styles.energyContainer}>
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
          setModalVisible(!energyModalVisible);
        }}
      >
        <View style={styles.energyModalOverlay}>
          <View style={styles.energyModalContent}>
            <Text style={styles.energyModalTitle}>No Energy!</Text>
            <Text style={styles.energyModalMessage}>You are out of energy tokens.</Text>

            {/* Conditional rendering for video button */}
            {videoTokens < VIDEO_TOKEN_LIMIT && (
              <>
                <Pressable
                  style={styles.energyModalButton}
                  onPress={() => {
                    setModalVisible(false);
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

            {/* Close Modal Button */}
            <Pressable
              style={[styles.energyModalButton, styles.energyModalCloseButton]}
              onPress={() => setModalVisible(false)}
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
