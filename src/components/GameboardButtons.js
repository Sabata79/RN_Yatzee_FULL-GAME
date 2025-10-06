/**
 * GameboardButtons – action buttons for the main gameboard UI.
 * Renders throw, set points, and start game buttons with dynamic states and icons.
 *
 * Props:
 *  - rounds: number
 *  - nbrOfThrowsLeft: number
 *  - gameStarted: boolean
 *  - beginGame: () => void
 *  - throwDices: () => void
 *  - canSetPoints: boolean
 *  - onRollPress?: () => void
 *  - onSetPointsPress: () => void
 *
 * @module GameboardButtons
 * @author Sabata79
 * @since 2025-09-18
 */
import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import styles from '../styles/GameboardScreenButtonStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function GameboardButtons({
  rounds,
  nbrOfThrowsLeft,
  gameStarted,
  beginGame,
  throwDices,
  canSetPoints,
  onRollPress,       // optional override
  onSetPointsPress,
}) {
  if (rounds <= 0) {
    return (
      <View style={styles.buttonContainer}>
        <View style={styles.buttonGhost} />
        <View style={styles.buttonGhost} />
      </View>
    );
  }

  // default roll handler (used if onRollPress prop not provided)
  const defaultRollPress = useCallback(() => {
    if (rounds <= 0) return;

    if (!gameStarted) {
      // Do not call beginGame() here; throwDices() will call beginGame()
      // as needed. Calling it here caused tokens to be decremented twice
      // (optimistic local decrement in beginGame + the call below).
      throwDices();
      return;
    }

    if (nbrOfThrowsLeft <= 0) return;
    throwDices();
  }, [rounds, gameStarted, beginGame, throwDices, nbrOfThrowsLeft]);

  const rollHandler = onRollPress ?? defaultRollPress;

  return (
    <View style={styles.buttonContainer}>
      <View style={styles.buttonWrapper}>
        <View style={styles.shadowLayer} />
        <Pressable
          disabled={rounds <= 0 || (gameStarted && nbrOfThrowsLeft <= 0)}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={rollHandler}
        >
          <Text style={styles.buttonText}>Roll Dices</Text>
          <View style={styles.nbrThrowsTextContainer}>
            {rounds > 0 && (
              <View style={styles.nbrThrowsText}>
                <Text style={styles.nbrThrowsTextValue}>{nbrOfThrowsLeft}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <View style={styles.buttonWrapper}>
        <View style={styles.shadowLayer} />
        <Pressable
          disabled={!canSetPoints}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onSetPointsPress}
        >
          <Text style={styles.buttonText}>Set Points</Text>
          <MaterialCommunityIcons name="beaker-plus" size={25} style={styles.iconContainer} />
        </Pressable>
      </View>
    </View>
  );
}

export default React.memo(GameboardButtons);
