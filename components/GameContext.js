// Purpose: Context for the game state and player data.
import React, { createContext, useState, useContext } from 'react';

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
      playerName,
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
    }}>
      {children}
    </GameContext.Provider>
  );
};
