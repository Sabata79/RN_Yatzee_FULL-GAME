/**
 * src/services/nameUtils.js
 * Common name utilities for player name handling
 *
 * @module nameUtils
 * @author Sabata79
 * @since 2025-08-29 (updated 2025-08-29)
 */
import { dbGet } from './Firebase';

// Clean input name
// preserving your original rule of characters.
export const sanitizeInput = (input = '') =>
  String(input)
    .replace(/[^a-zA-Z0-9 äöåÄÖÅæøÆØ]/g, '')
    .trim();

// Check if name already exists.
// optional `excludePlayerId` → current player is excluded.
export const checkIfNameExists = async (name, excludePlayerId = null) => {
  const cleanedName = sanitizeInput(name);
  if (!cleanedName) return false;

  const snapshot = await dbGet('players');
  if (!snapshot.exists()) return false;

  const playersData = snapshot.val();
  const target = cleanedName.toLowerCase();

  for (let pid in playersData) {
    if (!Object.prototype.hasOwnProperty.call(playersData, pid)) continue;

    // Skip current player (used in Settings)
    if (excludePlayerId && String(pid) === String(excludePlayerId)) {
      continue;
    }

    const rawName = playersData[pid]?.name ?? '';
    const dbName = sanitizeInput(rawName).toLowerCase();

    if (dbName && dbName === target) {
      return true;
    }
  }

  return false;
};
