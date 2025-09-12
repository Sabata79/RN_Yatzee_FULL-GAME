/**
 * Gameboard.js - Main game screen for playing Yatzy (fixed)
 * Main game screen for playing Yatzy. Handles dice rolling, scoring, and game state.
 * Refactored 12.9.2025 to fix FlatList re-render loop issues.
 * @module Gameboard    
 * @author Sabata79
 * @since 2025-08-29
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FlatList, Text, View, Pressable, ImageBackground, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import gameboardstyles from '../styles/GameboardScreenStyles';
import { NBR_OF_THROWS, NBR_OF_DICES, MAX_SPOTS, BONUS_POINTS, BONUS_POINTS_LIMIT } from '../constants/Game';
import DiceAnimation from '../components/DiceAnimation';
import { useAudio } from '../services/AudioManager';
import ModalAlert from '../constants/ModalAlert';
import { useGame } from '../constants/GameContext';
import RenderFirstRow from '../components/RenderFirstRow';
import Header from './Header';
import GlowingText from '../components/AnimatedText';
import GameSave from '../constants/GameSave';
import { dicefaces } from '../constants/DicePaths';
import GameboardButtons from '../components/GameboardButtons';
import { scoringCategoriesConfig } from '../constants/scoringCategoriesConfig';
import {
    calculateDiceSum,
    calculateTwoOfKind,
    calculateThreeOfAKind,
    calculateFourOfAKind,
    calculateYatzy,
    calculateFullHouse,
    calculateSmallStraight,
    calculateLargeStraight,
    calculateChange,
} from '../logic/diceLogic';
import GridField from '../components/GridField';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 720;

const RenderDices = React.memo(function RenderDices({
    status,
    setStatus,
    rounds,
    nbrOfThrowsLeft,
    setNbrOfThrowsLeft,
    resetGame,
    savePlayerPoints,
    navigation,
    startGame,
    throwDices,
    selectedField,
    handleSetPoints,
    resetDiceSelection,
    scoringCategories,
    setRounds,
    diceRow,
    endGame,
}) {
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
                endGame={endGame}
            />
        </View>
    );
});

export default function Gameboard({ route, navigation }) {
    const gameContext = useGame();
    const { playSfx, playSelect, playDeselect, playDiceTouch } = useAudio();

    // Adater for Gridfield
    const audioApi = useMemo(
        () => ({ playSfx, playSelect, playDeselect, playDiceTouch }),
        [playSfx, playSelect, playDeselect, playDiceTouch]
    );

    // Selected grid field
    const [selectedField, setSelectedField] = useState(null);
    const [board, setBoard] = useState(Array(NBR_OF_DICES).fill(1));

    // Player / points / tokens
    const [playerName, setPlayerName] = useState('');
    const { playerId, setPlayer } = gameContext;
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const { gameStarted, gameEnded, startGame, endGame, totalPoints, setTotalPoints, tokens, setTokens, setEnergyModalVisible } = gameContext;
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timer, setTimer] = useState(null);
    const timerRef = useRef(null);
    const { savePlayerPoints } = GameSave({ playerId, totalPoints, elapsedTime, navigation });

    const [isLayerVisible, setLayerVisible] = useState(true);

    // Start and stop game time counting
    useEffect(() => {
        if (gameStarted && !gameEnded) {
            if (!timer) {
                const interval = setInterval(() => {
                    setElapsedTime((t) => t + 1);
                }, 1000);
                setTimer(interval);
            }
        } else if (timer) {
            clearInterval(timer);
            setTimer(null);
        }
        return () => { if (timer) clearInterval(timer); };
    }, [gameStarted, gameEnded]);

    // Game logic state
    const [nbrOfThrowsLeft, setNbrOfThrowsLeft] = useState(NBR_OF_THROWS);
    const [status, setStatus] = useState('Throw the dices');
    const [selectedDices, setSelectedDices] = useState(new Array(NBR_OF_DICES).fill(false));
    const resetDiceSelection = useCallback(() => setSelectedDices(new Array(NBR_OF_DICES).fill(false)), []);
    const [rounds, setRounds] = useState(MAX_SPOTS);
    const [rolledDices, setRolledDices] = useState(new Array(NBR_OF_DICES).fill(0));

    // Scoring categories
    const [scoringCategories, setScoringCategories] = useState(
        scoringCategoriesConfig.map((cat) => {
            let calculateScore = null;
            switch (cat.name) {
                case 'ones': calculateScore = (r) => calculateDiceSum(r, 1); break;
                case 'twos': calculateScore = (r) => calculateDiceSum(r, 2); break;
                case 'threes': calculateScore = (r) => calculateDiceSum(r, 3); break;
                case 'fours': calculateScore = (r) => calculateDiceSum(r, 4); break;
                case 'fives': calculateScore = (r) => calculateDiceSum(r, 5); break;
                case 'sixes': calculateScore = (r) => calculateDiceSum(r, 6); break;
                case 'twoOfKind': calculateScore = (r) => calculateTwoOfKind(r); break;
                case 'threeOfAKind': calculateScore = (r) => calculateThreeOfAKind(r); break;
                case 'fourOfAKind': calculateScore = (r) => calculateFourOfAKind(r); break;
                case 'yatzy': calculateScore = (r) => calculateYatzy(r); break;
                case 'fullHouse': calculateScore = (r) => (calculateFullHouse(r) ? 25 : 0); break;
                case 'smallStraight': calculateScore = (r) => calculateSmallStraight(r); break;
                case 'largeStraight': calculateScore = (r) => calculateLargeStraight(r); break;
                case 'chance': calculateScore = (r) => calculateChange(r); break;
                default: calculateScore = null;
            }
            return { ...cat, calculateScore, locked: false, points: 0 };
        })
    );

    const [minorPoints, setMinorPoints] = useState(0);
    const [hasAppliedBonus, setHasAppliedBonus] = useState(false);

    useEffect(() => {
        if (rounds === MAX_SPOTS) setLayerVisible(true); else setLayerVisible(false);
    }, [rounds]);

    useEffect(() => {
        if (route?.params?.playerId) setPlayer(route.params.playerId);
    }, [route?.params?.playerId, setPlayer]);

    const resetGame = useCallback(() => {
        setScoringCategories((prev) => prev.map((category) => ({
            ...category,
            points: 0,
            locked: false,
            yatzyAchieved: false,
        })));
        setRounds(MAX_SPOTS);
        setNbrOfThrowsLeft(NBR_OF_THROWS);
        resetDiceSelection();
        setTotalPoints(0);
        setMinorPoints(0);
        setHasAppliedBonus(false);
        setElapsedTime(0);
        setBoard(Array(NBR_OF_DICES).fill(1));
        setRolledDices(new Array(NBR_OF_DICES).fill(0));
    }, [resetDiceSelection, setTotalPoints]);

    // Stable data array (keys 2..33), never changes
    const data = useMemo(() => Array.from({ length: 32 }, (_, index) => ({ key: String(index + 2) })), []);

    const handleSetPoints = useCallback(() => {
        if (selectedField === null) return;

        const minorNames = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
        const selectedCategory = scoringCategories.find((category) => category.index === selectedField);
        if (!selectedCategory || selectedCategory.locked) return;

        if (selectedCategory.name === 'yatzy') {
            const yatzyScore = calculateYatzy(rolledDices);
            if (yatzyScore === 50) {
                const newPoints = selectedCategory.points === 0 ? 50 : selectedCategory.points + 50;
                setScoringCategories((prev) => prev.map((c) => (c.index === selectedField ? { ...c, points: newPoints, locked: true, yatzyAchieved: true } : c)));
                setTotalPoints((tp) => tp + 50);
            } else {
                setScoringCategories((prev) => prev.map((c) => (c.index === selectedField ? { ...c, locked: true } : c)));
            }
        } else {
            const points = selectedCategory.calculateScore(rolledDices);
            const isMinor = minorNames.includes(selectedCategory.name);
            setScoringCategories((prev) => prev.map((c) => (c.index === selectedField ? { ...c, points, locked: true } : c)));
            if (isMinor) {
                const newMinorPoints = minorPoints + points;
                let bonusApplied = hasAppliedBonus;
                let total = totalPoints + points;
                if (newMinorPoints >= BONUS_POINTS_LIMIT && !hasAppliedBonus) {
                    total += BONUS_POINTS;
                    bonusApplied = true;
                }
                setMinorPoints(newMinorPoints);
                setTotalPoints(total);
                if (bonusApplied !== hasAppliedBonus) setHasAppliedBonus(bonusApplied);
            } else {
                setTotalPoints(totalPoints + points);
            }
        }
        setSelectedField(null);
    }, [selectedField, scoringCategories, rolledDices, hasAppliedBonus, setTotalPoints]);

    // Yatzy field lock/unlock based on current roll
    const checkAndUnlockYatzy = useCallback((currRoll) => {
        const yatzyCategory = scoringCategories.find((c) => c.name === 'yatzy');
        if (!yatzyCategory) return;
        const ys = calculateYatzy(currRoll);
        if (ys === 50 && yatzyCategory.points > 0) {
            setScoringCategories((prev) => prev.map((c) => (c.name === 'yatzy' ? { ...c, locked: false, yatzyAchieved: true } : c)));
        } else if (!yatzyCategory.locked && yatzyCategory.yatzyAchieved) {
            setScoringCategories((prev) => prev.map((c) => (c.name === 'yatzy' ? { ...c, locked: true } : c)));
        }
    }, [scoringCategories]);

    const [diceAnimations] = useState(() => Array.from({ length: NBR_OF_DICES }, () => new Animated.Value(0)));
    const [isRolling, setIsRolling] = useState(false);

    const selectDice = useCallback((i) => {
        // allow selecting only after the first throw
        if (nbrOfThrowsLeft >= NBR_OF_THROWS) return;

        setSelectedDices(prev => {
            const next = [...prev];
            next[i] = !next[i];
            return next;
        });

        // play tap sfx (ignore errors)
        Promise.resolve(playDiceTouch?.()).catch(() => { });
    }, [nbrOfThrowsLeft, playDiceTouch]);

    const getDiceColor = useCallback((index) => {
        if (board.every((v, i, arr) => v === arr[0])) return 'red';
        return selectedDices[index] ? 'red' : 'white';
    }, [board, selectedDices]);

    const throwDices = useCallback(() => {
        if (nbrOfThrowsLeft > 0) {
            setIsRolling(true);
            // SFX
            playSfx();
            setTimeout(() => {
                setBoard((prevBoard) => {
                    const newBoard = [...prevBoard];
                    const newRolled = [...rolledDices];
                    for (let i = 0; i < NBR_OF_DICES; i++) {
                        if (!selectedDices[i]) {
                            const rnd = Math.floor(Math.random() * 6) + 1;
                            newBoard[i] = rnd;
                            newRolled[i] = rnd;
                        }
                    }
                    setRolledDices(newRolled);
                    checkAndUnlockYatzy(newRolled);
                    return newBoard;
                });
                setNbrOfThrowsLeft((n) => n - 1);
                setIsRolling(false);
            }, 500);
        } else {
            setStatus('No throws left');
            setNbrOfThrowsLeft(NBR_OF_THROWS);
        }
    }, [nbrOfThrowsLeft, selectedDices, rolledDices, checkAndUnlockYatzy, playSfx]);

    const handleStartGame = useCallback(() => {
        if (tokens > 0) {
            setLayerVisible(false);
            setStatus('Throw the dices');
            setTokens((prev) => prev - 1);
        } else {
            setEnergyModalVisible(true);
        }
    }, [tokens, setTokens, setEnergyModalVisible]);

    //
    const canSelectNow = nbrOfThrowsLeft < NBR_OF_THROWS;
    const rollingGlobal = isRolling;
    // Prebuild dice row (stable handlers per index)
    const onSelectHandlers = useMemo(() => Array.from({ length: NBR_OF_DICES }, (_, i) => () => selectDice(i)), [selectDice]);
    const diceRow = useMemo(() => (
        Array.from({ length: NBR_OF_DICES }, (_, i) => (
            <DiceAnimation
                key={i}
                diceName={dicefaces[board[i] - 1]?.display}
                isSelected={selectedDices[i]}
                onSelect={onSelectHandlers[i]}
                animationValue={diceAnimations[i]}
                color={getDiceColor(i)}
                isRolling={isRolling && !selectedDices[i]} // animaatiota varten
                canInteract={canSelectNow && !rollingGlobal} // UI-gating
            />
        ))
    ), [board, selectedDices, onSelectHandlers, diceAnimations, getDiceColor, isRolling, canSelectNow, rollingGlobal]);

    const renderFooter = useCallback(() => (
        <RenderDices
            status={status}
            setStatus={setStatus}
            rounds={rounds}
            nbrOfThrowsLeft={nbrOfThrowsLeft}
            setNbrOfThrowsLeft={setNbrOfThrowsLeft}
            resetGame={resetGame}
            savePlayerPoints={async () => {
                // Stop timer and save last game time TO DO!!
                if (timer) clearInterval(timer);
                setTimer(null);
                await savePlayerPoints();
                resetGame();
                navigation.navigate('Scoreboard', { tab: 'week', playerId });
            }}
            navigation={navigation}
            startGame={startGame}
            throwDices={throwDices}
            selectedField={selectedField}
            handleSetPoints={handleSetPoints}
            resetDiceSelection={resetDiceSelection}
            scoringCategories={scoringCategories}
            setRounds={setRounds}
            diceRow={diceRow}
        />
    ), [status, rounds, nbrOfThrowsLeft, resetGame, savePlayerPoints, navigation, playerId, startGame, throwDices, selectedField, handleSetPoints, resetDiceSelection, scoringCategories, setRounds, diceRow, setStatus, setNbrOfThrowsLeft, timer]);

    return (
        <ImageBackground source={require('../../assets/diceBackground.webp')} style={styles.background}>
            <Header />
            {isLayerVisible && (
                <Pressable
                    onPress={() => {
                        if (!gameStarted && rounds === MAX_SPOTS) handleStartGame();
                    }}
                    style={gameboardstyles.filterLayer}
                >
                    <GlowingText>START GAME</GlowingText>
                </Pressable>
            )}
            <View style={[styles.overlay, { alignSelf: 'stretch', width: '100%' }]}>
                <FlatList
                    data={data}
                    renderItem={({ index }) => (
                        <GridField
                            index={index}
                            scoringCategories={scoringCategories}
                            totalPoints={totalPoints}
                            minorPoints={minorPoints}
                            selectedField={selectedField}
                            setSelectedField={setSelectedField}
                            audioManager={audioApi}
                            setStatus={setStatus}
                            isSmallScreen={isSmallScreen}
                            gameboardstyles={gameboardstyles}
                            rolledDices={rolledDices}
                            BONUS_POINTS_LIMIT={BONUS_POINTS_LIMIT}
                            styles={styles}
                            nbrOfThrowsLeft={nbrOfThrowsLeft}
                            NBR_OF_THROWS={NBR_OF_THROWS}
                        />
                    )}
                    numColumns={4}
                    keyExtractor={(item) => item.key}
                    contentContainerStyle={gameboardstyles.gameboardContainer}
                    ListEmptyComponent={null}
                    ListHeaderComponent={RenderFirstRow}
                    ListFooterComponent={renderFooter}
                    ListFooterComponentStyle={gameboardstyles.gameboardContainer}
                    extraData={{ scoringCategories, totalPoints, minorPoints, selectedField, nbrOfThrowsLeft }}
                />
            </View>
            <ModalAlert visible={modalVisible} message={modalMessage} onClose={() => setModalVisible(false)} />
        </ImageBackground>
    );
}
