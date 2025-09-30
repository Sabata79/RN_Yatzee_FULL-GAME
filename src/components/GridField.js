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
import { View, Pressable, Text, Image, Animated, useWindowDimensions } from 'react-native';
import { useRef, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudio } from '../services/AudioManager';
import { dicefaces } from '../constants/DicePaths';
import { getBreakpoints, makeSizes } from '../utils/breakpoints';
import COLORS from '../constants/colors';

const { DIE_SIZE } = makeSizes(getBreakpoints());
const ICON = Math.round(DIE_SIZE * 0.70); // MaterialCommunityIcons size
const LABEL = Math.round(DIE_SIZE * 0.28); // “FullHouse/small/large/Yatzy” font size



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
                // ensure burst runs immediately on press (fix edge-cases where selection change may not retrigger useEffect)
                try {
                    burstScale.setValue(0.6);
                    burstOpacity.setValue(0.6);
                    Animated.parallel([
                        Animated.timing(burstScale, { toValue: 1.8, duration: 420, useNativeDriver: true }),
                        Animated.timing(burstOpacity, { toValue: 0, duration: 420, useNativeDriver: true }),
                    ]).start();
                } catch (e) {
                    // ignore animation errors in edge environments
                }
            }
        }
    };

    const isSelected = selectedField === index;

    // Burst animation values (single-shot when a field becomes selected)
    const burstScale = useRef(new Animated.Value(0.4)).current;
    const burstOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isSelected) {
            // start burst: visible then fade+grow
            burstScale.setValue(0.6);
            burstOpacity.setValue(0.6);
            Animated.parallel([
                Animated.timing(burstScale, { toValue: 1.8, duration: 420, useNativeDriver: true }),
                Animated.timing(burstOpacity, { toValue: 0, duration: 420, useNativeDriver: true }),
            ]).start();
        } else {
            // reset for next time
            burstScale.setValue(0.4);
            burstOpacity.setValue(0);
        }
    }, [isSelected, burstScale, burstOpacity]);

    // Helper to render the animated burst overlay. Color can be overridden (locked -> success)
    const renderBurst = (color = COLORS.error, radius = 12) => (
        <Animated.View
            pointerEvents="none"
            style={{
                position: 'absolute',
                left: -8,
                right: -8,
                top: -8,
                bottom: -8,
                borderRadius: radius,
                backgroundColor: color,
                transform: [{ scale: burstScale }],
                opacity: burstOpacity,
            }}
        />
    );



    const isLocked = (categoryName) => {
        const category = scoringCategories.find((category) => category.name === categoryName);
        return category ? category.locked : false;
    };

    const currentCategory = scoringCategories.find((category) => category.index === index);
    const fieldStyle =
        currentCategory && currentCategory.locked
            ? gameboardstyles.lockedField
            : gameboardstyles.selectScore;

    // Section bonus state (used for index 24 special burst)
    const sectionAchieved = typeof minorPoints === 'number' && typeof BONUS_POINTS_LIMIT === 'number'
        ? minorPoints >= BONUS_POINTS_LIMIT
        : false;

    // When section bonus becomes active, trigger burst on the section cell (index 24)
    useEffect(() => {
        if (index === 24 && sectionAchieved) {
            try {
                burstScale.setValue(0.6);
                burstOpacity.setValue(0.6);
                Animated.parallel([
                    Animated.timing(burstScale, { toValue: 1.8, duration: 420, useNativeDriver: true }),
                    Animated.timing(burstOpacity, { toValue: 0, duration: 420, useNativeDriver: true }),
                ]).start();
            } catch (e) {
                // ignore animation errors
            }
        }
    }, [index, sectionAchieved, burstScale, burstOpacity]);

    // Indexes of the grid
    if (index === 0) {
        return (
            <View style={gameboardstyles.item}>
                <Image source={dicefaces[0]?.display} style={gameboardstyles.dieFace} />
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
                    {/* Burst overlay (animated) */}
                    <Animated.View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: -8,
                            right: -8,
                            top: -8,
                            bottom: -8,
                            borderRadius: 12,
                            backgroundColor: COLORS.error,
                            transform: [{ scale: burstScale }],
                            opacity: burstOpacity,
                        }}
                    />
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
                    <Animated.View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: -8,
                            right: -8,
                            top: -8,
                            bottom: -8,
                            borderRadius: 12,
                            backgroundColor: COLORS.error,
                            transform: [{ scale: burstScale }],
                            opacity: burstOpacity,
                        }}
                    />
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
                    <Animated.View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: -8,
                            right: -8,
                            top: -8,
                            bottom: -8,
                            borderRadius: 12,
                            backgroundColor: COLORS.error,
                            transform: [{ scale: burstScale }],
                            opacity: burstOpacity,
                        }}
                    />
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
                <Image source={dicefaces[1]?.display} style={gameboardstyles.dieFace} />
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
                    <Animated.View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: -8,
                            right: -8,
                            top: -8,
                            bottom: -8,
                            borderRadius: 12,
                            backgroundColor: COLORS.error,
                            transform: [{ scale: burstScale }],
                            opacity: burstOpacity,
                        }}
                    />
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
                    <Animated.View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: -8,
                            right: -8,
                            top: -8,
                            bottom: -8,
                            borderRadius: 12,
                            backgroundColor: COLORS.error,
                            transform: [{ scale: burstScale }],
                            opacity: burstOpacity,
                        }}
                    />
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
                <Image source={dicefaces[2]?.display} style={gameboardstyles.dieFace} />
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
                    <Animated.View
                        pointerEvents="none"
                        style={{
                            position: 'absolute',
                            left: -8,
                            right: -8,
                            top: -8,
                            bottom: -8,
                            borderRadius: 12,
                            backgroundColor: COLORS.error,
                            transform: [{ scale: burstScale }],
                            opacity: burstOpacity,
                        }}
                    />
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
                    size={ICON}
                    style={gameboardstyles.icon}
                />
                <Text style={{ fontSize: LABEL, color: 'white' }}>FullHouse</Text>
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
                    {renderBurst(isLocked('fullHouse') ? COLORS.success : COLORS.error)}
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
                <Image source={dicefaces[3]?.display} style={gameboardstyles.dieFace} />
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
                    {renderBurst(isLocked('fours') ? COLORS.success : COLORS.error)}
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
                    size={ICON}
                    style={gameboardstyles.icon}
                />
                <Text style={{ fontSize: LABEL, color: 'white' }}>small</Text>
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
                    {renderBurst(isLocked('smallStraight') ? COLORS.success : COLORS.error)}
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
                <Image source={dicefaces[4]?.display} style={gameboardstyles.dieFace} />
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
                    {renderBurst(isLocked('fives') ? COLORS.success : COLORS.error)}
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
                    size={ICON}
                    style={gameboardstyles.icon}
                />
                <Text style={{ fontSize: LABEL, color: 'white' }}>large</Text>
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
                    {renderBurst(isLocked('largeStraight') ? COLORS.success : COLORS.error)}
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
                <Image source={dicefaces[5]?.display} style={gameboardstyles.dieFace} />
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
                    {renderBurst(isLocked('sixes') ? COLORS.success : COLORS.error)}
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
                    size={ICON}
                    style={gameboardstyles.icon}
                />
                <Text style={{ fontSize: LABEL, color: 'white' }}>Yatzy</Text>
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
                    {renderBurst(isLocked('yatzy') ? COLORS.success : COLORS.error)}
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
                    {isSectionMinorAchieved && renderBurst(COLORS.success, 100)}
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
                    size={ICON}
                    style={gameboardstyles.icon}
                />
                <Text style={{ fontSize: LABEL, color: 'white' }}>Change</Text>
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
                    {renderBurst(isLocked('chance') ? COLORS.success : COLORS.error)}
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
                <Text style={{ fontSize: LABEL, color: 'white' }}></Text>
            </View>
        );
    }
}

export default GridField;
