/**
 * PlayerCard - Modal component for displaying player profile, stats, and trophies.
 *
 * 
 * This file displays the player's card with avatar, stats, top scores, and trophies.
 * @module PlayerCard
 * @author Sabata79
 * @since 2025-08-29
 */
import { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable, Image, ActivityIndicator, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useGame } from '../constants/GameContext';
import playerCardStyles from '../styles/PlayerCardStyles';
import COLORS from '../constants/colors';
import { dbOnValue, dbOff, dbGet, dbUpdate } from '../services/Firebase';
import { avatars } from '../constants/AvatarPaths';
import AvatarContainer from '../constants/AvatarContainer';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import { PlayercardBg } from '../constants/PlayercardBg';
import CoinLayer from './CoinLayer';
import { isBetterScore } from '../utils/scoreUtils';
import { levelBadgePaths } from '../constants/BadgePaths';


export default function PlayerCard({ isModalVisible, setModalVisible }) {
  const {
    playerId,
    playerName,
    viewingPlayerId,
    viewingPlayerName,
    resetViewingPlayer,
    avatarUrl,
    setAvatarUrl,
    playerLevel,
  } = useGame();

  // UUSI: local state for viewing another player's level
  // undefined = not yet loaded; null = loaded but no level set
  const [viewingPlayerLevel, setViewingPlayerLevel] = useState(undefined);

  const [playerIsLinked, setPlayerIsLinked] = useState(false);
  const [viewingPlayerAvatar, setViewingPlayerAvatar] = useState('');
  const [avatarSelected, setAvatarSelected] = useState(null);
  const [monthlyRanks, setMonthlyRanks] = useState(Array(12).fill(null));
  const [weeklyRank, setWeeklyRank] = useState('-');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [topScores, setTopScores] = useState([]);
  const [isModalModalVisible, setModalModalVisible] = useState(false);
  const [playedGames, setPlayedGames] = useState(0);
  const [playedGamesOffset, setPlayedGamesOffset] = useState(null); // will store { y, h }
  const [badgeHeight, setBadgeHeight] = useState(null);
  const [avgPoints, setAvgPoints] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);
  // storedLevel: undefined = loading, null = loaded but no level
  const [storedLevel, setStoredLevel] = useState(undefined);
  // preferredCardBg: user-selected override (null = no override)
  const [preferredCardBg, setPreferredCardBg] = useState(null);
  // profileLoaded: profile read at least once (prevents premature level fallback)
  const [profileLoaded, setProfileLoaded] = useState(false);
  // preferredLoaded: whether preferredCardBg has been specifically read
  const [preferredLoaded, setPreferredLoaded] = useState(false);
  // acceptBeginner: allow 'beginner' as resolved after a short grace period
  const [acceptBeginner, setAcceptBeginner] = useState(false);
  const acceptBeginnerTimerRef = useRef(null);
  const [viewingAllTimeRank, setViewingAllTimeRank] = useState('-');
  const [weeklyWins, setWeeklyWins] = useState(0);
  const [modalHeight, setModalHeight] = useState(0);
  const [modalWidth, setModalWidth] = useState(0);
  const [isBgLoading, setIsBgLoading] = useState(true);
  // Animated opacity for background fade-in
  const bgOpacity = useRef(new Animated.Value(0)).current;

  // Content settle detection & content animation refs
  const lastUpdateRef = useRef(Date.now());
  const settleTimeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const [contentSettled, setContentSettled] = useState(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(8)).current;
  const imageLoadedRef = useRef(false);
  // suppressBgLoadingRef: avoid showing loader during DB-driven preference updates
  const suppressBgLoadingRef = useRef(false);
  const suppressTimeoutRef = useRef(null);
  // Reveal guard: only start any visual reveal when this becomes true
  const [revealReady, setRevealReady] = useState(false);
  // Animated ribbon (scale/rotate/translate) for All-Time #1
  const ribbonAnim = useRef(new Animated.Value(0)).current;
  // Animated ribbon for linked status (separate DOM/animation)
  const ribbonLinkedAnim = useRef(new Animated.Value(0)).current;
  // ribbonsMounted: mount ribbon DOM after animation is ready to avoid flash
  const [ribbonsMounted, setRibbonsMounted] = useState(false);

  const clearSettleTimers = () => {
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  };

  const scheduleSettle = (delay = 300, maxWait = 1500) => {
    setContentSettled(false);
    clearSettleTimers();
    settleTimeoutRef.current = setTimeout(() => {
      setContentSettled(true);
      settleTimeoutRef.current = null;
    }, delay);
    maxTimeoutRef.current = setTimeout(() => {
      setContentSettled(true);
      maxTimeoutRef.current = null;
    }, maxWait);
  };

  const markUpdate = () => {
    lastUpdateRef.current = Date.now();
    scheduleSettle();
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const idToUse = viewingPlayerId || playerId;
  const nameToUse = viewingPlayerName || playerName;

  useEffect(() => {
    if (!isModalVisible) {
      // reset the grace timer state when modal closes
      setAcceptBeginner(false);
      if (acceptBeginnerTimerRef.current) {
        clearTimeout(acceptBeginnerTimerRef.current);
        acceptBeginnerTimerRef.current = null;
      }
      return;
    }
    if (!viewingPlayerId || viewingPlayerId === playerId) {
      setViewingPlayerLevel(null); // Own card, no need to fetch
      return;
    }
    // Get the level of the viewed player
    setViewingPlayerLevel(undefined); // loading
    const path = `players/${viewingPlayerId}/level`;
    const handle = (snapshot) => {
      setViewingPlayerLevel(snapshot.exists() ? snapshot.val() : null);
    };
    dbOnValue(path, handle);
    return () => dbOff(path, handle);
  }, [isModalVisible, viewingPlayerId, playerId]);

  const handleAvatarSelect = (avatar) => {
    const avatarPath = avatar.path;
    setAvatarSelected(avatarPath);
    setAvatarUrl(avatarPath);
    saveAvatarToDatabase(avatarPath);
    setIsAvatarModalVisible(false);
  };

  const saveAvatarToDatabase = async (avatarPath) => {
    // guard
    const path = String(avatarPath || '').trim();
    if (!path) {
      console.error('Avatar path is empty!');
      return;
    }

    // optional: skip write if unchanged
    if (path === avatarUrl) {
      setAvatarUrl(path);
      return;
    }

    try {
      await dbUpdate(`players/${playerId}`, {
        avatar: path,
        avatarUrl: path, // keep backward compatibility with readers using avatarUrl
      });
      setAvatarUrl(path);
    } catch (e) {
      console.error('Error saving avatar to Firebase:', e);
    }
  };


  // ----- HELPERS -----

  const _norm = (s) => String(s || '').replace(/\\/g, '/').replace(/^\.\//, '');
  const _last2 = (s) => _norm(s).split('/').slice(-2).join('/');

  const getAvatarImage = (avatarPath) => {
    const hit = findAvatarMeta(avatarPath);
    return hit ? hit.display : null; // ← ei fallback-kuvaa
  };

  // Find avatar meta by path using the same normalization rules as getAvatarImage
  const findAvatarMeta = (avatarPath) => {
    const target = _norm(avatarPath);
    if (!target) return null;
    const hit = avatars.find(av => {
      const ap = _norm(av.path);
      return ap === target || ap.endsWith(_last2(target)) || target.endsWith(_last2(ap));
    });
    return hit || null;
  };

  const isBeginnerAvatar = (avatarPath) => {
    const avatar = findAvatarMeta(avatarPath);
    return !!avatar && String(avatar.level || '').toLowerCase() === 'beginner';
  };

  const getAvatarToDisplay = () => (idToUse === playerId ? avatarUrl : viewingPlayerAvatar);

  const getTopScoresWithEmptySlots = () => topScores.slice(0, 5);

  const getPlayerCardBackground = (level) => {
    if (!level) return null;
    const key = String(level).trim().toLowerCase();
    const bg = PlayercardBg.find(b => b.level.toLowerCase() === key);
    if (bg) return bg.display;
    // If level is 'legendary' but we don't have a specific image, fall back
    // to the highest available background (usually 'Elite'). This prevents
    // an indefinite loading state for valid high levels.
    if (key === 'legendary' && PlayercardBg.length > 0) {
      return PlayercardBg[PlayercardBg.length - 1].display;
    }
    return null;
  };


  // ----- LEVEL COMPUTATION -----

  // levelInfo is selected based on whether viewing own or another's card
  const getPlayerLevelInfo = () => {
    // played games
    const games = playedGames;

    // level ranges based on games played
    let computed = { level: 'beginner', min: 0, max: 400 };
    if (games >= 2000) computed = { level: 'legendary', min: 2000, max: 2000 };
    else if (games >= 1201) computed = { level: 'elite', min: 1201, max: 2000 };
    else if (games >= 801) computed = { level: 'advanced', min: 801, max: 1200 };
    else if (games >= 401) computed = { level: 'basic', min: 401, max: 800 };

    const progress =
      computed.max === computed.min
        ? 1
        : (games - computed.min) / (computed.max - computed.min);

    // clamp 0..1
    const clamped = Math.max(0, Math.min(1, progress));

    // Determine whether this is the player's own card. For own card we
    // require an explicit storedLevel to be present before choosing a
    // displayed level; this avoids briefly falling back to the computed
    // 'beginner' value while the canonical value from the player node
    // is still loading.
    const isOwn = idToUse === playerId;
    const levelLabel = isOwn ? (storedLevel ?? null) : (storedLevel ?? viewingPlayerLevel ?? computed.level);

    return { ...computed, level: levelLabel, progress: clamped };
  };

  const previousMonthRank = currentMonth > 0 ? monthlyRanks[currentMonth - 1] : '--';
  const levelInfo = getPlayerLevelInfo();

  // badge lookup for current level
  const badgeHit = (() => {
    const key = (levelInfo.level || '').toString().toLowerCase();
    return levelBadgePaths.find(b => (b.level || '').toString().toLowerCase() === key) || null;
  })();

  // Background info — be defensive: levelInfo.level may be null/undefined while
  // the canonical storedLevel is still loading. isDarkBg is computed later
  // from the resolved background (preferredCardBg if set, otherwise level).
  // This ensures the chosen image and the text/style (dark vs light) are
  // decided from the same source and avoid transient mismatches.
  let isDarkBg = false;

  // ----- EFFECT: attach/detach all listeners when modal is open -----
  useEffect(() => {
    if (!isModalVisible || !idToUse) return;

    const subs = []; // { path, cb }

    // TOP SCORES: prefer per-player `topScores` aggregate if present (newer flow);
    // otherwise fall back to scanning `scores` (legacy clients).
    const topScoresAggPath = `players/${idToUse}/topScores`;
    const topScoresAggCb = (snapshot) => {
      if (snapshot.exists()) {
        try {
          const arr = snapshot.val();
          if (Array.isArray(arr)) {
            const normalized = arr.map(s => ({ points: Number(s.points || 0), date: s.date, duration: Number(s.duration || 0), time: s.time || '' }));
            setTopScores(normalized.slice(0, NBR_OF_SCOREBOARD_ROWS));
            markUpdate();
            return;
          }
        } catch (e) { /* fallthrough to scores scan */ }
      }

      // If aggregate missing or malformed, fall back to scanning raw scores
      const topScoresPath = `players/${idToUse}/scores`;
      dbGet(topScoresPath).then(snap => {
        if (!snap.exists()) {
          setTopScores([]);
          markUpdate();
          return;
        }
        const scores = snap.val();
        const vals = Object.values(scores).filter(s => s && typeof s === 'object');
        const sorted = vals
          .map(s => ({ points: Number(s.points || 0), date: s.date, duration: Number(s.duration || 0), time: s.time }))
          .sort((a, b) => b.points - a.points)
          .slice(0, NBR_OF_SCOREBOARD_ROWS);
        setTopScores(sorted);
        markUpdate();
      }).catch(() => {
        setTopScores([]);
        markUpdate();
      });
    };
    dbOnValue(topScoresAggPath, topScoresAggCb);
    subs.push({ path: topScoresAggPath, cb: topScoresAggCb });

    // MONTHLY RANKS (aggregates only)
    // Previously this code scanned every player's `scores` tree as a fallback
    // when per-player `monthlyBest` aggregates were missing. That fallback
    // has been disabled to avoid expensive scans for players with many
    // score entries. We now rely solely on `monthlyBest` aggregates; if the
    // aggregate is missing the month will show as '-' until backfill runs.
    const playersPath = 'players';
    const monthlyCb = (snapshot) => {
      if (!snapshot.exists()) {
        setMonthlyRanks(Array(12).fill('-'));
        markUpdate();
        return;
      }
      const playersData = snapshot.val();
      const monthlyScores = Array.from({ length: 12 }, () => []);
      const year = new Date().getFullYear();

      Object.keys(playersData).forEach((pId) => {
        const p = playersData[pId] || {};
        // Prefer aggregated monthlyBest if present
        const mbYear = p.monthlyBest && p.monthlyBest[year] ? p.monthlyBest[year] : null;
        if (mbYear) {
          Object.keys(mbYear).forEach((mKey) => {
            const entry = mbYear[mKey];
            if (!entry || typeof entry !== 'object') return; // skip malformed/null entries
            const monthIndex = Math.max(0, Math.min(11, parseInt(mKey, 10) - 1));
            // entry expected shape: { points, duration, date, scoreKey }
            let ts = Date.now();
            try {
              ts = typeof entry.date === 'number' ? entry.date : new Date(String(entry.date).split('.').reverse().join('-')).getTime();
            } catch (e) { /* keep now */ }
            const candidate = { playerId: pId, points: Number(entry.points || 0), duration: Number(entry.duration || 0), date: ts };
            const existing = monthlyScores[monthIndex].find(s => s.playerId === pId);
            if (!existing || isBetterScore(candidate, existing)) {
              monthlyScores[monthIndex] = monthlyScores[monthIndex].filter(s => s.playerId !== pId);
              monthlyScores[monthIndex].push(candidate);
            }
          });
        } else {
          // Fallback: scan raw scores like before
          const scores = p.scores || {};
          Object.values(scores).forEach((score) => {
            const d = new Date(String(score.date).split('.').reverse().join('-'));
            if (d.getFullYear() === year) {
              const monthIndex = d.getMonth();
              const entry = { playerId: pId, points: score.points, duration: score.duration, date: d.getTime() };
              const existing = monthlyScores[monthIndex].find(s => s.playerId === pId);
              if (!existing || isBetterScore(entry, existing)) {
                monthlyScores[monthIndex] = monthlyScores[monthIndex].filter(s => s.playerId !== pId);
                monthlyScores[monthIndex].push(entry);
              }
            }
          });
        }
      });

      const monthRanks = monthlyScores.map((arr) => {
        if (arr.length === 0) return ' - ';
        arr.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.duration !== b.duration) return a.duration - b.duration;
          return a.date - b.date;
        });
        const idx = arr.findIndex(s => s.playerId === idToUse);
        return idx === -1 ? ' - ' : idx + 1;
      });

      setMonthlyRanks(monthRanks);
      markUpdate();
    };
    dbOnValue(playersPath, monthlyCb);
    subs.push({ path: playersPath, cb: monthlyCb });

    // WEEKLY RANK (prefer per-player weeklyBest if available)
    // WEEKLY RANK (aggregates only)
    // Fallback scanning of raw scores disabled to avoid heavy DB scans.
    const weeklyRankCb = (snapshot) => {
      if (!snapshot.exists()) {
        setWeeklyRank(' - ');
        markUpdate();
        return;
      }
      const playersData = snapshot.val();
      const now = new Date();
      const day = now.getDay();
      const mondayThisWeek = new Date(now);
      mondayThisWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const previousWeekEnd = new Date(mondayThisWeek);
      previousWeekEnd.setDate(mondayThisWeek.getDate() - 1);
      const previousWeekStart = new Date(previousWeekEnd);
      previousWeekStart.setDate(previousWeekEnd.getDate() - 6);

      let weeklyScores = [];
      Object.keys(playersData).forEach((pId) => {
        const p = playersData[pId] || {};
        const wb = p.weeklyBest || null;
        if (wb) {
          // weeklyBest expected keys like '2025-37'
          Object.keys(wb).forEach((wk) => {
            const entry = wb[wk];
            if (!entry || typeof entry !== 'object') return; // skip malformed entries
            let ts = Date.now();
            try { ts = typeof entry.date === 'number' ? entry.date : new Date(String(entry.date).split('.').reverse().join('-')).getTime(); } catch (e) { /* ignore */ }
            const d = new Date(ts);
            if (d >= previousWeekStart && d <= previousWeekEnd) {
              weeklyScores.push({ playerId: pId, points: Number(entry.points || 0), duration: Number(entry.duration || 0), date: ts });
            }
          });
        } else {
          const scores = p.scores || {};
          Object.values(scores).forEach((s) => {
            const d = new Date(String(s.date).split('.').reverse().join('-'));
            if (d >= previousWeekStart && d <= previousWeekEnd) {
              weeklyScores.push({ playerId: pId, points: s.points, duration: s.duration, date: d.getTime() });
            }
          });
        }
      });

      const bestByPlayer = {};
      weeklyScores.forEach(s => {
        const cur = bestByPlayer[s.playerId];
        if (!cur || isBetterScore(s, cur)) bestByPlayer[s.playerId] = s;
      });

      const best = Object.values(bestByPlayer).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (a.duration !== b.duration) return a.duration - b.duration;
        return a.date - b.date;
      });

      const r = best.findIndex(s => s.playerId === idToUse) + 1;
      setWeeklyRank(r === 0 ? ' - ' : r);
      markUpdate();
    };
    dbOnValue(playersPath, weeklyRankCb);
    subs.push({ path: playersPath, cb: weeklyRankCb });

    // WEEKLY WINS (within the year)
    const weeklyWinsCb = (snapshot) => {
      if (!snapshot.exists()) {
        setWeeklyWins(0);
        markUpdate();
        return;
      }
      const playersData = snapshot.val();
      const now = new Date();
      let wins = 0;

      for (let weeksAgo = 0; weeksAgo <= 52; weeksAgo++) {
        const monday = new Date(now);
        monday.setDate(monday.getDate() - monday.getDay() + 1 - weeksAgo * 7);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        let weeklyScores = [];
        Object.keys(playersData).forEach((pId) => {
          const scores = playersData[pId].scores || {};
          Object.values(scores).forEach((s) => {
            const d = new Date(s.date.split('.').reverse().join('-'));
            if (d >= monday && d <= sunday) {
              weeklyScores.push({ playerId: pId, points: s.points, duration: s.duration, date: d.getTime() });
            }
          });
        });

        const bestByPlayer = {};
        weeklyScores.forEach(s => {
          const cur = bestByPlayer[s.playerId];
          if (!cur || isBetterScore(s, cur)) bestByPlayer[s.playerId] = s;
        });

        const best = Object.values(bestByPlayer).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.duration !== b.duration) return a.duration - b.duration;
          return a.date - b.date;
        });

        const winner = best[0];
        if (winner && winner.playerId === idToUse) wins += 1;
      }

      setWeeklyWins(wins);
      markUpdate();
    };
    dbOnValue(playersPath, weeklyWinsCb);
    subs.push({ path: playersPath, cb: weeklyWinsCb });

    // PLAYER STATS (+ progressPoints init)
    // This listener computes aggregates from scores once and then initializes per-player
    // aggregate fields in the player's profile: playedGames, sumPoints, sumDuration.
    // After migration these aggregates should be used by other parts of the app so
    // we can drop per-score retention later to save DB size.
    const statsCb = async (snapshot) => {
      let gamesCount = 0;
      let totalPointsCalc = 0;
      let totalDurationCalc = 0;

      if (snapshot.exists()) {
        const scoresData = snapshot.val();
        gamesCount = Object.keys(scoresData).length;
        Object.values(scoresData).forEach(score => {
          totalPointsCalc += Number(score.points || 0);
          totalDurationCalc += Number(score.duration || 0);
        });
      }

      // Read player's profile to see if aggregates already exist
      try {
        const pSnap = await dbGet(`players/${idToUse}`);
        const pData = pSnap.val() || {};

        // Mark that we've loaded the profile at least once. This prevents
        // immediately falling back to a level-based background for high-tier
        // players before we know if they have an explicit preferredCardBg.
        if (!profileLoaded) setProfileLoaded(true);
        // Normalize and apply preferredCardBg if present (once). We'll use
        // this normalized value for suppress logic below to avoid races.
        let incomingNorm;
        if (typeof pData.preferredCardBg !== 'undefined') {
          const raw = pData.preferredCardBg;
          const norm = raw == null ? null : String(raw).trim().toLowerCase();
          incomingNorm = (norm === 'null' || norm === 'undefined' || norm === '') ? null : norm;
          setPreferredCardBg(incomingNorm);
          setPreferredLoaded(true);
        } else if (idToUse === playerId) {
          incomingNorm = null;
          setPreferredCardBg(null);
          setPreferredLoaded(true);
        }

        // preferred background (optional override)
        // If the preferred background changed in the DB, apply it without
        // triggering the full background loader (which blanks the preview).
        // Use the normalized incoming value for comparison to avoid transient mismatches.
        try {
          if (typeof incomingNorm !== 'undefined' && incomingNorm !== preferredCardBg) {
            suppressBgLoadingRef.current = true;
            if (suppressTimeoutRef.current) clearTimeout(suppressTimeoutRef.current);
            suppressTimeoutRef.current = setTimeout(() => { suppressBgLoadingRef.current = false; suppressTimeoutRef.current = null; }, 800);
          }
        } catch (e) { /* ignore comparison errors */ }

        const hasPlayedGames = typeof pData.playedGames === 'number';
        const hasSumPoints = typeof pData.sumPoints === 'number';
        const hasSumDuration = typeof pData.sumDuration === 'number';

        if (hasPlayedGames && hasSumPoints && hasSumDuration) {
          // Use aggregates from profile (fast, no full scan needed)
          const played = Number(pData.playedGames) || 0;
          const sumPoints = Number(pData.sumPoints) || 0;
          const sumDuration = Number(pData.sumDuration) || 0;
          setPlayedGames(played);
          setAvgPoints(played > 0 ? Math.round(sumPoints / played) : 0);
          setAvgDuration(played > 0 ? Math.round(sumDuration / played) : 0);
          markUpdate();
        } else {
          // Aggregates missing — initialize them from current scores snapshot
          setPlayedGames(gamesCount);
          setAvgPoints(gamesCount > 0 ? Math.round(totalPointsCalc / gamesCount) : 0);
          setAvgDuration(gamesCount > 0 ? Math.round(totalDurationCalc / gamesCount) : 0);
          markUpdate();

          // Write aggregates to DB only if missing (migration step). This avoids
          // overwriting any existing manual or server-side values.
          const updatePayload = {};
          if (!hasPlayedGames) updatePayload.playedGames = gamesCount;
          if (!hasSumPoints) updatePayload.sumPoints = totalPointsCalc;
          if (!hasSumDuration) updatePayload.sumDuration = totalDurationCalc;

          if (Object.keys(updatePayload).length > 0) {
            dbUpdate(`players/${idToUse}`, updatePayload)
              .then(() => console.log('Player aggregates initialized:', updatePayload))
              .catch(err => console.error('Error initializing player aggregates:', err));
          }
        }

        // progressPoints is deprecated: progress is derived from playedGames
      } catch (err) {
        console.error('Error reading player profile for aggregates:', err);
        // Fallback to computed values in case of error
        setPlayedGames(gamesCount);
        setAvgPoints(gamesCount > 0 ? Math.round(totalPointsCalc / gamesCount) : 0);
        setAvgDuration(gamesCount > 0 ? Math.round(totalDurationCalc / gamesCount) : 0);
        markUpdate();
      }
    };
    const statsPath = `players/${idToUse}/scores`;
    dbOnValue(statsPath, statsCb);
    subs.push({ path: statsPath, cb: statsCb });

    // ALL-TIME RANK (prefer per-player allTimeBest aggregate)
    const allTimeCb = (snapshot) => {
      if (!snapshot.exists()) {
        setViewingAllTimeRank(' - ');
        return;
      }
      const playersData = snapshot.val();
      const bestScores = Object.entries(playersData).map(([pId, data]) => {
        const at = data.allTimeBest || null;
        if (at && typeof at.points === 'number') {
          return { playerId: pId, maxScore: Number(at.points) };
        }
        const scores = data.scores || {};
        const maxScore = Object.values(scores)
          .map(s => Number(s.points) || 0)
          .reduce((m, v) => (v > m ? v : m), 0);
        return { playerId: pId, maxScore };
      });
      bestScores.sort((a, b) => b.maxScore - a.maxScore);
      const idx = bestScores.findIndex(item => item.playerId === idToUse);
      setViewingAllTimeRank(idx >= 0 ? idx + 1 : ' - ');
    };
    dbOnValue(playersPath, allTimeCb);
    subs.push({ path: playersPath, cb: allTimeCb });

    // AVATAR & LINKED
    const profilePath = `players/${idToUse}`;
    const avatarCb = (snapshot) => {
      const data = snapshot.val() || {};
      const path = data.avatar || data.avatarUrl || ''; // ← backward compatible
      if (idToUse === playerId) setAvatarUrl(path);
      else setViewingPlayerAvatar(path);
      // Also mark profile loaded when avatar/profile snapshot arrives
      if (!profileLoaded) setProfileLoaded(true);
      markUpdate();
    };
    dbOnValue(profilePath, avatarCb);
    subs.push({ path: profilePath, cb: avatarCb });

    // Preferred background listener: ensure we know the stored preference
    // as soon as possible so we don't fall back to level-based image
    // prematurely when opening from Home.
    const prefPath = `players/${idToUse}/preferredCardBg`;
    const prefCb = (snapshot) => {
      const val = snapshot.exists() ? snapshot.val() : null;
      const norm = val == null ? null : String(val).trim().toLowerCase();
      if (norm === 'null' || norm === 'undefined' || norm === '') setPreferredCardBg(null);
      else setPreferredCardBg(norm);
      if (!preferredLoaded) setPreferredLoaded(true);
      markUpdate();
    };
    dbOnValue(prefPath, prefCb);
    subs.push({ path: prefPath, cb: prefCb });

    const linkedPath = `players/${idToUse}/isLinked`;
    const linkedCb = (snapshot) => {
      setPlayerIsLinked(!!snapshot.val());
      markUpdate();
    };
    dbOnValue(linkedPath, linkedCb);
    subs.push({ path: linkedPath, cb: linkedCb });

    // Stored level (whole player object)
    const levelPath = `players/${idToUse}`;
    const levelCb = (snapshot) => {
      const data = snapshot.val();
      // loaded but maybe no level field
      // normalize strings to lowercase for consistent comparisons
      const lvl = data ? (data.level ?? null) : null;
      setStoredLevel(typeof lvl === 'string' ? lvl.toLowerCase() : lvl);
      markUpdate();
    };
    dbOnValue(levelPath, levelCb);
    subs.push({ path: levelPath, cb: levelCb });

    // Cleanup
    return () => {
      subs.forEach(({ path, cb }) => dbOff(path, cb));
    };
  }, [isModalVisible, idToUse, playerId, setAvatarUrl]);

  

  // When reveal guard flips true, run all reveal animations together (bg, content, ribbons)
  useEffect(() => {
    if (!revealReady || !isModalVisible) return;

    const CONTENT_ANIM_DELAY = 80; // keep small delay so UI feels deliberate
    Animated.sequence([
      Animated.delay(CONTENT_ANIM_DELAY),
      Animated.parallel([
        Animated.timing(bgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(contentTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    // Ribbons: mount and start after revealReady — ensure the ribbon views are
    // mounted and the animated values are at 0 before starting the spring by
    // deferring a short time. We set `ribbonsMounted` just before starting the springs
    // to avoid the static ribbon image being visible for a frame.
    setTimeout(() => {
      setRibbonsMounted(true);
      if (viewingAllTimeRank === 1) {
        try { ribbonAnim.setValue(0); } catch (e) { }
        // stronger, snappier spring for visible pop
        Animated.spring(ribbonAnim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 8 }).start();
      }
      if (playerIsLinked) {
        try { ribbonLinkedAnim.setValue(0); } catch (e) { }
        Animated.spring(ribbonLinkedAnim, { toValue: 1, useNativeDriver: true, tension: 140, friction: 7 }).start();
      }
    }, 60);
  }, [revealReady, isModalVisible, viewingAllTimeRank, playerIsLinked, bgOpacity, contentOpacity, contentTranslate, ribbonAnim, ribbonLinkedAnim]);
  

  // Ribbon animations are handled by the `revealReady` effect above.

  // Decide when the card is ready to reveal: wait for content to settle and,
  // if a background image is required, also wait for it to load.
  useEffect(() => {
    if (!isModalVisible) return;
    const bgReady = needsBgLoad ? imageLoadedRef.current === true : true;
    if (contentSettled && bgReady) {
      setRevealReady(true);
    }

    if (!isModalVisible) {
      setRevealReady(false);
      imageLoadedRef.current = false;
      setContentSettled(false);
      clearSettleTimers();
      setRibbonsMounted(false);
      try { bgOpacity.setValue(0); } catch (e) { }
      try { contentOpacity.setValue(0); contentTranslate.setValue(8); } catch (e) { }
      try { ribbonAnim.setValue(0); ribbonLinkedAnim.setValue(0); } catch (e) { }
    }
  }, [isModalVisible, contentSettled, needsBgLoad]);

  // Get trophy for specific month
  const getTrophyForMonth = (monthIndex) => {
    const rank = monthlyRanks[monthIndex];
    if (rank === ' - ') return <Text style={playerCardStyles.emptySlotText}> - </Text>;
    if (rank === 1) {
      return (
        <View style={playerCardStyles.trophyContainer}>
          <Image source={require('../../assets/trophies/goldTrophy.webp')} style={playerCardStyles.playerCardTrophyImage} />
          <Text style={playerCardStyles.trophyText}>GOLD</Text>
        </View>
      );
    }
    if (rank === 2) {
      return (
        <View style={playerCardStyles.trophyContainer}>
          <Image source={require('../../assets/trophies/silverTrophy.webp')} style={playerCardStyles.playerCardTrophyImage} />
          <Text style={playerCardStyles.trophyText}>SILVER</Text>
        </View>
      );
    }
    if (rank === 3) {
      return (
        <View style={playerCardStyles.trophyContainer}>
          <Image source={require('../../assets/trophies/bronzeTrophy.webp')} style={playerCardStyles.playerCardTrophyImage} />
          <Text style={playerCardStyles.trophyText}>BRONZE</Text>
        </View>
      );
    }
    return (
      <Text
        style={playerCardStyles.rankSlotText}
      >
        {rank}.
      </Text>
    );
  };

  // Decide whether this is own card or viewing someone else
  const isOwnCard = idToUse === playerId;

  // levelResolved: for own card rely on storedLevel only; for other players
  // we accept either storedLevel or viewingPlayerLevel as resolution.
  // For own card treat a 'beginner' storedLevel as unresolved initially so
  // we don't flash the Beginner background while a higher canonical value
  // may still arrive. After a short grace period we accept 'beginner'.
  const storedLevelLower = typeof storedLevel === 'string' ? storedLevel : storedLevel;
  const levelResolved = isOwnCard
    ? (storedLevel !== undefined && (storedLevelLower !== 'beginner' || acceptBeginner))
    : (storedLevel !== undefined || viewingPlayerLevel !== undefined);

  // Start grace timer when modal opens for own card: after 700ms accept beginner
  useEffect(() => {
    if (!isModalVisible || !isOwnCard) return;
    // clear any existing
    if (acceptBeginnerTimerRef.current) {
      clearTimeout(acceptBeginnerTimerRef.current);
      acceptBeginnerTimerRef.current = null;
    }
    setAcceptBeginner(false);
    acceptBeginnerTimerRef.current = setTimeout(() => {
      setAcceptBeginner(true);
      acceptBeginnerTimerRef.current = null;
    }, 700);
    return () => {
      if (acceptBeginnerTimerRef.current) {
        clearTimeout(acceptBeginnerTimerRef.current);
        acceptBeginnerTimerRef.current = null;
      }
    };
  }, [isModalVisible, isOwnCard]);

  // Determine final background: prefer player's explicit choice (preferredCardBg)
  // if set and valid, otherwise fall back to level-based background.
  let playerCardBg = null;
  if (preferredCardBg) {
    // prefer explicit override
    const explicit = getPlayerCardBackground(preferredCardBg);
    if (explicit) playerCardBg = explicit;
  }
  if (!playerCardBg) {
    // Only compute level-based background when we have a resolved level to avoid flashing beginner
    // Additionally, if this is the user's own card and they are high-tier (elite/legendary),
    // don't render the level-based background before we've loaded the profile — this avoids a
    // short flash of the level image before a preferredCardBg from the profile is applied.
  const highTier = typeof levelInfo.level === 'string' && ['elite', 'legendary'].includes(levelInfo.level.toLowerCase());
  // Only allow level-based fallback once we've loaded the stored preferred value
  // (preferredLoaded). This ensures we don't show a transient level image
  // before the user's explicit choice is known.
  const allowLevelBg = preferredLoaded && levelResolved && (!(isOwnCard && highTier) || profileLoaded);
    playerCardBg = allowLevelBg ? getPlayerCardBackground(levelInfo.level) : null;
  }

  // Resolve brightness/style from the actual source used for the background: preferredCardBg
  // if it was applied, else the level-derived background if it was used. If neither is
  // available yet, default to false (treat as light) which avoids flicker.
  let resolvedKey = '';
  if (preferredCardBg) {
    resolvedKey = String(preferredCardBg || '').toLowerCase();
  } else if (playerCardBg) {
    resolvedKey = String(levelInfo.level || '').toLowerCase();
  }
  const bgInfo = PlayercardBg.find(bg => (bg.level || '').toLowerCase() === resolvedKey);
  isDarkBg = !!bgInfo?.isDark;
  const levelKey = (levelInfo.level || '').toLowerCase();
  const isDefaultBg = !playerCardBg && levelResolved && levelKey === 'beginner';
  const needsBgLoad = !playerCardBg && !levelResolved;

  // Show a fullscreen spinner while the correct (non-beginner) background
  // is being resolved. This prevents a quick flash of the BeginnerBG.
  if (isModalVisible && needsBgLoad) {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator
            size="large"
            color={COLORS.info}
            style={{ transform: [{ scale: 1.9 }], margin: 8 }}
          />
        </View>
      </Modal>
    );
  }

  const avatarSrc = getAvatarImage(getAvatarToDisplay());
  // Compute modal container style and hide border while waiting for reveal to avoid
  // showing the thin border together with the centered ActivityIndicator.
  const modalContainerStyle = [
    playerCardStyles.playerCardModalContainer,
    isDarkBg && playerCardStyles.playerCardModalContainerDark,
  ];
  if (!revealReady) {
    modalContainerStyle.push({ borderWidth: 0 });
  }

  return (
    <View style={playerCardStyles.playerCardContainer}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={playerCardStyles.playerCardModalBackground}>
          <View
            style={modalContainerStyle}
            onLayout={(event) => {
              const { height, width } = event.nativeEvent.layout;
              setModalHeight(height);
              setModalWidth(width);
            }}
          >
            {/* Corner ribbon for All-Time #1 */}
            {revealReady && ribbonsMounted && viewingAllTimeRank === 1 && (
              <Animated.View
                style={[
                  playerCardStyles.ribbonImageWrapper,
                  {
                    // Amplified animation so the ribbon 'pops' into place visibly
                    opacity: ribbonAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.9, 1] }),
                    transform: [
                      { translateY: ribbonAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [-32, -8, 0] }) },
                      { scale: ribbonAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 1.12, 1] }) },
                      { rotate: ribbonAnim.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '0deg'] }) },
                    ],
                  },
                ]}
                pointerEvents="none"
              >
                <Image source={require('../../assets/ribbon.webp')} style={playerCardStyles.ribbonImage} />
                <Text style={playerCardStyles.ribbonLabel}>ALL-TIME #1</Text>
              </Animated.View>
            )}
            {/* Linked Ribbon (Animated, separate DOM) */}
            {revealReady && ribbonsMounted && playerIsLinked && (
              <Animated.View
                style={[
                  playerCardStyles.ribbonLinkedImageWrapper,
                  {
                    opacity: ribbonLinkedAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.9, 1] }),
                    transform: [
                      { translateY: ribbonLinkedAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [-28, -6, 0] }) },
                      { scale: ribbonLinkedAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.65, 1.08, 1] }) },
                      { rotate: ribbonLinkedAnim.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] }) },
                    ],
                  },
                ]}
                pointerEvents="none"
              >
                <Image source={require('../../assets/ribbonlinked.webp')} style={playerCardStyles.ribbonImage} />
                <View style={[playerCardStyles.nameAndLinkContainer, { position: 'absolute', left: 8, top: 8, zIndex: 40, transform: [{ rotate: '-45deg' }] }]}> 
                  <FontAwesome5 name="link" size={12} color='white' style={playerCardStyles.ribbonIcon} />
                  <Text style={playerCardStyles.ribbonLinkedLabel}>Linked</Text>
                </View>
              </Animated.View>
            )}
            {/* isBgLoading overlay removed to avoid duplicate spinners; reveal placeholder handles waiting state */}
            <Animated.Image
              source={playerCardBg}
              style={[playerCardStyles.avatarModalBackgroundImage, { opacity: bgOpacity }]}
              onLoadStart={() => {
                imageLoadedRef.current = false;
                // If this load was triggered by a preference change coming from
                // the selector/DB, suppress the loader/opactiy reset so the
                // visible preview doesn't flash to blank. Regular loads will
                // still set the loading flag and reset opacity.
                if (suppressBgLoadingRef.current) {
                  return;
                }
                setIsBgLoading(true);
                // reset opacity when a new image starts loading
                try { bgOpacity.setValue(0); } catch (e) { /* ignore */ }
              }}
              onLoadEnd={() => {
                setIsBgLoading(false);
                imageLoadedRef.current = true;
                // If content already settled, animate immediately; otherwise
                // the effect will be triggered by the contentSettled watcher.
                if (contentSettled) {
                  // delay content/background slightly so ribbons (All-Time) can appear first
                  Animated.sequence([
                    Animated.delay(80),
                    Animated.parallel([
                      Animated.timing(bgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
                      Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                      Animated.timing(contentTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
                    ]),
                  ]).start();
                }
              }}
            />
            {revealReady ? (
              <>
                <CoinLayer weeklyWins={weeklyWins} modalHeight={modalHeight - 2} modalWidth={modalWidth - 20} />

                {/* HEADER */}
                <View style={playerCardStyles.playerCardHeaderCentered}>
                  <View style={playerCardStyles.nameAndLinkContainer}>
                    <Text style={[playerCardStyles.playerCardName, isDarkBg && playerCardStyles.playerCardNameDark]}>{nameToUse}</Text>
                  </View>
                  <Pressable
                    style={playerCardStyles.playerCardCloseButton}
                    onPress={() => {
                      setModalModalVisible(false);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[playerCardStyles.playerCardCloseText, isDarkBg && playerCardStyles.playerCardCloseTextDark]}>X</Text>
                  </Pressable>
                </View>

                {/* Avatar + Stats */}
                <View style={playerCardStyles.playerInfoContainer}>
                  <View style={{ position: 'relative' }}>
                    <View style={isBeginnerAvatar(getAvatarToDisplay()) ? playerCardStyles.avatarContainerBeginner : playerCardStyles.avatarContainer}>
                      {avatarSrc ? (
                        <Image
                          style={isBeginnerAvatar(getAvatarToDisplay()) ? playerCardStyles.beginnerAvatar : [playerCardStyles.avatar, playerCardStyles.defaultAvatar]}
                          source={avatarSrc}
                        />
                      ) : (
                        <View
                          style={isBeginnerAvatar(getAvatarToDisplay()) ? [playerCardStyles.beginnerAvatar, { alignItems: 'center', justifyContent: 'center' }] : [playerCardStyles.avatar, playerCardStyles.defaultAvatar, { alignItems: 'center', justifyContent: 'center' }]}
                        >
                          <FontAwesome5 name="user" size={36} color="#000000" />
                        </View>
                      )}
                    </View>
                    {idToUse === playerId && (
                      <Pressable style={playerCardStyles.editAvatarButton} onPress={() => setIsAvatarModalVisible(true)}>
                        <FontAwesome5 name="edit" size={15} color="white" />
                      </Pressable>
                    )}
                  </View>

                  <View style={[playerCardStyles.playerTextContainer]}>
                    <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark, {textAlign: 'center'}]}>Progress:</Text>
                    <View style={playerCardStyles.progressBar}>
                      <View style={[playerCardStyles.progressFill, { width: `${levelInfo.progress * 100}%` }]} />
                      <Text style={playerCardStyles.progressPercentageText}>{Math.floor(levelInfo.progress * 100)}%</Text>
                    </View>
                    <View style={playerCardStyles.playerStatsContainer}>
                      <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>All Time Rank: {viewingAllTimeRank}</Text>
                      <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>Weekly Wins: {weeklyWins}</Text>
                      <View onLayout={(e) => setPlayedGamesOffset({ y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height })} style={{ alignSelf: 'flex-start' }}>
                        <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>Played Games: {playedGames}</Text>
                      </View>
                      <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>Avg. Points/Game: {avgPoints}</Text>
                      <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>Avg Duration/Game: {avgDuration} s</Text>

                      {/* Absolute badge positioned to the right of the stats container, vertically aligned with Played Games */}
                      {badgeHit && badgeHit.display && playedGamesOffset !== null && (
                        (() => {
                          const fallbackBadgeH = 80; // matches playerStatsBadgeAbsolute in styles
                          const badgeH = badgeHeight !== null ? badgeHeight : fallbackBadgeH;
                          const top = Math.max(0, Math.round(playedGamesOffset.y + (playedGamesOffset.h / 2) - (badgeH / 2)));
                          return (
                            <Image
                              source={badgeHit.display}
                              resizeMode="cover"
                              onLayout={(e) => {
                                  const h = Math.round(e.nativeEvent.layout.height || 0);
                                  const prev = Math.round(badgeHeight || 0);
                                  // Only update if change is significant (>1px) to avoid jitter
                                  if (h > 0 && Math.abs(h - prev) > 1) {
                                    setBadgeHeight(h);
                                  }
                                }}
                              style={[playerCardStyles.playerStatsBadgeAbsolute, { top }]}
                            />
                          );
                        })()
                      )}
                    </View>
                  </View>
                </View>

                {/* TOP SCORES */}
                <Text style={[playerCardStyles.playerCardScoresTitle, isDarkBg && playerCardStyles.playerCardTextDark]}>TOP 5 SCORES</Text>
                <View style={playerCardStyles.playerCardScoresContainer} contentContainerStyle={{ paddingTop: 2, paddingBottom: 5, flexGrow: 0 }}>
                  {getTopScoresWithEmptySlots().map((score, index) => (
                    <View
                      key={index}
                      style={[
                        playerCardStyles.scoreRow,
                        index % 2 === 0
                          ? [playerCardStyles.evenRow, isDarkBg && playerCardStyles.evenRowDark]
                          : [playerCardStyles.oddRow, isDarkBg && playerCardStyles.oddRowDark]
                      ]}
                    >
                      <Text style={[playerCardStyles.playerCardScoreItem, isDarkBg && playerCardStyles.playerCardTextDark]}>
                        {index + 1}. {score ? `${score.points} points in ${score.duration} sec` : ' - '}
                      </Text>
                      <Text style={[playerCardStyles.playerCardScoreDate, isDarkBg && playerCardStyles.playerCardTextDark]}>{score ? score.date : ''}</Text>
                    </View>
                  ))}
                </View>

                {/* TROPHIES */}
                <View style={playerCardStyles.playerCardTrophyCase}>
                  <Text style={[playerCardStyles.playerCardTrophyCaseTitle, isDarkBg && playerCardStyles.playerCardTextDark]}>TROPHIES {currentYear}</Text>
                  <View style={playerCardStyles.playerCardMonthsContainer}>
                    {Array(12).fill(null).map((_, index) => (
                      <View
                        key={index}
                        style={[
                          playerCardStyles.playerCardMonth,
                          index === currentMonth ? playerCardStyles.playerCardOngoingMonth : null,
                          isDarkBg && playerCardStyles.playerCardMonthDark,
                        ]}
                      >
                        <Text style={playerCardStyles.playerCardMonthText}>{monthNames[index]}</Text>
                        {getTrophyForMonth(index)}
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              // While waiting for reveal: keep modal container, ribbons visible, but
              // don't render the heavy columns. Show a subtle centered spinner.
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
                <ActivityIndicator
                  size="large"
                  color={COLORS.info}
                  style={{ transform: [{ scale: 1.9 }], margin: 6 }}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Avatar-picker modal */}
      <AvatarContainer
        isVisible={isAvatarModalVisible}
        onClose={() => setIsAvatarModalVisible(false)}
        avatars={avatars}
        handleAvatarSelect={handleAvatarSelect}
        playerLevel={playerLevel}
      />
    </View>
  );
}
