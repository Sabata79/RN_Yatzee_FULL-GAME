/**
 * errorTracking.js — Production error tracking and Firebase logging.
 * Logs critical bugs and anomalies to Firebase for post-mortem analysis.
 * Automatically captures device info, user context, and stack traces.
 *
 * @module src/utils/errorTracking
 * @author Sabata79
 * @since 2025-11-10
 * @updated 2025-11-10
 */

import { Platform } from 'react-native';
import { dbSet, dbPush } from '../services/Firebase';
import * as Device from 'expo-device';

/**
 * Log a critical bug to Firebase for production analysis.
 * This runs silently and never crashes the app even if Firebase fails.
 *
 * @param {Object} params
 * @param {string} params.bugType - Type of bug (e.g., 'SCORE_DUPLICATION')
 * @param {string} params.severity - 'critical' | 'major' | 'minor'
 * @param {Object} params.context - Any relevant context data
 * @param {string} params.playerId - Optional player ID
 * @param {string} params.description - Human-readable description
 */
export async function logBugToFirebase({
  bugType,
  severity = 'major',
  context = {},
  playerId = null,
  description = '',
}) {
  try {
    // Only log in production or if explicitly enabled
    const shouldLog = process.env.NODE_ENV === 'production' || process.env.ENABLE_ERROR_TRACKING === 'true';
    
    if (!shouldLog) {
      // In dev, just console.error
      console.error(`[ErrorTracking] ${bugType}:`, description, context);
      return;
    }

    // Build error report
    const errorReport = {
      bugType,
      severity,
      description,
      context,
      playerId,
      timestamp: Date.now(),
      timestampISO: new Date().toISOString(),
      device: {
        platform: Platform.OS,
        version: Platform.Version,
        manufacturer: Device.manufacturer || 'unknown',
        modelName: Device.modelName || 'unknown',
        osName: Device.osName || 'unknown',
        osVersion: Device.osVersion || 'unknown',
      },
      app: {
        // You can add app version here if available
        // version: Constants.manifest?.version,
      },
    };

    // Write to Firebase under /errorLogs/{bugType}/{pushId}
    const path = `errorLogs/${bugType}`;
    await dbPush(path, errorReport);

    console.warn(`[ErrorTracking] Bug logged to Firebase: ${bugType}`);
  } catch (err) {
    // Fail silently - never crash the app due to logging failure
    console.error('[ErrorTracking] Failed to log bug to Firebase:', err?.message || String(err));
  }
}

/**
 * Validate score consistency and log anomalies.
 * Checks if basic points are within reasonable bounds and match expected calculations.
 *
 * @param {Object} params
 * @param {number} params.totalPoints - Current total points
 * @param {number} params.minorPoints - Minor section points
 * @param {boolean} params.hasAppliedBonus - Whether section bonus was applied
 * @param {Array} params.scoringCategories - All scoring categories with points
 * @param {string} params.playerId - Player ID
 * @returns {boolean} - true if valid, false if anomaly detected
 */
