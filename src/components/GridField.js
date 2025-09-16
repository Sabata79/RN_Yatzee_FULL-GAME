/**
 * GridField – Single scoring cell renderer for the score grid.
 * Handles selection, displays points, and integrates dice-based scoring.
 *
 * Usage:
 *   import GridField from '@/components/GridField';
 *   <GridField
 *     index={index}
 *     scoringCategories={scoringCategories}
 *     totalPoints={totalPoints}
 *     minorPoints={minorPoints}
 *     selectedField={selectedField}
 *     setSelectedField={setSelectedField}
 *     audioManager={audioApi}
 *     isSmallScreen={isSmallScreen}
 *     gameboardstyles={gameboardstyles}
 *     rolledDices={rolledDices}
 *     BONUS_POINTS_LIMIT={BONUS_POINTS_LIMIT}
 *     styles={styles}
 *     nbrOfThrowsLeft={nbrOfThrowsLeft}
 *     NBR_OF_THROWS={NBR_OF_THROWS}
 *   />
 *
 * Notes:
 * - Visual and interaction logic only; actual scoring application is done in Gameboard.handleSetPoints().
 *
 * @module components/GridField.js
 * @author Sabata79
 * @since 2025-09-16
 */
import { View, Pressable, Text, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudio } from '../services/AudioManager';
import { dicefaces } from '../constants/DicePaths';

