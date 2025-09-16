/**
 * GameSave – Persist player scores and duration to Firebase.
 *
 * Usage:
 *   import GameSave from '@/constants/GameSave';
 *   const { savePlayerPoints } = GameSave({ totalPoints, durationOverride });
 *   const ok = await savePlayerPoints();
 *
 * Behavior:
 * - Resolves playerId from GameContext or SecureStore.
 * - Creates/updates `players/{uid}/scores` with:
 *   { key, date (fi-FI), time (locale), points, duration }
 * - Merges prior entries, sorts by (points desc, duration asc, date asc), and trims to TOPSCORELIMIT.
 * - Calls `saveGame()` in context when successful (used to reset timer in RenderFirstRow).
 *
 * Params:
 * - totalPoints {number} – required total score to save.
 * - durationOverride {number} – optional elapsed seconds; defaults to context elapsedTime.
 *
 * @module constants/GameSave.js
 * @author Sabata79
 * @since 2025-09-16
 */
import * as SecureStore from 'expo-secure-store';
import { useGame } from './GameContext';
import { dbGet, dbSet, dbRef, push } from '../services/Firebase';
import { TOPSCORELIMIT } from './Game';

const GameSave = ({ totalPoints }) => {
  const { playerId, elapsedTime, saveGame } = useGame();

  // Fallback: if playerId is missing from context, fetch from SecureStore
  const resolvePlayerId = async () => {
    if (playerId) return playerId;
    try {
      const stored = await SecureStore.getItemAsync('user_id');
      return stored || '';
    } catch {
      return '';
    }
  };

  const savePlayerPoints = async () => {
    const uid = await resolvePlayerId();
    if (!uid) {
      console.error('Player ID is missing in GameSave.');
      return false;
    }
    if (totalPoints === undefined || totalPoints === null) {
      console.error('Total points is undefined or null');
      return false;
    }

    try {
      // Fetch player data
      const snap = await dbGet(`players/${uid}`);
      const playerData = snap.val();

      if (!playerData) {
        console.error('Player data not found');
        return false;
      }

      // Create a new key for the score
      const scoresPath = `players/${uid}/scores`;
      const newRef = push(dbRef(scoresPath));
      const newKey = newRef.key;

      const now = new Date();
      const formattedDate = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;

      const playerPoints = {
        key: newKey,
        date: formattedDate,
        time: now.toLocaleTimeString(),
        points: totalPoints,
        duration: elapsedTime,
      };

      // Update top scores (merge old + new, sort, limit)
      const prevScores = playerData.scores ? Object.values(playerData.scores) : [];
      const updatedScores = [...prevScores, playerPoints].sort((a, b) => b.points - a.points);
      const topScores = updatedScores.slice(0, TOPSCORELIMIT);

      // Write back as an object with keys
      const scoresObj = topScores.reduce((acc, s) => {
        acc[s.key] = s;
        return acc;
      }, {});


      await dbSet(scoresPath, scoresObj);

      // --- Update lastRank fields for AllTime, Monthly, Weekly ---
      // Fetch all players for ranking
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

      // Helper to get best score for a player by filter
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

      // Build ranking arrays
      const playerRanks = { allTime: [], monthly: [], weekly: [] };
      Object.entries(allPlayers).forEach(([pid, pdata]) => {
        const scores = pdata.scores ? Object.values(pdata.scores) : [];
        // AllTime: best score
        const bestAll = getBestScore(scores, () => true);
        if (bestAll) playerRanks.allTime.push({ playerId: pid, ...bestAll });
        // Monthly: best score this month
        const bestMonth = getBestScore(scores, (s) => {
          const parts = s.date.split('.');
          if (parts.length !== 3) return false;
          const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        if (bestMonth) playerRanks.monthly.push({ playerId: pid, ...bestMonth });
        // Weekly: best score this week
        const bestWeek = getBestScore(scores, (s) => {
          const parts = s.date.split('.');
          if (parts.length !== 3) return false;
          const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
        });
        if (bestWeek) playerRanks.weekly.push({ playerId: pid, ...bestWeek });
      });

      // Sort and find ranks
      const sortScores = (arr) => arr.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (a.duration !== b.duration) return a.duration - b.duration;
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

      // Update player lastRank field
      await dbSet(`players/${uid}/lastRank`, lastRank);

      // Mark the game as saved
      if (typeof saveGame === 'function') saveGame();

      return true;
    } catch (error) {
      console.error('Error saving player points:', error?.message ?? String(error));
      return false;
    }
  };

  return { savePlayerPoints };
};

export default GameSave;