export function validateScoreConsistency({
  totalPoints,
  minorPoints,
  hasAppliedBonus,
  scoringCategories,
  playerId = null,
}) {
  try {
    // Calculate expected total from categories
    const calculatedTotal = scoringCategories.reduce((sum, cat) => sum + (cat.points || 0), 0);
    const sectionBonus = hasAppliedBonus ? 35 : 0;
    const expectedTotal = calculatedTotal + sectionBonus;

    // Check for anomalies
    const anomalies = [];

    // 1. Total points mismatch
    if (totalPoints !== expectedTotal) {
      anomalies.push({
        type: 'TOTAL_MISMATCH',
        expected: expectedTotal,
        actual: totalPoints,
        difference: totalPoints - expectedTotal,
      });
    }

    // 2. Unreasonably high basic points (max realistic is ~500)
    const basicPoints = totalPoints - sectionBonus;
    if (basicPoints > 500) {
      anomalies.push({
        type: 'UNREALISTIC_BASIC_POINTS',
        basicPoints,
        threshold: 500,
      });
    }

    // 3. Section bonus applied but minor points < 63
    if (hasAppliedBonus && minorPoints < 63) {
      anomalies.push({
        type: 'INVALID_SECTION_BONUS',
        minorPoints,
        threshold: 63,
        hasBonus: hasAppliedBonus,
      });
    }

    // 4. Negative points (should never happen)
    if (totalPoints < 0 || minorPoints < 0) {
      anomalies.push({
        type: 'NEGATIVE_POINTS',
        totalPoints,
        minorPoints,
      });
    }

    // 5. Check for duplicate points in categories (same points in multiple categories)
    const categoryPoints = scoringCategories.map(c => c.points).filter(p => p > 0);
    const duplicates = categoryPoints.filter((p, i) => categoryPoints.indexOf(p) !== i && p > 20);
    if (duplicates.length > 0) {
      anomalies.push({
        type: 'SUSPICIOUS_DUPLICATE_POINTS',
        duplicateValues: duplicates,
      });
    }

    // If anomalies detected, log to Firebase
    if (anomalies.length > 0) {
      logBugToFirebase({
        bugType: 'SCORE_ANOMALY',
        severity: 'critical',
        playerId,
        description: `Score validation failed with ${anomalies.length} anomalie(s)`,
        context: {
          totalPoints,
          minorPoints,
          hasAppliedBonus,
          calculatedTotal,
          expectedTotal,
          sectionBonus,
          basicPoints,
          anomalies,
          categories: scoringCategories.map(c => ({
            name: c.name,
            points: c.points,
            locked: c.locked,
          })),
        },
      });

      return false;
    }

    return true;
  } catch (err) {
    console.error('[validateScoreConsistency] Validation error:', err?.message || String(err));
    return true; // Don't block the game if validation fails
  }
}

/**
 * Track point-setting operations for debugging duplication issues.
 * Call this every time points are set to track the history.
 *
 * @param {Object} params
 * @param {string} params.categoryName - Name of category being scored
 * @param {number} params.points - Points being added
 * @param {number} params.totalBefore - Total points before this operation
 * @param {number} params.totalAfter - Total points after this operation
 * @param {string} params.playerId - Player ID
 */
export function trackPointOperation({
  categoryName,
  points,
  totalBefore,
  totalAfter,
  playerId = null,
}) {
  // Store in-memory history (last 20 operations)
  if (!global.__pointOperationHistory) {
    global.__pointOperationHistory = [];
  }

  const operation = {
    timestamp: Date.now(),
    categoryName,
    points,
    totalBefore,
    totalAfter,
    diff: totalAfter - totalBefore,
  };

  global.__pointOperationHistory.push(operation);
  if (global.__pointOperationHistory.length > 20) {
    global.__pointOperationHistory.shift();
  }

  // Check for suspicious duplicate operations (same category scored twice in < 500ms)
  const recentOps = global.__pointOperationHistory.filter(
    op => op.timestamp > Date.now() - 500 && op.categoryName === categoryName
  );

  if (recentOps.length > 1) {
    // DUPLICATE DETECTED!
    logBugToFirebase({
      bugType: 'DUPLICATE_POINT_OPERATION',
      severity: 'critical',
      playerId,
      description: `Category "${categoryName}" scored ${recentOps.length} times within 500ms`,
      context: {
        categoryName,
        operationCount: recentOps.length,
        operations: recentOps,
        fullHistory: global.__pointOperationHistory,
      },
    });

    console.error(
      `[ErrorTracking] DUPLICATE DETECTED: ${categoryName} scored ${recentOps.length} times!`,
      recentOps
    );
  }
}

/**
 * Get the point operation history for debugging.
 * @returns {Array} - Array of recent point operations
 */
export function getPointOperationHistory() {
  return global.__pointOperationHistory || [];
}

/**
 * Clear point operation history (call when game resets).
 */
export function clearPointOperationHistory() {
  global.__pointOperationHistory = [];
}
