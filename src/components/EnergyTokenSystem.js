/**
 * EnergyTokenSystem — Manages player's energy token regeneration and persistence.
 * Centralized timer, AsyncStorage hydration, and Firebase syncing for tokens and nextTokenTime.
 * @module src/components/EnergyTokenSystem
 * @author Sabata79
 * @since 2025-09-24
 * @updated 2025-09-24
 */

// EnergyTokenSystem.js
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator, Animated } from 'react-native';
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
    tokensStabilized,
    getTimeToNextToken,
  } = useGame();

  // Animated fade to smooth appearance when tokens become stabilized
  const opacity = useRef(new Animated.Value(tokensStabilized ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: tokensStabilized ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [tokensStabilized, opacity]);

  // Dev-only render timing
  React.useEffect(() => {
    // dev render timing log removed
  }, [tokens, tokensStabilized, energyModalVisible, getTimeToNextToken]);

  React.useEffect(() => {
    // tokens stabilized debug log removed
  }, [tokensStabilized]);

  // console.log('EnergyTokenSystem render', { tokens, timeToNextToken });

  // EnergyTokenSystem is now a presentation-only component.
  // All token regen, persistence and DB syncing responsibility has been moved to GameContext.

  // Memoize progress so derived value doesn't flip-flop on unrelated renders
  const progress = useMemo(() => (typeof tokens === 'number' && tokensStabilized ? Math.max(0, Math.min(1, tokens / MAX_TOKENS)) : 0), [tokens, tokensStabilized]);

  const handleClose = useCallback(() => setEnergyModalVisible(false), [setEnergyModalVisible]);

  // Render the energy container
  if (hidden) return null;
  return (
    <Animated.View style={[styles.energyContainer, { opacity }] }>
      <View style={styles.progressWrap}>
        <MaterialCommunityIcons
          name="flash"
          size={30}
          color="gold"
          style={styles.energyIconOverlay}
        />
        {tokensStabilized ? (
          <ProgressBar progress={progress} color="green" style={styles.progressBar} />
        ) : (
          <View style={[styles.progressBar, styles.progressPlaceholder]}>
            <ActivityIndicator size="small" color="white" />
          </View>
        )}
        <View style={styles.progressOverlay}>
          <Text style={styles.tokenText}>{tokensStabilized ? `${tokens} / ${MAX_TOKENS}` : `-- / ${MAX_TOKENS}`}</Text>
        </View>
      </View>
        <EnergyModal
          visible={energyModalVisible}
          onClose={handleClose}
          tokens={tokens}
          maxTokens={MAX_TOKENS}
          // Only compute and pass the time string when modal is open to avoid
          // forcing header and other consumers to re-render every second.
          timeToNextToken={energyModalVisible ? getTimeToNextToken() : undefined}
        />
    </Animated.View>
  );
};

export default React.memo(EnergyTokenSystem);
