/**
 * Gameboard – main game screen for playing Yatzy.
 * Handles game logic, memoized handlers, and lightweight footer rendering.
 * Opens ScoreModal and stops the game when rounds === 0. Resets game safely with resetGame().
 *
 * Props:
 *  - navigation: object (React Navigation)
 *  - route: object (React Navigation)
 *
 * @module Gameboard
 * @author Sabata79
 * @since 2025-09-16 (cleaned 2025-09-18)
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FlatList, Text, View, Pressable, ImageBackground, Animated, Dimensions } from 'react-native';
import styles from '../styles/styles';
import gameboardstyles from '../styles/GameboardScreenStyles';
import { NBR_OF_THROWS, NBR_OF_DICES, MAX_SPOTS, BONUS_POINTS, BONUS_POINTS_LIMIT } from '../constants/Game';
import DiceAnimation from '../components/DiceAnimation';
import { useAudio } from '../services/AudioManager';
import { useGame } from '../constants/GameContext';
import { useElapsedTime } from '../constants/ElapsedTimeContext';
import RenderFirstRow from '../components/RenderFirstRow';
import Header from './Header';
import GlowingText from '../components/AnimatedText';
import { useGameSave } from '../constants/GameSave';
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
import ScoreModal from '../components/modals/ScoreModal';
import EnergyModal from '../components/modals/EnergyModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoints, makeSizes } from '../utils/breakpoints';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 720;

// TIME BONUS
const FAST_THRESHOLD = 150; // < 2:30 → +10
const SLOW_THRESHOLD = 300; // > 5:00 → -10
const FAST_BONUS = 10;
const SLOW_BONUS = -10;

// Renders the dice row and action buttons in the footer.
const RenderDices = React.memo(function RenderDices({
  rounds,
  nbrOfThrowsLeft,
  diceRow,
  totalPoints,
  onRollPress,
  canSetPoints,
  onSetPointsPress,
  diceRowMinH,
}) {
  return (
    <View style={gameboardstyles.footerWrap}>
      <Text style={gameboardstyles.scoreText}>Total: {totalPoints}</Text>
        <View style={[gameboardstyles.diceBorder, { minHeight: diceRowMinH }]}>
          <View style={[gameboardstyles.gameboardContainer, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
            {diceRow}
          </View>
        </View>
      <GameboardButtons
        rounds={rounds}
        nbrOfThrowsLeft={nbrOfThrowsLeft}
        onRollPress={onRollPress}
        canSetPoints={canSetPoints}
        onSetPointsPress={onSetPointsPress}
      />
    </View>
  );
});

export default function Gameboard({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { savePlayerPoints } = useGameSave();
  const { elapsedTime } = useElapsedTime();
  const { playSfx, playSelect, playDeselect, playDiceTouch } = useAudio();

  const bp = useBreakpoints();
  const SZ = makeSizes(bp);

 const tileSize =
  bp.isTablet
    ? Math.round(SZ.FACE * 0.72)   // tabletit: pienempi noppa
    : bp.isWidePhone
    ? Math.round(SZ.FACE * 1.4)   // leveät puhelimet (Pixel 7, S22)
    : Math.round(SZ.FACE * 1.4);  // peruspuhelimet

  const diceRowMinH = Math.round(tileSize * 1.20);

  const audioApi = useMemo(
    () => ({ playSfx, playSelect, playDeselect, playDiceTouch }),
    [playSfx, playSelect, playDeselect, playDiceTouch]
  );

  const [selectedField, setSelectedField] = useState(null);
  const [board, setBoard] = useState(Array(NBR_OF_DICES).fill(1));

  const {
    playerId,
    setPlayerId,
    gameStarted,
    gameEnded,
    startGame,
    endGame,
    totalPoints,
    setTotalPoints,
    tokens,
    setTokens,
    energyModalVisible,
    setEnergyModalVisible,
    timeToNextToken,
    setIsGameSaved,
  } = useGame();

  const [scoreOpen, setScoreOpen] = useState(false);
  const [isLayerVisible, setLayerVisible] = useState(true);

  // Game state
  const [nbrOfThrowsLeft, setNbrOfThrowsLeft] = useState(NBR_OF_THROWS);
  const [selectedDices, setSelectedDices] = useState(new Array(NBR_OF_DICES).fill(false));
  const resetDiceSelection = useCallback(() => setSelectedDices(new Array(NBR_OF_DICES).fill(false)), []);
  const [rounds, setRounds] = useState(MAX_SPOTS);
  const [rolledDices, setRolledDices] = useState(new Array(NBR_OF_DICES).fill(0));

  // Start the game (decreases a token; overlay does not start the game)
  const beginGame = useCallback(() => {
    if (gameStarted) return true;
    if ((tokens ?? 0) > 0) {
      setTokens(prev => Math.max(0, (prev ?? 0) - 1));
      startGame();
      return true;
    }
    // Do not open modal here; modal opens only from START GAME overlay
    return false;
  }, [gameStarted, tokens, setTokens, startGame]);

  // When rounds reach 0, end the game and open the score modal
  useEffect(() => {
    if (rounds === 0 && !gameEnded) {
      endGame();
      setScoreOpen(true);
    }
  }, [rounds, gameEnded, endGame]);

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
    setLayerVisible(rounds === MAX_SPOTS);
  }, [rounds]);

  useEffect(() => {
    if (route?.params?.playerId) setPlayerId(route.params.playerId);
  }, [route?.params?.playerId, setPlayerId]);

  const resetGame = useCallback(() => {
    setIsGameSaved(true); // Notify RenderFirstRow to reset stopwatch
    setScoringCategories((prev) =>
      prev.map((category) => ({
        ...category,
        points: 0,
        locked: false,
        yatzyAchieved: false,
      }))
    );
    setRounds(MAX_SPOTS);
    setNbrOfThrowsLeft(NBR_OF_THROWS);
    resetDiceSelection();
    setTotalPoints(0);
    setMinorPoints(0);
    setHasAppliedBonus(false);
    setBoard(Array(NBR_OF_DICES).fill(1));
    setRolledDices(new Array(NBR_OF_DICES).fill(0));
  }, [resetDiceSelection, setTotalPoints, setIsGameSaved]);

  // Grid data (stable)
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
        setScoringCategories((prev) =>
          prev.map((c) => (c.index === selectedField ? { ...c, points: newPoints, locked: true, yatzyAchieved: true } : c))
        );
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
  }, [selectedField, scoringCategories, rolledDices, hasAppliedBonus, minorPoints, totalPoints, setTotalPoints]);

  // Yatzy "reopen" check
  const checkAndUnlockYatzy = useCallback(
    (currRoll) => {
      const yatzyCategory = scoringCategories.find((c) => c.name === 'yatzy');
      if (!yatzyCategory) return;
      const ys = calculateYatzy(currRoll);
      if (ys === 50 && yatzyCategory.points > 0) {
        setScoringCategories((prev) =>
          prev.map((c) => (c.name === 'yatzy' ? { ...c, locked: false, yatzyAchieved: true } : c))
        );
      } else if (!yatzyCategory.locked && yatzyCategory.yatzyAchieved) {
        setScoringCategories((prev) => prev.map((c) => (c.name === 'yatzy' ? { ...c, locked: true } : c)));
      }
    },
    [scoringCategories]
  );

  const [diceAnimations] = useState(() => Array.from({ length: NBR_OF_DICES }, () => new Animated.Value(0)));
  const [isRolling, setIsRolling] = useState(false);

  const selectDice = useCallback(
    (i) => {
      if (nbrOfThrowsLeft >= NBR_OF_THROWS) return;
      setSelectedDices((prev) => {
        const next = [...prev];
        next[i] = !next[i];
        return next;
      });
      Promise.resolve(playDiceTouch?.()).catch(() => { });
    },
    [nbrOfThrowsLeft, playDiceTouch]
  );

  const getDiceColor = useCallback(
    (index) => {
      if (board.every((v, i, arr) => v === arr[0])) return 'red';
      return selectedDices[index] ? 'red' : 'white';
    },
    [board, selectedDices]
  );

  const throwDices = useCallback(() => {
    if (nbrOfThrowsLeft > 0) {
      setIsRolling(true);
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
      setNbrOfThrowsLeft(NBR_OF_THROWS);
    }
  }, [nbrOfThrowsLeft, selectedDices, rolledDices, checkAndUnlockYatzy, playSfx]);

  // First roll starts the game; overlay only hides
  const onRollPress = useCallback(() => {
    if (rounds <= 0) return;

    if (!gameStarted) {
      const ok = beginGame();
      if (!ok) return; // not enough tokens -> open energy modal
    }
    if (nbrOfThrowsLeft <= 0) return;
    throwDices();
  }, [rounds, gameStarted, beginGame, nbrOfThrowsLeft, throwDices]);

  // Set Points button logic (rounds, throws, selections)
  const onSetPointsPress = useCallback(() => {
    const sel = selectedField;
    if (sel == null) return;

    handleSetPoints();
    setNbrOfThrowsLeft(NBR_OF_THROWS);
    resetDiceSelection();

    const selectedCategory = scoringCategories.find((c) => c.index === sel);
    const shouldDecrease =
      !selectedCategory || selectedCategory.name !== 'yatzy' || selectedCategory.points === 0;

    if (shouldDecrease) setRounds((prev) => Math.max(prev - 1, 0));
  }, [selectedField, handleSetPoints, scoringCategories, resetDiceSelection]);

  const canSelectNow = nbrOfThrowsLeft < NBR_OF_THROWS;
  const rollingGlobal = isRolling;

  const onSelectHandlers = useMemo(
    () => Array.from({ length: NBR_OF_DICES }, (_, i) => () => selectDice(i)),
    [selectDice]
  );

  const { width, height } = Dimensions.get('window');
  const isTablet = Math.min(width, height) >= 600;
  const diceRow = useMemo(
    () =>
      Array.from({ length: NBR_OF_DICES }, (_, i) => (
        <DiceAnimation
          key={i}
          diceName={dicefaces[board[i] - 1]?.display}
          isSelected={selectedDices[i]}
          onSelect={onSelectHandlers[i]}
          animationValue={diceAnimations[i]}
          color={getDiceColor(i)}
          isRolling={isRolling && !selectedDices[i]}
          canInteract={canSelectNow && !rollingGlobal}
          tileSize={tileSize}       // ← uusi
          columns={5}
          hPadding={bp.isTablet ? 80 : 65}
        />
      )),
    [board, selectedDices, onSelectHandlers, diceAnimations, getDiceColor, isRolling, canSelectNow, rollingGlobal, tileSize, bp.isTablet]
  );

  // ScoreModal -> save score and reset game if successful
  const handleSaveScoreFromModal = useCallback(
    async ({ total, elapsedSecs }) => {
      const ok = await savePlayerPoints({ totalPoints: total, duration: elapsedSecs });
      if (ok) {
        resetGame();
        navigation.navigate('Scoreboard', { tab: 'week', playerId });
      }
      return ok;
    },
    [savePlayerPoints, resetGame, navigation, playerId]
  );

  const renderFooter = useCallback(
    () => (
      <RenderDices
        rounds={rounds}
        nbrOfThrowsLeft={nbrOfThrowsLeft}
        diceRow={diceRow}
        totalPoints={totalPoints}
        onRollPress={onRollPress}
        canSetPoints={Boolean(selectedField)}
        onSetPointsPress={onSetPointsPress}
        diceRowMinH={diceRowMinH}
      />
    ),
    [
      rounds,
      nbrOfThrowsLeft,
      diceRow,
      totalPoints,
      onRollPress,
      selectedField,
      onSetPointsPress,
    ]
  );

  return (
    <ImageBackground source={require('../../assets/diceBackground.webp')} style={styles.background}>
      <Header />


      {isLayerVisible && !gameStarted && (
        <>
          <Pressable
            onPress={() => {
              if ((tokens ?? 0) === 0) {
                setEnergyModalVisible(true);
              } else {
                setLayerVisible(false);
              }
            }}
            pointerEvents="auto"
            style={gameboardstyles.filterLayer}
          >
            <GlowingText>START GAME</GlowingText>
          </Pressable>
          <EnergyModal
            visible={energyModalVisible}
            onClose={() => setEnergyModalVisible(false)}
            tokens={tokens}
            maxTokens={10}
            timeToNextToken={timeToNextToken}
          />
        </>
      )}

      <View style={gameboardstyles.centerHost}>
        <FlatList
          style={gameboardstyles.list}
          contentContainerStyle={gameboardstyles.listContent}
          columnWrapperStyle={gameboardstyles.columnWrap}
          data={data}
          numColumns={4}
          renderItem={({ index }) => (
            <GridField
              index={index}
              scoringCategories={scoringCategories}
              totalPoints={totalPoints}
              minorPoints={minorPoints}
              selectedField={selectedField}
              setSelectedField={setSelectedField}
              audioManager={audioApi}
              isSmallScreen={isSmallScreen}
              gameboardstyles={gameboardstyles}
              rolledDices={rolledDices}
              BONUS_POINTS_LIMIT={BONUS_POINTS_LIMIT}
              styles={styles}
              nbrOfThrowsLeft={nbrOfThrowsLeft}
              NBR_OF_THROWS={NBR_OF_THROWS}
            />
          )}
          keyExtractor={(item) => item.key}
          ListHeaderComponent={<RenderFirstRow rounds={rounds} />}
          ListFooterComponent={renderFooter}
          ListHeaderComponentStyle={{ marginBottom: 6 }}
          ListFooterComponentStyle={{ marginTop: 6 }}
          extraData={{ scoringCategories, totalPoints, minorPoints, selectedField, nbrOfThrowsLeft, rounds }}
        />
      </View>

      <ScoreModal
        visible={scoreOpen}
        onClose={() => setScoreOpen(false)}
        onCancel={() => { setScoreOpen(false); resetGame(); }}
        onSave={handleSaveScoreFromModal}
        points={totalPoints - (hasAppliedBonus ? BONUS_POINTS : 0)}
        minorPoints={minorPoints}
        sectionBonus={hasAppliedBonus ? BONUS_POINTS : 0}
        elapsedSecs={elapsedTime}
        fastThreshold={FAST_THRESHOLD}
        slowThreshold={SLOW_THRESHOLD}
        fastBonus={FAST_BONUS}
        slowBonus={SLOW_BONUS}
        bottomInset={insets.bottom}
        bottomOffset={75}
        dark
      />
    </ImageBackground>
  );
}
