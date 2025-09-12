import { Pressable, Text, View } from 'react-native';
import gameboardBtnstyles from '../styles/GameboardScreenButtonStyles';

// NOTE: styles and MaterialCommunityIcons come via props

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
  endGame, // <-- added
}) => {
  return (
    <View style={gameboardBtnstyles.buttonContainer}>
      {rounds > 0 && (
        <>
          {/* Roll Dices */}
          <View style={gameboardBtnstyles.buttonWrapper}>
            <View style={gameboardBtnstyles.shadowLayer} />
            <Pressable
              disabled={nbrOfThrowsLeft <= 0}
              style={({ pressed }) => [
                gameboardBtnstyles.button,
                pressed && gameboardBtnstyles.buttonPressed,
              ]}
              onPress={() => {
                // Start the game on the very first roll of the first round
                if (rounds === MAX_SPOTS && nbrOfThrowsLeft === NBR_OF_THROWS) {
                  startGame();
                }
                throwDices();
              }}
            >
              <Text style={gameboardBtnstyles.buttonText}>Roll Dices</Text>
              <View style={gameboardBtnstyles.nbrThrowsTextContainer}>
                {rounds > 0 && (
                  <View style={gameboardBtnstyles.nbrThrowsText}>
                    <Text style={gameboardBtnstyles.nbrThrowsTextValue}>
                      {nbrOfThrowsLeft}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          </View>

          {/* Set Points */}
          <View style={gameboardBtnstyles.buttonWrapper}>
            <View style={gameboardBtnstyles.shadowLayer} />
            <Pressable
              disabled={selectedField == null} // safer than !selectedField
              style={({ pressed }) => [
                gameboardBtnstyles.button,
                pressed && gameboardBtnstyles.buttonPressed,
              ]}
              onPress={() => {
                // Apply points to selected category
                handleSetPoints();

                // Reset throws and selection for the next turn
                setNbrOfThrowsLeft(NBR_OF_THROWS);
                resetDiceSelection();

                // Determine if we should decrement rounds
                const selectedCategory = scoringCategories.find(
                  (category) => category.index === selectedField
                );

                const shouldDecrement =
                  !selectedCategory ||
                  selectedCategory.name !== 'yatzy' ||
                  selectedCategory.points === 0;

                if (shouldDecrement) {
                  setRounds((prev) => {
                    const next = prev - 1;
                    if (next === 0) {
                      // Last slot filled → end game now (stops timer; duration is preserved)
                      endGame && endGame();
                    }
                    return next;
                  });
                }
              }}
            >
              <Text style={gameboardBtnstyles.buttonText}>Set Points</Text>
              <MaterialCommunityIcons
                name="beaker-plus"
                size={25}
                style={gameboardBtnstyles.iconContainer}
              />
            </Pressable>
          </View>
        </>
      )}

      {/* Game Over / Save */}
      {rounds === 0 && (
        <View className={gameboardBtnstyles.fullWidthButtonWrapper}>
          <View style={gameboardBtnstyles.shadowLayer} />
          <Pressable
            style={({ pressed }) => [
              gameboardBtnstyles.button,
              pressed && gameboardBtnstyles.buttonPressed,
            ]}
            onPress={async () => {
              const ok = await savePlayerPoints();
              if (ok) {
                resetGame();
                navigation.navigate('Scoreboard');
              }
            }}
          >
            <Text style={gameboardBtnstyles.buttonText}>
              Game Over, Save Your Score
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default GameboardButtons;
