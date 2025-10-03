
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dbOnValue, dbOff, dbSet, dbUpdate, dbRef, dbGet, dbRunTransaction } from '../services/Firebase';
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
  const [tokensStabilized, setTokensStabilized] = useState(false); // true after stabilizeTokensOnBoot finishes

  // Token regen constants
  const REGEN_INTERVAL = 1.6 * 60 * 60 * 1000; // 1.6 hours in ms
  // Use production regen interval (1.6h).
  // Production regen interval (1.6 hours)
  const EFFECTIVE_REGEN_INTERVAL = REGEN_INTERVAL;
  // If nextTokenTime in DB is farther in the future than this, treat as invalid and clamp it
  const MAX_NEXT_TOKEN_FUTURE = 24 * 60 * 60 * 1000; // 24 hours

  // Refs & helpers for regen logic
  const serverOffsetRef = useRef(0);
  const tokensRef = useRef(tokens);
  const nextTokenTimeRef = useRef(nextTokenTime);
  const lastDecrementRef = useRef(null); // ms epoch when tokens first dropped from MAX->MAX-1
  const prevTokensRef = useRef(null);
  const manualChangeRef = useRef(null);

  // keep refs in sync with state
  useEffect(() => { tokensRef.current = tokens; }, [tokens]);
  useEffect(() => { nextTokenTimeRef.current = nextTokenTime; }, [nextTokenTime]);

  // keep prevTokensRef in sync for detecting MAX->MAX-1 transitions
  // store the previous tokens value whenever tokens state changes
  useEffect(() => {
    prevTokensRef.current = typeof tokens === 'number' ? tokens : prevTokensRef.current;
  }, [tokens]);

  // Persist nextTokenTime to AsyncStorage when it changes
  useEffect(() => {
    (async () => {
      try {
        if (nextTokenTime) await AsyncStorage.setItem('nextTokenTime', nextTokenTime.toString());
        else await AsyncStorage.removeItem('nextTokenTime');
      } catch (e) {}
    })();
  }, [nextTokenTime]);

  // Load nextTokenTime from Firebase (or AsyncStorage fallback) when playerId changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!playerId) { try { setTokensStabilized(false); } catch (e) {} ; return; }
      try {
        // Load lastTokenDecrement first (preferred authoritative anchor)
        try {
          const ldSnap = await dbGet(`players/${playerId}/lastTokenDecrement`);
          if (ldSnap && ldSnap.exists && ldSnap.exists()) {
            const raw = ldSnap.val();
            const asNum = Number(raw);
            if (!isNaN(asNum) && asNum > 0) {
              lastDecrementRef.current = asNum; // epoch ms
            }
          }
        } catch (e) {
          // ignore
        }

        const snap = await dbGet(`players/${playerId}/nextTokenTime`);
        if (snap && snap.exists && snap.exists()) {
          const val = snap.val();
          const dt = new Date(val);
          if (!isNaN(dt.getTime())) {
            if (!cancelled) {
              // clamp obviously-future timestamps (protect against bad writers)
              const now = new Date(Date.now() + (serverOffsetRef.current || 0));
                if (dt.getTime() - now.getTime() > MAX_NEXT_TOKEN_FUTURE) {
                const clamped = new Date(now.getTime() + EFFECTIVE_REGEN_INTERVAL);
                setNextTokenTime(clamped);
                try { if (playerId) await dbUpdate(`players/${playerId}`, { nextTokenTime: clamped.toISOString() }); } catch (e) {}
              } else {
                setNextTokenTime(dt);
              }
            }
          }
        } else {
          const saved = await AsyncStorage.getItem('nextTokenTime');
          if (saved) {
            const dt = new Date(saved);
            if (!isNaN(dt.getTime())) if (!cancelled) setNextTokenTime(dt);
          }
        }

        // Ensure legacy users with tokens === 0 have an authoritative anchor.
        // Run this on the dedicated tokensAtomic child so presence/other writes
        // to players/{playerId} won't override it.
        try {
          const atomicPath = `players/${playerId}/tokensAtomic`;
          const txRes = await dbRunTransaction(atomicPath, (current) => {
            const obj = current || {};
            const curTokens = Number.isFinite(obj.tokens) ? obj.tokens : 0;
            const hasAnchor = typeof obj.lastTokenDecrement !== 'undefined' && obj.lastTokenDecrement !== null;
            if (curTokens < MAX_TOKENS && !hasAnchor) {
              return { ...obj, lastTokenDecrement: Date.now() };
            }
            return obj;
          });
          // mirror back to legacy field (best-effort)
          try {
            if (txRes && txRes.snapshot && typeof txRes.snapshot.val === 'function') {
              const after = txRes.snapshot.val();
              const serverAnchor = Number.isFinite(after?.lastTokenDecrement) ? Number(after.lastTokenDecrement) : null;
              if (playerId) dbUpdate(`players/${playerId}`, { lastTokenDecrement: serverAnchor !== null ? serverAnchor : null }).catch(()=>{});
            }
          } catch (e) {}
        } catch (e) {
          // best-effort, ignore failures
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [playerId]);

  // Listen for lastTokenDecrement changes (authoritative anchor for regen)
  useEffect(() => {
    if (!playerId) return undefined;
    const path = `players/${playerId}/lastTokenDecrement`;
    const handler = (snap) => {
      try {
        if (!snap) return;
        const val = snap.val ? snap.val() : snap;
        if (val === null) { lastDecrementRef.current = null; return; }
        const asNum = Number(val);
        if (!isNaN(asNum)) lastDecrementRef.current = asNum;
      } catch (e) {}
    };
    const unsub = dbOnValue(path, handler);
    return () => { try { if (unsub && typeof unsub === 'function') unsub(); else dbOff(path, handler); } catch (e) {} };
  }, [playerId]);

  // Subscribe to serverTimeOffset
  useEffect(() => {
    let unsub; try {
      unsub = dbOnValue('/.info/serverTimeOffset', (snap) => {
        try { const val = snap && snap.val ? snap.val() : (snap || 0); serverOffsetRef.current = typeof val === 'number' ? val : 0; } catch (e) { serverOffsetRef.current = 0; }
      });
    } catch (e) {}
    return () => { try { if (unsub && typeof unsub === 'function') unsub(); } catch (e) {} };
  }, []);

  // Realtime listener for nextTokenTime changes (other clients)
  useEffect(() => {
    if (!playerId) return undefined;
    const path = `players/${playerId}/nextTokenTime`;
    const handler = (snap) => {
      try {
        if (!snap) return;
        const val = snap.val ? snap.val() : snap;
        if (val === null) { setNextTokenTime(null); return; }
        const dt = new Date(val);
        if (!isNaN(dt.getTime())) {
          const now = new Date(Date.now() + (serverOffsetRef.current || 0));
          if (dt.getTime() - now.getTime() > MAX_NEXT_TOKEN_FUTURE) {
            // clamp and repair remote value
            const clamped = new Date(now.getTime() + EFFECTIVE_REGEN_INTERVAL);
            setNextTokenTime(clamped);
                try { if (playerId) dbUpdate(`players/${playerId}`, { nextTokenTime: clamped.toISOString() }).catch(()=>{}); } catch(e) {}
          } else {
            setNextTokenTime(dt);
          }
        }
      } catch (e) {}
    };
    const unsub = dbOnValue(path, handler);
    return () => { try { if (unsub && typeof unsub === 'function') unsub(); else dbOff(path, handler); } catch (e) {} };
  }, [playerId]);

  // Authoritative compute function in GameContext
  const computeAndApplyTokens = async () => {
    try {
      const now = Date.now() + (serverOffsetRef.current || 0);
      const currentTokens = typeof tokensRef.current === 'number' ? tokensRef.current : 0;

      // Prefer authoritative anchor: lastTokenDecrement
      const anchor = typeof lastDecrementRef.current === 'number' ? lastDecrementRef.current : null;

      if (anchor) {
        // Compute how many intervals have passed since anchor
        const elapsed = now - anchor;
        if (elapsed < EFFECTIVE_REGEN_INTERVAL) return; // not enough time passed
        if (manualChangeRef.current && Date.now() - manualChangeRef.current < 2000) return;

        const intervals = Math.floor(elapsed / EFFECTIVE_REGEN_INTERVAL);
        if (intervals <= 0) return;

        // Use a dedicated child path for token transactions to avoid being
        // overridden by unrelated sets on other children (presence/nextTokenTime/etc).
        // We still mirror results back to legacy fields after the transaction
        // so other clients remain compatible.
        if (!playerId) return;
        try {
          const atomicPath = `players/${playerId}/tokensAtomic`;
          const txResult = await dbRunTransaction(atomicPath, (current) => {
            // current is the value at players/{playerId}/tokensAtomic (or null)
            const serverObj = current || {};
            const serverTokens = Number.isFinite(serverObj.tokens) ? serverObj.tokens : (typeof tokensRef.current === 'number' ? tokensRef.current : 0);
            const serverAnchor = Number.isFinite(serverObj.lastTokenDecrement) ? Number(serverObj.lastTokenDecrement) : (typeof lastDecrementRef.current === 'number' ? lastDecrementRef.current : null);
            // If server doesn't have an anchor, treat our anchor as base
            // Normalize anchors to numbers. If neither server nor local anchor
            // is available we must not credit tokens here (prevents huge
            // backfills when baseAnchor is null).
            const normalizedServerAnchor = Number.isFinite(serverAnchor) ? Number(serverAnchor) : null;
            const normalizedAnchor = Number.isFinite(anchor) ? Number(anchor) : null;
            const baseAnchor = normalizedServerAnchor !== null ? normalizedServerAnchor : (normalizedAnchor !== null ? normalizedAnchor : null);
            if (baseAnchor === null) {
              // No authoritative anchor available; do not compute intervals here.
              return current;
            }
            const serverElapsed = now - baseAnchor;
            let serverIntervals = 0;
            if (normalizedServerAnchor !== null) {
              serverIntervals = Math.floor(serverElapsed / EFFECTIVE_REGEN_INTERVAL);
            } else if (normalizedAnchor !== null) {
              serverIntervals = intervals;
            }
            if (serverIntervals <= 0) {
              try {
                const threshold = 0.95;
                const shouldLog = typeof serverElapsed === 'number' && typeof EFFECTIVE_REGEN_INTERVAL === 'number' && serverElapsed > (EFFECTIVE_REGEN_INTERVAL * threshold);
                if (shouldLog) console.log('[BOOT] regen none - intervals=0', { playerId, serverAnchor, serverElapsed, EFFECTIVE_REGEN_INTERVAL });
              } catch (e) {}
              return current;
            }
            const newTokens = Math.min(serverTokens + serverIntervals, MAX_TOKENS);
            if (newTokens <= serverTokens) {
              try { console.log('[BOOT] no tokens earned, anchor unchanged', { playerId, serverTokens, newTokens, serverIntervals }); } catch (e) {}
              // ensure tokens value is at least serverTokens
              return { ...serverObj, tokens: newTokens };
            }
            let newAnchor = null;
            if (newTokens < MAX_TOKENS) {
              newAnchor = baseAnchor + serverIntervals * EFFECTIVE_REGEN_INTERVAL;
            }
            return { ...serverObj, tokens: newTokens, lastTokenDecrement: newAnchor };
          });

          // If transaction returned a snapshot, reflect it locally and mirror to legacy fields
          if (txResult && txResult.snapshot && typeof txResult.snapshot.val === 'function') {
            const after = txResult.snapshot.val();
            const serverTokens = Number.isFinite(after?.tokens) ? after.tokens : 0;
            const serverAnchor = Number.isFinite(after?.lastTokenDecrement) ? Number(after.lastTokenDecrement) : null;
            // Record that this is a manual/server-driven change to avoid write-through races
            manualChangeRef.current = Date.now();
            setTokens(serverTokens);
            tokensRef.current = serverTokens;
            lastDecrementRef.current = serverAnchor;
            // compute nextTokenTime locally
            if (serverTokens >= MAX_TOKENS) {
              setNextTokenTime(null);
              nextTokenTimeRef.current = null;
            } else if (serverAnchor) {
              const rem = serverAnchor + EFFECTIVE_REGEN_INTERVAL - now;
              const nextTime = new Date(Date.now() + rem);
              setNextTokenTime(nextTime);
              nextTokenTimeRef.current = nextTime;
            }
            console.log('[BOOT] fetched gained tokens (anchor)', { playerId, newTokens: serverTokens, serverAnchor });

            // Mirror back to legacy fields so other clients see the update.
            try {
              if (playerId) {
                dbUpdate(`players/${playerId}`, { tokens: serverTokens, lastTokenDecrement: serverAnchor !== null ? serverAnchor : null }).catch(()=>{});
              }
            } catch (e) {}
          }
        } catch (e) {
          console.warn('[GameContext] token regen transaction failed', e);
        }

        return;
      }

      // Fallback: use nextTokenTime logic if anchor not available
      const next = nextTokenTimeRef.current instanceof Date ? nextTokenTimeRef.current : (nextTokenTimeRef.current ? new Date(nextTokenTimeRef.current) : null);
      const nowDate = new Date(Date.now() + (serverOffsetRef.current || 0));
      // If there's no authoritative anchor for legacy users, establish one
      // now and schedule the nextTokenTime instead of crediting potentially
      // large backlogs from stale nextTokenTime/AsyncStorage. This prevents
      // old users with tokens==0 from immediately receiving MAX_TOKENS.
      if (!lastDecrementRef.current && currentTokens < MAX_TOKENS) {
        try {
          manualChangeRef.current = Date.now();
          const newAnchor = Date.now();
          lastDecrementRef.current = newAnchor;
          // write atomically to tokensAtomic child to avoid being overridden
          if (playerId) {
            const atomicPath = `players/${playerId}/tokensAtomic`;
            try {
              await dbRunTransaction(atomicPath, (current) => {
                const obj = current || {};
                if (!obj.lastTokenDecrement) obj.lastTokenDecrement = newAnchor;
                return obj;
              });
            } catch (e) {}
            // mirror back to legacy fields (best-effort)
            try { dbUpdate(`players/${playerId}`, { lastTokenDecrement: newAnchor }).catch(()=>{}); } catch(e) {}
          }
          const newNext = new Date(nowDate.getTime() + EFFECTIVE_REGEN_INTERVAL);
          setNextTokenTime(newNext);
          nextTokenTimeRef.current = newNext;
          if (playerId) try { dbUpdate(`players/${playerId}`, { nextTokenTime: newNext.toISOString() }).catch(()=>{}); } catch(e) {}
        } catch (e) {}
        return;
      }
      // schedule if missing
      if (!next && currentTokens < MAX_TOKENS) {
        const newNext = new Date(nowDate.getTime() + EFFECTIVE_REGEN_INTERVAL);
        setNextTokenTime(newNext);
        nextTokenTimeRef.current = newNext;
        if (playerId) await dbUpdate(`players/${playerId}`, { nextTokenTime: newNext.toISOString() });
        return;
      }
      if (currentTokens >= MAX_TOKENS) return;
      if (!next || isNaN(next.getTime())) return;
      const diff = next - nowDate;
      if (diff > 0) return;
      if (manualChangeRef.current && Date.now() - manualChangeRef.current < 2000) return;
      const diffTime = nowDate - next;
      const tokensToAdd = Math.floor(diffTime / EFFECTIVE_REGEN_INTERVAL) + 1;
      const newTokenCount = Math.min(currentTokens + tokensToAdd, MAX_TOKENS);
      const effectiveAdded = newTokenCount - currentTokens;
      if (effectiveAdded <= 0) return;
      // apply tokens via state setter
      // mark manual change so write-through effect won't race with our transaction below
      manualChangeRef.current = Date.now();
      setTokens((prev) => {
        const updated = Math.min((typeof prev === 'number' ? prev : currentTokens) + effectiveAdded, MAX_TOKENS);
        tokensRef.current = updated;
        return updated;
      });
      // Persist tokens and nextTokenTime atomically via a transaction to avoid races
      if (playerId) {
        try {
          console.log('[BOOT] fetched gained tokens (fallback)', { playerId, added: effectiveAdded, newTokenCount });
          // perform transaction on dedicated atomic child to avoid being overridden
          const atomicPath = `players/${playerId}/tokensAtomic`;
          const txResult = await dbRunTransaction(atomicPath, (current) => {
            const serverObj = current || {};
            const curServerTokens = Number.isFinite(serverObj.tokens) ? serverObj.tokens : (typeof tokensRef.current === 'number' ? tokensRef.current : 0);
            // Reconcile: take the max between server and our computed newTokenCount to avoid regressions
            const reconciledTokens = Math.min(Math.max(curServerTokens, currentTokens) + effectiveAdded, MAX_TOKENS);
            const out = { ...serverObj, tokens: reconciledTokens };
            if (reconciledTokens >= MAX_TOKENS) {
              // when full, clear nextTokenTime
              out.nextTokenTime = null;
              out.lastTokenDecrement = null;
            } else {
              const remainder = diffTime % EFFECTIVE_REGEN_INTERVAL;
              const newNextTime = new Date(nowDate.getTime() + (EFFECTIVE_REGEN_INTERVAL - remainder));
              out.nextTokenTime = newNextTime.toISOString();
              // compute a fallback anchor if needed
              out.lastTokenDecrement = out.lastTokenDecrement || null;
            }
            return out;
          });
          // Mirror results back to legacy player fields (best-effort)
          try {
            if (txResult && txResult.snapshot && typeof txResult.snapshot.val === 'function') {
              const after = txResult.snapshot.val();
              const serverTokens = Number.isFinite(after?.tokens) ? after.tokens : 0;
              const nextTimeIso = after?.nextTokenTime || null;
              const serverAnchor = Number.isFinite(after?.lastTokenDecrement) ? Number(after.lastTokenDecrement) : null;
              // set tokens and nextTokenTime/lastTokenDecrement as children (non-blocking)
              if (playerId) {
                dbUpdate(`players/${playerId}`, { tokens: serverTokens, nextTokenTime: nextTimeIso || null, lastTokenDecrement: serverAnchor !== null ? serverAnchor : null }).catch(()=>{});
              }
            }
          } catch (e) {}
        } catch (e) {
          // log but don't throw – we still updated local state
          console.warn('[GameContext] fallback regen transaction failed', e);
        }
      }
    } catch (e) {
      console.error('[GameContext] computeAndApplyTokens error', e);
    }
  };

  // Utility: stabilize tokens during initial boot so UI doesn't flash transient values.
  // Call this from the landing/boot flow once the playerId is known. It will mark a
  // manual change (so write-through skips), trigger a compute/apply pass, and wait a
  // short time for transactions and listeners to settle before returning.
  const stabilizeTokensOnBoot = useCallback(async (waitMs = 1200) => {
    try {
      // mark so write-through will skip briefly
      try { manualChangeRef.current = Date.now(); } catch (e) {}
      // attempt a compute pass (best-effort)
      try { await computeAndApplyTokens(); } catch (e) {}
      // small wait to allow transactions/listeners to propagate
      await new Promise((res) => setTimeout(res, waitMs));
      // mark tokens as stabilized so UI can stop showing placeholders
      try { setTokensStabilized(true); } catch (e) {}
    } catch (e) {
      // swallow – best-effort only
    }
  }, []);

  // Interval runner
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerId) return;
      computeAndApplyTokens();
    }, 1000);
    return () => clearInterval(interval);
  }, [playerId]);

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

        // If full, show nothing
        if (curTokens >= MAX_TOKENS) {
          if (mounted) setTimeToNextToken('');
          return;
        }

        // Prefer explicit nextTokenTime
        let nextMs = null;
        const next = nextTokenTimeRef.current instanceof Date ? nextTokenTimeRef.current.getTime() : (nextTokenTimeRef.current ? new Date(nextTokenTimeRef.current).getTime() : null);
        if (next && !isNaN(next)) nextMs = next - now;
        else if (typeof lastDecrementRef.current === 'number') nextMs = (lastDecrementRef.current + EFFECTIVE_REGEN_INTERVAL) - now;

        if (nextMs == null) {
          if (mounted) setTimeToNextToken('00:00:00');
          return;
        }

        if (nextMs <= 0) {
          if (mounted) setTimeToNextToken('00:00:00');
          return;
        }

        const totalSec = Math.floor(nextMs / 1000);
        const hh = Math.floor(totalSec / 3600);
        const mm = Math.floor((totalSec % 3600) / 60);
        const ss = totalSec % 60;
        // format as H:MM:SS (omit hours when zero -> MM:SS)
        let str;
        if (hh > 0) {
          str = `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
        } else {
          str = `${String(mm)}:${String(ss).padStart(2, '0')}`;
        }
        if (mounted) setTimeToNextToken(str);
      } catch (e) {
        // ignore
      }
    };

    // run immediately and then every second
    tick();
    const id = setInterval(tick, 1000);
    return () => { mounted = false; clearInterval(id); };
  }, [playerId]);

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
      console.log('[GameContext] tokens listener -> raw=', raw, 'clamped=', clamped, 'playerId=', playerId);
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

    // Avoid racing with transactions: if we've recently made a manual change
    // (e.g. via dbRunTransaction) skip automatic write-through for a short window.
    if (manualChangeRef.current && (Date.now() - manualChangeRef.current) < 2000) {
      // dev visibility
      try { if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[GameContext] skipping write-through tokens due to recent manualChange', { playerId, tokens }); } catch (e) {}
      return;
    }

    const clamped = Math.max(0, Math.min(MAX_TOKENS, Math.trunc(tokens)));
    // Use field-level update to avoid overriding other children under players/{playerId}
    dbUpdate(`players/${playerId}`, { tokens: clamped }).catch(() => { });
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
    (Constants.expoConfig?.extra?.buildVersionCode ?? Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.ios?.buildNumber) ||
      Constants.manifest?.android?.versionCode ||
      Constants.manifest?.ios?.buildNumber ||
      Constants.nativeBuildVersion ||
      ''
  );
  const payload = { online: true, lastSeen: ts, lastSeenHuman: formatLastSeen(ts), gameVersion: fallbackGameVersion, versionCode: fallbackVersionCode };
        await dbSet(path, payload);
        // NOTE: versionCode is intentionally kept under the presence node
        // (players/{playerId}/presence) and included in the presence payload above.
        // Do NOT write versionCode at the player root here to avoid overwriting
        // server-managed fields elsewhere in the player object.

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

  // Mark that a manual/server-driven change is about to happen so write-through
  // effects (which would call dbSet) can skip for a short window to avoid
  // racing with transactions. Use from other modules before starting a
  // dbRunTransaction that will update player tokens/anchors.
  const markManualChange = useCallback(() => {
    try { manualChangeRef.current = Date.now(); } catch (e) {}
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
  markManualChange,
  stabilizeTokensOnBoot,
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
  tokensStabilized,
  tokens,
  setTokens,
  energyModalVisible,
  setEnergyModalVisible,
      // trigger
      triggerTokenRecalc: () => { computeAndApplyTokens(); },
      
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
  tokensStabilized,
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
      // note: computeAndApplyTokens is not added to deps because it's stable within this render
    ]
  );

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};
