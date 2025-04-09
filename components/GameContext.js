// GameContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ref, onValue, get, set, update } from 'firebase/database';
import { database } from './Firebase';
import { MAX_TOKENS, VIDEO_TOKEN_LIMIT } from '../constants/Game';

const GameContext = createContext();

export const useGame = () => {
  return useContext(GameContext);
};

export const GameProvider = ({ children }) => {
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [activePlayerId, setActivePlayerId] = useState('');
  const [playerScores, setPlayerScores] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isGameSaved, setIsGameSaved] = useState(false);
  const [viewingPlayerId, setViewingPlayerId] = useState('');
  const [viewingPlayerName, setViewingPlayerName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);
  const [userRecognized, setUserRecognized] = useState(false);
  const [tokens, setTokens] = useState(null);
  const [videoTokens, setVideoTokens] = useState(0);
  const [energyModalVisible, setEnergyModalVisible] = useState(false);
  // Tilin linkityksen tila
  const [isLinked, setIsLinked] = useState(false);
  // Pelaajan taso (default on 'basic')
  const [playerLevel, setPlayerLevel] = useState('beginner');
  const [gameVersion, setGameVersion] = useState("");
  const [progressPoints, setProgressPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState('');
  const [nextLevel, setNextLevel] = useState('');
  const [allTimeRank, setAllTimeRank] = useState('--');

  console.log('GameContext Log - progressPoints:', progressPoints);
  console.log('GameContext Log - currentLevel:', currentLevel);
  console.log('GameContext Log - nextLevel:', nextLevel);
  console.log('GameContext Log - allTime Rank:', allTimeRank);

  // Apufunktio, joka määrittää, kumpi score on "parempi"
  const isBetterScore = (newScore, oldScore) => {
    if (Number(newScore.points) > Number(oldScore.points)) return true;
    if (Number(newScore.points) < Number(oldScore.points)) return false;
    if (Number(newScore.duration) < Number(oldScore.duration)) return true;
    if (Number(newScore.duration) > Number(oldScore.duration)) return false;
    const dateA = new Date(newScore.date.split('.').reverse().join('-'));
    const dateB = new Date(oldScore.date.split('.').reverse().join('-'));
    return dateA < dateB;
  };

  // Hakee kaikkien pelaajien parhaan tuloksen ja määrittää pelaajan allTimeRankin
  useEffect(() => {
    if (playerId) {
      const playersRef = ref(database, 'players');
      const unsubscribe = onValue(playersRef, (snapshot) => {
        if (!snapshot.exists()) {
          setAllTimeRank('--');
          return;
        }
        const playersData = snapshot.val();
        const tmpScores = [];
        Object.keys(playersData).forEach((pId) => {
          const player = playersData[pId];
          if (player.scores) {
            let bestScore = null;
            Object.values(player.scores).forEach((score) => {
              if (!bestScore || isBetterScore(score, bestScore)) {
                bestScore = score;
              }
            });
            if (bestScore) {
              tmpScores.push({
                playerId: pId,
                points: bestScore.points,
                duration: bestScore.duration,
                date: bestScore.date,
              });
            }
          }
        });
        tmpScores.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.duration !== b.duration) return a.duration - b.duration;
          const dateA = new Date(a.date.split('.').reverse().join('-'));
          const dateB = new Date(b.date.split('.').reverse().join('-'));
          return dateA - dateB;
        });
        const rankIndex = tmpScores.findIndex((s) => s.playerId === playerId);
        setAllTimeRank(rankIndex === -1 ? '--' : rankIndex + 1);
      });
      return () => unsubscribe();
    }
  }, [playerId]);

  const updateProgressPoints = (newPoints) => {
    console.log("Updating progress points:", newPoints); // Debug log
    setProgressPoints(newPoints);

    // Lasketaan ja päivitetään taso
    const currentLvl = getCurrentLevel(newPoints);
    const nextLvl = getNextLevel(currentLvl);
    setCurrentLevel(currentLvl);
    setNextLevel(nextLvl);
  };

  const getCurrentLevel = (points) => {
    if (points <= 400) return "Beginner";
    if (points <= 800) return "Basic";
    if (points <= 1200) return "Advanced";
    if (points <= 2000) return "Elite";
    return "Legendary";
  };

  const getNextLevel = (currentLevel) => {
    const levelOrder = ["Beginner", "Basic", "Advanced", "Elite", "Legendary"];
    const nextIndex = levelOrder.indexOf(currentLevel) + 1;
    return nextIndex < levelOrder.length ? levelOrder[nextIndex] : "Legendary";
  };



  // Tämä funktio päivittää progress-pisteet
  // const updateProgressPoints = (newPoints) => {
  //   console.log("Pelaajan nykyiset progress-pisteet ennen tallennusta:", newPoints); // Logitus ennen tallentamista
  //   setProgressPoints(newPoints);

  //   // if (playerId) {
  //   //   const playerRef = ref(database, `players/${playerId}`);
  //   //   update(playerRef, {
  //   //     progressPoints: newPoints, // Tallennetaan Firebaseen
  //   //   }).catch(error => console.error("Error updating progressPoints:", error));
  //   // }
  // };

  // Kuunnellaan pelaajan tasoa Firebase-tietokannasta, kun playerId on saatavilla
  useEffect(() => {
    if (playerId) {
      const levelRef = ref(database, `players/${playerId}/level`);
      const unsubscribe = onValue(levelRef, (snapshot) => {
        if (snapshot.exists()) {
          const levelValue = snapshot.val();
          setPlayerLevel(levelValue);
          console.log('Player level updated from Firebase:', levelValue);
        }
      });
      return () => unsubscribe();
    }
  }, [playerId]);

  // Hae tokenit Firebase:sta
  const fetchInitialTokens = async () => {
    try {
      const tokenRef = ref(database, `players/${playerId}/tokens`);
      const snapshot = await get(tokenRef);

      if (snapshot.exists()) {
        const fetchedTokens = snapshot.val();
        console.log('Firebase-tokens:', fetchedTokens);

        if (fetchedTokens !== tokens) {
          setTokens(fetchedTokens);
        }
      } else {
        console.log('Tokens ei löytynyt Firebase:sta. Luodaan oletusarvo.');
        await set(tokenRef, MAX_TOKENS);
        setTokens(MAX_TOKENS);
      }
    } catch (error) {
      console.error('Virhe tokenien lataamisessa:', error);
      if (tokens !== MAX_TOKENS) {
        setTokens(MAX_TOKENS);
      }
    }
  };

  const fetchVideoTokens = async () => {
    try {
      const videoTokenRef = ref(database, `players/${playerId}/videoTokens`);
      const snapshot = await get(videoTokenRef);
      const fetchedVideoTokens = snapshot.exists() ? snapshot.val() : 0;
      setVideoTokens(fetchedVideoTokens);
    } catch (error) {
      console.error('Error fetching video tokens from Firebase:', error);
      setVideoTokens(0);
    }
  };

  const updateTokensInFirebase = async () => {
    if (playerId && tokens !== null) {
      try {
        const tokenRef = ref(database, `players/${playerId}/tokens`);
        await set(tokenRef, tokens);
        console.log(`Tokens päivitetty Firebaseen: ${tokens}`);
      } catch (error) {
        console.error('Virhe Firebase-tokens-päivityksessä:', error);
      }
    }
  };

  const updateVideoTokensInFirebase = async () => {
    if (playerId && videoTokens !== null) {
      try {
        const videoTokenRef = ref(database, `players/${playerId}/videoTokens`);
        await set(videoTokenRef, videoTokens);
        console.log(`Video tokens päivitetty Firebaseen: ${videoTokens}`);
      } catch (error) {
        console.error('Virhe video tokenien päivityksessä Firebaseen:', error);
      }
    }
  };

  useEffect(() => {
    if (playerId) {
      const playerRef = ref(database, `players/${playerId}/avatar`);
      onValue(playerRef, (snapshot) => {
        const avatarPath = snapshot.val();
        if (avatarPath) {
          setAvatarUrl(avatarPath);
          setIsAvatarLoaded(true);
        } else {
          setAvatarUrl(null);
          setIsAvatarLoaded(true);
        }
      });
    }
  }, [playerId]);

  useEffect(() => {
    if (playerId) {
      fetchInitialTokens();
      fetchVideoTokens();
    }
  }, [playerId]);

  useEffect(() => {
    updateTokensInFirebase();
  }, [tokens]);

  useEffect(() => {
    updateVideoTokensInFirebase();
  }, [videoTokens]);

  const setActivePlayer = (id, name) => {
    setActivePlayerId(id);
    setPlayerName(name);
  };

  const setPlayerIdContext = (id) => {
    setPlayerId(id);
  };

  const setElapsedTimeContext = (time) => {
    setElapsedTime(time);
  };

  const setPlayerScoresContext = (scores) => {
    setPlayerScores(scores);
  };

  const setPlayerNameContext = (name) => {
    setPlayerName(name);
  };

  const setViewingPlayerIdContext = (id) => {
    setViewingPlayerId(id);
  };

  const setViewingPlayerNameContext = (name) => {
    setViewingPlayerName(name);
  };

  const resetViewingPlayer = () => {
    setViewingPlayerId(null);
    setViewingPlayerName(null);
  };

  const startGame = () => {
    setGameStarted(true);
    setGameEnded(false);
    setElapsedTime(0);
  };

  const endGame = () => {
    setGameEnded(true);
    setGameStarted(false);
    setElapsedTimeContext(elapsedTime);
  };

  const saveGame = () => {
    setIsGameSaved(true);
  };

  return (
    <GameContext.Provider value={{
      playerId,
      setPlayerId,
      playerName,
      setPlayerName,
      activePlayerId,
      avatarUrl,
      viewingPlayerId,
      viewingPlayerName,
      playerScores,
      setPlayerIdContext,
      setAvatarUrl,
      setPlayerScoresContext,
      setPlayerNameContext,
      setViewingPlayerIdContext,
      setViewingPlayerNameContext,
      gameStarted,
      gameEnded,
      startGame,
      endGame,
      totalPoints,
      setTotalPoints,
      elapsedTime,
      setElapsedTimeContext,
      saveGame,
      isGameSaved,
      setIsGameSaved,
      resetViewingPlayer,
      userRecognized,
      setUserRecognized,
      tokens,
      setTokens,
      videoTokens,
      setVideoTokens,
      energyModalVisible,
      setEnergyModalVisible,
      isLinked,
      setIsLinked,
      playerLevel,
      setPlayerLevel,
      gameVersion,
      setGameVersion,
      progressPoints,
      setProgressPoints: updateProgressPoints,
      currentLevel,
      setCurrentLevel,
      nextLevel,
      setNextLevel,
      allTimeRank,
      setAllTimeRank,
    }}>
      {children}
    </GameContext.Provider>
  );
};
