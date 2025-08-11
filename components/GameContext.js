// context/GameContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { dbOnValue, dbOff, dbGet, dbSet } from '../components/Firebase';
import { MAX_TOKENS, VIDEO_TOKEN_LIMIT } from '../constants/Game';

const GameContext = createContext();
export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerIdContext, setPlayerIdContext] = useState('');
  const [playerNameContext, setPlayerNameContext] = useState('');
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
  const [isLinked, setIsLinked] = useState(false);
  const [playerLevel, setPlayerLevel] = useState('beginner');
  const [gameVersion, setGameVersion] = useState('');
  const [progressPoints, setProgressPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState('');
  const [nextLevel, setNextLevel] = useState('');
  const [allTimeRank, setAllTimeRank] = useState('--');

  const isBetterScore = (newScore, oldScore) => {
    if (Number(newScore.points) > Number(oldScore.points)) return true;
    if (Number(newScore.points) < Number(oldScore.points)) return false;
    if (Number(newScore.duration) < Number(oldScore.duration)) return true;
    if (Number(newScore.duration) > Number(oldScore.duration)) return false;
    const dateA = new Date(newScore.date.split('.').reverse().join('-'));
    const dateB = new Date(oldScore.date.split('.').reverse().join('-'));
    return dateA < dateB;
  };

  // All Time Rank listener
  useEffect(() => {
    if (!playerId) return;
    const path = 'players';

    const handleValue = (snapshot) => {
      if (!snapshot.exists()) {
        setAllTimeRank('--');
        return;
      }
      const playersData = snapshot.val();
      const tmpScores = [];

      Object.keys(playersData).forEach((pId) => {
        const player = playersData[pId];
        if (player?.scores) {
          let bestScore = null;
          Object.values(player.scores).forEach((score) => {
            if (!bestScore || isBetterScore(score, bestScore)) {
              bestScore = score;
            }
          });
          if (bestScore) tmpScores.push({ playerId: pId, ...bestScore });
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
    };

    dbOnValue(path, handleValue);
    return () => dbOff(path, handleValue);
  }, [playerId]);

  // Player level listener
  useEffect(() => {
    if (!playerId) return;
    const path = `players/${playerId}/level`;

    const handleValue = (snapshot) => {
      if (snapshot.exists()) setPlayerLevel(snapshot.val());
    };

    dbOnValue(path, handleValue);
    return () => dbOff(path, handleValue);
  }, [playerId]);

  // Avatar listener
  useEffect(() => {
    if (!playerId) return;
    const path = `players/${playerId}/avatar`;

    const handleValue = (snapshot) => {
      const avatarPath = snapshot.val();
      setAvatarUrl(avatarPath || null);
      setIsAvatarLoaded(true);
    };

    dbOnValue(path, handleValue);
    return () => dbOff(path, handleValue);
  }, [playerId]);

  // Fetch tokens
  const fetchInitialTokens = async () => {
    try {
      const snapshot = await dbGet(`players/${playerId}/tokens`);
      if (snapshot.exists()) {
        setTokens(snapshot.val());
      } else {
        await dbSet(`players/${playerId}/tokens`, MAX_TOKENS);
        setTokens(MAX_TOKENS);
      }
    } catch (error) {
      console.error('Virhe tokenien lataamisessa:', error);
      setTokens(MAX_TOKENS);
    }
  };

  const fetchVideoTokens = async () => {
    try {
      const snapshot = await dbGet(`players/${playerId}/videoTokens`);
      setVideoTokens(snapshot.exists() ? snapshot.val() : 0);
    } catch (error) {
      console.error('Error fetching video tokens:', error);
      setVideoTokens(0);
    }
  };

  const updateTokensInFirebase = async () => {
    if (playerId && tokens !== null) {
      await dbSet(`players/${playerId}/tokens`, tokens);
    }
  };

  const updateVideoTokensInFirebase = async () => {
    if (playerId && videoTokens !== null) {
      await dbSet(`players/${playerId}/videoTokens`, videoTokens);
    }
  };

  useEffect(() => {
    if (playerId) {
      fetchInitialTokens();
      fetchVideoTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  useEffect(() => {
    updateTokensInFirebase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  useEffect(() => {
    updateVideoTokensInFirebase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoTokens]);

  const getCurrentLevel = (points) => {
    if (points <= 400) return 'Beginner';
    if (points <= 800) return 'Basic';
    if (points <= 1200) return 'Advanced';
    if (points <= 2000) return 'Elite';
    return 'Legendary';
  };

  const getNextLevel = (currentLevel) => {
    const levelOrder = ['Beginner', 'Basic', 'Advanced', 'Elite', 'Legendary'];
    const nextIndex = levelOrder.indexOf(currentLevel) + 1;
    return nextIndex < levelOrder.length ? levelOrder[nextIndex] : 'Legendary';
  };

  const updateProgressPoints = (newPoints) => {
    setProgressPoints(newPoints);
    const currentLvl = getCurrentLevel(newPoints);
    const nextLvl = getNextLevel(currentLvl);
    setCurrentLevel(currentLvl);
    setNextLevel(nextLvl);
  };

  const setActivePlayer = (id, name) => {
    setActivePlayerId(id);
    setPlayerName(name);
  };

  const contextValue = {
    playerLevel,
    setPlayerLevel,
    playerId,
    setPlayerId,
    playerName,
    setPlayerName,
    playerIdContext,
    setPlayerIdContext,
    playerNameContext,
    setPlayerNameContext,
    activePlayerId,
    setActivePlayer,
    playerScores,
    setPlayerScores,
    gameStarted,
    gameEnded,
    startGame: () => {
      setGameStarted(true);
      setGameEnded(false);
      setElapsedTime(0);
    },
    endGame: () => {
      setGameEnded(true);
      setGameStarted(false);
    },
    totalPoints,
    setTotalPoints,
    elapsedTime,
    setElapsedTime,
    setElapsedTimeContext: setElapsedTime,
    isGameSaved,
    setIsGameSaved,
    saveGame: () => setIsGameSaved(true),
    userRecognized,
    setUserRecognized,
    viewingPlayerId,
    viewingPlayerName,
    setViewingPlayerId,
    setViewingPlayerName,
    resetViewingPlayer: () => {
      setViewingPlayerId(null);
      setViewingPlayerName(null);
    },
    tokens,
    setTokens,
    videoTokens,
    setVideoTokens,
    energyModalVisible,
    setEnergyModalVisible,
    isLinked,
    setIsLinked,
    gameVersion,
    setGameVersion,
    progressPoints,
    setProgressPoints: updateProgressPoints,
    currentLevel,
    nextLevel,
    allTimeRank,
    avatarUrl,
    setAvatarUrl,
    isAvatarLoaded,
  };

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};