function GridField({
    index,
    scoringCategories,
    totalPoints,
    minorPoints,
    selectedField,
    setSelectedField,
    audioManager,
    isSmallScreen,
    gameboardstyles,
    rolledDices,
    BONUS_POINTS_LIMIT,
    styles,
    nbrOfThrowsLeft,
    NBR_OF_THROWS,
}) {
    // Fallback
    const audioCtx = useAudio();
    const sfx = {
        playSelect: audioManager?.playSelect || audioCtx?.playSelect || (() => { }),
        playDeselect: audioManager?.playDeselect || audioCtx?.playDeselect || (() => { }),
        playSfx: audioManager?.playSfx || audioCtx?.playSfx || (() => { }),
    };

    const handlePressField = (idx) => {
        if (nbrOfThrowsLeft < NBR_OF_THROWS) {
            if (idx === selectedField) {
                setSelectedField(null);
                sfx.playDeselect?.();
            } else {
                setSelectedField(idx);
                sfx.playSelect?.();
            }
        }
    };

    const isSelected = selectedField === index;

    const isLocked = (categoryName) => {
        const category = scoringCategories.find((category) => category.name === categoryName);
        return category ? category.locked : false;
    };

    const currentCategory = scoringCategories.find((category) => category.index === index);
    const fieldStyle =
        currentCategory && currentCategory.locked
            ? gameboardstyles.lockedField
            : gameboardstyles.selectScore;

    // Indexes of the grid
    if (index === 0) {
        return (
            <View style={gameboardstyles.item}>
                <Image
                    source={dicefaces[0]?.display}
                    resizeMode="contain"
                    style={{
                        width: isSmallScreen ? 30 : 40,
                        height: isSmallScreen ? 30 : 40,
                    }}
                />
            </View>
        );
        // Sum of ones
    } else if (index === 1) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('ones')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('ones')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 2) {
        return (
            <View style={gameboardstyles.item}>
                <Text style={gameboardstyles.gridTxt}>2 X</Text>
            </View>
        );
    } else if (index === 3) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('twoOfKind')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('twoOfKind')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 6) {
        return (
            <View style={gameboardstyles.item}>
                <Text style={gameboardstyles.gridTxt}>3 X</Text>
            </View>
        );
        // Sum of Triples and more
    } else if (index === 7) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('threeOfAKind')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('threeOfAKind')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 4) {
        return (
            <View style={gameboardstyles.item}>
                <Image
                    source={dicefaces[1]?.display}
                    resizeMode="contain"
                    style={{
                        width: isSmallScreen ? 30 : 40,
                        height: isSmallScreen ? 30 : 40,
                    }}
                />
            </View>
        );
        // Sum of twos
    } else if (index === 5) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('twos')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('twos')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 10) {
        return (
            <View style={gameboardstyles.item}>
                <Text style={gameboardstyles.gridTxt}>4 X</Text>
            </View>
        );
        // Sum of Fours and more
    } else if (index === 11) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fourOfAKind')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('fourOfAKind')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 8) {
        return (
            <View style={gameboardstyles.item}>
                <Image
                    source={dicefaces[2]?.display}
                    resizeMode="contain"
                    style={{
                        width: isSmallScreen ? 30 : 40,
                        height: isSmallScreen ? 30 : 40,
                    }}
                />
            </View>
        );
        // Sum of Threes
    } else if (index === 9) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('threes')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('threes')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
        // Fullhouse
    } else if (index === 14) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons
                    name="home"
                    size={isSmallScreen ? 22 : 25}
                    style={gameboardstyles.icon}
                />
                <Text style={{ fontSize: 10, color: 'white' }}>FullHouse</Text>
            </View>
        );
    } else if (index === 15) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fullHouse')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('fullHouse')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
        // Four of a kind
    } else if (index === 12) {
        return (
            <View style={gameboardstyles.item}>
                <Image
                    source={dicefaces[3]?.display}
                    resizeMode="contain"
                    style={{
                        width: isSmallScreen ? 30 : 40,
                        height: isSmallScreen ? 30 : 40,
                    }}
                />
            </View>
        );
    } else if (index === 13) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fours')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('fours')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 18) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons
                    name="cards-outline"
                    size={isSmallScreen ? 22 : 25}
                    style={gameboardstyles.icon}
                />
                <Text style={{ fontSize: 10, color: 'white' }}>small</Text>
            </View>
        );
        // Small straight
    } else if (index === 19) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('smallStraight')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('smallStraight')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 16) {
        return (
            <View style={gameboardstyles.item}>
                <Image
                    source={dicefaces[4]?.display}
                    resizeMode="contain"
                    style={{
                        width: isSmallScreen ? 30 : 40,
                        height: isSmallScreen ? 30 : 40,
                    }}
                />
            </View>
        );
        // Sum of Fives
    } else if (index === 17) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fives')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('fives')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 22) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons
                    name="cards-outline"
                    size={isSmallScreen ? 22 : 25}
                    style={gameboardstyles.icon}
                />
                <Text style={{ fontSize: 10, color: 'white' }}>large</Text>
            </View>
        );
        // Large straight
    } else if (index === 23) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('largeStraight')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('largeStraight')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 20) {
        return (
            <View style={gameboardstyles.item}>
                <Image
                    source={dicefaces[5]?.display}
                    resizeMode="contain"
                    style={{
                        width: isSmallScreen ? 30 : 40,
                        height: isSmallScreen ? 30 : 40,
                    }}
                />
            </View>
        );
        // Sum of Sixes
    } else if (index === 21) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('sixes')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('sixes')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 26) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons
                    name="star-outline"
                    size={isSmallScreen ? 22 : 25}
                    style={gameboardstyles.icon}
                />
                <Text style={{ fontSize: 10, color: 'white' }}>Yatzy</Text>
            </View>
        );
        // YATZY
    } else if (index === 27) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('yatzy')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('yatzy')
                            ? currentCategory.points
                            : currentCategory.points + currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 24) {
        const isSectionMinorAchieved = minorPoints >= BONUS_POINTS_LIMIT;
        return (
            <View style={gameboardstyles.item}>
                <View
                    style={
                        isSectionMinorAchieved
                            ? gameboardstyles.sectionContainerAchieved
                            : gameboardstyles.sectionContainer
                    }
                >
                    <Text style={gameboardstyles.sectionBonusTxt}>Section Bonus</Text>
                    <Text style={gameboardstyles.sectionBonusTxt}>+35</Text>
                </View>
            </View>
        );
        // Minor points
    } else if (index === 25) {
        return (
            <View style={gameboardstyles.item}>
                <Text style={gameboardstyles.scoreText}>
                    {minorPoints} / {BONUS_POINTS_LIMIT}
                </Text>
            </View>
        );
    } else if (index === 30) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons
                    name="account-question-outline"
                    size={isSmallScreen ? 22 : 25}
                    style={gameboardstyles.icon}
                />
                <Text style={{ fontSize: 10, color: 'white' }}>Change</Text>
            </View>
        );
        // Sum of Faces
    } else if (index === 31) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('chance')}>
                <View
                    style={[
                        gameboardstyles.item,
                        isSelected ? gameboardstyles.selectScorePressed : fieldStyle,
                    ]}
                >
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('chance')
                            ? currentCategory.points
                            : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else {
        return (
            <View style={gameboardstyles.item}>
                <Text style={styles.text}></Text>
            </View>
        );
    }
}

export default GridField;
