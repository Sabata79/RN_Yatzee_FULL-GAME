/**
 * GameSave – hooks and helpers for saving game results and player progress.
 * Provides useGameSave hook for saving points, duration, and player data to backend.
 * Uses dbRunTransaction to atomically update per-player aggregates (playedGames, sumPoints, sumDuration).
 * @module GameSave
 * @since 2025-09-18
 */
import { useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useElapsedTime } from './ElapsedTimeContext';
import { useGame } from './GameContext';
import { dbGet, dbSet, dbRef, push, dbRunTransaction } from '../services/Firebase';
import { TOPSCORELIMIT } from './Game';

export function useGameSave() {
  const { playerId, elapsedTime: ctxElapsed, saveGame } = useGame();
  const { elapsedTime: hookElapsed } = { elapsedTime: ctxElapsed };
  const elapsedTime = hookElapsed ?? 0;

  const resolvePlayerId = useCallback(async () => {
    if (playerId) return playerId;
    try {
      const stored = await SecureStore.getItemAsync('user_id');
      return stored || '';
    } catch {
      return '';
    }
  }, [playerId]);

  const savePlayerPoints = useCallback(
    async ({ totalPoints, duration } = {}) => {
      const uid = await resolvePlayerId();
      if (!uid) {
        console.error('[GameSave] Missing playerId');
        return false;
      }
      if (typeof totalPoints !== 'number' || Number.isNaN(totalPoints)) {
        console.error('[GameSave] totalPoints is not a valid number');
        return false;
      }

      try {
        // Fetch current player data
        const snap = await dbGet(`players/${uid}`);
        const playerData = snap.val() || {};

        // Create a new score entry
        const scoresPath = `players/${uid}/scores`;
        const newRef = push(dbRef(scoresPath));
        const newKey = newRef.key;
        const now = new Date();
        const formattedDate = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
        const durationSecs = typeof duration === 'number' ? duration : elapsedTime;

        const newEntry = {
          key: newKey,
          date: formattedDate,
          time: now.toLocaleTimeString(),
          points: totalPoints,
          duration: durationSecs,
        };

        // Merge old + new, sort and trim
        const prevScores = playerData.scores ? Object.values(playerData.scores) : [];
        const merged = [...prevScores, newEntry].sort((a, b) => {
          if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
          if ((a.duration || 0) !== (b.duration || 0)) return (a.duration || 0) - (b.duration || 0);
          const da = new Date(String(a.date).split('.').reverse().join('-'));
          const db = new Date(String(b.date).split('.').reverse().join('-'));
          return da - db;
        }).slice(0, TOPSCORELIMIT);

        const scoresObj = merged.reduce((acc, s) => {
          acc[s.key] = s;
          return acc;
        }, {});

        await dbSet(scoresPath, scoresObj);

        // Atomically update aggregates using transaction
        try {
          await dbRunTransaction(`players/${uid}`, (current) => {
            if (current == null) return current; // player removed
            const played = Number(current.playedGames || 0) + 1;
            const sumP = Number(current.sumPoints || 0) + Number(totalPoints || 0);
            const sumD = Number(current.sumDuration || 0) + Number(durationSecs || 0);
            return { ...current, playedGames: played, sumPoints: sumP, sumDuration: sumD };
          });
        } catch (txErr) {
          console.error('[GameSave] Aggregates transaction failed', txErr);
        }

        // Recompute ranks (all-time/monthly/weekly) and update lastRank
        try {
          const allPlayersSnap = await dbGet('players');
          const allPlayers = allPlayersSnap.val() || {};
          const nowDate = new Date();
          const currentMonth = nowDate.getMonth();
          const currentYear = nowDate.getFullYear();

          const getWeekNumber = (date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
          };
          const currentWeek = getWeekNumber(nowDate);

          const getBestScore = (scores, filterFn) => {
            const filtered = scores.filter(filterFn);
            if (filtered.length === 0) return null;
            return filtered.reduce((best, s) => {
              if (!best) return s;
              if (s.points > best.points) return s;
              if (s.points === best.points && s.duration < best.duration) return s;
              if (s.points === best.points && s.duration === best.duration && new Date(s.date) < new Date(best.date)) return s;
              return best;
            }, null);
          };

          const playerRanks = { allTime: [], monthly: [], weekly: [] };
          Object.entries(allPlayers).forEach(([pid, pdata]) => {
            const scores = pdata.scores ? Object.values(pdata.scores) : [];
            const bestAll = getBestScore(scores, () => true);
            if (bestAll) playerRanks.allTime.push({ playerId: pid, ...bestAll });
            const bestMonth = getBestScore(scores, (s) => {
              const parts = String(s.date).split('.');
              if (parts.length !== 3) return false;
              const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            if (bestMonth) playerRanks.monthly.push({ playerId: pid, ...bestMonth });
            const bestWeek = getBestScore(scores, (s) => {
              const parts = String(s.date).split('.');
              if (parts.length !== 3) return false;
              const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
            });
            if (bestWeek) playerRanks.weekly.push({ playerId: pid, ...bestWeek });
          });

          const sortScores = (arr) => arr.sort((a, b) => {
            if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
            if ((a.duration || 0) !== (b.duration || 0)) return (a.duration || 0) - (b.duration || 0);
            return new Date(a.date) - new Date(b.date);
          });
          const allTimeSorted = sortScores(playerRanks.allTime);
          const monthlySorted = sortScores(playerRanks.monthly);
          const weeklySorted = sortScores(playerRanks.weekly);

          const findRank = (arr, pid) => arr.findIndex(p => p.playerId === pid) + 1;
          const lastRank = {
            allTime: findRank(allTimeSorted, uid),
            monthly: findRank(monthlySorted, uid),
            weekly: findRank(weeklySorted, uid),
          };

          await dbSet(`players/${uid}/lastRank`, lastRank);
        } catch (rankErr) {
          console.error('[GameSave] Ranking update failed', rankErr);
        }

        if (typeof saveGame === 'function') saveGame();
        return true;
      } catch (err) {
        console.error('[GameSave] Save error:', err?.message || String(err));
        return false;
      }
    },
    [resolvePlayerId, elapsedTime, saveGame]
  );

  return { savePlayerPoints };
}
