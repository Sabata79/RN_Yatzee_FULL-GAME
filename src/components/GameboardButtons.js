/**
 * GameboardButtons – Action buttons footer for the game.
 * Renders "Roll Dices" and "Set Points" while rounds > 0.
 * When rounds <= 0, renders invisible placeholders to keep layout width stable.
 *
 * Usage:
 *   import GameboardButtons from '@/components/GameboardButtons';
 *   <GameboardButtons
 *     rounds={rounds}
 *     nbrOfThrowsLeft={nbrOfThrowsLeft}
 *     startGame={startGame}
 *     throwDices={throwDices}
 *     selectedField={selectedField}
 *     handleSetPoints={handleSetPoints}
 *     setNbrOfThrowsLeft={setNbrOfThrowsLeft}
 *     resetDiceSelection={resetDiceSelection}
 *     scoringCategories={scoringCategories}
 *     setRounds={setRounds}
 *     MAX_SPOTS={MAX_SPOTS}
 *     NBR_OF_THROWS={NBR_OF_THROWS}
 *     MaterialCommunityIcons={MaterialCommunityIcons}
 *   />
 *
 * Notes:
 * - Does NOT call endGame directly; Gameboard handles end-of-game via useEffect.
 * - Decrements rounds unless a free Yatzy case applies.
 *
 * @module components/GameboardButtons
 * @author Sabata79
 * @since 2025-09-16
 */
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import styles from '../styles/GameboardScreenButtonStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MAX_SPOTS, NBR_OF_THROWS } from '../constants/Game';

const GameboardButtons = (props) => {

  const {
    rounds,
    nbrOfThrowsLeft,
    startGame,
    throwDices,
    selectedField,
    handleSetPoints,
    setNbrOfThrowsLeft,
    resetDiceSelection,
    scoringCategories,
    setRounds,
  } = props;

  // console.log('Rendering GameboardButtons, rounds:', rounds);
  // console.log('nbrOfThrowsLeft:', nbrOfThrowsLeft);
  // console.log('startGame function:', startGame);
  // console.log('throwDices function:', throwDices);
  // console.log('selectedField:', selectedField);
  // console.log('handleSetPoints function:', handleSetPoints);
  // console.log('setNbrOfThrowsLeft function:', setNbrOfThrowsLeft);
  // console.log('scoringCategories:', scoringCategories);
  // console.log('resetDiceSelection function:', resetDiceSelection);
  // console.log('setRounds function:', setRounds);
  console.log('MAX_SPOTS:', MAX_SPOTS);
  console.log('NBR_OF_THROWS:', NBR_OF_THROWS);

  if (rounds <= 0) {
    // “Ghost”-napit pitävät layoutin leveyden
    return (
      <View style={styles.buttonContainer}>
        <View style={styles.buttonGhost} />
        <View style={styles.buttonGhost} />
      </View>
    );
  }

  return (
    <View style={styles.buttonContainer}>
      <View style={styles.buttonWrapper}>
        <View style={styles.shadowLayer} />
        <Pressable
          disabled={nbrOfThrowsLeft <= 0}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => {
            if (rounds === MAX_SPOTS && nbrOfThrowsLeft === NBR_OF_THROWS) startGame();
            if (nbrOfThrowsLeft <= 0) return;
            throwDices();
          }}
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
          disabled={!selectedField}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => {
            handleSetPoints();
            setNbrOfThrowsLeft(NBR_OF_THROWS);
            resetDiceSelection();
            const selectedCategory = scoringCategories.find((c) => c.index === selectedField);
            const shouldDecrease = !selectedCategory || selectedCategory.name !== 'yatzy' || selectedCategory.points === 0;
            if (shouldDecrease) setRounds((prev) => Math.max(prev - 1, 0));
          }}
        >
          <Text style={styles.buttonText}>Set Points</Text>
          <MaterialCommunityIcons name="beaker-plus" size={25} style={styles.iconContainer} />
        </Pressable>
      </View>
    </View>
  );
};

export default GameboardButtons;
