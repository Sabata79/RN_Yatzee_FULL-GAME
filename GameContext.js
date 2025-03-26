// GameContext.js 
// Purpose: Context for the game state and player data.
import React, { createContext, useState, useContext, useEffect } from 'react';
import { ref, onValue, get, set } from 'firebase/database';
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
  // Uusi tila: onko tili linkitetty Googleen
  const [isLinked, setIsLinked] = useState(false);

  // Fetch the player's avatar from the avatars array
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

  // Fecth video tokens from Firebase
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

  // Update tokens in Firebase
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

  // Update video tokens in Firebase
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

  // Get player token information from Firebase
  useEffect(() => {
    if (playerId) {
      fetchInitialTokens();
      fetchVideoTokens(); 
    }
  }, [playerId]);

  // Update tokens in Firebase, when they change
  useEffect(() => {
    updateTokensInFirebase();
  }, [tokens]);

  // Update video tokens in Firebase, when they change
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
      videoTokens, // Video tokenit lisätty
      setVideoTokens, // Video tokenien asettaminen
      energyModalVisible,
      setEnergyModalVisible,
      // Uudet tilat tilin linkitykselle:
      isLinked,
      setIsLinked,
    }}>
      {children}
    </GameContext.Provider>
  );
};
