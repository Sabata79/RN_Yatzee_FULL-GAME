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

        // Tallennetaan top 5 all-time scores
        const scoresRef = ref(database, `players/${playerId}/scores`);
        await set(scoresRef, topFiveScores.reduce((acc, score) => {
          acc[score.key] = score;
          return acc;
        }, {}));

        // Monthly scores
        const currentMonth = new Date().getMonth();
        const lastSavedMonth = playerData.lastSavedMonth || -1;

        // Jos kuukausi on muuttunut, tyhjennetään scoresMonthly
        if (lastSavedMonth !== currentMonth) {
          const scoresMonthlyRef = ref(database, `players/${playerId}/scoresMonthly`);
          await set(scoresMonthlyRef, {}); // Tyhjennetään kuukauden tulokset
          await set(ref(database, `players/${playerId}/lastSavedMonth`), currentMonth); // Päivitetään kuukauden tallennus
        }

        // Hae ja päivitä monthly top 5
        const currentMonthlyScores = playerData.scoresMonthly ? Object.values(playerData.scoresMonthly) : [];

        currentMonthlyScores.push(playerPoints); // Lisää uusi pisteet
        currentMonthlyScores.sort((a, b) => b.points - a.points); // Järjestä parhaiden mukaan

        const topFiveMonthlyScores = currentMonthlyScores.slice(0, 5); // Pidä vain top 5

        const scoresMonthlyRef = ref(database, `players/${playerId}/scoresMonthly`);
        await set(scoresMonthlyRef, topFiveMonthlyScores.reduce((acc, score) => {
          acc[score.key] = score;
          return acc;
        }, {}));

        // Päivitä välimuisti ja navigoi tulostaululle
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
