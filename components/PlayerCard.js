import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView as RNScrollView, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useGame } from '../components/GameContext';
import styles from '../styles/playerCardStyles';
import { database } from './Firebase';
import { ref, onValue, update } from 'firebase/database';
import { avatars } from '../constants/AvatarPaths';
import AvatarContainer from '../components/AvatarContainer';

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

  const [playerIsLinked, setPlayerIsLinked] = useState(false);
  const [viewingPlayerAvatar, setViewingPlayerAvatar] = useState('');
  const [avatarSelected, setAvatarSelected] = useState(null);
  const [monthlyRanks, setMonthlyRanks] = useState(Array(12).fill(null));
  const [weeklyRank, setWeeklyRank] = useState('--');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [topScores, setTopScores] = useState([]);
  const [isModalModalVisible, setModalModalVisible] = useState(false);
  const [playedGames, setPlayedGames] = useState(0);
  const [avgPoints, setAvgPoints] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);
  // Uusi state, jossa tallennettu taso haetaan tietokannasta
  const [storedLevel, setStoredLevel] = useState(null);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const idToUse = viewingPlayerId || playerId;
  const nameToUse = viewingPlayerName || playerName;

  const handleAvatarSelect = (avatar) => {
    const avatarPath = avatar.path;
    setAvatarSelected(avatarPath);
    setAvatarUrl(avatarPath);
    saveAvatarToDatabase(avatarPath);
    setIsAvatarModalVisible(false);
  };

  const saveAvatarToDatabase = (avatarPath) => {
    if (avatarPath) {
      const playerRef = ref(database, `players/${playerId}`);
      update(playerRef, { avatar: avatarPath })
        .then(() => {
          setAvatarUrl(avatarPath);
        })
        .catch((error) => {
          console.error('Error saving avatar to Firebase:', error);
        });
    } else {
      console.error('Avatar path is empty!');
    }
  };

  // Haetaan top-scoren lista
  const fetchTopScores = () => {
    if (idToUse) {
      const playerRef = ref(database, `players/${idToUse}/scores`);
      onValue(playerRef, (snapshot) => {
        if (snapshot.exists()) {
          const scores = snapshot.val();
          const sortedScores = Object.values(scores)
            .map(score => ({
              points: score.points,
              date: score.date,
              duration: score.duration,
              time: score.time,
            }))
            .sort((a, b) => b.points - a.points)
            .slice(0, 20);
          setTopScores(sortedScores);
        } else {
          setTopScores([]);
        }
      });
    }
  };

  // Haetaan kuukauden sijoitukset nykyiselle vuodelle
  const fetchMonthlyRanks = () => {
    const monthlyScores = Array.from({ length: 12 }, () => []);
    const playersRef = ref(database, `players`);
    onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val();
        const currentYear = new Date().getFullYear();
        const isBetterScore = (newScore, oldScore) => {
          if (newScore.points > oldScore.points) return true;
          if (newScore.points < oldScore.points) return false;
          if (newScore.duration < oldScore.duration) return true;
          if (newScore.duration > oldScore.duration) return false;
          return newScore.date < oldScore.date;
        };

        Object.keys(playersData).forEach((pId) => {
          const playerScores = playersData[pId].scores || {};
          Object.values(playerScores).forEach((score) => {
            const scoreDate = new Date(score.date.split('.').reverse().join('-'));
            if (scoreDate.getFullYear() === currentYear) {
              const monthIndex = scoreDate.getMonth();
              const existingMonthScores = monthlyScores[monthIndex];
              const scoreObj = {
                playerId: pId,
                points: score.points,
                duration: score.duration,
                date: scoreDate.getTime(),
              };
              const playerBestScore = existingMonthScores.find(s => s.playerId === pId);
              if (!playerBestScore || isBetterScore(scoreObj, playerBestScore)) {
                monthlyScores[monthIndex] = existingMonthScores.filter(s => s.playerId !== pId);
                monthlyScores[monthIndex].push(scoreObj);
              }
            }
          });
        });

        const monthRanks = monthlyScores.map((monthScores) => {
          if (monthScores.length === 0) return '--';
          monthScores.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (a.duration !== b.duration) return a.duration - b.duration;
            return a.date - b.date;
          });
          const rank = monthScores.findIndex(score => score.playerId === idToUse) + 1;
          return rank === 0 ? '--' : rank;
        });

        setMonthlyRanks(monthRanks);
      } else {
        setMonthlyRanks(Array(12).fill('--'));
      }
    });
  };

  // Haetaan edellisen viikon sijoitus
  const fetchWeeklyRank = () => {
    const playersRef = ref(database, `players`);
    onValue(playersRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val();
        const currentDate = new Date();
        const currentDay = currentDate.getDay();
        // Lasketaan tämän viikon maanantai
        const mondayThisWeek = new Date(currentDate);
        mondayThisWeek.setDate(currentDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
        // Edellisen viikon sunnuntai on maanantain edeltävä päivä
        const previousWeekEnd = new Date(mondayThisWeek);
        previousWeekEnd.setDate(mondayThisWeek.getDate() - 1);
        // Edellisen viikon maanantai
        const previousWeekStart = new Date(previousWeekEnd);
        previousWeekStart.setDate(previousWeekEnd.getDate() - 6);

        let weeklyScores = [];
        Object.keys(playersData).forEach((pId) => {
          const playerScores = playersData[pId].scores || {};
          Object.values(playerScores).forEach((score) => {
            const scoreDate = new Date(score.date.split('.').reverse().join('-'));
            if (scoreDate >= previousWeekStart && scoreDate <= previousWeekEnd) {
              weeklyScores.push({
                playerId: pId,
                points: score.points,
                duration: score.duration,
                date: scoreDate.getTime(),
              });
            }
          });
        });

        // Otetaan kullekin pelaajalle paras tulos
        const bestScoresMap = {};
        weeklyScores.forEach(score => {
          if (!bestScoresMap[score.playerId]) {
            bestScoresMap[score.playerId] = score;
          } else {
            const currentBest = bestScoresMap[score.playerId];
            const isBetterScore = (newScore, oldScore) => {
              if (newScore.points > oldScore.points) return true;
              if (newScore.points < oldScore.points) return false;
              if (newScore.duration < oldScore.duration) return true;
              if (newScore.duration > oldScore.duration) return false;
              return newScore.date < oldScore.date;
            };
            if (isBetterScore(score, currentBest)) {
              bestScoresMap[score.playerId] = score;
            }
          }
        });

        const bestScores = Object.values(bestScoresMap);
        bestScores.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.duration !== b.duration) return a.duration - b.duration;
          return a.date - b.date;
        });

        const rank = bestScores.findIndex(score => score.playerId === idToUse) + 1;
        setWeeklyRank(rank === 0 ? '--' : rank);
      } else {
        setWeeklyRank('--');
      }
    });
  };

  // Haetaan pelaajan tilastot: pelattujen pelien määrä, keskiarvot ja alustetaan progressPoints, jos sitä ei ole.
  const fetchPlayerStats = () => {
    if (idToUse) {
      const scoresRef = ref(database, `players/${idToUse}/scores`);
      onValue(scoresRef, (snapshot) => {
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
        setPlayedGames(gamesCount);
        setAvgPoints(gamesCount > 0 ? (totalPointsCalc / gamesCount).toFixed(0) : 0);
        setAvgDuration(gamesCount > 0 ? (totalDurationCalc / gamesCount).toFixed(0) : 0);

        // Tarkistetaan, onko progressPoints-kenttää jo olemassa. Jos ei, alustetaan se pelattujen pelien määrällä.
        const playerRef = ref(database, `players/${idToUse}`);
        onValue(playerRef, (snapshot) => {
          const playerData = snapshot.val();
          if (!playerData || playerData.progressPoints === undefined) {
            update(playerRef, { progressPoints: gamesCount })
              .then(() => console.log("progressPoints initialized."))
              .catch((error) => console.error("Error initializing progressPoints:", error));
          }
        });
      });
    }
  };

  // Haetaan tallennettu level tietokannasta (jos on asetettu)
  useEffect(() => {
    if (isModalVisible && idToUse) {
      const playerRef = ref(database, `players/${idToUse}`);
      onValue(playerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setStoredLevel(data.level);
        }
      });
    }
  }, [isModalVisible, idToUse]);

