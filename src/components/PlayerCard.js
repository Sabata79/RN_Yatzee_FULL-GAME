import { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useGame } from '../constants/GameContext';
import styles from '../styles/playerCardStyles';
import { dbOnValue, dbOff, dbGet, dbUpdate } from '../services/Firebase';
import { avatars } from '../constants/AvatarPaths';
import AvatarContainer from '../constants/AvatarContainer';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import { PlayercardBg } from '../constants/PlayercardBg';
import CoinLayer from './CoinLayer';

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
  const [storedLevel, setStoredLevel] = useState(null);
  const [viewingAllTimeRank, setViewingAllTimeRank] = useState('--');
  const [weeklyWins, setWeeklyWins] = useState(0);
  const [modalHeight, setModalHeight] = useState(0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
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

  const saveAvatarToDatabase = async (avatarPath) => {
    if (!avatarPath) {
      console.error('Avatar path is empty!');
      return;
    }
    try {
      await dbUpdate(`players/${playerId}`, { avatar: avatarPath });
      setAvatarUrl(avatarPath);
    } catch (e) {
      console.error('Error saving avatar to Firebase:', e);
    }
  };

  // ----- HELPERS -----
  const isBetterScore = (a, b) => {
    if (a.points > b.points) return true;
    if (a.points < b.points) return false;
    if (a.duration < b.duration) return true;
    if (a.duration > b.duration) return false;
    return a.date < b.date;
  };

  const getAvatarImage = (avatarPath) => {
    const avatar = avatars.find(av => av.path === avatarPath);
    return avatar ? avatar.display : require('../../assets/whiteDices.webp');
  };

  const isBeginnerAvatar = (avatarPath) => {
    const avatar = avatars.find(av => av.path === avatarPath);
    return !!avatar && avatar.level === 'Beginner';
  };

  const getAvatarToDisplay = () => (idToUse === playerId ? avatarUrl : viewingPlayerAvatar);

  const getTopScoresWithEmptySlots = () => topScores.slice(0, 5);

  const getPlayerCardBackground = (level) => {
    const bg = PlayercardBg.find(bg => bg.level.toLowerCase() === level.toLowerCase());
    return bg ? bg.display : require('../../assets/playerCardBg/BeginnerBG.webp');
  };


  // ----- LEVEL COMPUTATION -----
  const getPlayerLevelInfo = () => {
    const games = playedGames;
    let computed = { level: 'beginner', min: 0, max: 400 };

    if (games >= 2000) computed = { level: 'legendary', min: 2000, max: 2000 };
    else if (games >= 1201) computed = { level: 'elite', min: 1201, max: 2000 };
    else if (games >= 801) computed = { level: 'advanced', min: 801, max: 1200 };
    else if (games >= 401) computed = { level: 'basic', min: 401, max: 800 };

    const progress = computed.max === computed.min ? 1 : (games - computed.min) / (computed.max - computed.min);
    computed = { ...computed, progress: Math.min(progress, 1) };

    const defaults = ['beginner', 'basic', 'advanced', 'elite', 'legendary'];

    if (storedLevel) {
      const storedIdx = defaults.indexOf(storedLevel);
      const computedIdx = defaults.indexOf(computed.level);

      if (storedIdx === -1) {
        return { level: storedLevel, progress: 1, min: computed.min, max: computed.max };
      }
      if (computedIdx > storedIdx) {
        // Update upwards if the calculated level is higher
        dbUpdate(`players/${idToUse}`, { level: computed.level })
          .then(() => console.log('Level updated to computed level'))
          .catch(err => console.error('Error updating level', err));
        return computed;
      }
      if (computedIdx === storedIdx) return computed;

      // If the database has a "higher" custom level than calculated
      return { level: storedLevel, progress: 1, min: computed.min, max: computed.max };
    }

    return computed;
  };

  const previousMonthRank = currentMonth > 0 ? monthlyRanks[currentMonth - 1] : '--';
  const levelInfo = getPlayerLevelInfo();

  // Tumman taustan tunnistus
  const bgInfo = PlayercardBg.find(bg => bg.level.toLowerCase() === levelInfo.level.toLowerCase());
  const isDarkBg = bgInfo?.isDark;

  // ----- EFFECT: attach/detach all listeners when modal is open -----
  useEffect(() => {
    if (!isModalVisible || !idToUse) return;

    const subs = []; // { path, cb }

    // TOP SCORES
    const topScoresPath = `players/${idToUse}/scores`;
    const topScoresCb = (snapshot) => {
      if (snapshot.exists()) {
        const scores = snapshot.val();
        const sorted = Object.values(scores)
          .map(s => ({ points: s.points, date: s.date, duration: s.duration, time: s.time }))
          .sort((a, b) => b.points - a.points)
          .slice(0, NBR_OF_SCOREBOARD_ROWS);
        setTopScores(sorted);
      } else {
        setTopScores([]);
      }
    };
    dbOnValue(topScoresPath, topScoresCb);
    subs.push({ path: topScoresPath, cb: topScoresCb });

    // MONTHLY RANKS (whole year)
    const playersPath = 'players';
    const monthlyCb = (snapshot) => {
      if (!snapshot.exists()) {
        setMonthlyRanks(Array(12).fill('--'));
        return;
      }
      const playersData = snapshot.val();
      const monthlyScores = Array.from({ length: 12 }, () => []);
      const year = new Date().getFullYear();

      Object.keys(playersData).forEach((pId) => {
        const scores = playersData[pId].scores || {};
        Object.values(scores).forEach((score) => {
          const d = new Date(score.date.split('.').reverse().join('-'));
          if (d.getFullYear() === year) {
            const monthIndex = d.getMonth();
            const entry = { playerId: pId, points: score.points, duration: score.duration, date: d.getTime() };
            const existing = monthlyScores[monthIndex].find(s => s.playerId === pId);
            if (!existing || isBetterScore(entry, existing)) {
              monthlyScores[monthIndex] = monthlyScores[monthIndex].filter(s => s.playerId !== pId);
              monthlyScores[monthIndex].push(entry);
            }
          }
        });
      });

      const monthRanks = monthlyScores.map((arr) => {
        if (arr.length === 0) return '--';
        arr.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.duration !== b.duration) return a.duration - b.duration;
          return a.date - b.date;
        });
        const idx = arr.findIndex(s => s.playerId === idToUse);
        return idx === -1 ? '--' : idx + 1;
      });

      setMonthlyRanks(monthRanks);
    };
    dbOnValue(playersPath, monthlyCb);
    subs.push({ path: playersPath, cb: monthlyCb });

    // WEEKLY RANK (last week)
    const weeklyRankCb = (snapshot) => {
      if (!snapshot.exists()) {
        setWeeklyRank('--');
        return;
      }
      const playersData = snapshot.val();
      const now = new Date();
      const day = now.getDay();
      const mondayThisWeek = new Date(now);
      mondayThisWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const previousWeekEnd = new Date(mondayThisWeek);
      previousWeekEnd.setDate(mondayThisWeek.getDate() - 1);
      const previousWeekStart = new Date(previousWeekEnd);
      previousWeekStart.setDate(previousWeekEnd.getDate() - 6);

      let weeklyScores = [];
      Object.keys(playersData).forEach((pId) => {
        const scores = playersData[pId].scores || {};
        Object.values(scores).forEach((s) => {
          const d = new Date(s.date.split('.').reverse().join('-'));
          if (d >= previousWeekStart && d <= previousWeekEnd) {
            weeklyScores.push({ playerId: pId, points: s.points, duration: s.duration, date: d.getTime() });
          }
        });
      });

      const bestByPlayer = {};
      weeklyScores.forEach(s => {
        const cur = bestByPlayer[s.playerId];
        if (!cur || isBetterScore(s, cur)) bestByPlayer[s.playerId] = s;
      });

      const best = Object.values(bestByPlayer).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (a.duration !== b.duration) return a.duration - b.duration;
        return a.date - b.date;
      });

      const r = best.findIndex(s => s.playerId === idToUse) + 1;
      setWeeklyRank(r === 0 ? '--' : r);
    };
    dbOnValue(playersPath, weeklyRankCb);
    subs.push({ path: playersPath, cb: weeklyRankCb });

    // WEEKLY WINS (within the year)
    const weeklyWinsCb = (snapshot) => {
      if (!snapshot.exists()) {
        setWeeklyWins(0);
        return;
      }
      const playersData = snapshot.val();
      const now = new Date();
      let wins = 0;

      for (let weeksAgo = 0; weeksAgo <= 52; weeksAgo++) {
        const monday = new Date(now);
        monday.setDate(monday.getDate() - monday.getDay() + 1 - weeksAgo * 7);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        let weeklyScores = [];
        Object.keys(playersData).forEach((pId) => {
          const scores = playersData[pId].scores || {};
          Object.values(scores).forEach((s) => {
            const d = new Date(s.date.split('.').reverse().join('-'));
            if (d >= monday && d <= sunday) {
              weeklyScores.push({ playerId: pId, points: s.points, duration: s.duration, date: d.getTime() });
            }
          });
        });

        const bestByPlayer = {};
        weeklyScores.forEach(s => {
          const cur = bestByPlayer[s.playerId];
          if (!cur || isBetterScore(s, cur)) bestByPlayer[s.playerId] = s;
        });

        const best = Object.values(bestByPlayer).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.duration !== b.duration) return a.duration - b.duration;
          return a.date - b.date;
        });

        const winner = best[0];
        if (winner && winner.playerId === idToUse) wins += 1;
      }

      setWeeklyWins(wins);
    };
    dbOnValue(playersPath, weeklyWinsCb);
    subs.push({ path: playersPath, cb: weeklyWinsCb });

    // PLAYER STATS (+ progressPoints init)
    const statsCb = async (snapshot) => {
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

      // progressPoints init if missing
      const pSnap = await dbGet(`players/${idToUse}`);
      const pData = pSnap.val();
      if (!pData || pData.progressPoints === undefined) {
        dbUpdate(`players/${idToUse}`, { progressPoints: gamesCount })
          .then(() => console.log('progressPoints initialized.'))
          .catch(err => console.error('Error initializing progressPoints:', err));
      }
    };
    const statsPath = `players/${idToUse}/scores`;
    dbOnValue(statsPath, statsCb);
    subs.push({ path: statsPath, cb: statsCb });

    // ALL-TIME RANK
    const allTimeCb = (snapshot) => {
      if (!snapshot.exists()) {
        setViewingAllTimeRank('--');
        return;
      }
      const playersData = snapshot.val();
      const bestScores = Object.entries(playersData).map(([pId, data]) => {
        const scores = data.scores || {};
        const maxScore = Object.values(scores)
          .map(s => Number(s.points) || 0)
          .reduce((m, v) => (v > m ? v : m), 0);
        return { playerId: pId, maxScore };
      });
      bestScores.sort((a, b) => b.maxScore - a.maxScore);
      const idx = bestScores.findIndex(item => item.playerId === idToUse);
      setViewingAllTimeRank(idx >= 0 ? idx + 1 : '--');
    };
    dbOnValue(playersPath, allTimeCb);
    subs.push({ path: playersPath, cb: allTimeCb });

    // AVATAR & LINKED
    const avatarPath = `players/${idToUse}/avatar`;
    const avatarCb = (snapshot) => {
      const path = snapshot.val();
      if (idToUse === playerId) setAvatarUrl(path || '');
      else setViewingPlayerAvatar(path || '');
    };
    dbOnValue(avatarPath, avatarCb);
    subs.push({ path: avatarPath, cb: avatarCb });

    const linkedPath = `players/${idToUse}/isLinked`;
    const linkedCb = (snapshot) => setPlayerIsLinked(!!snapshot.val());
    dbOnValue(linkedPath, linkedCb);
    subs.push({ path: linkedPath, cb: linkedCb });

    // Stored level (whole player object)
    const levelPath = `players/${idToUse}`;
    const levelCb = (snapshot) => {
      const data = snapshot.val();
      if (data) setStoredLevel(data.level);
    };
    dbOnValue(levelPath, levelCb);
    subs.push({ path: levelPath, cb: levelCb });

    // Cleanup
    return () => {
      subs.forEach(({ path, cb }) => dbOff(path, cb));
    };
  }, [isModalVisible, idToUse, playerId, setAvatarUrl]);

  useEffect(() => {
    if (!isModalVisible) {
      resetViewingPlayer();
    }
  }, [isModalVisible, resetViewingPlayer]);

  // Get trophy for specific month
  const getTrophyForMonth = (monthIndex) => {
    const rank = monthlyRanks[monthIndex];
    if (rank === '--') return <Text style={styles.emptySlotText}>--</Text>;
    if (rank === 1) {
      return (
        <View style={styles.trophyContainer}>
          <Image source={require('../../assets/trophies/goldTrophy.webp')} style={styles.playerCardTrophyImage} />
          <Text style={styles.trophyText}>GOLD</Text>
        </View>
      );
    }
    if (rank === 2) {
      return (
        <View style={styles.trophyContainer}>
          <Image source={require('../../assets/trophies/silverTrophy.webp')} style={styles.playerCardTrophyImage} />
          <Text style={styles.trophyText}>SILVER</Text>
        </View>
      );
    }
    if (rank === 3) {
      return (
        <View style={styles.trophyContainer}>
          <Image source={require('../../assets/trophies/bronzeTrophy.webp')} style={styles.playerCardTrophyImage} />
          <Text style={styles.trophyText}>BRONZE</Text>
        </View>
      );
    }
    return (
      <Text
        style={[
          styles.playerCardMonthText,
          { fontWeight: 'bold', marginTop: '40%', fontSize: 18, backgroundColor: '#00000000' },
        ]}
      >
        {rank}.
      </Text>
    );
  };

  return (
    <View style={styles.playerCardContainer}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.playerCardModalBackground}>
          <View
            style={[styles.playerCardModalContainer, isDarkBg && styles.playerCardModalContainerDark]}
            onLayout={(event) => setModalHeight(event.nativeEvent.layout.height)}
          >
            <Image source={getPlayerCardBackground(levelInfo.level)} style={styles.avatarModalBackgroundImage} />
            <CoinLayer weeklyWins={weeklyWins} modalHeight={modalHeight -2} />

            {/* HEADER */}
            <View style={styles.playerCardHeaderCentered}>
              <View style={styles.nameAndLinkContainer}>
                {playerIsLinked && (
                  <View style={styles.linkIconContainer}>
                    <FontAwesome5 name="link" size={10} color="gold" />
                  </View>
                )}
                <Text style={[styles.playerCardNameTextCentered, isDarkBg && styles.playerCardNameTextCenteredDark]}>{nameToUse}</Text>
              </View>
              <Pressable
                style={styles.playerCardCloseButton}
                onPress={() => {
                  setModalModalVisible(false);
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.playerCardCloseText, isDarkBg && styles.playerCardCloseTextDark]}>X</Text>
              </Pressable>
            </View>

            {/* Avatar + Stats */}
            <View style={styles.playerInfoContainer}>
              <View style={{ position: 'relative' }}>
                <View style={styles.avatarContainer}>
                  <Image
                    style={[
                      styles.avatar,
                      isBeginnerAvatar(getAvatarToDisplay()) ? styles.beginnerAvatar : styles.defaultAvatar,
                    ]}
                    source={getAvatarImage(getAvatarToDisplay())}
                  />
                </View>
                {idToUse === playerId && (
                  <Pressable style={styles.editAvatarButton} onPress={() => setIsAvatarModalVisible(true)}>
                    <FontAwesome5 name="edit" size={15} color="white" />
                  </Pressable>
                )}
              </View>

              <View style={[styles.playerTextContainer, isDarkBg && styles.playerTextContainerDark]}>
                <Text style={[styles.playerStat, isDarkBg && styles.playerCardTextDark]}>Level: {levelInfo.level}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${levelInfo.progress * 100}%` }]} />
                  <Text style={[styles.progressPercentageText, isDarkBg && styles.playerCardTextDark]}>{Math.floor(levelInfo.progress * 100)}%</Text>
                </View>
                <View style={styles.playerStatsContainer}>
                  <Text style={[styles.playerStat, isDarkBg && styles.playerCardTextDark]}>All Time Rank: {viewingAllTimeRank}</Text>
                  <Text style={[styles.playerStat, isDarkBg && styles.playerCardTextDark]}>Weekly Wins: {weeklyWins}</Text>
                  <Text style={[styles.playerStat, isDarkBg && styles.playerCardTextDark]}>Played Games: {playedGames}</Text>
                  <Text style={[styles.playerStat, isDarkBg && styles.playerCardTextDark]}>Avg. Points/Game: {avgPoints}</Text>
                  <Text style={[styles.playerStat, isDarkBg && styles.playerCardTextDark]}>Avg Duration/Game: {avgDuration} s</Text>
                </View>
              </View>
            </View>

            {/* TOP SCORES */}
            <Text style={[styles.playerCardScoresTitle, isDarkBg && styles.playerCardTextDark]}>TOP 5 SCORES</Text>
            <View style={styles.playerCardScoresContainer} contentContainerStyle={{ paddingTop: 2, paddingBottom: 5, flexGrow: 0 }}>
              {getTopScoresWithEmptySlots().map((score, index) => (
                <View
                  key={index}
                  style={[
                    styles.scoreRow,
                    index % 2 === 0
                      ? [styles.evenRow, isDarkBg && styles.evenRowDark]
                      : [styles.oddRow, isDarkBg && styles.oddRowDark]
                  ]}
                >
                  <Text style={[styles.playerCardScoreItem, isDarkBg && styles.playerCardTextDark]}>
                    {index + 1}. {score.points} points in {score.duration} sec
                  </Text>
                  <Text style={[styles.playerCardScoreDate, isDarkBg && styles.playerCardTextDark]}>{score.date}</Text>
                </View>
              ))}
            </View>

            {/* TROPHIES */}
            <View style={styles.playerCardTrophyCase}>
              <Text style={[styles.playerCardTrophyCaseTitle, isDarkBg && styles.playerCardTextDark]}>TROPHIES {currentYear}</Text>
              <View style={styles.playerCardMonthsContainer}>
                {Array(12).fill(null).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.playerCardMonth,
                      index === currentMonth ? styles.playerCardOngoingMonth : null,
                      isDarkBg && styles.playerCardMonthDark,
                    ]}
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

      {/* Avatar-picker modal */}
      <AvatarContainer
        isVisible={isAvatarModalVisible}
        onClose={() => setIsAvatarModalVisible(false)}
        avatars={avatars}
        handleAvatarSelect={handleAvatarSelect}
        playerLevel={playerLevel}
      />
    </View>
  );
}
