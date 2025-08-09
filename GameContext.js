// GameContext.js 
// Purpose: Context for the game state and player data.
import React, { createContext, useState, useContext, useEffect } from 'react';
import { database } from './Firebase'; // ✅ korjattu import

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
  const [isLinked, setIsLinked] = useState(false);

  const db = database(); // ✅ käytetään Firebase-yhteyttä

  const fetchInitialTokens = async () => {
    try {
      const tokenRef = ref(db, `players/${playerId}/tokens`);
      const snapshot = await get(tokenRef);
      if (snapshot.exists()) {
        const fetchedTokens = snapshot.val();
        if (fetchedTokens !== tokens) {
          setTokens(fetchedTokens);
        }
      } else {
        await set(tokenRef, MAX_TOKENS);
        setTokens(MAX_TOKENS);
      }
    } catch (error) {
      if (tokens !== MAX_TOKENS) {
        setTokens(MAX_TOKENS);
      }
    }
  };

  const fetchVideoTokens = async () => {
    try {
      const videoTokenRef = ref(db, `players/${playerId}/videoTokens`);
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
        const tokenRef = ref(db, `players/${playerId}/tokens`);
        await set(tokenRef, tokens); 
      } catch (error) {
        console.error('Virhe Firebase-tokens-päivityksessä:', error);
      }
    }
  };

  const updateVideoTokensInFirebase = async () => {
    if (playerId && videoTokens !== null) {
      try {
        const videoTokenRef = ref(db, `players/${playerId}/videoTokens`);
        await set(videoTokenRef, videoTokens);
      } catch (error) {
        console.error('Virhe video tokenien päivityksessä Firebaseen:', error);
      }
    }
  };

  useEffect(() => {
    if (playerId) {
      const playerRef = ref(db, `players/${playerId}/avatar`);
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
    }}>
      {children}
    </GameContext.Provider>
  );
};
