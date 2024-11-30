import { set } from 'firebase/database';
import React, { createContext, useState, useContext } from 'react';

// Luo GameContext
const GameContext = createContext();

export const useGame = () => {
  
  return useContext(GameContext); 
};

export const GameProvider = ({ children }) => {
  const [playerId, setPlayerId] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isGameSaved, setIsGameSaved] = useState(false); 

  const setPlayerIdContext = (id) => {
    setPlayerId(id); 
  };

    const setElapsedTimeContext = (time) => {
    setElapsedTime(time); 
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
      setPlayerIdContext,
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
    }}>
      {children}
    </GameContext.Provider>
  );
};
