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
import { Pressable, Text, View } from 'react-native';
import gameboardBtnstyles from '../styles/GameboardScreenButtonStyles';

const GameboardButtons = ({
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
  MAX_SPOTS,
  NBR_OF_THROWS,
  MaterialCommunityIcons,
}) => {
  if (rounds <= 0) {
    const { width } = useWindowDimensions();
    const gameboardBtnstyles = useMemo(() => createGameboardButtonStyles(width), [width]);
    // Render two "ghost buttons" to keep width and alignment intact  TODO 
    return (
      <View style={gameboardBtnstyles.buttonContainer}>
        <View style={gameboardBtnstyles.buttonGhost} />
        <View style={gameboardBtnstyles.buttonGhost} />
      </View>
    );
  }

  return (
    <View style={gameboardBtnstyles.buttonContainer}>
      <View style={gameboardBtnstyles.buttonWrapper}>
        <View style={gameboardBtnstyles.shadowLayer} />
        <Pressable
          disabled={nbrOfThrowsLeft <= 0}
          style={({ pressed }) => [gameboardBtnstyles.button, pressed && gameboardBtnstyles.buttonPressed]}
          onPress={() => {
            if (rounds === MAX_SPOTS && nbrOfThrowsLeft === NBR_OF_THROWS) startGame();
            if (nbrOfThrowsLeft <= 0) return;
            throwDices();
          }}
        >
          <Text style={gameboardBtnstyles.buttonText}>Roll Dices</Text>
          <View style={gameboardBtnstyles.nbrThrowsTextContainer}>
            {rounds > 0 && (
              <View style={gameboardBtnstyles.nbrThrowsText}>
                <Text style={gameboardBtnstyles.nbrThrowsTextValue}>{nbrOfThrowsLeft}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <View style={gameboardBtnstyles.buttonWrapper}>
        <View style={gameboardBtnstyles.shadowLayer} />
        <Pressable
          disabled={!selectedField}
          style={({ pressed }) => [gameboardBtnstyles.button, pressed && gameboardBtnstyles.buttonPressed]}
          onPress={() => {
            handleSetPoints();
            setNbrOfThrowsLeft(NBR_OF_THROWS);
            resetDiceSelection();

            const selectedCategory = scoringCategories.find((c) => c.index === selectedField);
            const shouldDecrease = !selectedCategory || selectedCategory.name !== 'yatzy' || selectedCategory.points === 0;
            if (shouldDecrease) setRounds((prev) => Math.max(prev - 1, 0));
          }}
        >
          <Text style={gameboardBtnstyles.buttonText}>Set Points</Text>
          <MaterialCommunityIcons name="beaker-plus" size={25} style={gameboardBtnstyles.iconContainer} />
        </Pressable>
      </View>
    </View>
  );
};

export default GameboardButtons;
