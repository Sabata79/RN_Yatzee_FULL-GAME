/**
 * EnergyTokenSystem — Manages player's energy token regeneration and persistence.
 * Centralized timer, AsyncStorage hydration, and Firebase syncing for tokens and nextTokenTime.
 * @module src/components/EnergyTokenSystem
 * @author Sabata79
 * @since 2025-09-24
 * @updated 2025-09-24
 */

// EnergyTokenSystem.js
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import EnergyModal from './modals/EnergyModal';
import { ProgressBar } from 'react-native-paper';
import styles from '../styles/EnergyTokenStyles';
import { MAX_TOKENS } from '../constants/Game';
import { useGame } from '../constants/GameContext';

// Energy token regeneration system
const EnergyTokenSystem = ({ hidden }) => {
  const {
    tokens,
    energyModalVisible,
    setEnergyModalVisible,
    timeToNextToken,
  } = useGame();

  // EnergyTokenSystem is now a presentation-only component.
  // All token regen, persistence and DB syncing responsibility has been moved to GameContext.

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
