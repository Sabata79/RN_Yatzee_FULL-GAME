/**
 * GameSave.js - Save player scores & duration
 */
import * as SecureStore from 'expo-secure-store';
import { useGame } from '../constants/GameContext';
import { dbGet, dbSet, dbRef, push } from '../services/Firebase';
import { TOPSCORELIMIT } from '../constants/Game';

const GameSave = ({ totalPoints, durationOverride } = {}) => {
  const { playerId, elapsedTime, saveGame } = useGame();

  // Fallback: if playerId missing in context, read from SecureStore
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
    if (typeof totalPoints !== 'number') {
      console.error('Total points is undefined or not a number');
      return false;
    }

    try {
      // Fetch player data
      const snap = await dbGet(`players/${uid}`);
      const playerData = snap.val() || {};

      // Preserve existing keys from the DB
      const prevEntries = playerData.scores
        ? Object.entries(playerData.scores).map(([key, val]) => ({
            ...val,
            key: val?.key || key,
          }))
        : [];

      // Create a key for the new score
      const scoresPath = `players/${uid}/scores`;
      const newRef = push(dbRef(scoresPath));
      const newKey = newRef.key;

      const now = new Date();
      const formattedDate = now.toLocaleDateString('fi-FI');

      const duration =
        typeof durationOverride === 'number'
          ? durationOverride
          : typeof elapsedTime === 'number'
          ? elapsedTime
          : 0;

      const playerPoints = {
        key: newKey,
        date: formattedDate,
        time: now.toLocaleTimeString(),
        points: totalPoints,
        duration, // <- save elapsed time here
      };

      // Merge + sort + limit
      const updated = [...prevEntries, playerPoints]
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;              // higher points first
          if ((a.duration ?? 0) !== (b.duration ?? 0)) return (a.duration ?? 0) - (b.duration ?? 0); // shorter duration wins
          return new Date(a.date) - new Date(b.date);                          // earlier date wins
        })
        .slice(0, TOPSCORELIMIT);

      // Write back as { key: score, ... }
      const scoresObj = updated.reduce((acc, s) => {
        acc[s.key] = s;
        return acc;
      }, {});

      await dbSet(scoresPath, scoresObj);

      // Mark the game as saved (if provided in context)
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
