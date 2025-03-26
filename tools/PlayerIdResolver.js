// DEVELOPER NOTE: The following functions are used to fetch and update player data from Firebase.

// import { ref, get, set } from 'firebase/database';
// import { database } from './Firebase';

// const updatePlayerId = async (oldPlayerId, newPlayerId) => {
//   try {
//     const oldPlayerRef = ref(database, `players/${oldPlayerId}`);
//     const newPlayerRef = ref(database, `players/${newPlayerId}`);

//     // Haetaan molempien tilien tiedot
//     const [oldSnapshot, newSnapshot] = await Promise.all([
//       get(oldPlayerRef),
//       get(newPlayerRef),
//     ]);

//     if (oldSnapshot.exists()) {
//       const oldPlayerData = oldSnapshot.val();
//       const newPlayerData = newSnapshot.exists() ? newSnapshot.val() : {};

//       // ✅ Muunnetaan scores-objekti taulukoksi (jos on olemassa)
//       const oldScores = oldPlayerData.scores ? Object.values(oldPlayerData.scores) : [];
//       const newScores = newPlayerData.scores ? Object.values(newPlayerData.scores) : [];

//       // ✅ Yhdistetään tulokset ilman yliajoa
//       const mergedScores = [...newScores, ...oldScores];

//       // ✅ Luodaan uusi data, jossa molemmat tulokset yhdistetään
//       const mergedData = {
//         ...newPlayerData,   // Uuden tilin tiedot säilytetään
//         ...oldPlayerData,   // Vanhan tilin tiedot lisätään (ei yliajoa)
//         scores: mergedScores.reduce((acc, score) => {
//           acc[score.key] = score; // Tallennetaan takaisin objektiksi Firebase-yhteensopivasti
//           return acc;
//         }, {}),
//       };

//       // ✅ Päivitetään uusi tili yhdistetyillä tiedoilla
//       await set(newPlayerRef, mergedData);

//       // 🗑️ Valinnainen: poistetaan vanhan ID:n tiedot
//       // await set(oldPlayerRef, null);

//       console.log(`✅ Pelaajan tiedot yhdistetty uuteen ID:hen: ${newPlayerId}`);
//     } else {
//       console.log('⚠️ Vanhan ID:n tiedot eivät löytyneet.');
//     }
//   } catch (error) {
//     console.error('❌ Virhe pelaajan ID:n yhdistämisessä:', error);
//   }
// };

// // 🔥 Kutsu funktio näin:
// const oldPlayerId = '3bd1401f-6b74-4915-992d-f9a28b458761';
// const newPlayerId = 'YVZYBwbdLdbaXbZwFifLe6mbd2Q2';
// updatePlayerId(oldPlayerId, newPlayerId);





// // Poistetaan kaikki SecureStore tiedot
// const clearSecureStore = async () => {
// try {
//     await SecureStore.deleteItemAsync('user_id'); // Poistaa yksittäisen tiedon
//     console.log('SecureStore on tyhjennetty.');
// } catch (error) {
//     console.error('Virhe SecureStore tiedon poistamisessa:', error);
// }
// };

// clearSecureStore();


//RECOVER TEST!

// const handleReset = async () => {
//   try {
//     await SecureStore.deleteItemAsync('user_id');
//     Alert.alert('SecureStore reset', 'user_id on poistettu.');
//     console.log('user_id deleted from SecureStore');
//   } catch (error) {
//     Alert.alert('Reset error', error.message);
//     console.error('Error deleting user_id from SecureStore:', error);
//   }
// };

{/* <View style={{ marginTop: 50, padding: 20 }}>
      <Button title="Reset SecureStore (user_id)" onPress={handleReset} />
    </View> */}

