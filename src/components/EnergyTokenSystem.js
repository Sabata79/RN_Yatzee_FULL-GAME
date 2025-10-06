/**
 * EnergyTokenSystem — Manages player's energy token regeneration and persistence.
 * Centralized timer, AsyncStorage hydration, and Firebase syncing for tokens and nextTokenTime.
 * @module src/components/EnergyTokenSystem
 * @author Sabata79
 * @since 2025-09-24
 * @updated 2025-09-24
 */

// EnergyTokenSystem.js
import React, { useMemo, useCallback } from 'react';
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

  console.log('EnergyTokenSystem render', { tokens, timeToNextToken });

  // EnergyTokenSystem is now a presentation-only component.
  // All token regen, persistence and DB syncing responsibility has been moved to GameContext.

  // Memoize progress so derived value doesn't flip-flop on unrelated renders
  const progress = useMemo(() => (tokens ? tokens / MAX_TOKENS : 0), [tokens]);

  const handleClose = useCallback(() => setEnergyModalVisible(false), [setEnergyModalVisible]);

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
        onClose={handleClose}
        tokens={tokens}
        maxTokens={MAX_TOKENS}
        // Only pass the time string when the modal is actually visible to avoid
        // forcing modal and its children to re-render every second when hidden.
        timeToNextToken={energyModalVisible ? timeToNextToken : undefined}
      />
    </View>
  );
};

export default React.memo(EnergyTokenSystem);
