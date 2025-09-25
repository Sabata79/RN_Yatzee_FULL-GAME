
/**
 * GameContext – global state provider for the game and player session.
 * Provides realtime Firebase listeners, scoreboard helpers, and player/session state for the app.
 * Elapsed time is managed separately in ElapsedTimeContext.
 *
 * Props:
 *  - children: ReactNode
 *
 * Exposed API (selection):
 *  - gameStarted, gameEnded, startGame(), endGame()
 *  - totalPoints, setTotalPoints
 *  - isGameSaved, setIsGameSaved
 *  - tokens, setTokens, energyModalVisible, setEnergyModalVisible
 *  - playerId, setPlayerId, playerName, setPlayerName, isLinked, setIsLinked
 *  - avatarUrl, setAvatarUrl, scoreboardData
 *
 * @module GameContext
 * @author Sabata79
 * @since 2025-09-18
 */

import { createContext, useState, useContext, useEffect, useMemo, useRef, useCallback } from 'react';
import { dbOnValue, dbOff, dbSet } from '../services/Firebase';
import { MAX_TOKENS } from './Game';

const GameContext = createContext();
export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [playerId, setPlayerId] = useState('');
  const [scoreboardData, setScoreboardData] = useState([]);
  const [scoreboardMonthly, setScoreboardMonthly] = useState([]);
  const [scoreboardWeekly, setScoreboardWeekly] = useState([]);
  const [scoreboardIndices, setScoreboardIndices] = useState({ allTime: -1, monthly: -1, weekly: -1 });
  const [playerName, setPlayerName] = useState('');
  const [playerIdContext, setPlayerIdContext] = useState('');
  const [playerNameContext, setPlayerNameContext] = useState('');
  const [activePlayerId, setActivePlayerId] = useState('');
  const [playerScores, setPlayerScores] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isGameSaved, setIsGameSaved] = useState(false);
  const [viewingPlayerId, setViewingPlayerId] = useState('');
  const [viewingPlayerName, setViewingPlayerName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);
  const [userRecognized, setUserRecognized] = useState(false);

  // TOKENS
  const [tokens, setTokens] = useState(null);
  const hydratedRef = useRef(false); // true ensimmäisen Firebase-arvon jälkeen

  const [energyModalVisible, setEnergyModalVisible] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [playerLevel, setPlayerLevel] = useState('');
  const [gameVersion, setGameVersion] = useState('');
  const [progressPoints, setProgressPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState('');
  const [nextLevel, setNextLevel] = useState('');
  const [allTimeRank, setAllTimeRank] = useState('--');

  const [nextTokenTime, setNextTokenTime] = useState(null); // seuraavan tokenin aikaleima (Date tai ISO-string)
  const [timeToNextToken, setTimeToNextToken] = useState(''); // countdown-string, esim. "1 h 23 min 10 s"

  const isBetterScore = (newScore, oldScore) => {
    if (Number(newScore.points) > Number(oldScore.points)) return true;
    if (Number(newScore.points) < Number(oldScore.points)) return false;
    if (Number(newScore.duration) < Number(oldScore.duration)) return true;
    if (Number(newScore.duration) > Number(oldScore.duration)) return false;
    const dateA = new Date(newScore.date.split('.').reverse().join('-'));
    const dateB = new Date(oldScore.date.split('.').reverse().join('-'));
    return dateA < dateB;
  };

  // ISO week helper (same logic as used in Scoreboard screen)
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // ----- All Time Rank listener -----
  useEffect(() => {
    if (!playerId) return;
    const path = 'players';

    const handleValue = (snapshot) => {
      if (!snapshot.exists()) {
        setAllTimeRank('--');
        return;
      }
      const playersData = snapshot.val();
      const tmpScores = [];

      Object.keys(playersData).forEach((pId) => {
        const player = playersData[pId];
        if (player?.scores) {
          let bestScore = null;
          Object.values(player.scores).forEach((score) => {
            if (!bestScore || isBetterScore(score, bestScore)) bestScore = score;
          });
          if (bestScore) tmpScores.push({ playerId: pId, ...bestScore });
        }
      });

      tmpScores.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (a.duration !== b.duration) return a.duration - b.duration;
        const dateA = new Date(a.date.split('.').reverse().join('-'));
        const dateB = new Date(b.date.split('.').reverse().join('-'));
        return dateA - dateB;
      });

      const rankIndex = tmpScores.findIndex((s) => s.playerId === playerId);
      setAllTimeRank(rankIndex === -1 ? '--' : rankIndex + 1);
    };

    dbOnValue(path, handleValue);
    return () => dbOff(path, handleValue);
  }, [playerId]);

  // ----- Scoreboard listener -----
  useEffect(() => {
    const handle = (snapshot) => {
      const playersData = snapshot.val();
      const tmpAll = [];
      const tmpMon = [];
      const tmpWeek = [];
      if (playersData) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const currentWeek = getWeekNumber(now);

        Object.keys(playersData).forEach((pid) => {
          const player = playersData[pid];
          if (player?.scores) {
            const list = Object.values(player.scores);
            if (list.length > 0) {
              let bestAll = null;
              let bestMon = null;
              let bestWeek = null;

              list.forEach((score) => {
                const parts = (score.date || '').split('.');
                const d = parts.length === 3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) : new Date(score.date);

                // all-time best
                if (
                  !bestAll ||
                  score.points > bestAll.points ||
                  (score.points === bestAll.points && score.duration < bestAll.duration) ||
                  (score.points === bestAll.points && score.duration === bestAll.duration && new Date(score.date) < new Date(bestAll.date))
                ) {
                  bestAll = score;
                }

                // monthly best (same month/year)
                if (!isNaN(d) && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                  if (!bestMon || isBetterScore(score, bestMon)) bestMon = score;
                }

                // weekly best (ISO week match)
                if (!isNaN(d) && getWeekNumber(d) === currentWeek) {
                  if (!bestWeek || isBetterScore(score, bestWeek)) bestWeek = score;
                }
              });

              if (bestAll) tmpAll.push({ ...bestAll, name: player.name, playerId: pid, avatar: player.avatar || null, scores: list });
              if (bestMon) tmpMon.push({ ...bestMon, name: player.name, playerId: pid, avatar: player.avatar || null, scores: list });
              if (bestWeek) tmpWeek.push({ ...bestWeek, name: player.name, playerId: pid, avatar: player.avatar || null, scores: list });
            }
          }
        });

        const compare = (a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.duration !== b.duration) return a.duration - b.duration;
          return new Date(a.date.split('.').reverse().join('-')) - new Date(b.date.split('.').reverse().join('-'));
        };

        tmpAll.sort(compare);
        tmpMon.sort(compare);
        tmpWeek.sort(compare);

  setScoreboardData(tmpAll);
  setScoreboardMonthly(tmpMon);
  setScoreboardWeekly(tmpWeek);

  // compute indices for current playerId
  const idxAll = tmpAll.findIndex((s) => s.playerId === playerId);
  const idxMon = tmpMon.findIndex((s) => s.playerId === playerId);
  const idxWeek = tmpWeek.findIndex((s) => s.playerId === playerId);
  setScoreboardIndices({ allTime: idxAll, monthly: idxMon, weekly: idxWeek });
      } else {
        setScoreboardData([]);
        setScoreboardMonthly([]);
        setScoreboardWeekly([]);
        setScoreboardIndices({ allTime: -1, monthly: -1, weekly: -1 });
      }
    };

    const unsubscribe = dbOnValue('players', handle);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // ----- Player level listener -----
  useEffect(() => {
    if (!playerId) return;
    const path = `players/${playerId}/level`;
    const handleValue = (snapshot) => {
      if (snapshot.exists()) setPlayerLevel(snapshot.val());
    };
    dbOnValue(path, handleValue);
    return () => dbOff(path, handleValue);
  }, [playerId]);

  // ----- Avatar listener -----
  useEffect(() => {
    if (!playerId) return;
    const path = `players/${playerId}/avatar`;
    const handleValue = (snapshot) => {
      const avatarPath = snapshot.val();
      setAvatarUrl(avatarPath || null);
      setIsAvatarLoaded(true);
    };
    dbOnValue(path, handleValue);
    return () => dbOff(path, handleValue);
  }, [playerId]);

  // ===== TOKENS: Realtime listener =====
  useEffect(() => {
    if (!playerId) return;

    const path = `players/${playerId}/tokens`;
    const handleTokens = (snapshot) => {
      const raw = snapshot.val();
      const n = Number.isFinite(raw) ? raw : 0;
      const clamped = Math.max(0, Math.min(MAX_TOKENS, Math.trunc(n)));
      setTokens(clamped);
      hydratedRef.current = true;
    };

    const unsubscribe = dbOnValue(path, handleTokens);
    return () => {
      hydratedRef.current = false;
      if (typeof unsubscribe === 'function') unsubscribe();
      else dbOff(path, handleTokens);
    };
  }, [playerId]);

  // Write-through on local changes (after hydration)
  useEffect(() => {
    if (!playerId) return;
    if (!hydratedRef.current) return; // älä kirjoita ennen ensimmäistä serveriarvoa
    if (tokens == null) return;

    const clamped = Math.max(0, Math.min(MAX_TOKENS, Math.trunc(tokens)));
    dbSet(`players/${playerId}/tokens`, clamped).catch(() => { });
  }, [playerId, tokens]);

  // ----- Level helpers -----
  const getCurrentLevel = (points) => {
    if (points <= 400) return 'Beginner';
    if (points <= 800) return 'Basic';
    if (points <= 1200) return 'Advanced';
    if (points <= 2000) return 'Elite';
    return 'Legendary';
  };

  const getNextLevel = (lvl) => {
    const order = ['Beginner', 'Basic', 'Advanced', 'Elite', 'Legendary'];
    const nextIndex = order.indexOf(lvl) + 1;
    return nextIndex < order.length ? order[nextIndex] : 'Legendary';
  };

  const updateProgressPoints = (newPoints) => {
    setProgressPoints(newPoints);
    const curr = getCurrentLevel(newPoints);
    setCurrentLevel(curr);
    setNextLevel(getNextLevel(curr));
  };

  const setActivePlayer = useCallback((id, name) => {
    setActivePlayerId(id);
    setPlayerName(name);
  }, []);

  const startGameCb = useCallback(() => {
    setGameStarted(true);
    setGameEnded(false);
  }, []);

  const endGameCb = useCallback(() => {
    setGameEnded(true);
    setGameStarted(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      // identity
      playerLevel,
      setPlayerLevel,
      playerId,
      setPlayerId,
      playerName,
      setPlayerName,
      playerIdContext,
      setPlayerIdContext,
      playerNameContext,
      setPlayerNameContext,
      activePlayerId,
      setActivePlayer,

      // scores & game flow
      playerScores,
      setPlayerScores,
      gameStarted,
      gameEnded,
      startGame: startGameCb,
      endGame: endGameCb,
      totalPoints,
      setTotalPoints,
      isGameSaved,
      setIsGameSaved,
      saveGame: () => setIsGameSaved(true),

      // UI state
      userRecognized,
      setUserRecognized,
      viewingPlayerId,
      viewingPlayerName,
      setViewingPlayerId,
      setViewingPlayerName,
      resetViewingPlayer: () => {
        setViewingPlayerId(null);
        setViewingPlayerName(null);
      },

  // tokens
  nextTokenTime,
  setNextTokenTime,
  timeToNextToken,
  setTimeToNextToken,
  tokens,
  setTokens,
  energyModalVisible,
  setEnergyModalVisible,

      // misc
      isLinked,
      setIsLinked,
      gameVersion,
      setGameVersion,
      progressPoints,
      setProgressPoints: updateProgressPoints,
      currentLevel,
      nextLevel,
      allTimeRank,
      avatarUrl,
      setAvatarUrl,
      isAvatarLoaded,

      // scoreboard
  scoreboardData,
  setScoreboardData,
  scoreboardMonthly,
  setScoreboardMonthly,
  scoreboardWeekly,
  setScoreboardWeekly,
  scoreboardIndices,
  setScoreboardIndices,
    }),
    [
      playerLevel,
      playerId,
      playerName,
      playerIdContext,
      playerNameContext,
      activePlayerId,
      playerScores,
      gameStarted,
      gameEnded,
      startGameCb,
      endGameCb,
      totalPoints,
      isGameSaved,
      userRecognized,
      viewingPlayerId,
      viewingPlayerName,
  nextTokenTime,
  timeToNextToken,
      tokens,
      energyModalVisible,
      isLinked,
      gameVersion,
      progressPoints,
      currentLevel,
      nextLevel,
      allTimeRank,
      avatarUrl,
      isAvatarLoaded,
      scoreboardData,
      scoreboardMonthly,
      scoreboardWeekly,
      scoreboardIndices,
    ]
  );

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};
