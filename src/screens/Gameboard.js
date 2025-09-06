import { SafeAreaView } from 'react-native-safe-area-context';
/**
 * Gameboard.js - Main game screen for playing Yatzy
 *
 * Contains the main gameplay logic, dice, and scoreboard for Yatzy.
 *
 * Usage:
 *   import Gameboard from './Gameboard';
 *   ...
 *   <Gameboard />
 *
 * @module screens/Gameboard
 * @author Sabata79
 * @since 2025-09-06
 */
import { useState, useEffect } from 'react';
import { FlatList, Text, View, Pressable, ImageBackground, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import gameboardstyles from '../styles/GameboardScreenStyles';
import { NBR_OF_THROWS, NBR_OF_DICES, MAX_SPOTS, BONUS_POINTS, BONUS_POINTS_LIMIT } from '../constants/Game';
import DiceAnimation from '../components/DiceAnimation';
import ModalAlert from '../constants/ModalAlert';
import { useGame } from '../constants/GameContext';
import RenderFirstRow from '../components/RenderFirstRow';
import GlowingText from '../components/AnimatedText';
import GameSave from '../constants/GameSave';
import { dicefaces } from '../constants/DicePaths';
import GameboardButtons from '../components/GameboardButtons';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 720;

export default function Gameboard({ route, navigation }) {

    const [board, setBoard] = useState(Array(NBR_OF_DICES).fill(1));

    // 1. Player name and ID
    const [playerName, setPlayerName] = useState('');
    const { playerId, setPlayer } = useGame();
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const { gameStarted, gameEnded, startGame, endGame, totalPoints, setTotalPoints, tokens, setTokens, setEnergyModalVisible } = useGame();
    const [elapsedTime, setElapsedTime] = useState(0);
    const { savePlayerPoints } = GameSave({ playerId, totalPoints, elapsedTime, navigation });

    const [isLayerVisible, setLayerVisible] = useState(true);

    // 2. Game logic state
    const [nbrOfThrowsLeft, setNbrOfThrowsLeft] = useState(NBR_OF_THROWS);
    const [status, setStatus] = useState('Throw the dices');
    const [selectedDices, setSelectedDices] = useState(new Array(NBR_OF_DICES).fill(false));
    const resetDiceSelection = () => { setSelectedDices(new Array(NBR_OF_DICES).fill(false)); };
    const [rounds, setRounds] = useState(MAX_SPOTS);
    const [rolledDices, setRolledDices] = useState(new Array(NBR_OF_DICES).fill(0));

    // 3. Scoring categories and points
    const [scoringCategories, setScoringCategories] = useState([
        {
            name: 'ones',
            index: 1,
            calculateScore: (rolledDices) => calculateDiceSum(1),
            locked: false,
            points: 0,
        },
        {
            name: 'twos',
            index: 5,
            calculateScore: (rolledDices) => calculateDiceSum(2),
            locked: false,
            points: 0,
        },
        {
            name: 'threes',
            index: 9,
            calculateScore: (rolledDices) => calculateDiceSum(3),
            locked: false,
            points: 0,
        },
        {
            name: 'fours',
            index: 13,
            calculateScore: (rolledDices) => calculateDiceSum(4),
            locked: false,
            points: 0,
        },
        {
            name: 'fives',
            index: 17,
            calculateScore: (rolledDices) => calculateDiceSum(5),
            locked: false,
            points: 0,
        },
        {
            name: 'sixes',
            index: 21,
            calculateScore: (rolledDices) => calculateDiceSum(6),
            locked: false,
            points: 0,
        },
        {
            name: 'twoOfKind',
            index: 3,
            calculateScore: (rolledDices) => calculateTwoOfKind(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'threeOfAKind',
            index: 7,
            calculateScore: (rolledDices) => calculateThreeOfAKind(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'fourOfAKind',
            index: 11,
            calculateScore: (rolledDices) => calculateFourOfAKind(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'yatzy',
            index: 27,
            calculateScore: (rolledDices) => calculateYatzy(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'fullHouse',
            index: 15,
            calculateScore: (rolledDices) => calculateFullHouse(rolledDices) ? 25 : 0,
            locked: false,
            points: 0,
        },
        {
            name: 'smallStraight',
            index: 19,
            calculateScore: (rolledDices) => calculateSmallStraight(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'largeStraight',
            index: 23,
            calculateScore: (rolledDices) => calculateLargeStraight(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'chance',
            index: 31,
            calculateScore: (rolledDices) => calculateChange(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'sectionMinor',
            points: 0
        },
    ]);

    const [minorPoints, setMinorPoints] = useState(0);
    const [hasAppliedBonus, setHasAppliedBonus] = useState(false);

    useEffect(() => {
        if (rounds === MAX_SPOTS) {
            setLayerVisible(true);
        } else {
            setLayerVisible(false);
        }
    }, [rounds]);

    useEffect(() => {
        if (route.params?.playerId) {
            setPlayer(route.params?.playerId);
        }
    }, [route.params?.playerId]);


    // Reset all game state to initial values
    const resetGame = () => {
        const resetCategories = scoringCategories.map(category => {
            return {
                ...category,
                points: 0,
                locked: false,
                yatzyAchieved: false,
            };
        });
        setScoringCategories(resetCategories);
        setRounds(MAX_SPOTS);
        setNbrOfThrowsLeft(NBR_OF_THROWS);
        resetDiceSelection();
        setTotalPoints(0);
        setMinorPoints(0);
        setHasAppliedBonus(false);
        setElapsedTime(0);
    };

    // Data for rendering the gameboard grid
    const [data, setData] = useState([
        ...Array.from({ length: 32 }, (_, index) => ({ key: String(index + 2) })),
    ]);

    // const handleBonus = () => {
    //     if (!hasAppliedBonus && minorPoints >= BONUS_POINTS_LIMIT) {
    //         setTotalPoints(totalPoints + BONUS_POINTS);
    //         setHasAppliedBonus(true);
    //     }
    // };

    const handleSetPoints = () => {
        if (selectedField === null) return;

        const minorNames = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
        const selectedCategory = scoringCategories.find(category => category.index === selectedField);

        if (selectedCategory && !selectedCategory.locked) {
            if (selectedCategory.name === 'yatzy') {
                const yatzyScore = calculateYatzy(rolledDices);
                if (yatzyScore === 50) {
                    // If the roll results in a Yatzy, add 50 points (stacking model)
                    const newPoints = selectedCategory.points === 0 ? 50 : selectedCategory.points + 50;
                    const updatedCategories = scoringCategories.map(category => {
                        if (category.index === selectedField) {
                            // Unlock the field (show stacking points), then lock on Set Points press
                            return { ...category, points: newPoints, locked: true, yatzyAchieved: true };
                        }
                        return category;
                    });
                    setScoringCategories(updatedCategories);
                    setTotalPoints(totalPoints + 50);
                } else {
                    // If no Yatzy is rolled, lock the Yatzy field automatically (remains 0 if not previously stacked)
                    const updatedCategories = scoringCategories.map(category => {
                        if (category.index === selectedField) {
                            return { ...category, locked: true };
                        }
                        return category;
                    });
                    setScoringCategories(updatedCategories);
                    // Optionally show a message that no Yatzy was rolled
                    // Alert.alert("No Yatzy", "You did not roll a Yatzy, so the Yatzy field is locked with 0 points.");
                }
            } else {
                // Normal scoring for other categories
                const points = selectedCategory.calculateScore(rolledDices);
                const isMinorNames = minorNames.includes(selectedCategory.name);
                const updatedCategories = scoringCategories.map(category => {
                    if (category.index === selectedField) {
                        return { ...category, points: points, locked: true };
                    }
                    return category;
                });
                let newTotalPoints = totalPoints + points;
                if (isMinorNames) {
                    const newMinorPoints = minorPoints + points;
                    if (newMinorPoints >= BONUS_POINTS_LIMIT && !hasAppliedBonus) {
                        newTotalPoints += BONUS_POINTS;
                        setHasAppliedBonus(true);
                    }
                    setMinorPoints(newMinorPoints);
                }
                setScoringCategories(updatedCategories);
                setTotalPoints(newTotalPoints);
            }
            setSelectedField(null);
        }
    };


    // Count the sum of the dices for a given value
    function calculateDiceSum(diceValue) {
        return rolledDices.reduce((sum, dice) => (dice === diceValue ? sum + dice : sum), 0);
    }
    // Calculate two of a kind (pair)
    function calculateTwoOfKind(rolledDices) {
        const countsTwoOfaKind = {};
        rolledDices.forEach(dice => {
            countsTwoOfaKind[dice] = (countsTwoOfaKind[dice] || 0) + 1;
        });

        let maxPairValue = 0;

        for (let dice in countsTwoOfaKind) {
            if (countsTwoOfaKind[dice] >= 2) {
                maxPairValue = Math.max(maxPairValue, parseInt(dice));
            }
        }
        return maxPairValue * 2;
    }

    // Three of a kind
    function calculateThreeOfAKind(rolledDices) {
        const countsThreeOfaKind = {};
        rolledDices.forEach(dice => {
            countsThreeOfaKind[dice] = (countsThreeOfaKind[dice] || 0) + 1;
        });

        for (let dice in countsThreeOfaKind) {
            if (countsThreeOfaKind[dice] >= 3) {
                return dice * 3;
            }
        }
        return 0;
    }

    // Four of a kind
    function calculateFourOfAKind(rolledDices) {
        const countsFourOfaKind = {};
        rolledDices.forEach(dice => {
            countsFourOfaKind[dice] = (countsFourOfaKind[dice] || 0) + 1;
        });

        for (let dice in countsFourOfaKind) {
            if (countsFourOfaKind[dice] >= 4) {
                return dice * 4;
            }
        }
        return 0;
    }
    // Yahtzee (all dice the same)
    function calculateYatzy(rolledDices) {

        return rolledDices.reduce((sum, dice) => {
            if (dice === 0) {
                return sum;
            }
            if (rolledDices.filter(item => item === dice).length === 5) {
                return 50;
            }
            return sum;
        }, 0);
    }

    function checkAndUnlockYatzy(rolledDices) {
        const yatzyCategory = scoringCategories.find(c => c.name === 'yatzy');
        if (!yatzyCategory) return;

        const yatzyScore = calculateYatzy(rolledDices);

        if (yatzyScore === 50 && yatzyCategory.points > 0) {
            // If player already has Yatzy (>0 points), allow stacking
            console.log('Yatzy achieved again: unlocking Yatzy field for stacking.');
            setScoringCategories(prev =>
                prev.map(c =>
                    c.name === 'yatzy'
                        ? { ...c, locked: false, yatzyAchieved: true }
                        : c
                )
            );
        } else {
            // Otherwise, if field is open in stacking mode (points>0 and currently unlocked),
            // lock it automatically if no Yatzy is rolled
            if (!yatzyCategory.locked && yatzyCategory.yatzyAchieved) {
                console.log('No Yatzy rolled: auto-locking Yatzy field.');
                setScoringCategories(prev =>
                    prev.map(c =>
                        c.name === 'yatzy'
                            ? { ...c, locked: true }
                            : c
                    )
                );
            }
        }
    }

    // Fullhouse (three of a kind + a pair)
    function calculateFullHouse(rolledDices) {
        const counts = {};
        for (const dice of rolledDices) {
            counts[dice] = (counts[dice] || 0) + 1;
        }
        const values = Object.values(counts);
        return values.includes(3) && values.includes(2);
    }
    // Small straight (sequence of four)
    function calculateSmallStraight(rolledDices) {
        const sortedDiceValues = [...rolledDices].sort((a, b) => a - b);
        const smallStraights = [
            [1, 2, 3, 4],
            [2, 3, 4, 5],
            [3, 4, 5, 6]
        ];
        for (const smallStraight of smallStraights) {
            if (smallStraight.every(val => sortedDiceValues.includes(val))) {
                return 30;
            }
        }
        return 0;
    }
    // Large straight (sequence of five)
    function calculateLargeStraight(rolledDices) {
        const sortedDiceValues = [...rolledDices].sort((a, b) => a - b);
        const largeStraights = [
            [1, 2, 3, 4, 5],
            [2, 3, 4, 5, 6]
        ];
        for (const largeStraight of largeStraights) {
            if (largeStraight.every(val => sortedDiceValues.includes(val))) {
                return 40;
            }
        }
        return 0;
    }
    // Chance (sum of all dice)
    function calculateChange(rolledDices) {
        return rolledDices.reduce((sum, dice) => {
            if (dice === 0) {
                return sum;
            }
            return sum + dice;
        }, 0);
    }

    const [selectedField, setSelectedField] = useState(null);

    const renderGrid = ({ index, scoringCategories, totalPoints, minorPoints }) => {

        const handlePressField = (index) => {
            if (nbrOfThrowsLeft < NBR_OF_THROWS && nbrOfThrowsLeft !== NBR_OF_THROWS) {
                setSelectedField(index === selectedField ? null : index);
            } else {
                setStatus('Cannot select field at this time');
            }
        };

        // Is field selected
        const isSelected = selectedField === index;

        // Is category locked
        const isLocked = (categoryName) => {
            const category = scoringCategories.find(category => category.name === categoryName);
            return category ? category.locked : false;
        };

        // Get the current category
        const currentCategory = scoringCategories.find(category => category.index === index);

        // Style for the field
        const fieldStyle = currentCategory && currentCategory.locked ? gameboardstyles.lockedField : gameboardstyles.selectScore;


        // Indexes of the grid
        if (index === 0) {
            return (
                <View style={gameboardstyles.item}>
                    <MaterialCommunityIcons name="dice-1" size={isSmallScreen ? 40 : 45} style={gameboardstyles.icon} />
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
                    <MaterialCommunityIcons name="dice-2" size={isSmallScreen ? 40 : 45} style={gameboardstyles.icon} />
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
                    <MaterialCommunityIcons name="dice-3" size={isSmallScreen ? 40 : 45} style={gameboardstyles.icon} />
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
                    <MaterialCommunityIcons name="dice-4" size={isSmallScreen ? 40 : 45} style={gameboardstyles.icon} />
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
                    <MaterialCommunityIcons name="dice-5" size={isSmallScreen ? 40 : 45} style={gameboardstyles.icon} />
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
                    <MaterialCommunityIcons name="dice-6" size={isSmallScreen ? 40 : 45} style={gameboardstyles.icon} />
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

    const [diceAnimations] = useState(() =>
        Array.from({ length: NBR_OF_DICES }, () => new Animated.Value(0))
    );

    const [isRolling, setIsRolling] = useState(false);

    const renderDices = () => {

        const throwDices = () => {
            if (nbrOfThrowsLeft > 0) {
                setIsRolling(true);
                setTimeout(() => {
                    const newBoard = [...board];
                    for (let i = 0; i < NBR_OF_DICES; i++) {
                        if (!selectedDices[i]) {
                            let randomNumber = Math.floor(Math.random() * 6) + 1;
                            newBoard[i] = randomNumber;
                            rolledDices[i] = randomNumber;
                        }
                    }
                    setBoard(newBoard);
                    setNbrOfThrowsLeft(nbrOfThrowsLeft - 1);
                    setIsRolling(false);
                    checkAndUnlockYatzy(rolledDices);
                }, 1000);
            } else {
                setStatus('No throws left');
                setNbrOfThrowsLeft(NBR_OF_THROWS);
            }
        };

        const diceRow = [];
        for (let i = 0; i < NBR_OF_DICES; i++) {
            diceRow.push(
                <DiceAnimation
                    key={i}
                    diceName={dicefaces[board[i] - 1]?.display}
                    isSelected={selectedDices[i]}
                    onSelect={() => selectDice(i)}
                    animationValue={diceAnimations[i]}
                    color={getDiceColor(i)}
                    isRolling={isRolling && !selectedDices[i]}
                />
            );
        }

        function getDiceColor(index) {
            if (board.every((value, i, arr) => value === arr[0])) {
                return 'red';
            } else {
                return selectedDices[index] ? 'red' : 'white';
            }
        }

        const selectDice = (i) => {
            if (nbrOfThrowsLeft < NBR_OF_THROWS) {
                let dices = [...selectedDices];
                dices[i] = !dices[i];
                setSelectedDices(dices);
            } else {
                setStatus('Game has not started');
            }
        };

        useEffect(() => {
            if (rounds === 0) {
                endGame();
            }
        }, [rounds]);

        return (
            <View style={gameboardstyles.gameboard}>
                <Text style={styles.status}>{status}</Text>
                <View style={gameboardstyles.diceBorder}>
                    <View style={[gameboardstyles.gameboardContainer, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
                        {diceRow}
                    </View>
                </View>
                <GameboardButtons
                    status={status}
                    rounds={rounds}
                    nbrOfThrowsLeft={nbrOfThrowsLeft}
                    savePlayerPoints={savePlayerPoints}
                    resetGame={resetGame}
                    navigation={navigation}
                    startGame={startGame}
                    throwDices={throwDices}
                    selectedField={selectedField}
                    handleSetPoints={handleSetPoints}
                    setNbrOfThrowsLeft={setNbrOfThrowsLeft}
                    resetDiceSelection={resetDiceSelection}
                    scoringCategories={scoringCategories}
                    setRounds={setRounds}
                    MAX_SPOTS={MAX_SPOTS}
                    NBR_OF_THROWS={NBR_OF_THROWS}
                    styles={styles}
                    gameboardstyles={gameboardstyles}
                    MaterialCommunityIcons={MaterialCommunityIcons}
                />
            </View>
        );
    };

    const handleStartGame = () => {
        if (tokens > 0) {
            setLayerVisible(false);
            setStatus("Throw the dices");
            setTokens((prev) => prev - 1); // Decrease one token
            console.log("Game starting...");
        } else {
            setEnergyModalVisible(true);
        }
    };
    // Remove ImageBackground (if needed)
    return (
        <ImageBackground source={require('../../assets/diceBackground.webp')} style={styles.background}>
            {isLayerVisible && (
                <Pressable
                    onPress={() => {
                        if (!gameStarted && rounds === MAX_SPOTS) {
                            handleStartGame();
                        }
                    }}
                    style={gameboardstyles.filterLayer}
                >
                    <GlowingText>
                        START GAME
                    </GlowingText>
                </Pressable>
            )}

            <View style={styles.overlay}>
                <FlatList
                    data={data}
                    renderItem={({ item, index }) =>
                        renderGrid({ item, index, scoringCategories, totalPoints, minorPoints })}
                    numColumns={4}
                    keyExtractor={(item) => item.key}
                    contentContainerStyle={gameboardstyles.gameboardContainer}
                    ListHeaderComponent={<RenderFirstRow />}
                    ListEmptyComponent={renderGrid}
                    ListFooterComponent={renderDices}
                />
            </View>

            <ModalAlert
                visible={modalVisible}
                message={modalMessage}
                onClose={() => setModalVisible(false)}
            />
        </ImageBackground>
    );
}
