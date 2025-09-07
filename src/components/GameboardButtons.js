
import { Pressable, Text, View } from 'react-native';
import gameboardBtnstyles from '../styles/GameboardScreenButtonStyles'

// Huom! styles ja MaterialCommunityIcons tuodaan propsien kautta!

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
    MaterialCommunityIcons
}) => {
    return (
        <View style={gameboardBtnstyles.buttonContainer}>
            {/* Pelin aikana kaksi nappia */}
            {rounds > 0 && (
                <>
                    <View style={gameboardBtnstyles.buttonWrapper}>
                        <View style={gameboardBtnstyles.shadowLayer} />
                        <Pressable
                            disabled={nbrOfThrowsLeft <= 0}
                            style={({ pressed }) => [
                                gameboardBtnstyles.button,
                                pressed && gameboardBtnstyles.buttonPressed,
                            ]}
                            onPress={() => {
                                if (rounds === MAX_SPOTS && nbrOfThrowsLeft === 3) {
                                    startGame();
                                }
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
                            style={({ pressed }) => [
                                gameboardBtnstyles.button,
                                pressed && gameboardBtnstyles.buttonPressed,
                            ]}
                            onPress={() => {
                                handleSetPoints();
                                setNbrOfThrowsLeft(NBR_OF_THROWS);
                                resetDiceSelection();
                                const selectedCategory = scoringCategories.find(category => category.index === selectedField);
                                if (!selectedCategory || selectedCategory.name !== 'yatzy' || selectedCategory.points === 0) {
                                    console.log('Decreasing rounds. Current rounds:', rounds);
                                    setRounds(prevRounds => prevRounds - 1);
                                } else {
                                    console.log('Rounds not decreased. Current rounds:', rounds);
                                }
                            }}
                        >
                            <Text style={gameboardBtnstyles.buttonText}>Set Points</Text>
                            <MaterialCommunityIcons name="beaker-plus" size={25} style={gameboardBtnstyles.iconContainer} />
                        </Pressable>
                    </View>
                </>
            )}
            {/* Game Over -nappi keskitetysti */}
            {rounds === 0 && (
                <View style={gameboardBtnstyles.fullWidthButtonWrapper}>
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
                        <Text style={gameboardBtnstyles.buttonText}>Game Over, Save Your Score</Text>
                        <MaterialCommunityIcons name="scoreboard-outline" size={24} color="black" />
                    </Pressable>
                </View>
            )}
        </View>
    );
};

export default GameboardButtons;
