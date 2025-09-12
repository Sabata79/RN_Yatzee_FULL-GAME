/**
* src/services/nameUtils.js
* Common name utilities for player name handling
*
* @module nameUtils
* @author Sabata79
* @since 2025-08-29
*/
import { dbGet } from './Firebase';

export const sanitizeInput = (input) =>
  input.replace(/[^a-zA-Z0-9 äöåÄÖÅæøÆØ]/g, '').trim();

export const checkIfNameExists = async (name) => {
  const snapshot = await dbGet('players');
  if (snapshot.exists()) {
    const playersData = snapshot.val();
    for (let pid in playersData) {
      if (playersData[pid]?.name === name) return true;
    }
  }
  return false;
};