// Määritellään pelaajan taso pelattujen pelien (progressPoints) perusteella.
// Jos tietokannassa on jo asetettu "ylempi" taso (manuaalinen override),
// käytetään sitä sellaisenaan (progress 100%), ellei laskennallinen taso ole sama.
const getPlayerLevelInfo = () => {
  const games = playedGames;
  // Lasketaan laskennallinen taso
  let computedLevel = { level: "beginner", min: 0, max: 400 };
  if (games >= 2000) {
    computedLevel = { level: "legendary", min: 2000, max: 2000 };
  } else if (games >= 1201) {
    computedLevel = { level: "elite", min: 1201, max: 2000 };
  } else if (games >= 801) {
    computedLevel = { level: "advanced", min: 801, max: 1200 };
  } else if (games >= 401) {
    computedLevel = { level: "basic", min: 401, max: 800 };
  }
  const progress = computedLevel.max === computedLevel.min ? 1 : (games - computedLevel.min) / (computedLevel.max - computedLevel.min);
  computedLevel = { ...computedLevel, progress: Math.min(progress, 1) };

  // Oletustasot järjestyksessä
  const defaultLevels = ["beginner", "basic", "advanced", "elite", "legendary"];

  if (storedLevel) {
    const storedIndex = defaultLevels.indexOf(storedLevel);
    const computedIndex = defaultLevels.indexOf(computedLevel.level);
    // Jos tallennettua tasoa ei löydy oletuslistasta (esim. "turhapuro"),
    // palautetaan se sellaisenaan (progress 100%)
    if (storedIndex === -1) {
      return { level: storedLevel, progress: 1, min: computedLevel.min, max: computedLevel.max };
    }
    // Jos laskennallinen taso on korkeampi kuin tallennettu taso,
    // päivitetään tietokanta ja palautetaan laskennallinen taso
    if (computedIndex > storedIndex) {
      const playerRef = ref(database, `players/${idToUse}`);
      update(playerRef, { level: computedLevel.level })
        .then(() => console.log("Level updated to computed level"))
        .catch(err => console.error("Error updating level", err));
      return computedLevel;
    }
    // Jos laskennallinen taso on yhtä suuri kuin tallennettu taso,
    // palautetaan laskennallinen taso (eli progress lasketaan oikein)
    if (computedIndex === storedIndex) {
      return computedLevel;
    }
    // Jos laskennallinen taso on alhaisempi kuin tallennettu (override),
    // palautetaan tallennettu taso (progress 100%)
    return { level: storedLevel, progress: 1, min: computedLevel.min, max: computedLevel.max };
  }
  return computedLevel;
};

  useEffect(() => {
    if (isModalVisible && idToUse) {
      fetchTopScores();
      fetchMonthlyRanks();
      fetchWeeklyRank();
      fetchPlayerStats();

      // Haetaan avatar tietokannasta
      const avatarRef = ref(database, `players/${idToUse}/avatar`);
      onValue(avatarRef, (snapshot) => {
        const avatarPath = snapshot.val();
        if (idToUse === playerId) {
          setAvatarUrl(avatarPath || '');
        } else {
          setViewingPlayerAvatar(avatarPath || '');
        }
      });

      // Haetaan isLinked-lippu
      const linkedRef = ref(database, `players/${idToUse}/isLinked`);
      onValue(linkedRef, (snapshot) => {
        setPlayerIsLinked(snapshot.val());
      });
    }
  }, [isModalVisible, idToUse, playerId, setAvatarUrl]);

  useEffect(() => {
    if (!isModalVisible) {
      resetViewingPlayer();
    }
  }, [isModalVisible, resetViewingPlayer]);

  const getAvatarImage = (avatarPath) => {
    const avatar = avatars.find(av => av.path === avatarPath);
    return avatar ? avatar.display : require('../assets/whiteDices.png');
  };

  const isBeginnerAvatar = (avatarPath) => {
    const avatar = avatars.find(av => av.path === avatarPath);
    return avatar && avatar.level === 'Beginner';
  };

  const getAvatarToDisplay = () => {
    return idToUse === playerId ? avatarUrl : viewingPlayerAvatar;
  };

  const getTrophyForMonth = (monthIndex) => {
    const rank = monthlyRanks[monthIndex];
    if (rank === '--') return <Text style={styles.emptySlotText}>--</Text>;
    if (rank === 1) return (
      <View style={styles.trophyContainer}>
        <Image source={require('../assets/trophies/goldTrophy.jpeg')} style={styles.playerCardTrophyImage} />
        <Text style={styles.trophyText}>GOLD</Text>
      </View>
    );
    if (rank === 2) return (
      <View style={styles.trophyContainer}>
        <Image source={require('../assets/trophies/silverTrophy.jpeg')} style={styles.playerCardTrophyImage} />
        <Text style={styles.trophyText}>SILVER</Text>
      </View>
    );
    if (rank === 3) return (
      <View style={styles.trophyContainer}>
        <Image source={require('../assets/trophies/bronzeTrophy.jpeg')} style={styles.playerCardTrophyImage} />
        <Text style={styles.trophyText}>BRONZE</Text>
      </View>
    );
    return <Text style={[styles.playerCardMonthText, { fontWeight: 'bold', marginTop: 30, fontSize: 20 }]}>{rank}.</Text>;
  };

  const getTopScoresWithEmptySlots = () => {
    const emptyScores = Array(20 - topScores.length).fill({ points: '', date: '', duration: '' });
    return [...topScores, ...emptyScores].slice(0, 20);
  };

  // Poimitaan edellisen kuukauden sijoitus (jos nykyinen kuukausi ei ole tammikuu)
  const previousMonthRank = currentMonth > 0 ? monthlyRanks[currentMonth - 1] : '--';

  const levelInfo = getPlayerLevelInfo();

  return (
    <View style={styles.playerCardContainer}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.playerCardModalBackground}>
          <View style={styles.playerCardModalContainer}>
            <Image
              source={require('../assets/playercardBackground.jpeg')}
              style={styles.avatarModalBackgroundImage}
            />
            <Pressable
              style={styles.playerCardCloseButton}
              onPress={() => { setModalModalVisible(false); setModalVisible(false); }}
            >
              <Text style={styles.playerCardCloseText}>X</Text>
            </Pressable>

            {/* AvatarContainer */}
            <AvatarContainer
              isVisible={isAvatarModalVisible}
              onClose={() => setIsAvatarModalVisible(false)}
              avatars={avatars}
              handleAvatarSelect={handleAvatarSelect}
              playerLevel={playerLevel}
            />

            <View style={styles.playerInfoContainer}>
              <View style={{ position: 'relative' }}>
                <View style={styles.avatarContainer}>
                  <Image
                    style={[
                      styles.avatar,
                      isBeginnerAvatar(getAvatarToDisplay()) ? styles.beginnerAvatar : styles.defaultAvatar
                    ]}
                    source={getAvatarImage(getAvatarToDisplay())}
                  />
                </View>
                {playerIsLinked && (
                  <View style={styles.linkIconContainer}>
                    <FontAwesome5 name="link" size={15} color="gold" />
                  </View>
                )}
                {idToUse === playerId && (
                  <Pressable
                    style={styles.editAvatarButton}
                    onPress={() => setIsAvatarModalVisible(true)}
                  >
                    <FontAwesome5 name="edit" size={15} color="white" />
                  </Pressable>
                )}
              </View>
              {/* Pelaajan nimi, tilastot ja progressbar */}
              <View style={styles.playerTextContainer}>
                <View style={styles.playerNameContainer}>
                  <Text style={styles.playerCardName}>{nameToUse}</Text>
                </View>
                <Text style={[styles.playerStat, { textAlign: 'center' }]}>Level: {levelInfo.level}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${levelInfo.progress * 100}%` }]} />
                    <Text style={styles.progressPercentageText}>
                      {Math.floor(levelInfo.progress * 100)}%
                    </Text>
                  </View>
                </View>
                <View style={styles.playerStatsContainer}>
                  <Text style={styles.playerStat}>Played Games: {playedGames}</Text>
                  <Text style={styles.playerStat}>Avg. Points/Game: {avgPoints}</Text>
                  <Text style={styles.playerStat}>Avg Duration/Game: {avgDuration} s</Text>
                </View>
              </View>
            </View>

            <Text style={styles.playerCardScoresTitle}>TOP SCORES</Text>
            <RNScrollView style={[styles.playerCardScoresContainer, { maxHeight: 120 }]}>
              {getTopScoresWithEmptySlots().map((score, index) => (
                <View key={index} style={styles.scoreRow}>
                  <View style={styles.scoreTextContainer}>
                    <Text style={styles.playerCardScoreItem}>
                      {index + 1}. {score.points} points in {score.duration} sec
                    </Text>
                  </View>
                  <View style={styles.dateContainer}>
                    <Text style={styles.playerCardScoreDate}>{score.date}</Text>
                  </View>
                </View>
              ))}
            </RNScrollView>

            <View style={styles.playerCardTrophyCase}>
              <Text style={styles.playerCardTrophyCaseTitle}>TROPHIES {currentYear}</Text>
              <View style={styles.playerCardMonthsContainer}>
                {Array(12).fill(null).map((_, index) => (
                  <View
                    key={index}
                    style={[styles.playerCardMonth, index === currentMonth ? styles.playerCardOngoingMonth : null]}
                  >
                    <Text style={styles.playerCardMonthText}>{monthNames[index]}</Text>
                    {getTrophyForMonth(index)}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
