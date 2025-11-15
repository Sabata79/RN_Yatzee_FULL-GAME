/**
 * YearlyBadgeCalculator - Calculates and assigns yearly achievement badges to players
 * Analyzes monthly trophy rankings to determine Champion, Runner-Up, and Third Place badges
 * @module services/YearlyBadgeCalculator
 * @author Sabata79
 * @since 2025-11-14
 */

import { dbGet, dbSet } from './Firebase';

/**
 * Calculate badge points for a player based on monthly trophies
 * Gold = 3 points, Silver = 2 points, Bronze = 1 point
 * @param {string} playerId - Player's unique ID
 * @param {number} year - Year to calculate (e.g., 2025)
 * @returns {Promise<number>} Total badge points for the year
 */
async function calculatePlayerBadgePoints(playerId, year) {
  let totalPoints = 0;
  
  // Check all 12 months
  for (let month = 1; month <= 12; month++) {
    const monthKey = String(month).padStart(2, '0');
    const trophy = await dbGet(`players/${playerId}/monthlyBest/${year}/${monthKey}/rank`);
    
    if (trophy === 1) totalPoints += 3; // Gold
    else if (trophy === 2) totalPoints += 2; // Silver
    else if (trophy === 3) totalPoints += 1; // Bronze
  }
  
  return totalPoints;
}

/**
 * Get all player IDs from the database
 * @returns {Promise<string[]>} Array of player IDs
 */
async function getAllPlayerIds() {
  const playersSnapshot = await dbGet('players');
  if (!playersSnapshot) return [];
  
  return Object.keys(playersSnapshot);
}

/**
 * Calculate and assign yearly badges to all players
 * Determines top 3 players based on monthly trophy points
 * Handles tied positions (shared badges)
 * @param {number} year - Year to calculate badges for (e.g., 2025)
 * @returns {Promise<{success: boolean, playersProcessed: number, badgesAwarded: number}>}
 */
export async function calculateYearlyBadges(year) {
  try {
    console.log(`[YearlyBadgeCalculator] Starting badge calculation for year ${year}`);
    
    // Get all players
    const playerIds = await getAllPlayerIds();
    if (playerIds.length === 0) {
      console.warn('[YearlyBadgeCalculator] No players found');
      return { success: false, playersProcessed: 0, badgesAwarded: 0 };
    }
    
    // Calculate points for each player
    const playerPoints = [];
    for (const playerId of playerIds) {
      const points = await calculatePlayerBadgePoints(playerId, year);
      if (points > 0) {
        playerPoints.push({ playerId, points });
      }
    }
    
    // Sort by points (descending)
    playerPoints.sort((a, b) => b.points - a.points);
    
    console.log(`[YearlyBadgeCalculator] Player standings:`, playerPoints.map(p => `${p.playerId}: ${p.points}pts`));
    
    // Assign badges with tied position handling
    let badgesAwarded = 0;
    const assignedRanks = new Map();
    
    // Track unique point values for ranking
    const uniquePoints = [...new Set(playerPoints.map(p => p.points))].sort((a, b) => b - a);
    
    for (const player of playerPoints) {
      // Find which rank this point value corresponds to
      const pointsRankIndex = uniquePoints.indexOf(player.points);
      
      // Assign badge: 1st unique points = Champion (1), 2nd = Runner-Up (2), 3rd = Third (3)
      let badge = null;
      if (pointsRankIndex === 0) {
        badge = 1; // Champion
      } else if (pointsRankIndex === 1) {
        badge = 2; // Runner-Up
      } else if (pointsRankIndex === 2) {
        badge = 3; // Third Place
      }
      
      if (badge) {
        await dbSet(`players/${player.playerId}/yearlyBadge${year}`, badge);
        assignedRanks.set(player.playerId, badge);
        badgesAwarded++;
        console.log(`[YearlyBadgeCalculator] Awarded badge ${badge} to ${player.playerId} (${player.points} points)`);
      }
    }
    
    // Mark calculation as complete
    await dbSet(`yearlyBadges/${year}/calculated`, true);
    await dbSet(`yearlyBadges/${year}/calculatedAt`, Date.now());
    await dbSet(`yearlyBadges/${year}/playersProcessed`, playerIds.length);
    
    console.log(`[YearlyBadgeCalculator] Calculation complete: ${badgesAwarded} badges awarded to ${playerPoints.length} players`);
    
    return {
      success: true,
      playersProcessed: playerIds.length,
      badgesAwarded,
      rankings: assignedRanks
    };
    
  } catch (error) {
    console.error('[YearlyBadgeCalculator] Error calculating badges:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if yearly badges have been calculated for a given year
 * @param {number} year - Year to check
 * @returns {Promise<boolean>} True if already calculated
 */
export async function areBadgesCalculated(year) {
  const calculated = await dbGet(`yearlyBadges/${year}/calculated`);
  return calculated === true;
}

/**
 * Get badge rank for a specific player and year
 * @param {string} playerId - Player's unique ID
 * @param {number} year - Year to check
 * @returns {Promise<number|null>} Badge rank (1=Champion, 2=RunnerUp, 3=Third) or null
 */
export async function getPlayerBadge(playerId, year) {
  const badge = await dbGet(`players/${playerId}/yearlyBadge${year}`);
  return badge || null;
}
