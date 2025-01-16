// Purpose: Context for the game state and player data.
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ref, onValue, get, set } from 'firebase/database';
import { database } from './Firebase';
import { MAX_TOKENS } from '../constants/Game';

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
  const [energyModalVisible, setEnergyModalVisible] = useState(false);

  console.log('Tokens:', tokens);

  const fetchInitialTokens = async () => {
    try {
      const tokenRef = ref(database, `players/${playerId}/tokens`);
      const snapshot = await get(tokenRef);

      if (snapshot.exists()) {
        const fetchedTokens = snapshot.val();
        console.log('Firebase-tokens:', fetchedTokens);

        // If tokens are not loaded, set them to fetched value
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

      // If tokens are not loaded, set them to max
      if (tokens !== MAX_TOKENS) {
        setTokens(MAX_TOKENS);
      }
    }
  };

  useEffect(() => {
    const updateTokensInFirebase = async () => {
      if (playerId && tokens !== null) {
        try {
          const tokenRef = ref(database, `players/${playerId}/tokens`);
          await set(tokenRef, tokens); // Update tokens in Firebase
          console.log(`Tokens päivitetty Firebaseen: ${tokens}`);
        } catch (error) {
          console.error('Virhe Firebase-tokens-päivityksessä:', error);
        }
      }
    };

    updateTokensInFirebase();
  }, [tokens]);

  // useEffect, which fetches the initial tokens from Firebase
  useEffect(() => {
    if (playerId) {
      fetchInitialTokens();
    }
  }, [playerId]);

  // Avatar URL check in background
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
      energyModalVisible,
      setEnergyModalVisible
    }}>
      {children}
    </GameContext.Provider>
  );
};
