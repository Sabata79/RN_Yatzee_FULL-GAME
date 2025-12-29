/**
 * GameSave – hooks and helpers for saving game results and player progress.
 * Provides useGameSave hook for saving points, duration, and player data to backend.
 * Uses dbRunTransaction to atomically update per-player aggregates (playedGames, sumPoints, sumDuration).
 * @module GameSave
 * @since 2025-09-18
 * @updated 2025-09-27
 */
import { useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useElapsedTime } from './ElapsedTimeContext';
import { useGame } from './GameContext';
import { dbGet, dbSet, dbRef, push, dbRunTransaction } from '../services/Firebase';
import { isBetterScore } from '../utils/scoreUtils';
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

        // Determine existing scores and initialize aggregates if missing
        const scoresPath = `players/${uid}/scores`;
        const hasScores = playerData.scores && typeof playerData.scores === 'object' && Object.keys(playerData.scores).length > 0;
        const aggregatesMissing = (playerData.playedGames === undefined || playerData.playedGames === null) || (playerData.sumPoints === undefined || playerData.sumPoints === null) || (playerData.sumDuration === undefined || playerData.sumDuration === null);

        if (aggregatesMissing && hasScores) {
          // Compute aggregates from existing scores and write missing fields (conservative: only write missing ones)
          const existingScores = Object.values(playerData.scores).map(s => ({ points: Number(s.points || 0), duration: Number(s.duration || 0) }));
          const existingCount = existingScores.length;
          const existingSumPoints = existingScores.reduce((a, b) => a + (b.points || 0), 0);
          const existingSumDuration = existingScores.reduce((a, b) => a + (b.duration || 0), 0);
          const initUpdates = {};
          if (playerData.playedGames === undefined || playerData.playedGames === null) initUpdates[`players/${uid}/playedGames`] = existingCount;
          if (playerData.sumPoints === undefined || playerData.sumPoints === null) initUpdates[`players/${uid}/sumPoints`] = existingSumPoints;
          if (playerData.sumDuration === undefined || playerData.sumDuration === null) initUpdates[`players/${uid}/sumDuration`] = existingSumDuration;
          // Initialize topScores from existing scores (take TOPSCORELIMIT best)
          try {
            const normalized = Object.values(playerData.scores || {}).map(s => ({
              id: s.id || String(Date.now()),
              date: s.date,
              time: s.time || '',
              points: Number(s.points || 0),
              duration: Number(s.duration || 0),
            }));
            normalized.sort((a, b) => {
              if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
              if ((a.duration || 0) !== (b.duration || 0)) return (a.duration || 0) - (b.duration || 0);
              return new Date(a.date) - new Date(b.date);
            });
            const topN = normalized.slice(0, TOPSCORELIMIT);
            if (!playerData.topScores || !Array.isArray(playerData.topScores)) {
              initUpdates[`players/${uid}/topScores`] = topN;
            }
          } catch (e) {
            // ignore backfill topScores failure
          }
          if (Object.keys(initUpdates).length > 0) {
            // write only the missing fields
            try {
              // use multiple sets sequentially to reuse dbSet helper
              const entries = Object.entries(initUpdates);
              for (const [p, v] of entries) {
                await dbSet(p, v);
              }
            } catch (initErr) {
              console.error('[GameSave] Failed to initialize aggregates from existing scores', initErr);
            }
          }
        }

        // Prepare new score entry metadata (we intentionally do NOT push into the
        // `scores` tree here — migrated flow stores aggregates instead). We keep a
        // small identifier so records written into aggregate objects are traceable.
        const now = new Date();
        const formattedDate = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
        const durationSecs = typeof duration === 'number' ? duration : elapsedTime;
        const scoreId = String(now.getTime());
        const newEntry = {
          id: scoreId,
          date: formattedDate,
          time: now.toLocaleTimeString(),
          points: Number(totalPoints),
          duration: Number(durationSecs),
        };

        // Atomically update aggregates and per-period bests using a transaction.
        // This keeps player profile consistent and avoids racing writes to
        // monthlyBest/weeklyBest/allTimeBest.
        try {
          const getWeekNumber = (date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
          };

          await dbRunTransaction(`players/${uid}`, (current) => {
            const nowDate = now;
            const year = nowDate.getFullYear();
            const month = nowDate.getMonth() + 1; // 1..12
            const week = getWeekNumber(nowDate);
            const weekKey = `${year}-${String(week).padStart(2, '0')}`;

            // If player node missing, initialize minimal structure including the per-period maps
            if (current == null || typeof current !== 'object') {
              const monthlyBest = { [year]: { [String(month)]: newEntry } };
              const weeklyBest = { [weekKey]: newEntry };
              return {
                playedGames: 1,
                sumPoints: Number(totalPoints || 0),
                sumDuration: Number(durationSecs || 0),
                monthlyBest,
                weeklyBest,
                allTimeBest: newEntry,
              };
            }

            // Update played/sum aggregates
            const played = Number(current.playedGames || 0) + 1;
            const sumP = Number(current.sumPoints || 0) + Number(totalPoints || 0);
            const sumD = Number(current.sumDuration || 0) + Number(durationSecs || 0);

            // Clone or prepare per-period maps
            const monthlyBest = JSON.parse(JSON.stringify(current.monthlyBest || {}));
            if (!monthlyBest[year]) monthlyBest[year] = {};
            const existingMonth = monthlyBest[year][String(month)];
            if (!existingMonth || isBetterScore(newEntry, existingMonth)) {
              monthlyBest[year][String(month)] = newEntry;
            }

            const weeklyBest = JSON.parse(JSON.stringify(current.weeklyBest || {}));
            const existingWeek = weeklyBest[weekKey];
            if (!existingWeek || isBetterScore(newEntry, existingWeek)) {
              weeklyBest[weekKey] = newEntry;
            }

            const existingAll = current.allTimeBest || null;
            let allTimeBest = existingAll;
            if (!existingAll || isBetterScore(newEntry, existingAll)) {
              allTimeBest = newEntry;
            }

            // Maintain topScores array (best TOPSCORELIMIT entries)
            const currentTop = Array.isArray(current.topScores) ? JSON.parse(JSON.stringify(current.topScores)) : [];
            // push and dedupe by id (use newEntry.id)
            currentTop.push(newEntry);
            // sort by same ordering used elsewhere
            currentTop.sort((a, b) => {
              if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
              if ((a.duration || 0) !== (b.duration || 0)) return (a.duration || 0) - (b.duration || 0);
              return new Date(a.date) - new Date(b.date);
            });
            const topScores = currentTop.slice(0, TOPSCORELIMIT);

            // Compute level by playedGames thresholds (same rules as PlayerCard)
            const computeLevel = (games) => {
              let lvl = 'beginner';
              if (games >= 2000) lvl = 'legendary';
              else if (games >= 1201) lvl = 'elite';
              else if (games >= 801) lvl = 'advanced';
              else if (games >= 401) lvl = 'basic';
              return lvl;
            };

            const level = computeLevel(played);

            return { ...current, playedGames: played, sumPoints: sumP, sumDuration: sumD, monthlyBest, weeklyBest, allTimeBest, level, topScores };
          });
        } catch (txErr) {
          console.error('[GameSave] Aggregates transaction failed', txErr);
        }

        // Recompute ranks (all-time/monthly/weekly) and update lastRank
        try {
          const allPlayersSnap = await dbGet('players');
          const allPlayers = allPlayersSnap && typeof allPlayersSnap.val === 'function' ? (allPlayersSnap.val() || {}) : (allPlayersSnap || {});
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

          const playerRanks = { allTime: [], monthly: [], weekly: [] };
          
          Object.entries(allPlayers).forEach(([pid, pdata]) => {
            // Use aggregates (preferred) with fallback to legacy scores
            const aggAll = pdata?.allTimeBest || null;
            if (aggAll) {
              playerRanks.allTime.push({ playerId: pid, ...aggAll });
            }

            const monMap = pdata?.monthlyBest && pdata.monthlyBest[currentYear] ? pdata.monthlyBest[currentYear] : null;
            const aggMon = monMap ? monMap[String(currentMonth + 1)] : null;
            if (aggMon) {
              playerRanks.monthly.push({ playerId: pid, ...aggMon });
            }

            // Try both weekKey formats: with zero-padding (new) and without (legacy)
            const weekKeyPadded = `${currentYear}-${String(currentWeek).padStart(2, '0')}`;
            const weekKeyUnpadded = `${currentYear}-${currentWeek}`;
            let aggWeek = pdata?.weeklyBest && pdata.weeklyBest[weekKeyPadded] ? pdata.weeklyBest[weekKeyPadded] : null;
            if (!aggWeek && pdata?.weeklyBest) {
              aggWeek = pdata.weeklyBest[weekKeyUnpadded] || null;
            }
            if (aggWeek) {
              playerRanks.weekly.push({ playerId: pid, ...aggWeek });
            }
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

        // Score trimming removed intentionally: the app now stores per-period
        // aggregates (monthlyBest, weeklyBest, allTimeBest) and core counters.
        // We do not delete individual score entries here to avoid accidental
        // data loss. Trimming / archival should be a separate, reviewed admin
        // operation.

        if (typeof saveGame === 'function') saveGame();
        return true;
      } catch (err) {
        console.error('[GameSave] Save error:', err?.message || String(err));
        return false;
      }
    },
    [playerId, elapsedTime, resolvePlayerId, saveGame]
  );

  return { savePlayerPoints };
}
