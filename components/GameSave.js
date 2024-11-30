import { useGame } from './GameContext';
import { database } from './Firebase';
import { ref, set, push, get } from 'firebase/database';

const GameSave = ({ totalPoints, navigation }) => { 

  const { playerId, elapsedTime, saveGame } = useGame();


  const savePlayerPoints = async () => {

    if (!playerId) {
      console.error("Player ID is missing in GameSave.");
      return;
    }

    if (totalPoints === undefined || totalPoints === null) {
      console.error("Total points is undefined or null");
      return;
    }

    try {
      const playerRef = ref(database, `players/${playerId}`);
      const snapshot = await get(playerRef);
      const playerData = snapshot.val();

      if (playerData) {
        const newKey = push(ref(database, `players/${playerId}/scores`)).key;
        const playerPoints = {
          key: newKey,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          points: totalPoints,
          duration: elapsedTime,
        };

        const updatedScores = playerData.scores ? Object.values(playerData.scores) : [];
        updatedScores.push(playerPoints);
        updatedScores.sort((a, b) => b.points - a.points);

        const topFiveScores = updatedScores.slice(0, 5);

        const scoresRef = ref(database, `players/${playerId}/scores`);
        await set(scoresRef, topFiveScores.reduce((acc, score) => {
          acc[score.key] = score;
          return acc;
        }, {}));
        saveGame();
        navigation.navigate('Scoreboard');
      } else {
        console.error("Player data not found");
      }
    } catch (error) {
      console.error("Error saving player points: ", error.message);
    }
  };

  return { savePlayerPoints };
};

export default GameSave;
