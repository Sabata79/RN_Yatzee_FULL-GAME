// components/GameSave.js
import { useGame } from './GameContext';
import { dbGet, dbSet, dbRef, push } from './Firebase';
import { TOPSCORELIMIT } from '../constants/Game';

const GameSave = ({ totalPoints, navigation }) => {
  const { playerId, elapsedTime, saveGame } = useGame();

  const savePlayerPoints = async () => {
    if (!playerId) {
      console.error('Player ID is missing in GameSave.');
      return;
    }
    if (totalPoints === undefined || totalPoints === null) {
      console.error('Total points is undefined or null');
      return;
    }

    try {
      // Hae pelaajan data
      const snap = await dbGet(`players/${playerId}`);
      const playerData = snap.val();

      if (!playerData) {
        console.error('Player data not found');
        return;
      }

      // Luo uusi avain scorelle
      const scoresPath = `players/${playerId}/scores`;
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

      // Päivitä top-lista (yhdistä vanhat + uusi → järjestä → rajaa)
      const prevScores = playerData.scores ? Object.values(playerData.scores) : [];
      const updatedScores = [...prevScores, playerPoints].sort((a, b) => b.points - a.points);
      const topScores = updatedScores.slice(0, TOPSCORELIMIT);

      // Kirjoita takaisin objektina avaimilla
      const scoresObj = topScores.reduce((acc, s) => {
        acc[s.key] = s;
        return acc;
      }, {});

      await dbSet(scoresPath, scoresObj);

      saveGame();
      navigation.navigate('Scoreboard');
    } catch (error) {
      console.error('Error saving player points:', error?.message ?? String(error));
    }
  };

  return { savePlayerPoints };
};

export default GameSave;
