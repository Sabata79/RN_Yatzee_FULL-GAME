import { View, Pressable, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function GridField({
    index,
    scoringCategories,
    totalPoints,
    minorPoints,
    selectedField,
    setSelectedField,
    audioManager,
    setStatus,
    isSmallScreen,
    gameboardstyles,
    rolledDices,
    BONUS_POINTS_LIMIT,
    styles,
    nbrOfThrowsLeft,
    NBR_OF_THROWS
}) {
    const handlePressField = (idx) => {
        if (nbrOfThrowsLeft < NBR_OF_THROWS && nbrOfThrowsLeft !== NBR_OF_THROWS) {
            if (idx === selectedField) {
                setSelectedField(null);
                audioManager.playDeselect();
            } else {
                setSelectedField(idx);
                audioManager.playSelect();
            }
        } else {
            setStatus('Cannot select field at this time');
        }
    };



    const isSelected = selectedField === index;
    const isLocked = (categoryName) => {
        const category = scoringCategories.find(category => category.name === categoryName);
        return category ? category.locked : false;
    };
    const currentCategory = scoringCategories.find(category => category.index === index);
    const fieldStyle = currentCategory && currentCategory.locked ? gameboardstyles.lockedField : gameboardstyles.selectScore;

    // Indexes of the grid
    if (index === 0) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="dice-1" size={isSmallScreen ? 45 : 50} style={gameboardstyles.icon} />
            </View>
        );
        // Sum of ones
    } else if (index === 1) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('ones')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('ones') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
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
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('twoOfKind') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
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
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('threeOfAKind') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 4) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="dice-2" size={isSmallScreen ? 45 : 50} style={gameboardstyles.icon} />
            </View>
        );
        // Sum of twos
    } else if (index === 5) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('twos')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('twos') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
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
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('fourOfAKind') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 8) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="dice-3" size={isSmallScreen ? 45 : 50} style={gameboardstyles.icon} />
            </View>
        );
        // Sum of Threes
    } else if (index === 9) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('threes')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('threes') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
        // Fullhouse
    } else if (index === 14) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="home" size={isSmallScreen ? 22 : 25} style={gameboardstyles.icon} />
                <Text style={{ fontSize: 10, color: 'white' }}>FullHouse</Text>
            </View>
        );
    } else if (index === 15) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fullHouse')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('fullHouse') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
        // Four of a kind
    } else if (index === 12) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="dice-4" size={isSmallScreen ? 45 : 50} style={gameboardstyles.icon} />
            </View>
        );
    } else if (index === 13) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fours')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('fours') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 18) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="cards-outline" size={isSmallScreen ? 22 : 25} style={gameboardstyles.icon} />
                <Text style={{ fontSize: 10, color: 'white' }}>small</Text>
            </View>
        );
        // Small straight
    } else if (index === 19) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('smallStraight')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('smallStraight') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 16) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="dice-5" size={isSmallScreen ? 45 : 50} style={gameboardstyles.icon} />
            </View>
        );
        // Sum of Fives
    } else if (index === 17) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fives')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('fives') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 22) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="cards-outline" size={isSmallScreen ? 22 : 25} style={gameboardstyles.icon} />
                <Text style={{ fontSize: 10, color: 'white' }}>large</Text>
            </View>
        );
        // Large straight
    } else if (index === 23) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('largeStraight')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('largeStraight') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 20) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="dice-6" size={isSmallScreen ? 45 : 50} style={gameboardstyles.icon} />
            </View>
        );
        // Sum of Sixes
    } else if (index === 21) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('sixes')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('sixes') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 26) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="star-outline" size={isSmallScreen ? 22 : 25} style={gameboardstyles.icon} />
                <Text style={{ fontSize: 10, color: 'white' }}>Yatzy</Text>
            </View>
        );
        // YATZY
    } else if (index === 27) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('yatzy')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('yatzy')
                            ? currentCategory.points
                            : currentCategory.points + currentCategory.calculateScore(rolledDices)
                        }
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 24) {
        const isSectionMinorAchieved = minorPoints >= BONUS_POINTS_LIMIT;

        return (
            <View style={gameboardstyles.item}>
                <View style={isSectionMinorAchieved ? gameboardstyles.sectionContainerAchieved : gameboardstyles.sectionContainer}>
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
                    {minorPoints} / {BONUS_POINTS_LIMIT}</Text>
            </View>
        );
    } else if (index === 30) {
        return (
            <View style={gameboardstyles.item}>
                <MaterialCommunityIcons name="account-question-outline" size={isSmallScreen ? 22 : 25} style={gameboardstyles.icon} />
                <Text style={{ fontSize: 10, color: 'white' }}>Change</Text>
            </View>
        );
        // Sum of Faces
    } else if (index === 31) {
        return (
            <Pressable onPress={() => handlePressField(index)} disabled={isLocked('chance')}>
                <View style={[gameboardstyles.item, isSelected ? gameboardstyles.selectScorePressed : fieldStyle]}>
                    <Text style={gameboardstyles.inputIndexShown}>
                        {isLocked('chance') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                    </Text>
                </View>
            </Pressable>
        );
    } else if (index === 29) {
        return (
            <View style={gameboardstyles.item}>
                <Text style={gameboardstyles.scoreText}>Total: {totalPoints}</Text>
            </View>
        );
    } else {
        return (
            <View style={gameboardstyles.item}>
                <Text style={styles.text}></Text>
            </View>
        );
    }
};

export default GridField;
