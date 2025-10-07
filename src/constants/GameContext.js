
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
import { dbOnValue, dbOff, dbUpdate, dbRunTransaction, dbSet, dbGet, auth } from '../services/Firebase';
import { goOnline, goOffline } from '../services/Presence';
import { isBetterScore } from '../utils/scoreUtils';
import { MAX_TOKENS } from './Game';

// Regeneration constants (follow repo convention)
const REGEN_INTERVAL = 1.6 * 60 * 60 * 1000; // 1.6 hours
// const REGEN_INTERVAL = 1 * 60 * 1000; // 1 minute --- IGNORE ---
const EFFECTIVE_REGEN_INTERVAL = REGEN_INTERVAL;

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
  // player avatar url (canonical) + pending local display override
  const [avatarUrl, setAvatarUrlState] = useState(null);
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const pendingAvatarTimeoutRef = useRef(null);
  // Tokens
  const [tokens, setTokens] = useState(0);
  const tokensRef = useRef(0);
  const [tokensStabilized, setTokensStabilized] = useState(false)
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
        try { startGameCb(); } catch (e) { }
      }
    } catch (e) { }
  }, [startGameCb]);

  const endGame = useCallback(() => {
    try {
      setGameEnded(true);
      setGameStarted(false);
      if (typeof endGameCb === 'function') {
        try { endGameCb(); } catch (e) { }
      }
    } catch (e) { }
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

  // Setter wrapper for avatar that supports a short-lived local "pending" value
  const setAvatarUrl = useCallback((path, { local = true } = {}) => {
    try {
      // Always write canonical state immediately
      setAvatarUrlState(path);

      if (!local) {
        // DB-origin: if we have a pending override, clear it so UI reflects DB
        if (pendingAvatar !== null) {
          setPendingAvatar(null);
          if (pendingAvatarTimeoutRef.current) {
            clearTimeout(pendingAvatarTimeoutRef.current);
            pendingAvatarTimeoutRef.current = null;
          }
        }
        return;
      }

      // Local-origin: show instantly (pending) and clear after a short grace
      setPendingAvatar(path);
      if (pendingAvatarTimeoutRef.current) {
        clearTimeout(pendingAvatarTimeoutRef.current);
        pendingAvatarTimeoutRef.current = null;
      }
      pendingAvatarTimeoutRef.current = setTimeout(() => {
        setPendingAvatar(null);
        pendingAvatarTimeoutRef.current = null;
      }, 3000);
    } catch (e) { /* ignore */ }
  }, [pendingAvatar]);

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
  // centralized presence map (merged top-level + embedded)
  const [presenceMap, setPresenceMap] = useState({});
  const presenceCleanupRef = useRef(null);

  // Centralized presence management: keep the player online while we have a playerId
  useEffect(() => {
    let mounted = true;
    if (!playerId) return undefined;

    (async () => {
      try {
        const current = auth && auth().currentUser;
        if (!current || String(current.uid) !== String(playerId)) {
          try { console.debug('[GameContext] skipping goOnline: auth mismatch for', playerId); } catch (e) {}
          return;
        }
        try {
          const cleanup = await goOnline(playerId, { versionName: gameVersion, versionCode: gameVersionCode });
          if (!mounted) {
            try { if (typeof cleanup === 'function') cleanup(); } catch (e) {}
            return;
          }
          presenceCleanupRef.current = cleanup;
          try { console.debug('[GameContext] presence goOnline succeeded for', playerId, 'cleanupSet=', !!cleanup); } catch (e) {}
        } catch (e) {
          try { console.warn('[GameContext] goOnline failed for', playerId, e); } catch (er) {}
        }
      } catch (e) {}
    })();

    return () => {
      mounted = false;
      try {
        if (presenceCleanupRef.current && typeof presenceCleanupRef.current === 'function') {
          try { presenceCleanupRef.current().catch(() => {}); } catch (e) {}
          presenceCleanupRef.current = null;
        } else if (playerId) {
          try { goOffline(playerId).catch(() => {}); } catch (e) {}
        }
      } catch (e) {}
    };
  }, [playerId, gameVersion, gameVersionCode]);

  // ----- Scoreboard listener: compute all-time, monthly and weekly slices -----
  useEffect(() => {
    let unsubPlayers = null;
    let presenceUnsub = null;

    const handlePlayers = (snapshot) => {
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
              } catch (e) { }
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
              } catch (e) { }
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

        // Avoid unnecessary state updates: only set when content actually differs
        const arraysEqual = (a, b) => {
          if (a === b) return true;
          if (!Array.isArray(a) || !Array.isArray(b)) return false;
          if (a.length !== b.length) return false;
          for (let i = 0; i < a.length; i++) {
            const ai = a[i]; const bi = b[i];
            if (!ai || !bi) return false;
            if (ai.playerId !== bi.playerId || (ai.points || 0) !== (bi.points || 0) || (ai.duration || 0) !== (bi.duration || 0)) return false;
          }
          return true;
        };

        setScoreboardData((prev) => arraysEqual(prev, tmpAll) ? prev : tmpAll);
        setScoreboardMonthly((prev) => arraysEqual(prev, tmpMon) ? prev : tmpMon);
        setScoreboardWeekly((prev) => arraysEqual(prev, tmpWeek) ? prev : tmpWeek);

        const idxAll = tmpAll.findIndex((s) => s.playerId === playerId);
        const idxMon = tmpMon.findIndex((s) => s.playerId === playerId);
        const idxWeek = tmpWeek.findIndex((s) => s.playerId === playerId);
        setScoreboardIndices((prev) => {
          if (prev.allTime === idxAll && prev.monthly === idxMon && prev.weekly === idxWeek) return prev;
          return { allTime: idxAll, monthly: idxMon, weekly: idxWeek };
        });
      } catch (e) {
        // ignore per-listener errors
      }
    };

    try {
      unsubPlayers = dbOnValue('players', handlePlayers);
    } catch (e) {
      // ignore
    }

    // Subscribe to combined presence index and update centralized presenceMap
    (async () => {
      try {
        const { onCombinedPresenceChange } = await import('../services/Presence');
        presenceUnsub = await onCombinedPresenceChange((map) => {
          try {
            const newMap = map || {};
            // Use functional updater so we always compare to the latest prev state
            setPresenceMap((prev) => {
              const prevMap = prev || {};
              const pKeys = Object.keys(prevMap);
              const nKeys = Object.keys(newMap);
              if (pKeys.length !== nKeys.length) return newMap;
              for (let k of pKeys) {
                const a = prevMap[k]; const b = newMap[k];
                if (!b || !!a.online !== !!b.online || (a.lastSeen || 0) !== (b.lastSeen || 0)) return newMap;
              }
              return prevMap; // unchanged
            });
          } catch (e) { /* ignore */ }
        });
      } catch (e) { /* ignore */ }
    })();

    return () => {
      try { if (typeof unsubPlayers === 'function') unsubPlayers(); else dbOff('players', handlePlayers); } catch (e) { }
      try { if (presenceUnsub && typeof presenceUnsub === 'function') presenceUnsub(); } catch (e) { }
    };
  }, [playerId]);

  // ----- Persistent avatar listener -----
  useEffect(() => {
    if (!playerId) {
      // clear when no player
      try { setAvatarUrlState(null); } catch (e) { }
      return undefined;
    }

    const path = `players/${playerId}/avatar`;
    const handle = (snapshot) => {
      try {
        const val = snapshot && typeof snapshot.val === 'function' && snapshot.exists() ? snapshot.val() : (snapshot || null);
        // Use the central setter with local=false so we clear any pending local override
        try { setAvatarUrl(val || null, { local: false }); } catch (e) { /* ignore */ }
      } catch (e) { /* ignore per-listener errors */ }
    };

    const unsub = dbOnValue(path, handle);
    return () => {
      try { if (typeof unsub === 'function') unsub(); else dbOff(path, handle); } catch (e) { }
    };
  }, [playerId, setAvatarUrl]);

  // Effective avatar to show: pending local override (short-lived) or canonical
  useEffect(() => {
    if (!playerId) {
      // clear when no player
      setPlayerLevel(null);
      return;
    }

    const path = `players/${playerId}/level`;
    const handle = (snapshot) => {
      try {
        const val = snapshot && typeof snapshot.val === 'function' && snapshot.exists() ? snapshot.val() : null;
        // avoid stale/no-op sets
        setPlayerLevel((prev) => (prev === val ? prev : val));
      } catch (e) { /* ignore */ }
    };

    const unsub = dbOnValue(path, handle);
    return () => {
      try {
        if (typeof unsub === 'function') unsub(); else dbOff(path, handle);
      } catch (e) { /* ignore */ }
    };
  }, [playerId]);

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
          // intentionally do not set out.nextTokenTime here; UI will compute display from tokensLastAnchor
        } else {
          const base = anchor || now;
          out.tokensLastAnchor = base + intervals * EFFECTIVE_REGEN_INTERVAL;
          // do not write nextTokenTime; keep DB schema minimal and authoritative anchor is tokensLastAnchor
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

        // best-effort mirror and audit write (do NOT write nextTokenTime anymore)
        try {
          await dbUpdate(`players/${playerId}`, { tokens: serverTokens, tokensLastAnchor: serverAnchor !== null ? serverAnchor : null });
        } catch (e) { /* best-effort */ }
        try {
          await dbSet(`tokenAudit/${playerId}/${Date.now()}`, { actor: 'client', source: 'computeAndApplyTokens', tokens: serverTokens, ts: Date.now() });
        } catch (e) { /* ignore */ }
      } catch (e) {
        // ignore mapping failures
      }
    } catch (e) {
      // keep error localized; ignore transaction 'overridden-by-set' noise
      try {
        const code = e && (e.code || e.message || '');
        if (String(code).includes('overridden-by-set')) {
          // noisy: another client called set() during our transaction; safe to ignore
        } else {
          // eslint-disable-next-line no-console
          console.warn('[GameContext] computeAndApplyTokens error', e);
        }
      } catch (inner) {
        // eslint-disable-next-line no-console
        console.warn('[GameContext] computeAndApplyTokens error', e);
      }
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

    const id = setInterval(() => { computeAndApplyTokens().catch(() => { }); }, 1000);

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

  // Update human-readable countdown (HH:MM:SS) for timeToNextToken
  useEffect(() => {
    if (!playerId) {
      setTimeToNextToken('');
      return undefined;
    }

    let mounted = true;
    const tick = () => {
      try {
        const now = Date.now() + (serverOffsetRef.current || 0);
        const curTokens = typeof tokensRef.current === 'number' ? tokensRef.current : 0;

        if (curTokens >= MAX_TOKENS) {
          if (mounted) setTimeToNextToken('');
          return;
        }

        // Prefer authoritative anchor: lastDecrementRef (tokensLastAnchor). Treat nextTokenTime as diagnostic only.
        let nextMs = null;
        let usedSource = null;
        if (typeof lastDecrementRef.current === 'number') {
          nextMs = (lastDecrementRef.current + EFFECTIVE_REGEN_INTERVAL) - now;
          usedSource = 'lastDecrement';
        } else {
          // fallback: use manualChange or nextTokenTime if present
          const anchorCandidate = (typeof manualChangeRef.current === 'number') ? manualChangeRef.current : null;
          if (anchorCandidate) {
            nextMs = (anchorCandidate + EFFECTIVE_REGEN_INTERVAL) - now;
            usedSource = 'manualChange';
          } else {
            const next = nextTokenTimeRef.current instanceof Date ? nextTokenTimeRef.current.getTime() : (nextTokenTimeRef.current ? new Date(nextTokenTimeRef.current).getTime() : null);
            if (next && !isNaN(next)) {
              nextMs = next - now;
              usedSource = 'nextTokenTime';
            } else {
              nextMs = EFFECTIVE_REGEN_INTERVAL;
              usedSource = 'default';
            }
          }
        }

        // If database still contains nextTokenTime, warn if it materially disagrees with authoritative anchor
        try {
          const dbNext = nextTokenTimeRef.current instanceof Date ? nextTokenTimeRef.current.getTime() : (nextTokenTimeRef.current ? new Date(nextTokenTimeRef.current).getTime() : null);
          if (dbNext && usedSource !== 'nextTokenTime') {
            const diff = Math.abs(dbNext - (now + nextMs));
            if (diff > EFFECTIVE_REGEN_INTERVAL * 0.5) {
              console.warn('[GameContext.timer] nextTokenTime in DB disagrees with tokensLastAnchor by ms:', diff, { dbNext, computedFrom: usedSource });
            }
          }
        } catch (err) { /* ignore */ }

        if (nextMs <= 0) {
          if (mounted) setTimeToNextToken('00:00:00');
          return;
        }

        const totalSec = Math.floor(nextMs / 1000);
        const hh = Math.floor(totalSec / 3600);
        const mm = Math.floor((totalSec % 3600) / 60);
        const ss = totalSec % 60;
        let str;
        if (hh > 0) str = `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
        else str = `${String(mm)}:${String(ss).padStart(2, '0')}`;

        // Debug logs removed in production

        if (mounted) setTimeToNextToken(str);
      } catch (e) { /* ignore */ }
    };

    tick();
    let timer = null;
    const schedule = () => {
      const nowMs = Date.now();
      const delay = 1000 - (nowMs % 1000) || 1000;
      // Debug logs removed in production
      timer = setTimeout(() => { tick(); schedule(); }, delay);
    };
    schedule();
    return () => { mounted = false; if (timer) clearTimeout(timer); };
  }, [playerId]);

  const triggerTokenRecalc = useCallback(() => { computeAndApplyTokens().catch(() => { }); }, [computeAndApplyTokens]);

  // Stabilize tokens on-demand (used by boot flows)
  const stabilizeTokensOnBoot = useCallback(async () => {
    try {
      await computeAndApplyTokens();
      setTokensStabilized(true);
    } catch (e) {
      // best-effort
    }
  }, [computeAndApplyTokens]);

  const contextValue = ({
    // identity
    playerId,
    setPlayerId,
    playerName,
    setPlayerName,
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

  // identity
  avatarUrl: avatarUrl,
  displayAvatarUrl: pendingAvatar !== null ? pendingAvatar : avatarUrl,
  setAvatarUrl,

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
    presenceMap,
    scoreboardWeekly,
    setScoreboardWeekly,
    scoreboardIndices,
    setScoreboardIndices,
    viewingPlayerId,
    setViewingPlayerId,
    viewingPlayerName,
    setViewingPlayerName,
  } );

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};

export default GameProvider;

