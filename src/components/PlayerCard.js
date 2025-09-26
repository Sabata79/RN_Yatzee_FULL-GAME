/**
 * PlayerCard - Modal component for displaying player profile, stats, and trophies.
 *
 * 
 * This file displays the player's card with avatar, stats, top scores, and trophies.
 * @module PlayerCard
 * @author Sabata79
 * @since 2025-08-29
 */
import { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable, Image, ActivityIndicator, Animated } from 'react-native'; 
import { FontAwesome5 } from '@expo/vector-icons';
import { useGame } from '../constants/GameContext';
import playerCardStyles from '../styles/PlayerCardStyles';
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

  // UUSI: local state for viewing another player's level
  // undefined = not yet loaded; null = loaded but no level set
  const [viewingPlayerLevel, setViewingPlayerLevel] = useState(undefined);

  const [playerIsLinked, setPlayerIsLinked] = useState(false);
  const [viewingPlayerAvatar, setViewingPlayerAvatar] = useState('');
  const [avatarSelected, setAvatarSelected] = useState(null);
  const [monthlyRanks, setMonthlyRanks] = useState(Array(12).fill(null));
  const [weeklyRank, setWeeklyRank] = useState('-');
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [topScores, setTopScores] = useState([]);
  const [isModalModalVisible, setModalModalVisible] = useState(false);
  const [playedGames, setPlayedGames] = useState(0);
  const [avgPoints, setAvgPoints] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);
  // undefined = not yet loaded; null = loaded but no level set
  const [storedLevel, setStoredLevel] = useState(undefined);
  const [viewingAllTimeRank, setViewingAllTimeRank] = useState('-');
  const [weeklyWins, setWeeklyWins] = useState(0);
  const [modalHeight, setModalHeight] = useState(0);
  const [isBgLoading, setIsBgLoading] = useState(true);
  // Animated opacity for background fade-in
  const bgOpacity = useRef(new Animated.Value(0)).current;

  // Content settle detection & content animation refs
  const lastUpdateRef = useRef(Date.now());
  const settleTimeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const [contentSettled, setContentSettled] = useState(false);
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(8)).current;
  const imageLoadedRef = useRef(false);

  const clearSettleTimers = () => {
    if (settleTimeoutRef.current) {
      clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  };

  const scheduleSettle = (delay = 300, maxWait = 1500) => {
    setContentSettled(false);
    clearSettleTimers();
    settleTimeoutRef.current = setTimeout(() => {
      setContentSettled(true);
      settleTimeoutRef.current = null;
    }, delay);
    maxTimeoutRef.current = setTimeout(() => {
      setContentSettled(true);
      maxTimeoutRef.current = null;
    }, maxWait);
  };

  const markUpdate = () => {
    lastUpdateRef.current = Date.now();
    scheduleSettle();
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];


  const idToUse = viewingPlayerId || playerId;
  const nameToUse = viewingPlayerName || playerName;

  // UUSI: haetaan katsottavan pelaajan level kun modal avataan ja katsotaan muuta kuin omaa korttia
  useEffect(() => {
    if (!isModalVisible) return;
    if (!viewingPlayerId || viewingPlayerId === playerId) {
      setViewingPlayerLevel(null); // oma kortti, ei tarvita
      return;
    }
    // Haetaan katsottavan pelaajan level
    setViewingPlayerLevel(undefined); // loading
    const path = `players/${viewingPlayerId}/level`;
    const handle = (snapshot) => {
      setViewingPlayerLevel(snapshot.exists() ? snapshot.val() : null);
    };
    dbOnValue(path, handle);
    return () => dbOff(path, handle);
  }, [isModalVisible, viewingPlayerId, playerId]);

  const handleAvatarSelect = (avatar) => {
    const avatarPath = avatar.path;
    setAvatarSelected(avatarPath);
    setAvatarUrl(avatarPath);
    saveAvatarToDatabase(avatarPath);
    setIsAvatarModalVisible(false);
  };

  const saveAvatarToDatabase = async (avatarPath) => {
    // guard
    const path = String(avatarPath || '').trim();
    if (!path) {
      console.error('Avatar path is empty!');
      return;
    }

    // optional: skip write if unchanged
    if (path === avatarUrl) {
      setAvatarUrl(path);
      return;
    }

    try {
      await dbUpdate(`players/${playerId}`, {
        avatar: path,
        avatarUrl: path, // keep backward compatibility with readers using avatarUrl
      });
      setAvatarUrl(path);
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

  const _norm = (s) => String(s || '').replace(/\\/g, '/').replace(/^\.\//, '');
  const _last2 = (s) => _norm(s).split('/').slice(-2).join('/');

  const getAvatarImage = (avatarPath) => {
    const target = _norm(avatarPath);
    if (!target) return null; // ← tärkeä: ei oletuskuvaa
    const hit = avatars.find(av => {
      const ap = _norm(av.path);
      return ap === target || ap.endsWith(_last2(target)) || target.endsWith(_last2(ap));
    });
    return hit ? hit.display : null; // ← ei fallback-kuvaa
  };

  const isBeginnerAvatar = (avatarPath) => {
    const avatar = avatars.find(av => av.path === avatarPath);
    return !!avatar && avatar.level === 'Beginner';
  };

  const getAvatarToDisplay = () => (idToUse === playerId ? avatarUrl : viewingPlayerAvatar);

  const getTopScoresWithEmptySlots = () => topScores.slice(0, 5);

  const getPlayerCardBackground = (level) => {
    if (!level) return null;
    const key = String(level).toLowerCase();
    const bg = PlayercardBg.find(b => b.level.toLowerCase() === key);
    if (bg) return bg.display;
    // If level is 'legendary' but we don't have a specific image, fall back
    // to the highest available background (usually 'Elite'). This prevents
    // an indefinite loading state for valid high levels.
    if (key === 'legendary' && PlayercardBg.length > 0) {
      return PlayercardBg[PlayercardBg.length - 1].display;
    }
    return null;
  };


  // ----- LEVEL COMPUTATION -----

  // levelInfo is selected based on whether viewing own or another's card
  const getPlayerLevelInfo = () => {
    // played games
    const games = playedGames;

    // level ranges based on games played
    let computed = { level: 'beginner', min: 0, max: 400 };
    if (games >= 2000) computed = { level: 'legendary', min: 2000, max: 2000 };
    else if (games >= 1201) computed = { level: 'elite', min: 1201, max: 2000 };
    else if (games >= 801) computed = { level: 'advanced', min: 801, max: 1200 };
    else if (games >= 401) computed = { level: 'basic', min: 401, max: 800 };

    const progress =
      computed.max === computed.min
        ? 1
        : (games - computed.min) / (computed.max - computed.min);

    // clamp 0..1
    const clamped = Math.max(0, Math.min(1, progress));

    // Show displayed level: use stored or viewing player level if available
    const levelLabel =
      storedLevel ?? viewingPlayerLevel ?? computed.level;

    return { ...computed, level: levelLabel, progress: clamped };
  };

  const previousMonthRank = currentMonth > 0 ? monthlyRanks[currentMonth - 1] : '--';
  const levelInfo = getPlayerLevelInfo();

  // Background info
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
  markUpdate();
      } else {
  setTopScores([]);
  markUpdate();
      }
    };
    dbOnValue(topScoresPath, topScoresCb);
    subs.push({ path: topScoresPath, cb: topScoresCb });

    // MONTHLY RANKS (whole year)
    const playersPath = 'players';
    const monthlyCb = (snapshot) => {
      if (!snapshot.exists()) {
  setMonthlyRanks(Array(12).fill('-'));
  markUpdate();
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
        if (arr.length === 0) return ' - ';
        arr.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.duration !== b.duration) return a.duration - b.duration;
          return a.date - b.date;
        });
        const idx = arr.findIndex(s => s.playerId === idToUse);
        return idx === -1 ? ' - ' : idx + 1;
      });

  setMonthlyRanks(monthRanks);
  markUpdate();
    };
    dbOnValue(playersPath, monthlyCb);
    subs.push({ path: playersPath, cb: monthlyCb });

    // WEEKLY RANK (last week)
    const weeklyRankCb = (snapshot) => {
      if (!snapshot.exists()) {
  setWeeklyRank(' - ');
  markUpdate();
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
  setWeeklyRank(r === 0 ? ' - ' : r);
  markUpdate();
    };
    dbOnValue(playersPath, weeklyRankCb);
    subs.push({ path: playersPath, cb: weeklyRankCb });

    // WEEKLY WINS (within the year)
    const weeklyWinsCb = (snapshot) => {
      if (!snapshot.exists()) {
  setWeeklyWins(0);
  markUpdate();
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
  markUpdate();
    };
    dbOnValue(playersPath, weeklyWinsCb);
    subs.push({ path: playersPath, cb: weeklyWinsCb });

    // PLAYER STATS (+ progressPoints init)
    // This listener computes aggregates from scores once and then initializes per-player
    // aggregate fields in the player's profile: playedGames, sumPoints, sumDuration.
    // After migration these aggregates should be used by other parts of the app so
    // we can drop per-score retention later to save DB size.
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

      // Read player's profile to see if aggregates already exist
      try {
        const pSnap = await dbGet(`players/${idToUse}`);
        const pData = pSnap.val() || {};

        const hasPlayedGames = typeof pData.playedGames === 'number';
        const hasSumPoints = typeof pData.sumPoints === 'number';
        const hasSumDuration = typeof pData.sumDuration === 'number';

        if (hasPlayedGames && hasSumPoints && hasSumDuration) {
          // Use aggregates from profile (fast, no full scan needed)
          const played = Number(pData.playedGames) || 0;
          const sumPoints = Number(pData.sumPoints) || 0;
          const sumDuration = Number(pData.sumDuration) || 0;
          setPlayedGames(played);
          setAvgPoints(played > 0 ? Math.round(sumPoints / played) : 0);
          setAvgDuration(played > 0 ? Math.round(sumDuration / played) : 0);
          markUpdate();
        } else {
          // Aggregates missing — initialize them from current scores snapshot
          setPlayedGames(gamesCount);
          setAvgPoints(gamesCount > 0 ? Math.round(totalPointsCalc / gamesCount) : 0);
          setAvgDuration(gamesCount > 0 ? Math.round(totalDurationCalc / gamesCount) : 0);
          markUpdate();

          // Write aggregates to DB only if missing (migration step). This avoids
          // overwriting any existing manual or server-side values.
          const updatePayload = {};
          if (!hasPlayedGames) updatePayload.playedGames = gamesCount;
          if (!hasSumPoints) updatePayload.sumPoints = totalPointsCalc;
          if (!hasSumDuration) updatePayload.sumDuration = totalDurationCalc;

          if (Object.keys(updatePayload).length > 0) {
            dbUpdate(`players/${idToUse}`, updatePayload)
              .then(() => console.log('Player aggregates initialized:', updatePayload))
              .catch(err => console.error('Error initializing player aggregates:', err));
          }
        }

        // progressPoints init if missing (keep as before)
        if (!pData || pData.progressPoints === undefined) {
          dbUpdate(`players/${idToUse}`, { progressPoints: gamesCount })
            .then(() => console.log('progressPoints initialized.'))
            .catch(err => console.error('Error initializing progressPoints:', err));
        }
      } catch (err) {
        console.error('Error reading player profile for aggregates:', err);
        // Fallback to computed values in case of error
  setPlayedGames(gamesCount);
  setAvgPoints(gamesCount > 0 ? Math.round(totalPointsCalc / gamesCount) : 0);
  setAvgDuration(gamesCount > 0 ? Math.round(totalDurationCalc / gamesCount) : 0);
  markUpdate();
      }
    };
    const statsPath = `players/${idToUse}/scores`;
    dbOnValue(statsPath, statsCb);
    subs.push({ path: statsPath, cb: statsCb });

    // ALL-TIME RANK
    const allTimeCb = (snapshot) => {
      if (!snapshot.exists()) {
        setViewingAllTimeRank(' - ');
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
      setViewingAllTimeRank(idx >= 0 ? idx + 1 : ' - ');
    };
    dbOnValue(playersPath, allTimeCb);
    subs.push({ path: playersPath, cb: allTimeCb });

    // AVATAR & LINKED
    const profilePath = `players/${idToUse}`;
    const avatarCb = (snapshot) => {
      const data = snapshot.val() || {};
      const path = data.avatar || data.avatarUrl || ''; // ← backward compatible
      if (idToUse === playerId) setAvatarUrl(path);
      else setViewingPlayerAvatar(path);
      markUpdate();
    };
    dbOnValue(profilePath, avatarCb);
    subs.push({ path: profilePath, cb: avatarCb });

    const linkedPath = `players/${idToUse}/isLinked`;
    const linkedCb = (snapshot) => {
      setPlayerIsLinked(!!snapshot.val());
      markUpdate();
    };
    dbOnValue(linkedPath, linkedCb);
    subs.push({ path: linkedPath, cb: linkedCb });

    // Stored level (whole player object)
    const levelPath = `players/${idToUse}`;
    const levelCb = (snapshot) => {
      const data = snapshot.val();
      // loaded but maybe no level field
      setStoredLevel(data ? (data.level ?? null) : null);
      markUpdate();
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

  // Trigger animations when both image and content are settled/loaded
  useEffect(() => {
    if (!isModalVisible) return;
    if (contentSettled && imageLoadedRef.current) {
      // fade background in
      Animated.timing(bgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      // slide + fade content
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(contentTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }

    // Reset animations when modal closes
    if (!isModalVisible) {
      try { bgOpacity.setValue(0); } catch (e) {}
      try { contentOpacity.setValue(0); contentTranslate.setValue(8); } catch (e) {}
      imageLoadedRef.current = false;
      setContentSettled(false);
      clearSettleTimers();
    }
    // cleanup not needed here
  }, [isModalVisible, contentSettled, bgOpacity, contentOpacity, contentTranslate]);

  // Get trophy for specific month
  const getTrophyForMonth = (monthIndex) => {
    const rank = monthlyRanks[monthIndex];
    if (rank === ' - ') return <Text style={playerCardStyles.emptySlotText}> - </Text>;
    if (rank === 1) {
      return (
        <View style={playerCardStyles.trophyContainer}>
          <Image source={require('../../assets/trophies/goldTrophy.webp')} style={playerCardStyles.playerCardTrophyImage} />
          <Text style={playerCardStyles.trophyText}>GOLD</Text>
        </View>
      );
    }
    if (rank === 2) {
      return (
        <View style={playerCardStyles.trophyContainer}>
          <Image source={require('../../assets/trophies/silverTrophy.webp')} style={playerCardStyles.playerCardTrophyImage} />
          <Text style={playerCardStyles.trophyText}>SILVER</Text>
        </View>
      );
    }
    if (rank === 3) {
      return (
        <View style={playerCardStyles.trophyContainer}>
          <Image source={require('../../assets/trophies/bronzeTrophy.webp')} style={playerCardStyles.playerCardTrophyImage} />
          <Text style={playerCardStyles.trophyText}>BRONZE</Text>
        </View>
      );
    }
    return (
      <Text
        style={playerCardStyles.rankSlotText}
      >
        {rank}.
      </Text>
    );
  };

  const playerCardBg = getPlayerCardBackground(levelInfo.level);
  // If there's no explicit bg found yet: for beginners we can show the
  // BeginnerBG immediately; for non-beginners we should wait for the
  // PlayercardBg lookup to resolve to avoid flashing the beginner art.
  const levelKey = (levelInfo.level || '').toLowerCase();
  const isDefaultBg = !playerCardBg && levelKey === 'beginner';
  const needsBgLoad = !playerCardBg && levelKey !== 'beginner';

  // Show a fullscreen spinner while the correct (non-beginner) background
  // is being resolved. This prevents a quick flash of the BeginnerBG.
  if (isModalVisible && needsBgLoad) {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </Modal>
    );
  }

  const avatarSrc = getAvatarImage(getAvatarToDisplay());

  return (
    <View style={playerCardStyles.playerCardContainer}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={playerCardStyles.playerCardModalBackground}>
          <View
            style={[playerCardStyles.playerCardModalContainer, isDarkBg && playerCardStyles.playerCardModalContainerDark]}
            onLayout={(event) => setModalHeight(event.nativeEvent.layout.height)}
          >
            {/* Corner ribbon for All-Time #1 */}
            {viewingAllTimeRank === 1 && (
              <View style={playerCardStyles.ribbonImageWrapper} pointerEvents="none">
                <Image source={require('../../assets/ribbon.webp')} style={playerCardStyles.ribbonImage} />
                <Text style={playerCardStyles.ribbonLabel}>ALL-TIME #1</Text>
              </View>
            )}
            {isBgLoading && (
              <View style={[playerCardStyles.avatarModalBackgroundImage, { justifyContent: 'center', alignItems: 'center', position: 'absolute', zIndex: 2 }]}> 
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
            <Animated.Image
              source={playerCardBg}
              style={[playerCardStyles.avatarModalBackgroundImage, { opacity: bgOpacity }]}
              onLoadStart={() => {
                setIsBgLoading(true);
                imageLoadedRef.current = false;
                // reset opacity when a new image starts loading
                try { bgOpacity.setValue(0); } catch (e) { /* ignore */ }
              }}
              onLoadEnd={() => {
                setIsBgLoading(false);
                imageLoadedRef.current = true;
                // If content already settled, animate immediately; otherwise
                // the effect will be triggered by the contentSettled watcher.
                if (contentSettled) {
                  Animated.timing(bgOpacity, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                  }).start();
                  // animate content in as well
                  Animated.parallel([
                    Animated.timing(contentOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(contentTranslate, { toValue: 0, duration: 300, useNativeDriver: true }),
                  ]).start();
                }
              }}
            />
            <CoinLayer weeklyWins={weeklyWins} modalHeight={modalHeight - 2} />

            {/* HEADER */}
            <View style={playerCardStyles.playerCardHeaderCentered}>
              <View style={playerCardStyles.nameAndLinkContainer}>
                {playerIsLinked && (
                  <View style={[playerCardStyles.linkIconContainer, isDarkBg && playerCardStyles.linkIconContainerDark]}>
                    <FontAwesome5 name="link" size={18} color='#f1c40f' />
                  </View>
                )}
                <Text style={[playerCardStyles.playerCardName, isDarkBg && playerCardStyles.playerCardNameDark]}>{nameToUse}</Text>
              </View>
              <Pressable
                style={playerCardStyles.playerCardCloseButton}
                onPress={() => {
                  setModalModalVisible(false);
                  setModalVisible(false);
                }}
              >
                <Text style={[playerCardStyles.playerCardCloseText, isDarkBg && playerCardStyles.playerCardCloseTextDark]}>X</Text>
              </Pressable>
            </View>

            {/* Avatar + Stats */}
            <View style={playerCardStyles.playerInfoContainer}>
              <View style={{ position: 'relative' }}>
                <View style={playerCardStyles.avatarContainer}>
                  {avatarSrc ? (
                    <Image
                      style={[
                        playerCardStyles.avatar,
                        isBeginnerAvatar(getAvatarToDisplay()) ? playerCardStyles.beginnerAvatar : playerCardStyles.defaultAvatar,
                      ]}
                      source={avatarSrc}
                    />
                  ) : (
                    <View
                      style={[
                        playerCardStyles.avatar,
                        playerCardStyles.defaultAvatar,
                        { alignItems: 'center', justifyContent: 'center' },
                      ]}
                    >
                      <FontAwesome5 name="user" size={36} color="#000000" />
                    </View>
                  )}
                </View>
                {idToUse === playerId && (
                  <Pressable style={playerCardStyles.editAvatarButton} onPress={() => setIsAvatarModalVisible(true)}>
                    <FontAwesome5 name="edit" size={15} color="white" />
                  </Pressable>
                )}
              </View>

              <View style={[playerCardStyles.playerTextContainer]}>
                <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>Level: {levelInfo.level}</Text>
                <View style={playerCardStyles.progressBar}>
                  <View style={[playerCardStyles.progressFill, { width: `${levelInfo.progress * 100}%` }]} />
                  <Text style={[playerCardStyles.progressPercentageText, isDarkBg && playerCardStyles.playerCardTextDark]}>{Math.floor(levelInfo.progress * 100)}%</Text>
                </View>
                <View style={playerCardStyles.playerStatsContainer}>
                  <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>All Time Rank: {viewingAllTimeRank}</Text>
                  <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>Weekly Wins: {weeklyWins}</Text>
                  <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>Played Games: {playedGames}</Text>
                  <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>Avg. Points/Game: {avgPoints}</Text>
                  <Text style={[playerCardStyles.playerStat, isDarkBg && playerCardStyles.playerCardTextDark]}>Avg Duration/Game: {avgDuration} s</Text>
                </View>
              </View>
            </View>

            {/* TOP SCORES */}
            <Text style={[playerCardStyles.playerCardScoresTitle, isDarkBg && playerCardStyles.playerCardTextDark]}>TOP 5 SCORES</Text>
            <View style={playerCardStyles.playerCardScoresContainer} contentContainerStyle={{ paddingTop: 2, paddingBottom: 5, flexGrow: 0 }}>
              {getTopScoresWithEmptySlots().map((score, index) => (
                <View
                  key={index}
                  style={[
                    playerCardStyles.scoreRow,
                    index % 2 === 0
                      ? [playerCardStyles.evenRow, isDarkBg && playerCardStyles.evenRowDark]
                      : [playerCardStyles.oddRow, isDarkBg && playerCardStyles.oddRowDark]
                  ]}
                >
                  <Text style={[playerCardStyles.playerCardScoreItem, isDarkBg && playerCardStyles.playerCardTextDark]}>
                    {index + 1}. {score.points} points in {score.duration} sec
                  </Text>
                  <Text style={[playerCardStyles.playerCardScoreDate, isDarkBg && playerCardStyles.playerCardTextDark]}>{score.date}</Text>
                </View>
              ))}
            </View>

            {/* TROPHIES */}
            <View style={playerCardStyles.playerCardTrophyCase}>
              <Text style={[playerCardStyles.playerCardTrophyCaseTitle, isDarkBg && playerCardStyles.playerCardTextDark]}>TROPHIES {currentYear}</Text>
              <View style={playerCardStyles.playerCardMonthsContainer}>
                {Array(12).fill(null).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      playerCardStyles.playerCardMonth,
                      index === currentMonth ? playerCardStyles.playerCardOngoingMonth : null,
                      isDarkBg && playerCardStyles.playerCardMonthDark,
                    ]}
                  >
                    <Text style={playerCardStyles.playerCardMonthText}>{monthNames[index]}</Text>
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
