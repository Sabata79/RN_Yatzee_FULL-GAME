import { Pressable, Text, View } from 'react-native';
import gameboardBtnstyles from '../styles/GameboardScreenButtonStyles';

/**
 * GameboardButtons
 * - Rolls dice while rounds > 0
 * - Sets points and decrements rounds
 * - Does NOT call endGame directly (that is handled in Gameboard via useEffect)
 */
const GameboardButtons = ({
  rounds,
  nbrOfThrowsLeft,
  savePlayerPoints,
  resetGame,
  navigation,
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
  return (
    <View style={gameboardBtnstyles.buttonContainer}>
      {rounds > 0 && (
        <>
          <View style={gameboardBtnstyles.buttonWrapper}>
            <View style={gameboardBtnstyles.shadowLayer} />
            <Pressable
              disabled={nbrOfThrowsLeft <= 0}
              style={({ pressed }) => [gameboardBtnstyles.button, pressed && gameboardBtnstyles.buttonPressed]}
              onPress={() => {
                if (rounds === MAX_SPOTS && nbrOfThrowsLeft === NBR_OF_THROWS) {
                  startGame();
                }
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
                // apply points
                handleSetPoints();
                // reset throws & selection
                setNbrOfThrowsLeft(NBR_OF_THROWS);
                resetDiceSelection();

                // decrease rounds unless a “free” Yatzy
                const selectedCategory = scoringCategories.find((category) => category.index === selectedField);
                const shouldDecrease =
                  !selectedCategory || selectedCategory.name !== 'yatzy' || selectedCategory.points === 0;

                if (shouldDecrease) {
                  setRounds((prev) => Math.max(prev - 1, 0));
                }
              }}
            >
              <Text style={gameboardBtnstyles.buttonText}>Set Points</Text>
              <MaterialCommunityIcons name="beaker-plus" size={25} style={gameboardBtnstyles.iconContainer} />
            </Pressable>
          </View>
        </>
      )}

      {rounds === 0 && (
        <View style={gameboardBtnstyles.fullWidthButtonWrapper}>
          <View style={gameboardBtnstyles.shadowLayer} />
          <Pressable
            style={({ pressed }) => [gameboardBtnstyles.button, pressed && gameboardBtnstyles.buttonPressed]}
            onPress={async () => {
              const ok = await savePlayerPoints();
              if (ok) {
                resetGame();
                navigation.navigate('Scoreboard');
              }
            }}
          >
            <Text style={gameboardBtnstyles.buttonText}>Game Over, Save Your Score</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default GameboardButtons;
