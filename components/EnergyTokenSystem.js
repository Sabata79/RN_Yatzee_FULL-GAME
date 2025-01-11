import React, { useState, useEffect } from 'react';
import { View, Text, Alert, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/energyTokenStyles';
import { MAX_TOKENS, VIDEO_TOKEN_LIMIT, MILLISECONDS_IN_A_DAY } from '../constants/Game';
import { useGame } from '../components/GameContext';

const EnergyTokenSystem = ({ onPlay }) => {
  const [tokens, setTokens] = useState(MAX_TOKENS);
  const [nextTokenTime, setNextTokenTime] = useState(null);
  const [videoTokens, setVideoTokens] = useState(0);
  const [energyModalVisible, setModalVisible] = useState(false);
  const { gameStarted, gameEnded } = useGame();

  // Load saved data on mount
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

  // Save token data on change
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('tokens', tokens.toString());
        await AsyncStorage.setItem('nextTokenTime', nextTokenTime ? nextTokenTime.toISOString() : '');
        await AsyncStorage.setItem('videoTokens', videoTokens.toString());
        if (!await AsyncStorage.getItem('lastReset')) {
          await AsyncStorage.setItem('lastReset', new Date().toISOString());
        }
      } catch (e) {
        console.error('Failed to save data:', e);
      }
    };

    saveData();
  }, [tokens, nextTokenTime, videoTokens]);

  // Token regeneration logic
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

  // Handle game start
  useEffect(() => {
    if (gameStarted && tokens === 0) {
      setModalVisible(true);
    }
  }, [gameStarted]);

  // Handle ad-based token
  const handleWatchVideo = () => {
    if (videoTokens >= VIDEO_TOKEN_LIMIT) {
      Alert.alert('Limit Reached', 'You have reached the daily limit for earning tokens by watching videos.');
      return;
    }

    setTimeout(() => {
      setTokens((prev) => Math.min(prev + 1, MAX_TOKENS));
      setVideoTokens((prev) => prev + 1);
      Alert.alert('Thank You', 'You earned 1 extra token!');
    }, 2000);
  };

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
      <Text style={[styles.tokenText, { top: 30, left: -50 }]}>Video Tokens Used: {videoTokens}/{VIDEO_TOKEN_LIMIT}</Text>

      {/* Modal for No Energy */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={energyModalVisible}
        onRequestClose={() => {
          setModalVisible(!energyModalVisible);
        }}>
        <View style={styles.energyModalOverlay}>
          <View style={styles.energyModalContent}>
            <Text style={styles.energyModalTitle}>No Energy</Text>
            <Text style={styles.energyModalMessage}>You are out of energy tokens!</Text>
            <Pressable
              style={styles.energyModalButton}
              onPress={() => {
                setModalVisible(false);
                handleWatchVideo();
              }}>
              <Text style={styles.energyModalButtonText}>Watch Video for Energy Token</Text>
            </Pressable>
            <Text style={styles.energyModalFooterText}>Video Tokens Used: {videoTokens}/{VIDEO_TOKEN_LIMIT}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EnergyTokenSystem;
