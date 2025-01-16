import React, { useState, useEffect, useRef } from 'react';
import { FlatList, Text, View, Alert, Pressable, ImageBackground, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import { NBR_OF_THROWS, NBR_OF_DICES, MAX_SPOTS, BONUS_POINTS, BONUS_POINTS_LIMIT } from '../constants/Game';
import DiceAnimation from '../components/DiceAnimation';
import ModalAlert from '../constants/ModalAlert';
import { useGame } from '../components/GameContext';
import RenderFirstRow from '../components/RenderFirstRow';
import GlowingText from './AnimatedText';
import GameSave from '../components/GameSave';

let board = [];

export default function Gameboard({ route, navigation }) {

    // 1. Player name and ID
    const [playerName, setPlayerName] = useState('');
    const { playerId, setPlayer } = useGame();
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const { gameStarted, gameEnded, startGame, endGame, totalPoints, setTotalPoints,tokens,setTokens,setEnergyModalVisible } = useGame();
    const [elapsedTime, setElapsedTime] = useState(0);
    const { savePlayerPoints } = GameSave({ playerId, totalPoints, elapsedTime, navigation });

    const [isLayerVisible, setLayerVisible] = useState(true);

    // 2. Logic for the game
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


    // Reset the game
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

    // Making the gameboard
    const [data, setData] = useState([
        ...Array.from({ length: 32 }, (_, index) => ({ key: String(index + 2) })),
    ]);



    const handleBonus = () => {
        if (!hasAppliedBonus && minorPoints >= BONUS_POINTS_LIMIT) {
            setTotalPoints(totalPoints + BONUS_POINTS);
            setHasAppliedBonus(true);
        }
    };

    const handleSetPoints = () => {
        if (selectedField !== null) {
            const minorNames = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];

            const selectedCategory = scoringCategories.find(category => category.index === selectedField);

            if (selectedCategory) {
                if (!selectedCategory.locked) {
                    const points = selectedCategory.calculateScore(rolledDices);
                    const isMinorNames = minorNames.includes(selectedCategory.name);

                    const updatedCategories = scoringCategories.map(category => {
                        if (category.index === selectedField) {
                            if (category.name === 'yatzy') {
                                return {
                                    ...category,
                                    points: category.points === 0 ? points : category.points + points,
                                    locked: true,
                                };
                            }
                            return {
                                ...category,
                                points: points,
                                locked: true,
                            };
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
                    setTotalPoints(newTotalPoints);
                    setScoringCategories(updatedCategories);
                    setSelectedField(null);
                }
            }
        }
    };

    // Count the sum of the dices
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
    // Yahtzee
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
    const yatzyScore = calculateYatzy(rolledDices);

    setScoringCategories(prevCategories =>
        prevCategories.map(category => {
            if (category.name === 'yatzy') {
                // Do not lock the field if it has never been scored
                if (category.locked && category.points === 0 && !category.yatzyAchieved) {
                    console.log('Yatzy field is locked with 0 points initially, keeping it locked.');
                    return category;
                }
                if (yatzyScore === 50) {
                    console.log('Yatzy achieved, unlocking the field temporarily.');
                    return { ...category, locked: false, yatzyAchieved: true }; 
                } else if (category.yatzyAchieved) {
                    console.log('Yatzy not achieved, locking the field after first Yatzy.');
                    return { ...category, locked: true };
                }
            }
            return category;
        })
    );
}

    // Fullhouse
    function calculateFullHouse(rolledDices) {
        const counts = {};
        for (const dice of rolledDices) {
            counts[dice] = (counts[dice] || 0) + 1;
        }
        const values = Object.values(counts);
        return values.includes(3) && values.includes(2);
    }
    // Small straight
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
    // Big straight
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
    // Random
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
        const fieldStyle = currentCategory && currentCategory.locked ? styles.lockedField : styles.selectScore;


        // Indexes of the grid
        if (index === 0) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-1" size={45} style={styles.icon} />
                </View>
            );
            //Sum of ones
        } else if (index === 1) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('ones')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('ones') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 2) {
            return (
                <View style={styles.item}>
                    <Text style={styles.gridTxt}>2X</Text>
                </View>
            );
        } else if (index === 3) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('twoOfKind')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('twoOfKind') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 6) {
            return (
                <View style={styles.item}>
                    <Text style={styles.gridTxt}>3X</Text>
                </View>
            );
            // Sum of Triples and more
        } else if (index === 7) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('threeOfAKind')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('threeOfAKind') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 4) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-2" size={45} style={styles.icon} />
                </View>
            );
            // Sum of twos
        } else if (index === 5) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('twos')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('twos') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 10) {
            return (
                <View style={styles.item}>
                    <Text style={styles.gridTxt}>4X</Text>
                </View>
            );
            // Sum of Fours and more
        } else if (index === 11) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fourOfAKind')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('fourOfAKind') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 8) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-3" size={45} style={styles.icon} />
                </View>
            );
            // Sum of Threes
        } else if (index === 9) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('threes')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('threes') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
            // Fullhouse
        } else if (index === 14) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="home" size={25} style={styles.icon} />
                    <Text style={{ fontSize: 10, color: 'white' }}>FullHouse</Text>
                </View>
            );
        } else if (index === 15) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fullHouse')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('fullHouse') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
            // 4X
        } else if (index === 12) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-4" size={45} style={styles.icon} />
                </View>
            );
        } else if (index === 13) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fours')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('fours') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 18) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="cards-outline" size={25} style={styles.icon} />
                    <Text style={{ fontSize: 10, color: 'white' }}>small</Text>
                </View>
            );
            // Small straight
        } else if (index === 19) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('smallStraight')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('smallStraight') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 16) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-5" size={45} style={styles.icon} />
                </View>
            );
            // Sum of Fives
        } else if (index === 17) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('fives')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('fives') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 22) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="cards-outline" size={25} style={styles.icon} />
                    <Text style={{ fontSize: 10, color: 'white' }}>large</Text>
                </View>
            );
            // Large straight
        } else if (index === 23) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('largeStraight')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('largeStraight') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 20) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-6" size={45} style={styles.icon} />
                </View>
            );
            // Sum of Sixes
        } else if (index === 21) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('sixes')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('sixes') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 26) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="star-outline" size={25} style={styles.icon} />
                    <Text style={{ fontSize: 10, color: 'white' }}>Yatzy</Text>
                </View>
            );
            // YATZY
        } else if (index === 27) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('yatzy')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
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
                <View style={styles.item}>
                    <View style={isSectionMinorAchieved ? styles.sectionContainerAchieved : styles.sectionContainer}>
                        <Text style={styles.sectionBonusTxt}>Section Bonus</Text>
                        <Text style={styles.sectionBonusTxt}>+35</Text>
                    </View>
                </View>
            );
            // Minor points
        } else if (index === 25) {
            return (
                <View style={styles.item}>
                    <Text style={styles.scoreText}>
                        {minorPoints} / {BONUS_POINTS_LIMIT}</Text>
                </View>
            );
        } else if (index === 30) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="account-question-outline" size={25} style={styles.icon} />
                    <Text style={{ fontSize: 10, color: 'white' }}>Change</Text>
                </View>
            );
            //Sum of Faces
        } else if (index === 31) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('chance')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('chance') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 29) {
            return (
                <View style={styles.item}>
                    <Text style={styles.scoreText}>Total: {totalPoints}</Text>
                </View>
            );
        } else {
            return (
                <View style={styles.item}>
                    <Text style={styles.text}></Text>
                </View>
            );
        }
    };

    const renderDices = () => {
        const [isRolling, setIsRolling] = useState(false);

        const throwDices = () => {
            if (nbrOfThrowsLeft > 0) {
                setIsRolling(true);
                animateDices();
                setTimeout(() => {
                    for (let i = 0; i < NBR_OF_DICES; i++) {
                        if (!selectedDices[i]) {
                            let randomNumber = Math.floor(Math.random() * 6) + 1;
                            board[i] = 'dice-' + randomNumber;
                            rolledDices[i] = randomNumber;
                        }
                    }
                    setNbrOfThrowsLeft(nbrOfThrowsLeft - 1);
                    setIsRolling(false);
                    checkAndUnlockYatzy(rolledDices);
                }, 500);
            } else {
                setStatus('No throws left');
                setNbrOfThrowsLeft(NBR_OF_THROWS);
            }
        };

        const [diceAnimations] = useState(() =>
            Array.from({ length: NBR_OF_DICES }, () => new Animated.Value(0))
        );

        const animateDices = () => {
            Animated.parallel(
                diceAnimations.map((anim, index) =>
                    !selectedDices[index]
                        ? Animated.timing(anim, {
                            toValue: 1,
                            duration: 500,
                            useNativeDriver: true,
                        })
                        : Animated.timing(anim, {
                            toValue: 0,
                            duration: 0,
                            useNativeDriver: true,
                        })
                )
            ).start(() => {
                diceAnimations.forEach(anim => anim.setValue(0));
            });
        };

        const diceRow = [];
        for (let i = 0; i < NBR_OF_DICES; i++) {
            diceRow.push(
                <DiceAnimation
                    key={i}
                    diceName={board[i]}
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
            <View style={styles.gameboard}>
                <Text style={styles.status}>{status}</Text>
                <View style={styles.diceBorder}>
                    <View style={styles.flex}>{diceRow}</View>
                </View>
                <View style={styles.buttonContainer}>
                    {rounds === 0 ? (
                        <>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                    { width: '80%' },
                                ]}
                                onPress={() => {
                                    savePlayerPoints();
                                    resetGame();
                                }}
                            >
                                <Text style={styles.buttonText}>Game Over, Save Your Score</Text>
                                <MaterialCommunityIcons name="scoreboard-outline" size={24} color="black" />
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Pressable
                                disabled={nbrOfThrowsLeft <= 0}
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                    { width: '39%' },
                                ]}
                                onPress={() => {
                                    if (rounds === MAX_SPOTS && nbrOfThrowsLeft === 3) {
                                        startGame();
                                    }
                                    throwDices();
                                }}
                            >
                                <Text style={styles.buttonText}>Roll Dices</Text>
                                {rounds > 0 && <Text style={styles.nbrThrowsText}>{nbrOfThrowsLeft}</Text>}
                            </Pressable>
                            <Pressable
                                disabled={!selectedField}
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
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
                                <Text style={styles.buttonText}>Set Points</Text>
                                <MaterialCommunityIcons name="beaker-plus" size={25} color="black" />
                            </Pressable>
                        </>
                    )}
                </View>
            </View>
        );
    };

const handleStartGame = () => {
    if (tokens > 0) {
        setLayerVisible(false);
        setStatus("Throw the dices");
        setTokens((prev) => prev - 1); // Vähennetään yksi token
        console.log("Game starting...");
    } else {
        setEnergyModalVisible(true);
    }
};
    // Remove ImageBackground
    return (
        <ImageBackground source={require('../assets/diceBackground.jpg')} style={styles.background}>
            {isLayerVisible && (
                <Pressable
                    onPress={() => {
                        if (!gameStarted && rounds === MAX_SPOTS) {
                            handleStartGame();
                        }
                    }}
                    style={styles.filterLayer}
                >
                    <GlowingText style={styles.centeredText}>
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
                    contentContainerStyle={styles.container}
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
