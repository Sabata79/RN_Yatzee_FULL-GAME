// EnergyTokenSystem.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import styles from '../styles/EnergyTokenStyles';
import { MAX_TOKENS } from '../constants/Game';

const EnergyTokenSystem = ({ onPlay }) => {
    const [tokens, setTokens] = useState(MAX_TOKENS);
    const [nextTokenTime, setNextTokenTime] = useState(null);

    useEffect(() => {
        if (tokens < MAX_TOKENS) {
            const interval = setInterval(() => {
                if (nextTokenTime && new Date() >= nextTokenTime) {
                    setTokens((prev) => Math.min(prev + 1, MAX_TOKENS));
                    setNextTokenTime(null);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [tokens, nextTokenTime]);

    const handleWatchVideo = () => {
        // Simulate watching a video and earning a token
        setTimeout(() => {
            setTokens(tokens + 1);
            Alert.alert('Thank You', 'You earned 1 extra token!');
        }, 2000); // Simulate 2-second ad duration
    };

  return (
    <View style={styles.energyContainer}>
      <MaterialCommunityIcons name="flash" size={40} color="gold" style={styles.energyIcon} />
      <View style={styles.progressBarContainer}>
        <ProgressBar progress={tokens / MAX_TOKENS} color="green" style={styles.progressBar} />
        <Text style={styles.tokenText}>
          {tokens}/{MAX_TOKENS}
        </Text>
      </View>
    </View>
  );
}

export default EnergyTokenSystem;
