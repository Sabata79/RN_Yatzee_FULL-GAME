import React, { useState, useEffect } from 'react';
import { FlatList, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import { NBR_OF_THROWS, NBR_OF_DICES, MAX_SPOTS, SCOREBOARD_KEY } from '../constants/Game';
import AsyncStorage from '@react-native-async-storage/async-storage';

let board = [];

export default function Gameboard({ route, navigation }) {

    // Pelaajan nimi
    const [playerName, setPlayerName] = useState('');

    useEffect(() => {
        if (route.params?.player) {
            setPlayerName(route.params.player);
            resetGame();
        }
    }, [route.params?.player, route.params?.reset]);

    // Päivittää tulostaulun tiedot, kun näkymä saa fokuksen.
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            getScoreboardData();
        });
        return unsubscribe;
    }, [navigation]);

    //Resetoi pelin
    const resetGame = () => {
        const resetCategories = scoringCategories.map(category => {
            return {
                ...category,
                points: 0,
                locked: false,
            };
        });
        setScoringCategories(resetCategories);
        setRounds(MAX_SPOTS);
        setNbrOfThrowsLeft(NBR_OF_THROWS);
        resetDiceSelection();
    };

    // Tulosten tallennus asyncstorageen
    const currentDate = new Date();

    const savePlayerPoints = async () => {
        try {
            const totalPoints = scoringCategories.find(category => category.name === 'total').points;
            const newKey = new Date().getTime();
            const playerPoints = {
                key: newKey,
                name: playerName,
                date: currentDate.toLocaleDateString(), // päivämäärä
                time: currentDate.toLocaleTimeString(), // aika
                points: totalPoints,  // yhteispisteet
            };

            // Haetaan olemassa olevat pisteet AsyncStoragesta
            const existingScoresJSON = await AsyncStorage.getItem(SCOREBOARD_KEY);
            const existingScores = existingScoresJSON ? JSON.parse(existingScoresJSON) : [];

            // Lisätään uudet pisteet olemassa olevien pisteiden perään
            const updatedScores = [...existingScores, playerPoints];

            // Tallennetaan päivitetyt pisteet takaisin AsyncStorageen
            const jsonValue = JSON.stringify(updatedScores);
            await AsyncStorage.setItem(SCOREBOARD_KEY, jsonValue);
            navigation.navigate('Scoreboard');
        } catch (error) {
            console.log('Error:' + error);
        }
    };

    // Pisteiden tallennus asyncstorageen vol2
    const getScoreboardData = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(SCOREBOARD_KEY);
            if (jsonValue != null) {
                let tmpscores = JSON.parse(jsonValue);
                setScores(tmpscores);
            }
        }
        catch (error) {
            console.log('Error:' + error);
        }
    }

    // Gridin luominen
    const [data, setData] = useState([
        ...Array.from({ length: 32 }, (_, index) => ({ key: String(index + 2) })),
    ]);

    // Pelaajan jäljellä olevat heitot
    const [nbrOfThrowsLeft, setNbrOfThrowsLeft] = useState(NBR_OF_THROWS);

    //Peli Status toimii mutta lisäoptiona jos haluan lisätä pelin loppumisen
    const [status, setStatus] = useState('Throw the dices');

    //Valinta nopista listana (true/false)
    const [selectedDices, setSelectedDices] = useState(new Array(NBR_OF_DICES).fill(false));

    //Noppa valintojen resetointi
    const resetDiceSelection = () => { setSelectedDices(new Array(NBR_OF_DICES).fill(false)); };

    //Kierrosten lukumäärä
    const [rounds, setRounds] = useState(MAX_SPOTS);

    //Noppien silmäluvut listana 
    const [rolledDices, setRolledDices] = useState(new Array(NBR_OF_DICES).fill(0));

   // Pisteet
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
            name: 'threeOfAKind',
            index: 3,
            calculateScore: (rolledDices) => calculateThreeOfAKind(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'fourOfAKind',
            index: 7,
            calculateScore: (rolledDices) => calculateFourOfAKind(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'yatzy',
            index: 23,
            calculateScore: (rolledDices) => calculateYatzy(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'fullHouse',
            index: 11,
            calculateScore: (rolledDices) => calculateFullHouse(rolledDices) ? 25 : 0,
            locked: false,
            points: 0,
        },
        {
            name: 'smallStraight',
            index: 15,
            calculateScore: (rolledDices) => calculateSmallStraight(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'largeStraight',
            index: 19,
            calculateScore: (rolledDices) => calculateLargeStraight(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'chance',
            index: 27,
            calculateScore: (rolledDices) => calculateChange(rolledDices),
            locked: false,
            points: 0,
        },
        {
            name: 'sectionMinor',
            points: 0
        },
        {
            name: 'total',
            index: 29,
            points: 0,
        },

    ]);


    // ONGELMA: Kun sectionMinor pisteet saavuttaa 63 pistettä, kaikki noppien pyöräytykset lisäävät pisteitä ???

    const handleSetPoints = () => {
        if (selectedField !== null) {
            const minorNames = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];

            // Etsitään valittu kategoria valintaindeksin perusteella
            const selectedCategory = scoringCategories.find(category => category.index === selectedField);

            if (selectedCategory) {
                // Tarkistetaan, ettei kategoria ole lukittu
                if (!selectedCategory.locked) {
                    // Lasketaan pisteet valitulle kategorialle annettujen noppien perusteella
                    const points = selectedCategory.calculateScore(rolledDices);

                    // Tarkistetaan, onko valittu kategoria minorNames-listalla
                    const isCategoryInMinorNames = minorNames.includes(selectedCategory.name);

                    // Päivitetään kategoriat ja niiden pisteet
                    const updatedCategories = scoringCategories.map(category => {
                        if (category.index === selectedField) {
                            // Päivitetään valittu kategoria
                            return {
                                ...category,
                                points: points,
                                locked: true,
                            };
                        } else if (category.name === 'sectionMinor' && category.points >= 63) {
                            // Jos 'sectionMinor' on saavutettu 63 pistettä, lisätään 35 pistettä
                            return {
                                ...category,
                                points: category.points + 35,
                            };
                        } else if (category.name === 'total' || (isCategoryInMinorNames && category.name === 'sectionMinor')) {
                            return {
                                ...category,
                                points: category.points + points,
                            };
                        }
                        return category;
                    });
                    // Päivitetään pisteet ja lukitus kategorioille
                    setScoringCategories(updatedCategories);
                }
                // Tyhjennetään valittu kategoria
                setSelectedField(null);
            }
        }
    };

    //Silmälukujen summa
    function calculateDiceSum(diceValue) {
        return rolledDices.reduce((sum, dice) => (dice === diceValue ? sum + dice : sum), 0);
    }
    //Kolmoset 
    function calculateThreeOfAKind(rolledDices) {
        return rolledDices.reduce((sum, dice) => {
            if (dice === 0) {
                return sum;
            }
            if (rolledDices.filter(item => item === dice).length >= 3) {
                return rolledDices.reduce((sum, dice) => sum + dice, 0);
            }
            return sum;
        }, 0);
    }
    //Neloset
    function calculateFourOfAKind(rolledDices) {
        return rolledDices.reduce((sum, dice) => {
            if (dice === 0) {
                return sum;
            }
            if (rolledDices.filter(item => item === dice).length >= 4) {
                return rolledDices.reduce((sum, dice) => sum + dice, 0);
            }
            return sum;
        }, 0);
    }
    //Yatzy
    function calculateYatzy(rolledDices) {

        return rolledDices.reduce((sum, dice) => {
            if (dice === 0) {
                return sum;
            }
            if (rolledDices.filter(item => item === dice).length === 5) {
                return 50; // Lisää 50 pistettä
            }
            return sum;
        }, 0);
    }
    //Täyskäsi
    function calculateFullHouse(rolledDices) {
        const counts = {};
        for (const dice of rolledDices) {
            counts[dice] = (counts[dice] || 0) + 1;
        }
        const values = Object.values(counts);
        return values.includes(3) && values.includes(2);
    }
    //Pieni suora
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
    // Suuri suora OK!!!
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
    //Sattuma
    function calculateChange(rolledDices) {
        return rolledDices.reduce((sum, dice) => {
            if (dice === 0) {
                return sum;
            }
            return sum + dice;
        }, 0);
    }

    const [selectedField, setSelectedField] = useState(null);

    const renderFirstRow = () => (
        <>
            <View style={styles.firstRow}>
                <View style={styles.firstRowItem}>
                    <Text style={styles.firstRowNameText}>Good luck, {playerName}</Text>
                </View>
            </View>
            <View style={styles.firstRow}>
                <View style={styles.firstRowItem}>
                    <Text style={styles.firstRowCategoryText}>Minor</Text>
                </View>
                <View style={styles.firstRowItem}>
                    <Text style={styles.firstRowCategoryText}>Major</Text>
                </View>
            </View>
        </>
    );

    const renderGrid = ({ index, scoringCategories }) => {

        const handlePressField = (index) => {
            if (nbrOfThrowsLeft < NBR_OF_THROWS && nbrOfThrowsLeft !== 3) {
                setSelectedField(index === selectedField ? null : index);
            } else {
                setStatus('Cannot select field at this time');
            }
        };

        // Onko kenttä valittu
        const isSelected = selectedField === index;

        // Tarkistaa onko kategoria lukittu
        const isLocked = (categoryName) => {
            const category = scoringCategories.find(category => category.name === categoryName);
            return category ? category.locked : false;
        };

        // Haetaan nykyinen kategoria
        const currentCategory = scoringCategories.find(category => category.index === index);

        // Tyyli kentälle (lukittu tai valittu)
        const fieldStyle = currentCategory && currentCategory.locked ? styles.lockedField : styles.selectScore;


        // Indeksit Gridin kohdille OK!!!
        if (index === 0) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-1" size={45} style={styles.icon} />
                </View>
            );
            //SUM OF ONES
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
                    <Text style={styles.gridTxt}>3X</Text>
                </View>
            );
            //SUM OF TRIPLES AND MORE
        } else if (index === 3) {
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
                    <MaterialCommunityIcons name="dice-2" size={45} color="white" />
                </View>
            );
            //SUM OF TWOS
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
        } else if (index === 6) {
            return (
                <View style={styles.item}>
                    <Text style={styles.gridTxt}>4X</Text>
                </View>
            );
            //SUM OF FOURS AND MORE
        } else if (index === 7) {
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
                    <MaterialCommunityIcons name="dice-3" size={45} color="white" />
                </View>
            );
            //SUM OF THREES
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
            // TÄYSKÄSI
        } else if (index === 10) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="home" size={25} color="white" />
                    <Text style={{ fontSize: 10, color: 'white' }}>FullHouse</Text>
                </View>
            );
        } else if (index === 11) {
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
                    <MaterialCommunityIcons name="dice-4" size={45} color="white" />
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
        } else if (index === 14) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="cards-outline" size={25} color="white" />
                    <Text style={{ fontSize: 10, color: 'white' }}>small</Text>
                </View>
            );
            //SMALL STRAIGHT
        } else if (index === 15) {
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
                    <MaterialCommunityIcons name="dice-5" size={45} color="white" />
                </View>
            );
            //SUM OF FIVES
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
        } else if (index === 18) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="cards-outline" size={25} color="white" />
                    <Text style={{ fontSize: 10, color: 'white' }}>large</Text>
                </View>
            );
            //LARGE STRAIGHT
        } else if (index === 19) {
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
                    <MaterialCommunityIcons name="dice-6" size={45} color="white" />
                </View>
            );
            //SUM OF SIXES
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
        } else if (index === 22) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="star-outline" size={25} color="white" />
                    <Text style={{ fontSize: 10, color: 'white' }}>Yatzy</Text>
                </View>
            );
            //YATZY
        } else if (index === 23) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('yatzy')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('yatzy') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 26) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="account-question-outline" size={25} color="white" />
                    <Text style={{ fontSize: 10, color: 'white' }}>Change</Text>
                </View>
            );
            //SUM OF FACES
        } else if (index === 27) {
            return (
                <Pressable onPress={() => handlePressField(index)} disabled={isLocked('chance')}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : fieldStyle]}>
                        <Text style={styles.inputIndexShown}>
                            {isLocked('chance') ? currentCategory.points : currentCategory.calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 24) {
            const isSectionMinorAchieved = scoringCategories.find(category => category.name === 'sectionMinor').points >= 63;

            if (isSectionMinorAchieved) {
                scoringCategories.find(category => category.name === 'total').points += 35;
            }

            return (
                <View style={styles.item}>
                    <View style={isSectionMinorAchieved ? styles.sectionContainerAchieved : styles.sectionContainer}>
                        <Text style={styles.sectionBonusTxt}>Section Bonus</Text>
                        <Text style={styles.sectionBonusTxt}>+35</Text>
                    </View>
                </View>
            );
            // Minor pisteet
        } else if (index === 25) {
            return (
                <View style={styles.item}>
                    <Text style={styles.scoreText}>
                        {scoringCategories.find(category => category.name === 'sectionMinor').points} /63</Text>
                </View>
            );
        } else if (index === 29) {
            return (
                <View style={styles.item}>
                    <Text style={styles.scoreText}>Total: {currentCategory.points}</Text>
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

        const throwDices = () => {
            if (nbrOfThrowsLeft > 0) {
                for (let i = 0; i < NBR_OF_DICES; i++) {
                    if (!selectedDices[i]) {
                        let randomNumber = Math.floor(Math.random() * 6) + 1;
                        board[i] = 'dice-' + randomNumber;
                        rolledDices[i] = randomNumber;
                    }
                }
                setNbrOfThrowsLeft(nbrOfThrowsLeft - 1);
            } else {
                setStatus('No throws left');
                setNbrOfThrowsLeft(NBR_OF_THROWS)
            }
        };

        const diceRow = [];

        for (let i = 0; i < NBR_OF_DICES; i++) {
            diceRow.push(
                <Pressable key={"row" + i} onPress={() => selectDice(i)}>
                    <MaterialCommunityIcons
                        name={board[i]}
                        key={"diceRow" + i}
                        size={45}
                        color={getDiceColor(i)}>
                    </MaterialCommunityIcons>
                </Pressable>
            );
        }

        function getDiceColor(index) {
            if (board.every((value, i, arr) => value === arr[0])) {
                return 'red';
            }
            else {
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
        }

        return (
            <View style={styles.gameboard}>
                <Text style={styles.status}>{status}</Text>
                <View style={styles.diceBorder}>
                    <View style={styles.flex}>{diceRow}</View>
                </View>
                <View style={styles.buttonContainer}>
                    {rounds === 0 ? (
                        // Display "Game Over, Save Your Score" button when rounds is 0
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
                    ) : (
                        // Display regular buttons for rolling dice and setting points
                        <>
                            <Pressable
                                disabled={nbrOfThrowsLeft <= 0}
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                    { width: '39%' },
                                ]}
                                onPress={() => throwDices()}
                            >
                                <Text style={styles.buttonText}>Roll Dices</Text>
                                {rounds > 0 && <Text style={styles.nbrThrowsText}>{nbrOfThrowsLeft}</Text>}
                                {rounds === 0 && <MaterialCommunityIcons name="scoreboard-outline" size={24} color="black" />}
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
                                    setRounds(rounds - 1);
                                }}
                            >
                                <Text style={styles.buttonText}>Set Points</Text>
                                <MaterialCommunityIcons name="beaker-plus" size={25} color="black" />
                            </Pressable>
                        </>
                    )}
                </View>
            </View >
        );
    }


    return (
        <FlatList
            data={data}
            renderItem={({ item, index }) =>
                renderGrid({ item, index, scoringCategories })}
            numColumns={4}
            backgroundColor={'#85715d'}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.container}
            ListHeaderComponent={renderFirstRow}
            ListEmptyComponent={renderGrid}
            ListFooterComponent={renderDices}
        />
    );
}
