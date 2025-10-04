
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
*
 * @module src/constants/GameContext
 * @author Sabata79
 * @since 2025-09-18
 * @updated 2025-10-04
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { dbOnValue, dbOff, dbUpdate, dbRunTransaction, dbSet, dbGet } from '../services/Firebase';
import { isBetterScore } from '../utils/scoreUtils';
import { MAX_TOKENS } from './Game';

// Regeneration constants (follow repo convention)
const REGEN_INTERVAL = 1.6 * 60 * 60 * 1000; // 1.6 hours
const EFFECTIVE_REGEN_INTERVAL = REGEN_INTERVAL;
const MAX_NEXT_TOKEN_FUTURE = 24 * 60 * 60 * 1000; // guard for obviously-future timestamps

const GameContext = createContext(null);

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  // Basic identity/state placeholders (keep fields commonly referenced elsewhere)
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  // App version info (exposed for LandingPage and remote config checks)
  const [gameVersion, setGameVersion] = useState(null);
  const [gameVersionCode, setGameVersionCode] = useState(null);
  // additional identity helpers used across screens
  const [playerIdContext, setPlayerIdContext] = useState(null);
  const [playerNameContext, setPlayerNameContext] = useState(null);
  const [userRecognized, setUserRecognized] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [playerLevel, setPlayerLevel] = useState(null);
  // player avatar url
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Tokens
  const [tokens, setTokens] = useState(0);
  const tokensRef = useRef(0);
  const [tokensStabilized, setTokensStabilized] = useState(false);

  // Game lifecycle & UI state expected by Gameboard and other screens
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isGameSaved, setIsGameSaved] = useState(true);
  const [startGameCb, setStartGameCb] = useState(null);
  const [endGameCb, setEndGameCb] = useState(null);

  const startGame = useCallback(() => {
    try {
      setGameStarted(true);
      setGameEnded(false);
      if (typeof startGameCb === 'function') {
        try { startGameCb(); } catch (e) {}
      }
    } catch (e) {}
  }, [startGameCb]);

  const endGame = useCallback(() => {
    try {
      setGameEnded(true);
      setGameStarted(false);
      if (typeof endGameCb === 'function') {
        try { endGameCb(); } catch (e) {}
      }
    } catch (e) {}
  }, [endGameCb]);

  const saveGame = useCallback(() => { setIsGameSaved(true); }, []);

  // UI bits
  const [energyModalVisible, setEnergyModalVisible] = useState(false);
  const [timeToNextToken, setTimeToNextToken] = useState('');

  const [nextTokenTime, setNextTokenTime] = useState(null);
  const nextTokenTimeRef = useRef(null);

  // bookkeeping refs
  const manualChangeRef = useRef(null);
  const serverOffsetRef = useRef(0);

  const markManualChange = useCallback(() => { manualChangeRef.current = Date.now(); }, []);

  // small helpers for legacy anchor handling
  const lastDecrementRef = useRef(null);
  const hydratedRef = useRef(false);

  // Scoreboard & viewing helpers
  const [scoreboardData, setScoreboardData] = useState([]);
  const [scoreboardMonthly, setScoreboardMonthly] = useState([]);
  const [scoreboardWeekly, setScoreboardWeekly] = useState([]);
  const [scoreboardIndices, setScoreboardIndices] = useState({ allTime: -1, monthly: -1, weekly: -1 });
  const [viewingPlayerId, setViewingPlayerId] = useState(null);
  const [viewingPlayerName, setViewingPlayerName] = useState(null);

  // ----- Scoreboard listener: compute all-time, monthly and weekly slices -----
  // Prefer per-player aggregates (allTimeBest/monthlyBest/weeklyBest) when
  // available. Fall back to scanning raw `scores` only for players that do
  // not provide aggregates (legacy data). This avoids missing recently
  // recorded aggregates when individual `scores` entries are not present.
  useEffect(() => {
    let unsub = null;
    const handle = (snapshot) => {
      try {
        const all = snapshot && typeof snapshot.val === 'function' ? snapshot.val() : snapshot || {};
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const getWeekNumber = (date) => {
          const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          const dayNum = d.getUTCDay() || 7;
          d.setUTCDate(d.getUTCDate() + 4 - dayNum);
          const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
          return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        };
        const currentWeek = getWeekNumber(now);

        const tmpAll = [];
        const tmpMon = [];
        const tmpWeek = [];

        const pickBetter = (a, b) => {
          if (!a && !b) return null;
          if (!a) return b;
          if (!b) return a;
          return isBetterScore(a, b) ? a : b;
        };

        const parseScoreDate = (raw) => {
          if (raw == null) return null;
          if (typeof raw === 'number') return new Date(raw);
          if (typeof raw === 'string') {
            const trimmed = raw.trim();
            // dd.mm.yyyy or d.m.yyyy
            const parts = trimmed.split(' ')[0].split('.');
            if (parts.length === 3 && parts[0].length <= 2) {
              const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
              const t = Date.parse(iso);
              if (!Number.isNaN(t)) return new Date(t);
            }
            // Try ISO / standard parse
            const t2 = Date.parse(trimmed);
            if (!Number.isNaN(t2)) return new Date(t2);
          }
          return null;
        };

        Object.entries(all || {}).forEach(([pid, pdata]) => {
          try {
            const scores = pdata && pdata.scores ? Object.values(pdata.scores) : [];
            // Best candidates from raw scores (legacy)
            const bestAllFromScores = scores.reduce((best, s) => (best == null || isBetterScore(s, best) ? s : best), null);
            const bestMonFromScores = scores.reduce((best, s) => {
              try {
                if (!s) return best;
                const d = parseScoreDate(s.date);
                if (!d) return best;
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                  return (best == null || isBetterScore(s, best)) ? s : best;
                }
              } catch (e) {}
              return best;
            }, null);
            const bestWeekFromScores = scores.reduce((best, s) => {
              try {
                if (!s) return best;
                const d = parseScoreDate(s.date);
                if (!d) return best;
                if (getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear) {
                  return (best == null || isBetterScore(s, best)) ? s : best;
                }
              } catch (e) {}
              return best;
            }, null);

            // Aggregate candidates (preferred if present)
            const aggAll = pdata?.allTimeBest || null;
            const monMap = pdata?.monthlyBest && pdata.monthlyBest[currentYear] ? pdata.monthlyBest[currentYear] : null;
            const aggMon = monMap ? monMap[String(currentMonth + 1)] : null;
            const weekKey = `${currentYear}-${String(currentWeek).padStart(2, '0')}`;
            const aggWeek = pdata?.weeklyBest && pdata.weeklyBest[weekKey] ? pdata.weeklyBest[weekKey] : null;

            const finalAll = pickBetter(aggAll, bestAllFromScores);
            const finalMon = pickBetter(aggMon, bestMonFromScores);
            const finalWeek = pickBetter(aggWeek, bestWeekFromScores);

            const commonMeta = { playerId: pid, name: pdata?.name || pdata?.displayName || pid, avatar: pdata?.avatar || null };
            if (finalAll) tmpAll.push({ ...commonMeta, ...finalAll });
            if (finalMon) tmpMon.push({ ...commonMeta, ...finalMon });
            if (finalWeek) tmpWeek.push({ ...commonMeta, ...finalWeek });
          } catch (e) {
            // per-player best-effort
          }
        });

        const compare = (a, b) => {
          if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
          if ((a.duration || 0) !== (b.duration || 0)) return (a.duration || 0) - (b.duration || 0);
          const at = typeof a.date === 'number' ? a.date : Date.parse(String(a.date) || '') || Date.now();
          const bt = typeof b.date === 'number' ? b.date : Date.parse(String(b.date) || '') || Date.now();
          return at - bt;
        };

        tmpAll.sort(compare);
        tmpMon.sort(compare);
        tmpWeek.sort(compare);

        setScoreboardData(tmpAll);
        setScoreboardMonthly(tmpMon);
        setScoreboardWeekly(tmpWeek);

        const idxAll = tmpAll.findIndex((s) => s.playerId === playerId);
        const idxMon = tmpMon.findIndex((s) => s.playerId === playerId);
        const idxWeek = tmpWeek.findIndex((s) => s.playerId === playerId);
        setScoreboardIndices({ allTime: idxAll, monthly: idxMon, weekly: idxWeek });
      } catch (e) {
        // ignore
      }
    };

    try {
      unsub = dbOnValue('players', handle);
    } catch (e) {
      // ignore
    }

    return () => {
      try { if (typeof unsub === 'function') unsub(); else dbOff('players', handle); } catch (e) { }
    };
  }, [playerId]);

  // keep local refs in sync with state
  useEffect(() => { tokensRef.current = tokens; }, [tokens]);
  useEffect(() => { nextTokenTimeRef.current = nextTokenTime; }, [nextTokenTime]);

  // Authoritative token computation that runs a transaction on players/{playerId}
  const computeAndApplyTokens = useCallback(async () => {
    if (!playerId) return;
    if (manualChangeRef.current && Date.now() - manualChangeRef.current < 2000) return;
    try {
      const now = Date.now() + (serverOffsetRef.current || 0);
      const playerPath = `players/${playerId}`;

      const tx = await dbRunTransaction(playerPath, (current) => {
        const p = current || {};
        const serverTokens = Number.isFinite(p.tokens) ? p.tokens : (Number.isFinite(tokensRef.current) ? tokensRef.current : 0);
  const anchorRaw = Number.isFinite(p.tokensLastAnchor) ? p.tokensLastAnchor : (Number.isFinite(p.lastTokenDecrement) ? p.lastTokenDecrement : (Number.isFinite(lastDecrementRef.current) ? lastDecrementRef.current : null));
        const anchor = Number.isFinite(anchorRaw) ? Number(anchorRaw) : null;

        let intervals = 0;
        if (anchor) {
          const elapsed = now - anchor;
          if (elapsed <= 0) return p;
          intervals = Math.floor(elapsed / EFFECTIVE_REGEN_INTERVAL);
        } else {
          const nextIso = p.nextTokenTime || (nextTokenTimeRef.current instanceof Date ? nextTokenTimeRef.current.toISOString() : null);
          if (nextIso) {
            const nt = new Date(nextIso).getTime();
            if (!isNaN(nt) && nt <= now) {
              const diff = now - nt;
              intervals = Math.floor(diff / EFFECTIVE_REGEN_INTERVAL) + 1;
            }
          }
        }

        if (intervals <= 0) return p;

        const newTokens = Math.min(serverTokens + intervals, MAX_TOKENS);
        const out = { ...p, tokens: newTokens };
        if (newTokens >= MAX_TOKENS) {
          out.tokensLastAnchor = null;
          out.nextTokenTime = null;
        } else {
          const base = anchor || now;
          out.tokensLastAnchor = base + intervals * EFFECTIVE_REGEN_INTERVAL;
          out.nextTokenTime = new Date(out.tokensLastAnchor + EFFECTIVE_REGEN_INTERVAL).toISOString();
        }
        return out;
      });

      // update local view from transaction result
      try {
        const after = tx && tx.snapshot && typeof tx.snapshot.val === 'function' ? tx.snapshot.val() : (tx || null);
  const serverTokens = after && Number.isFinite(after.tokens) ? after.tokens : tokensRef.current;
  const serverAnchor = after && Number.isFinite(after.tokensLastAnchor) ? after.tokensLastAnchor : null;

        manualChangeRef.current = Date.now();
        setTokens(serverTokens);
        tokensRef.current = serverTokens;
        lastDecrementRef.current = serverAnchor;

        if (serverTokens >= MAX_TOKENS) {
          setNextTokenTime(null);
          nextTokenTimeRef.current = null;
        } else if (serverAnchor) {
          const nt = new Date(serverAnchor + EFFECTIVE_REGEN_INTERVAL);
          setNextTokenTime(nt);
          nextTokenTimeRef.current = nt;
        }

        // best-effort mirror and audit write
        try {
          await dbUpdate(`players/${playerId}`, { tokens: serverTokens, tokensLastAnchor: serverAnchor !== null ? serverAnchor : null, nextTokenTime: after?.nextTokenTime || null });
        } catch (e) { /* best-effort */ }
        try {
          await dbSet(`tokenAudit/${playerId}/${Date.now()}`, { actor: 'client', source: 'computeAndApplyTokens', tokens: serverTokens, ts: Date.now() });
        } catch (e) { /* ignore */ }
      } catch (e) {
        // ignore mapping failures
      }
    } catch (e) {
      // keep error localized
      // eslint-disable-next-line no-console
      console.warn('[GameContext] computeAndApplyTokens error', e);
    }
  }, [playerId]);

  // Listen to authoritative tokens and hydrate
  useEffect(() => {
    if (!playerId) return undefined;
    const path = `players/${playerId}/tokens`;
    const handle = (snap) => {
      try {
        const raw = snap && typeof snap.val === 'function' ? snap.val() : snap;
        const n = Number.isFinite(raw) ? raw : 0;
        const clamped = Math.max(0, Math.min(MAX_TOKENS, Math.trunc(n)));
        hydratedRef.current = true;
        setTokens(clamped);
        tokensRef.current = clamped;
      } catch (e) { /**/ }
    };
    const unsub = dbOnValue(path, handle);

    // attempt an initial stabilization pass
    (async () => {
      try {
        manualChangeRef.current = Date.now();
        await computeAndApplyTokens();
        setTokensStabilized(true);
      } catch (e) { /* best-effort */ }
    })();

    const id = setInterval(() => { computeAndApplyTokens().catch(() => {}); }, 1000);

    return () => {
      try { if (typeof unsub === 'function') unsub(); else dbOff(path, handle); } catch (e) { }
      hydratedRef.current = false;
      clearInterval(id);
    };
  }, [playerId, computeAndApplyTokens]);

  // Local changes write-through (after hydration)
  useEffect(() => {
    if (!playerId) return;
    if (!hydratedRef.current) return;
    if (manualChangeRef.current && Date.now() - manualChangeRef.current < 2000) return;
    const clamped = Math.max(0, Math.min(MAX_TOKENS, Math.trunc(tokens)));
    (async () => {
      try {
        await dbUpdate(`players/${playerId}`, { tokens: clamped });
      } catch (e) { /* ignore best-effort */ }
    })();
  }, [playerId, tokens]);

  const triggerTokenRecalc = useCallback(() => { computeAndApplyTokens().catch(() => {}); }, [computeAndApplyTokens]);

  // Stabilize tokens on-demand (used by boot flows)
  const stabilizeTokensOnBoot = useCallback(async () => {
    try {
      await computeAndApplyTokens();
      setTokensStabilized(true);
    } catch (e) {
      // best-effort
    }
  }, [computeAndApplyTokens]);

  const contextValue = useMemo(() => ({
    // identity
    playerId,
    setPlayerId,
    playerName,
    setPlayerName,
  avatarUrl,
  setAvatarUrl,
    // alternate identity/context helpers
    playerIdContext,
    setPlayerIdContext,
    playerNameContext,
    setPlayerNameContext,
    userRecognized,
    setUserRecognized,
    isLinked,
    setIsLinked,
    playerLevel,
    setPlayerLevel,
    // version info
    gameVersion,
    setGameVersion,
    gameVersionCode,
    setGameVersionCode,

    // tokens
    tokens,
    setTokens,
    tokensStabilized,
    nextTokenTime,
    setNextTokenTime,
    triggerTokenRecalc,
    stabilizeTokensOnBoot,
  // game lifecycle
  gameStarted,
  gameEnded,
  startGame,
  endGame,
  totalPoints,
  setTotalPoints,
  isGameSaved,
  setIsGameSaved,
  saveGame,
  startGameCb,
  setStartGameCb,
  endGameCb,
  setEndGameCb,
  markManualChange,
  // UI bits
  energyModalVisible,
  setEnergyModalVisible,
  timeToNextToken,
  setTimeToNextToken,

    // scoreboard & viewing helpers
    scoreboardData,
    setScoreboardData,
    scoreboardMonthly,
    setScoreboardMonthly,
    scoreboardWeekly,
    setScoreboardWeekly,
    scoreboardIndices,
    setScoreboardIndices,
    viewingPlayerId,
    setViewingPlayerId,
    viewingPlayerName,
    setViewingPlayerName,
  }), [
    playerId,
    playerName,
    playerIdContext,
    playerNameContext,
    userRecognized,
    isLinked,
    playerLevel,
    gameVersion,
    gameVersionCode,
    tokens,
    tokensStabilized,
    nextTokenTime,
    triggerTokenRecalc,
    stabilizeTokensOnBoot,
    scoreboardData,
    scoreboardMonthly,
    scoreboardWeekly,
    scoreboardIndices,
    viewingPlayerId,
    viewingPlayerName,
  ]);

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};

export default GameProvider;
 
