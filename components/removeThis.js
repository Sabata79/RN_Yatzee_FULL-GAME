import React, { useState, useEffect } from 'react';
import { FlatList, Text, View, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import { MAX_SPOTS, NBR_OF_THROWS, DICEVALUES, NBR_OF_DICES } from '../constants/Game';

let board = [];

export default function Gameboard({ navigation, route }) {

    // Pelaajan nimi OK!!!
    const [playerName, setPlayerName] = useState('');

    useEffect(() => {
        if (playerName === '' && route.params?.player) {
            setPlayerName(route.params.player);
            resetGame();
        }

    }, [route.params?.player, route.params?.reset]);

    const resetGame = () => {
        board = [];
    };

    // Gridin luominen OK!!!
    const [data, setData] = useState([
        ...Array.from({ length: 32 }, (_, index) => ({ key: String(index + 2) })),
    ]);

    // Pelaajan jäljellä olevat heitot OK!!!
    const [nbrOfThrowsLeft, setNbrOfThrowsLeft] = useState(NBR_OF_THROWS);

    //Peli Status toimii mutta lisäoptiona jos haluan lisätä pelin loppumisen
    const [status, setStatus] = useState('Throw the dices');
    console.log(status);
    //valinta listana  OK!!! true/false
    const [selectedDices, setSelectedDices] = useState(new Array(NBR_OF_DICES).fill(false));

    //Noppa valintojen resetointi OK!!!
    const resetDiceSelection = () => {
        setSelectedDices(new Array(NBR_OF_DICES).fill(false));
    };

    //Noppien silmäluvut listana, OK!!!
    const [rolledDices, setRolledDices] = useState(new Array(NBR_OF_DICES).fill(0));


    //Noppien silmäluvut yhteensä OK!!!
    const sumRolledDices = rolledDices.reduce((sum, diceValue) => sum + diceValue, 0);


        const [scoringCategories, setScoringCategories] = useState([
        {
            name: 'ones',
            calculateScore: (rolledDices) => calculateDiceSum(1),
            locked: false
        },
        {
            name: 'twos',
            calculateScore: (rolledDices) => calculateDiceSum(2),
            locked: false
        },
        {
            name: 'threes',
            calculateScore: (rolledDices) => calculateDiceSum(3),
            locked: false
        },
        {
            name: 'fours',
            calculateScore: (rolledDices) => calculateDiceSum(4),
            locked: false
        },
        {
            name: 'fives',
            calculateScore: (rolledDices) => calculateDiceSum(5),
            locked: false
        },
        {
            name: 'sixes',
            calculateScore: (rolledDices) => calculateDiceSum(6),
            locked: false
        },
        {
            name: 'threeOfAKind',
            calculateScore: (rolledDices) => calculateThreeOfAKind(rolledDices),
            locked: false
        },
        {
            name: 'fourOfAKind',
            calculateScore: (rolledDices) => calculateFourOfAKind(rolledDices),
            locked: false
        },
        {
            name: 'yatzy',
            calculateScore: (rolledDices) => calculateYatzy(rolledDices),
            locked: false
        },
        {
            name: 'fullHouse',
            calculateScore: (rolledDices) => calculateFullHouse(rolledDices) ? 25 : 0,
            locked: false
        },
        {
            name: 'smallStraight',
            calculateScore: (rolledDices) => calculateSmallStraight(rolledDices),
            locked: false
        },
        {
            name: 'largeStraight',
            calculateScore: (rolledDices) => calculateLargeStraight(rolledDices),
            locked: false
        },
        {
            name: 'chance',
            calculateScore: (rolledDices) => sumRolledDices,
            locked: false
        },
        {
            name: 'status',
            status: '',
        },
    ]);

    const diceSums = [1, 2, 3, 4, 5, 6].map(diceValue => calculateDiceSum(diceValue));

    function calculateDiceSum(diceValue) {
        return rolledDices.reduce((sum, dice) => (dice === diceValue ? sum + dice : sum), 0);
    }
    // Kolmoset 
    function calculateThreeOfAKind(rolledDices) {
        return rolledDices.reduce((sum, dice) => {
            if (dice === 0) {
                return sum;
            }
            if (rolledDices.filter(item => item === dice).length >= 3) {
                return sumRolledDices;
            }
            return sum;
        }, 0);
    }
    // Neloset
    function calculateFourOfAKind(rolledDices) {
        return rolledDices.reduce((sum, dice) => {
            if (dice === 0) {
                return sum;
            }
            if (rolledDices.filter(item => item === dice).length >= 4) {
                return sumRolledDices;
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
                return 50; // Add 50 to the sum for Yatzy
            }
            return sum;
        }, 0);
    }
    // Täyskäsi
    function calculateFullHouse(rolledDices) {
        const counts = {};
        for (const dice of rolledDices) {
            counts[dice] = (counts[dice] || 0) + 1;
        }
        const values = Object.values(counts);
        return values.includes(3) && values.includes(2);
    }
    // Pieni suora
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

    const [selectedField, setSelectedField] = useState(null);
    const [selecetedValue, setSelectedValue] = useState(null);
    const [fieldValues, setFieldValues] = useState(new Array(13).fill(null));

    const renderFirstRow = () => (
        <>
            <View style={styles.firstRow}>
                <View style={styles.firstRowItem}>
                    <Text style={{ fontFamily: 'AntonRegular', fontSize: 18, color: '#2f2009' }}>{playerName}</Text>
                </View>
            </View>
            <View style={styles.firstRow}>
                <View style={styles.firstRowItem}>
                    <Text style={{ fontFamily: 'AntonRegular', fontSize: 18, color: '#e9d99c' }}>Minor</Text>
                </View>
                <View style={styles.firstRowItem}>
                    <Text style={{ fontFamily: 'AntonRegular', fontSize: 18, color: '#e9d99c' }}>Major</Text>
                </View>
            </View>
        </>
    );

    const renderGrid = ({ index, scoringCategories }) => {

        const handlePressField = (index) => {
            setSelectedField(index === selectedField ? null : index);
        };

        // Valitun kentän väri OK!!!
        const isSelected = selectedField === index;

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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'ones').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'threeOfAKind').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'twos').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'fourOfAKind').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'threes').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'fullHouse').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'fours').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'smallStraight').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'fives').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'largeStraight').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'sixes').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'yatzy').calculateScore(rolledDices)}
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
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text style={styles.inputIndexShown}>
                            {scoringCategories.find(c => c.name === 'chance').calculateScore(rolledDices)}
                        </Text>
                    </View>
                </Pressable>
            );
        } else if (index === 24) {
            return (
                <View style={styles.item}>
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionBonusTxt}>Section Bonus</Text>
                        <Text style={styles.sectionBonusTxt}>+35</Text>
                    </View>
                </View>
            );
        } else if (index === 25) {
            return (
                <View style={styles.item}>
                    <Text style={{ color: '#2f2009', fontFamily: 'AntonRegular' }}>/63</Text>
                </View>
            );
        } else if (index === 29) {
            return (
                <View style={styles.item}>
                    <Text style={{ color: '#2f2009', fontFamily: 'AntonRegular' }}>Total:</Text>
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

    // Noppien , Roll ja Set Points renderöinti OK!!!
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
                    {nbrOfThrowsLeft === 3 ? (
                        <>
                            <Pressable
                                disabled={nbrOfThrowsLeft <= 0}  // Disabloi kun heittoja ei jäljellä
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                    { width: '80%' },
                                ]}
                                onPress={() => throwDices()}>
                                <Text style={styles.buttonText}>Roll Dices</Text>
                                <Text style={styles.nbrThrowsText}>{nbrOfThrowsLeft}</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                    { display: 'none' },
                                ]}
                                onPress={() => test()}>
                                <Text style={styles.buttonText}>Play</Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <Pressable
                                disabled={nbrOfThrowsLeft <= 0}  // Disabloi kun heittoja ei jäljellä
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                ]}
                                onPress={() => throwDices()}>
                                <Text style={styles.buttonText}>Roll Dices</Text>
                                <Text style={styles.nbrThrowsText}>{nbrOfThrowsLeft}</Text>
                            </Pressable>
                            <Pressable
                                disabled={!selectedField} // Disabloi kun kenttää ei ole valittu
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                ]}
                                onPress={() => {
                                    setNbrOfThrowsLeft(NBR_OF_THROWS);
                                    resetDiceSelection();
                                }}>
                                <Text style={styles.buttonText}>Set points</Text>
                                <MaterialCommunityIcons name="beaker-plus" size={25} color="black" />
                            </Pressable>
                        </>
                    )}
                </View>
            </View>
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

const handleSetPoints = () => {
    if (selectedField !== null) {
        const selectedCategory = scoringCategories.find(category => category.index === selectedField);

        if (selectedCategory) {
            if (!selectedCategory.locked) {
                const points = selectedCategory.calculateScore(rolledDices);
                const updatedCategories = scoringCategories.map(category => {
                    if (category.index === selectedField) {
                        const updatedCategory = {
                            ...category,
                            points: points,
                            locked: true,
                        };
                        // Calculate and update the total points for this category
                        updatedCategory.totalPoints = category.totalPoints ? category.totalPoints + points : points;
                        return updatedCategory;
                    } else if (category.name === 'total') {
                        // Update the 'total' category with the accumulated points
                        return {
                            ...category,
                            points: category.points + points,
                        };
                    }
                    return category;
                });

                // Päivitää kentän pisteet
                setScoringCategories(updatedCategories);

                // loggaa konsoliin
                console.log('Updated scoringCategories:', JSON.stringify(updatedCategories, null, 2));
            }
            setSelectedField(null);
        }
    }
};


