// GameSave utility for saving player scores
import * as SecureStore from 'expo-secure-store';
import { useGame } from './GameContext';
import { dbGet, dbSet, dbRef, push } from './Firebase';
import { TOPSCORELIMIT } from '../constants/Game';

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
