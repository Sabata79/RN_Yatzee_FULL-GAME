/**
 * Gameboard – Main game screen for playing Yatzy.
 * Streamlined: stable callbacks, memoized footer, minimal button props.
 *
 * @module screens/Gameboard
 * @since 2025-09-16 (perf pass 2025-09-18)
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FlatList, Text, View, Pressable, ImageBackground, Animated, Dimensions } from 'react-native';
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
import ScoreModal from '../components/modals/ScoreModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 720;

/** Footer with dice row + buttons (no heavy props) */
const RenderDices = React.memo(function RenderDices({
  rounds,
  nbrOfThrowsLeft,
  diceRow,
  totalPoints,
  canSetPoints,
  onRollPress,
  onSetPointsPress,
}) {
  return (
    <View style={gameboardstyles.footerWrap}>
      <Text style={gameboardstyles.scoreText}>Total: {totalPoints}</Text>
      <View style={gameboardstyles.diceBorder}>
        <View style={[gameboardstyles.gameboardContainer, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
          {diceRow}
        </View>
      </View>
      <GameboardButtons
        rounds={rounds}
        nbrOfThrowsLeft={nbrOfThrowsLeft}
        canSetPoints={canSetPoints}
        onRollPress={onRollPress}
        onSetPointsPress={onSetPointsPress}
      />
    </View>
  );
});

export default function Gameboard({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const gameContext = useGame();
  const { playSfx, playSelect, playDeselect, playDiceTouch } = useAudio();

  const audioApi = useMemo(
    () => ({ playSfx, playSelect, playDeselect, playDiceTouch }),
    [playSfx, playSelect, playDeselect, playDiceTouch]
  );

  const [selectedField, setSelectedField] = useState(null);
  const [board, setBoard] = useState(Array(NBR_OF_DICES).fill(1));

  const { playerId, setPlayerId } = gameContext;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [scoreOpen, setScoreOpen] = useState(false);

  const {
    gameStarted,
    gameEnded,
    startGame,
    endGame,
    totalPoints,
    setTotalPoints,
    tokens,
    setTokens,
    setEnergyModalVisible,
    elapsedTime,
    setElapsedTime,
    setIsGameSaved,
  } = gameContext;

  // Time bonus
  const FAST_THRESHOLD = 150;   // < 2:30 → +10
  const SLOW_THRESHOLD = 300;   // > 5:00 → -10
  const FAST_BONUS = 10;
  const SLOW_BONUS = -10;

  const timeBonus =
    elapsedTime > SLOW_THRESHOLD ? SLOW_BONUS :
    elapsedTime > FAST_THRESHOLD ? 0 : FAST_BONUS;

  const finalTotal = totalPoints + timeBonus;

  // Save prepared at top-level (no hooks in handlers)
  const { savePlayerPoints: saveFinalScore } = GameSave({
    totalPoints: finalTotal,
    durationOverride: elapsedTime,
  });

  const [isLayerVisible, setLayerVisible] = useState(true);

  // Game state
  const [nbrOfThrowsLeft, setNbrOfThrowsLeft] = useState(NBR_OF_THROWS);
  const [selectedDices, setSelectedDices] = useState(new Array(NBR_OF_DICES).fill(false));
  const resetDiceSelection = useCallback(() => setSelectedDices(new Array(NBR_OF_DICES).fill(false)), []);
  const [rounds, setRounds] = useState(MAX_SPOTS);
  const [rolledDices, setRolledDices] = useState(new Array(NBR_OF_DICES).fill(0));

  // End game when rounds hit 0
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
        case 'ones':           calculateScore = (r) => calculateDiceSum(r, 1); break;
        case 'twos':           calculateScore = (r) => calculateDiceSum(r, 2); break;
        case 'threes':         calculateScore = (r) => calculateDiceSum(r, 3); break;
        case 'fours':          calculateScore = (r) => calculateDiceSum(r, 4); break;
        case 'fives':          calculateScore = (r) => calculateDiceSum(r, 5); break;
        case 'sixes':          calculateScore = (r) => calculateDiceSum(r, 6); break;
        case 'twoOfKind':      calculateScore = (r) => calculateTwoOfKind(r); break;
        case 'threeOfAKind':   calculateScore = (r) => calculateThreeOfAKind(r); break;
        case 'fourOfAKind':    calculateScore = (r) => calculateFourOfAKind(r); break;
        case 'yatzy':          calculateScore = (r) => calculateYatzy(r); break;
        case 'fullHouse':      calculateScore = (r) => (calculateFullHouse(r) ? 25 : 0); break;
        case 'smallStraight':  calculateScore = (r) => calculateSmallStraight(r); break;
        case 'largeStraight':  calculateScore = (r) => calculateLargeStraight(r); break;
        case 'chance':         calculateScore = (r) => calculateChange(r); break;
        default:               calculateScore = null;
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
    setIsGameSaved(true);
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
    setElapsedTime(0);
  }, [resetDiceSelection, setTotalPoints, setElapsedTime, setIsGameSaved]);

  // Data source (stable)
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
      Promise.resolve(playDiceTouch?.()).catch(() => {});
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

  const handleStartGame = useCallback(() => {
    if (tokens > 0) {
      setLayerVisible(false);
      setTokens((prev) => prev - 1);
    } else {
      setEnergyModalVisible(true);
    }
  }, [tokens, setTokens, setEnergyModalVisible]);

  const canSelectNow = nbrOfThrowsLeft < NBR_OF_THROWS;
  const rollingGlobal = isRolling;

  const onSelectHandlers = useMemo(
    () => Array.from({ length: NBR_OF_DICES }, (_, i) => () => selectDice(i)),
    [selectDice]
  );

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
        />
      )),
    [board, selectedDices, onSelectHandlers, diceAnimations, getDiceColor, isRolling, canSelectNow, rollingGlobal]
  );

  // Stable button handlers (pass to GameboardButtons)
  const onRollPress = useCallback(() => {
    if (rounds === MAX_SPOTS && nbrOfThrowsLeft === NBR_OF_THROWS) startGame();
    if (nbrOfThrowsLeft <= 0) return;
    throwDices();
  }, [rounds, nbrOfThrowsLeft, startGame, throwDices]);

  const onSetPointsPress = useCallback(() => {
    handleSetPoints();
    setNbrOfThrowsLeft(NBR_OF_THROWS);
    resetDiceSelection();

    const selectedCategory = scoringCategories.find((c) => c.index === selectedField);
    const shouldDecrease = !selectedCategory || selectedCategory.name !== 'yatzy' || selectedCategory.points === 0;
    if (shouldDecrease) setRounds((prev) => Math.max(prev - 1, 0));
  }, [handleSetPoints, setNbrOfThrowsLeft, resetDiceSelection, scoringCategories, selectedField, setRounds]);

  // Footer element (not a function) to avoid recreations
  const footerEl = useMemo(() => (
    <RenderDices
      rounds={rounds}
      nbrOfThrowsLeft={nbrOfThrowsLeft}
      diceRow={diceRow}
      totalPoints={totalPoints}
      canSetPoints={!!selectedField}
      onRollPress={onRollPress}
      onSetPointsPress={onSetPointsPress}
    />
  ), [rounds, nbrOfThrowsLeft, diceRow, totalPoints, selectedField, onRollPress, onSetPointsPress]);

  // Memo extraData to avoid referential churn
  const listExtra = useMemo(
    () => ({ scoringCategories, totalPoints, minorPoints, selectedField, nbrOfThrowsLeft, rounds }),
    [scoringCategories, totalPoints, minorPoints, selectedField, nbrOfThrowsLeft, rounds]
  );

  // Save from modal
  const handleSaveScoreFromModal = useCallback(
    async () => {
      const ok = await saveFinalScore();
      if (ok) {
        resetGame();
        navigation.navigate('Scoreboard', { tab: 'week', playerId });
      }
      return ok;
    },
    [saveFinalScore, resetGame, navigation, playerId]
  );

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
          ListHeaderComponent={<RenderFirstRow rounds={rounds} />}
          ListFooterComponent={footerEl}
          extraData={listExtra}
        />
      </View>

      <ScoreModal
        visible={scoreOpen}
        onClose={() => setScoreOpen(false)}
        onCancel={() => { setScoreOpen(false); resetGame(); }}
        onSave={handleSaveScoreFromModal}
        points={totalPoints}
        elapsedSecs={elapsedTime}
        fastThreshold={FAST_THRESHOLD}
        slowThreshold={SLOW_THRESHOLD}
        fastBonus={FAST_BONUS}
        slowBonus={SLOW_BONUS}
        bottomInset={insets.bottom}
        bottomOffset={75}
        dark
      />

      <ModalAlert visible={modalVisible} message={modalMessage} onClose={() => setModalVisible(false)} />
    </ImageBackground>
  );
}
