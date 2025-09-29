
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
 * @updated 2025-09-25
 */

import { createContext, useState, useContext, useEffect, useMemo, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { dbOnValue, dbOff, dbSet, dbRef, dbGet } from '../services/Firebase';
import { isBetterScore } from '../utils/scoreUtils';
import { MAX_TOKENS } from './Game';
import { onDisconnect } from '@react-native-firebase/database';
import Constants from 'expo-constants';

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
  const levelSyncTimerRef = useRef(null);
  const levelSyncPendingRef = useRef(null);

  const [energyModalVisible, setEnergyModalVisible] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [playerLevel, setPlayerLevel] = useState('');
  const [gameVersion, setGameVersion] = useState('');
  const [gameVersionCode, setGameVersionCode] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
  const [nextLevel, setNextLevel] = useState('');
  const [allTimeRank, setAllTimeRank] = useState('--');

  const [nextTokenTime, setNextTokenTime] = useState(null); // seuraavan tokenin aikaleima (Date tai ISO-string)
  const [timeToNextToken, setTimeToNextToken] = useState(''); // countdown-string, esim. "1 h 23 min 10 s"

  // isBetterScore imported from shared util

  // ISO week helper (same logic as used in Scoreboard screen)
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Helper: format timestamp to dd.mm.yyyy / hh.mm.ss (24h)
  const formatLastSeen = (ts) => {
    try {
      const d = new Date(Number(ts) || Date.now());
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const sec = String(d.getSeconds()).padStart(2, '0');
      return `${dd}.${mm}.${yyyy} / ${hh}.${min}.${sec}`;
    } catch (e) {
      return '';
    }
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
          // Merge aggregates and raw scores: prefer aggregates when they are current
          // but always compare against any raw scores (legacy clients may write only scores)
          const at = player?.allTimeBest || null;
          const monMap = player?.monthlyBest || null;
          const weekMap = player?.weeklyBest || null;

          const scoresList = player?.scores ? Object.values(player.scores) : [];

          // Helper to pick the better of two score-like objects
          const pickBetter = (a, b) => {
            if (!a) return b;
            if (!b) return a;
            return isBetterScore(a, b) ? a : b;
          };

          // Compute best candidates from raw scores
          let bestAllFromScores = null;
          let bestMonFromScores = null;
          let bestWeekFromScores = null;
          if (scoresList.length > 0) {
            scoresList.forEach((score) => {
              const parts = (score.date || '').split('.');
              const d = parts.length === 3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) : new Date(score.date);

              // all-time
              if (!bestAllFromScores || isBetterScore(score, bestAllFromScores)) bestAllFromScores = score;

              // monthly
              if (!isNaN(d) && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                if (!bestMonFromScores || isBetterScore(score, bestMonFromScores)) bestMonFromScores = score;
              }

              // weekly
              if (!isNaN(d) && getWeekNumber(d) === currentWeek) {
                if (!bestWeekFromScores || isBetterScore(score, bestWeekFromScores)) bestWeekFromScores = score;
              }
            });
          }

          // Aggregate candidates
          const aggAll = at && at.points != null ? at : null;
          const aggMon = monMap && typeof monMap === 'object' && monMap[currentYear] ? monMap[currentYear][String(currentMonth + 1)] : null;
          const weekKey = `${currentYear}-${currentWeek}`;
          const aggWeek = weekMap && typeof weekMap === 'object' ? weekMap[weekKey] : null;

          // Choose final best by comparing aggregate vs raw-derived best
          const finalAll = pickBetter(aggAll, bestAllFromScores);
          const finalMon = pickBetter(aggMon, bestMonFromScores);
          const finalWeek = pickBetter(aggWeek, bestWeekFromScores);

          if (finalAll && finalAll.points != null) tmpAll.push({ ...finalAll, name: player.name, playerId: pid, avatar: player.avatar || null });
          if (finalMon && finalMon.points != null) tmpMon.push({ ...finalMon, name: player.name, playerId: pid, avatar: player.avatar || null });
          if (finalWeek && finalWeek.points != null) tmpWeek.push({ ...finalWeek, name: player.name, playerId: pid, avatar: player.avatar || null });
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
      if (snapshot.exists()) {
        try {
          const val = snapshot.val();
          setPlayerLevel(String(val || '').toLowerCase());
        } catch (e) {
          setPlayerLevel('');
        }
      } else {
        setPlayerLevel('');
      }
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

  // ----- Presence lifecycle (embedded under players/{playerId}/presence) -----
  // We only set presence for a player once they are recognized (userRecognized === true).
  // Uses AppState to set offline when app goes to background/inactive and re-set online on active.
  useEffect(() => {
    if (!playerId) return;

    let cleanupFn = null;
    let mounted = true;

    const path = `players/${playerId}/presence`;

    const setOnlineAndRegisterDisconnect = async () => {
      try {
        const ts = Date.now();
    // include gameVersion so presence records which client version is active
    // fallback to Expo constants if GameContext's values aren't set yet
  // Broaden fallback sources for version and versionCode to handle different Expo/managed/bare setups
  const fallbackGameVersion = String(
    gameVersion ||
      Constants.expoConfig?.version ||
      Constants.manifest?.version ||
      Constants.nativeAppVersion ||
      ''
  );

  const fallbackVersionCode = String(
    gameVersionCode ||
      (Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.ios?.buildNumber) ||
      Constants.manifest?.android?.versionCode ||
      Constants.manifest?.ios?.buildNumber ||
      Constants.nativeBuildVersion ||
      ''
  );
  const payload = { online: true, lastSeen: ts, lastSeenHuman: formatLastSeen(ts), gameVersion: fallbackGameVersion, versionCode: fallbackVersionCode };
        await dbSet(path, payload);

        // try to register onDisconnect on the same embedded path
        try {
          const ref = dbRef(path);
          const od = onDisconnect(ref);
          if (od && typeof od.set === 'function') {
            const offTs = Date.now();
            od.set({ online: false, lastSeen: offTs, lastSeenHuman: formatLastSeen(offTs), gameVersion: fallbackGameVersion, versionCode: fallbackVersionCode });
          }
          cleanupFn = async () => {
            try {
              if (od && typeof od.cancel === 'function') await od.cancel();
            } catch (e) {}
            try {
              const offTs2 = Date.now();
              await dbSet(path, { online: false, lastSeen: offTs2, lastSeenHuman: formatLastSeen(offTs2), versionCode: fallbackVersionCode });
            } catch (e) {}
          };
        } catch (e) {
          // fallback: provide cleanup that writes offline
          cleanupFn = async () => {
            const offTs3 = Date.now();
            return dbSet(path, { online: false, lastSeen: offTs3, lastSeenHuman: formatLastSeen(offTs3) });
          };
        }
      } catch (e) {
        console.warn('Presence: failed to set online for', playerId, e);
      }
    };

    // Only enable presence when the player is recognized (has a name / is linked)
    if (userRecognized) {
      setOnlineAndRegisterDisconnect();
    }

    const handleAppState = async (nextState) => {
      if (!userRecognized) return;
      if (nextState === 'background' || nextState === 'inactive') {
        // go offline immediately
        if (cleanupFn) {
          try {
            await cleanupFn();
          } catch (e) {}
          cleanupFn = null;
        }
      } else if (nextState === 'active') {
        // ensure online again
        if (!cleanupFn) await setOnlineAndRegisterDisconnect();
      }
    };

    const sub = AppState.addEventListener ? AppState.addEventListener('change', handleAppState) : null;

    return () => {
      mounted = false;
      try { sub?.remove?.(); } catch (e) {}
      if (cleanupFn) {
        try { cleanupFn().catch(() => {}); } catch (e) {}
        cleanupFn = null;
      }
    };
  }, [playerId, userRecognized]);

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

  // ----- Sync level from playedGames (debounced) -----
  // Listen to playedGames and ensure `players/{playerId}/level` reflects
  // the thresholds used by GameSave. Debounce writes briefly to avoid churn
  // if multiple updates arrive in quick succession (e.g. backfill + saves).
  useEffect(() => {
    if (!playerId) return;

    const path = `players/${playerId}/playedGames`;

    const computeLevel = (gamesCount) => {
      let lvl = 'beginner';
      if (gamesCount >= 2000) lvl = 'legendary';
      else if (gamesCount >= 1201) lvl = 'elite';
      else if (gamesCount >= 801) lvl = 'advanced';
      else if (gamesCount >= 401) lvl = 'basic';
      return lvl;
    };

    const scheduleSync = (newLevel) => {
      // mark pending and replace any existing timer
      levelSyncPendingRef.current = newLevel;
      if (levelSyncTimerRef.current) clearTimeout(levelSyncTimerRef.current);
      // short debounce (500ms) to coalesce rapid updates
      levelSyncTimerRef.current = setTimeout(async () => {
        const pending = levelSyncPendingRef.current;
        levelSyncPendingRef.current = null;
        levelSyncTimerRef.current = null;
        try {
          // read existing (best-effort)
          const levelSnap = await dbGet(`players/${playerId}/level`);
          const existing = levelSnap && typeof levelSnap.val === 'function' ? levelSnap.val() : levelSnap;
          if (existing !== pending) {
            await dbSet(`players/${playerId}/level`, pending);
          }
        } catch (e) {
          console.warn('[GameContext] Debounced level sync failed for', playerId, e);
        }
      }, 500);
    };

    const handlePlayed = (snapshot) => {
      try {
        const raw = snapshot.exists() ? snapshot.val() : 0;
        const games = Number(raw || 0);
        const newLevel = String(computeLevel(games)).toLowerCase();
        scheduleSync(newLevel);
      } catch (e) {
        console.warn('[GameContext] playedGames handler failed', e);
      }
    };

    dbOnValue(path, handlePlayed);
    return () => {
      dbOff(path, handlePlayed);
      if (levelSyncTimerRef.current) {
        clearTimeout(levelSyncTimerRef.current);
        levelSyncTimerRef.current = null;
      }
      levelSyncPendingRef.current = null;
    };
  }, [playerId]);

  // Level computation is derived from playedGames elsewhere; helper removed.

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
    // progressPoints removed - derived from playedGames
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
