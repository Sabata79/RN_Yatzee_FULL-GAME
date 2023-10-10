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
        }
    }, []);

    // Gridin luominen OK!!!
    const [data, setData] = useState([
        ...Array.from({ length: 31 }, (_, index) => ({ key: String(index + 2) })),
    ]);

    // Pelaajan jäljellä olevat heitot OK!!!
    const [nbrOfThrowsLeft, setNbrOfThrowsLeft] = useState(NBR_OF_THROWS);

    //Peli Status OK!!!
    const [status, setStatus] = useState('Throw the dices');

    const [gameEndStatus, setGameEndStatus] = useState(false);

    //Pelaajan piste paikat 13kpl OK!!!
    const [playerPointsTotal, setPlayerPointsTotal] = useState(new Array(MAX_SPOTS).fill(0));
    console.log('PlayePointsTotal:' + playerPointsTotal);

    //valinta listana  OK!!! true/false
    const [selectedDices, setSelectedDices] = useState(new Array(NBR_OF_DICES).fill(false));
    /* console.log(selectedDices); */

    //Noppien silmäluvut listana, OK!!!
    const [rolledDices, setRolledDices] = useState(new Array(NBR_OF_DICES).fill(0));
    /* console.log(rolledDices); */

    //Noppien silmäluvut yhteensä OK!!!
    const sumRolledDices = rolledDices.reduce((sum, diceValue) => sum + diceValue, 0);
    /* console.log(sumRolledDices); */

    // Summat eri silmäluvuille OK!!!
    const OnesSum = rolledDices.filter(dice => dice === 1).reduce((sum, diceValue) => sum + diceValue, 0);
    const TwoSum = rolledDices.filter(dice => dice === 2).reduce((sum, diceValue) => sum + diceValue, 0);
    const ThreeSum = rolledDices.filter(dice => dice === 3).reduce((sum, diceValue) => sum + diceValue, 0);
    const FoursSum = rolledDices.filter(dice => dice === 4).reduce((sum, diceValue) => sum + diceValue, 0);
    const FifthSum = rolledDices.filter(dice => dice === 5).reduce((sum, diceValue) => sum + diceValue, 0);
    const SixSum = rolledDices.filter(dice => dice === 6).reduce((sum, diceValue) => sum + diceValue, 0);

    //Summa jos kolme samaa ja yli OK!!!
    const ThreeOfAKindSum = rolledDices.reduce((sum, dice) => {
        if (dice === 0) {
            return sum;
        }
        if (rolledDices.filter(item => item === dice).length >= 3) {
            return sumRolledDices;
        }
        return sum;
    }, 0);
    //Summa jos neljä samaa ja yli OK!!!
    const FourOfAKindSum = rolledDices.reduce((sum, dice) => {
        if (dice === 0) {
            return sum;
        }
        if (rolledDices.filter(item => item === dice).length >= 4) {
            return sumRolledDices;
        }
        return sum;
    }, 0);
    //Yatzy OK!!!
    const Yatzy = rolledDices.reduce((sum, dice) => {
        // Tarkista onko noppa 0, jos on niin palauta summa
        if (dice === 0) {
            return sum;
        }
        // Tarkista onko viisi samaa silmälukua
        if (rolledDices.filter(item => item === dice).length === 5) {
            return sum + 50; // Add 50 to the sum for Yatzy
        }
        return sum;
    }, 0);
    // Täyskäsi OK!!!
    const FullHouse = () => {
        const counts = rolledDices.reduce((acc, dice) => {
            acc[dice] = (acc[dice] || 0) + 1;
            return acc;
        }, {});

        const countsValues = Object.values(counts);
        return countsValues.includes(3) && countsValues.includes(2);
    };
    const fullhouseValue = FullHouse() ? 25 : 0;
    // Pieni suora OK!!!
    const calculateSmallStraight = () => {
        const sortedDiceValues = [...rolledDices].sort((a, b) => a - b);
        const smallStraights = [
            [1, 2, 3, 4],
            [2, 3, 4, 5],
            [3, 4, 5, 6]
        ];

        for (const smallStraight of smallStraights) {
            if (smallStraight.every(val => sortedDiceValues.includes(val))) {
                return 30; // Pienen suoran arvo
            }
        }
        return 0; // Jos ei löydy pientä suoraa
    };
    const smallStraightValue = calculateSmallStraight();
    // Suuri suora OK!!!
    const calculateLargeStraight = () => {
        const sortedDiceValues = [...rolledDices].sort((a, b) => a - b);
        const largeStraights = [
            [1, 2, 3, 4, 5],
            [2, 3, 4, 5, 6]
        ];

        for (const largeStraight of largeStraights) {
            if (largeStraight.every(val => sortedDiceValues.includes(val))) {
                return 40; // Ison suoran arvo
            }
        }
        return 0; // Jos ei löydy suurta suoraa
    };
    const largeStraightValue = calculateLargeStraight();



    const [selectedField, setSelectedField] = useState(null);

    const [selecetedValue, setSelectedValue] = useState(null);


    // KYSEENALAINEN KOODI, TARVITSEEKO TÄMMÖISTÄ YLIPÄÄTÄNSÄ RAKENTA KUN HALUAA LUKITA TIETYN INDEXIN ARVON??
    const setPoints = () => {

        if (selectedField !== null) {
            let newValue = 0;
            switch (selectedField) {
                case 1:
                    setSelectedValue(OnesSum);
                    break;
                case 3:
                    setSelectedValue(ThreeOfAKindSum);
                    break;
                case 5:
                    setSelectedValue(TwoSum);
                    break;
                case 7:
                    setSelectedValue(FourOfAKindSum);
                    break;
                case 9:
                    setSelectedValue(ThreeSum);
                    break;
                case 11:
                    setSelectedValue(fullhouseValue);
                    break;
                case 13:
                    setSelectedValue(FoursSum);
                    break;
                case 15:
                    setSelectedValue(smallStraightValue);
                    break;
                case 17:
                    setSelectedValue(FifthSum);
                    break;
                case 19:
                    setSelectedValue(largeStraightValue);
                    break;
                case 21:
                    setSelectedValue(SixSum);
                    break;
                case 23:
                    setSelectedValue(Yatzy);
                    break;
                case 27:
                    setSelectedValue(sumRolledDices);
                    break;
                default:
                    selecetedValue = 0;
            }
            setSelectedField(null);
            setStatus('Points set successfully')
        } else {
            setStatus('Please select a field');
        }
    };

    const renderFirstRow = () => (
        <>
            <View style={styles.firstRow}>
                <View style={styles.firstRowItem}>
                    <Text style={styles.playerText}>{playerName}</Text>
                </View>
            </View>
            <View style={styles.firstRow}>
                <View style={styles.firstRowItem}>
                    <Text style={styles.text}>Minor</Text>
                </View>
                <View style={styles.firstRowItem}>
                    <Text style={styles.text}>Major</Text>
                </View>
            </View>
        </>
    );

    const renderGrid = ({
        index,
        sumRolledDices,
        OnesSum,
        TwoSum,
        ThreeSum,
        FoursSum,
        FifthSum,
        SixSum,
        ThreeOfAKindSum,
        FourOfAKindSum,
        Yatzy,
        fullhouseValue,
        smallStraightValue,
        largeStraightValue
    }) => {

        const handlePressField = (index) => {
            setSelectedField(index === selectedField ? null : index);
        };

        // Valitun kentän väri OK!!!
        const isSelected = selectedField === index;
        // Indeksit Gridin kohdille OK!!!
        if (index === 0) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-1" size={55} style={styles.icon} />
                </View>
            );
            //SUM OF ONES
        } else if (index === 1) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{OnesSum}</Text>
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
                        <Text>{ThreeOfAKindSum}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 4) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-2" size={55} color="white" />
                </View>
            );
            //SUM OF TWOS
        } else if (index === 5) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{TwoSum}</Text>
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
                        <Text>{FourOfAKindSum}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 8) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-3" size={55} color="white" />
                </View>
            );
            //SUM OF THREES
        } else if (index === 9) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{ThreeSum}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 10) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="home" size={30} color="white" />
                    <Text style={{ fontSize: 10, color: 'white' }}>fullhouse</Text>
                </View>
            );
            //FULLHOUSE
        } else if (index === 11) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{fullhouseValue}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 12) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-4" size={55} color="white" />
                </View>
            );
            //SUM OF FOURS
        } else if (index === 13) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{FoursSum}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 14) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="cards-outline" size={30} color="white" />
                    <Text style={{ fontSize: 10, color: 'white' }}>small</Text>
                </View>
            );
            //SMALL STRAIGHT
        } else if (index === 15) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{smallStraightValue}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 16) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-5" size={55} color="white" />
                </View>
            );
            //SUM OF FIVES
        } else if (index === 17) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{FifthSum}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 18) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="cards-outline" size={30} color="white" />
                    <Text style={{ fontSize: 10, color: 'white' }}>large</Text>
                </View>
            );
            //LARGE STRAIGHT
        } else if (index === 19) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{largeStraightValue}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 20) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="dice-6" size={55} color="white" />
                </View>
            );
            //SUM OF SIXES
        } else if (index === 21) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{SixSum}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 22) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="star-outline" size={30} color="white" />
                    <Text style={{ fontSize: 10, color: 'white' }}>Yatzy</Text>
                </View>
            );
            //YATZY
        } else if (index === 23) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{Yatzy}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 26) {
            return (
                <View style={styles.item}>
                    <MaterialCommunityIcons name="account-question-outline" size={30} color="white" />
                    <Text style={{ fontSize: 10, color: 'white' }}>Change</Text>
                </View>
            );
            //SUM OF FACES
        } else if (index === 27) {
            return (
                <Pressable onPress={() => handlePressField(index)}>
                    <View style={[styles.item, isSelected ? styles.selectScorePressed : styles.selectScore]}>
                        <Text>{sumRolledDices}</Text>
                    </View>
                </Pressable>
            );
        } else if (index === 28) {
            return (
                <View style={styles.item}>
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionBonusTxt}>Section Bonus</Text>
                        <Text style={styles.sectionBonusTxt}>+35</Text>
                    </View>
                </View>
            );
        } else if (index === 29) {
            return (
                <View style={styles.item}>
                    <Text style={styles.sectionBonusTxt}>/63</Text>
                </View>
            );
        } else if (index === 30) {
            return (
                <View style={styles.item}>
                    <Text style={styles.sectionBonusTxt}>Total:</Text>
                </View>
            );
        } else if (index === 31) {
            return (
                <View style={styles.item}>
                    <Text style={styles.sectionBonusTxt}></Text>
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

        const test = () => {
            if (nbrOfThrowsLeft === 0) {
                console.log('Play');
            }
        }

        const diceRow = [];
        for (let i = 0; i < NBR_OF_DICES; i++) {
            diceRow.push(
                <Pressable key={"row" + i} onPress={() => selectDice(i)}>
                    <MaterialCommunityIcons
                        name={board[i]}
                        key={"diceRow" + i}
                        size={60}
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
            if (nbrOfThrowsLeft < NBR_OF_THROWS && !gameEndStatus) {
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
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                ]}
                                onPress={() => {
                                    setPoints();
                                    setNbrOfThrowsLeft(NBR_OF_THROWS);
                                }}>
                                <Text style={styles.buttonText}>Set points</Text>
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
                renderGrid({
                    item,
                    index,
                    sumRolledDices,
                    OnesSum,
                    TwoSum,
                    ThreeSum,
                    FoursSum,
                    FifthSum,
                    SixSum,
                    ThreeOfAKindSum,
                    FourOfAKindSum,
                    Yatzy,
                    fullhouseValue,
                    smallStraightValue,
                    largeStraightValue
                })}
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
