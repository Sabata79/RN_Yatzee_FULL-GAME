const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.database();

// Server-side regen constants
const REGEN_INTERVAL = 1.6 * 60 * 60 * 1000; // 1.6 hours
const MAX_TOKENS = 10;

// Scheduled function: run every 5 minutes
exports.scheduledTokenRegen = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const now = Date.now();
  const playersRef = db.ref('players');
  try {
    const snapshot = await playersRef.once('value');
    if (!snapshot.exists()) return null;

    const tasks = [];
    snapshot.forEach((child) => {
      const pid = child.key;
      const p = child.val() || {};
      const tokens = Number.isFinite(p.tokens) ? Math.trunc(p.tokens) : 0;
      const next = p.nextTokenTime ? new Date(p.nextTokenTime).getTime() : null;
      if (tokens >= MAX_TOKENS) return; // skip
      if (!next || isNaN(next)) return; // skip
      if (next > now) return; // not due

      // For each player that is due, run a transaction on their node to atomically
      // compute tokens/nextTokenTime/lastTokenDecrement and avoid overriding concurrent client transactions.
      const txPromise = db.ref(`players/${pid}`).transaction((current) => {
        if (!current) return current;
        const curTokens = Number.isFinite(current.tokens) ? Math.trunc(current.tokens) : 0;
        if (curTokens >= MAX_TOKENS) return current;

        const serverNext = current.nextTokenTime ? new Date(current.nextTokenTime).getTime() : null;
        if (!serverNext || isNaN(serverNext) || serverNext > now) return current;

        const diff = now - serverNext;
        const toAdd = Math.min(MAX_TOKENS - curTokens, Math.floor(diff / REGEN_INTERVAL) + 1);
        if (toAdd <= 0) return current;

        const newTokens = Math.min(curTokens + toAdd, MAX_TOKENS);
        const out = { ...current, tokens: newTokens };

        if (newTokens >= MAX_TOKENS) {
          out.nextTokenTime = null;
          out.lastTokenDecrement = null;
        } else {
          const remainder = diff % REGEN_INTERVAL;
          const newNext = new Date(now + (REGEN_INTERVAL - remainder)).toISOString();
          out.nextTokenTime = newNext;

          // Compute a sensible lastTokenDecrement anchor:
          // If current.lastTokenDecrement exists, use it as base. Otherwise infer base from serverNext - REGEN_INTERVAL.
          const baseAnchor = (current.lastTokenDecrement && !isNaN(Number(current.lastTokenDecrement)))
            ? Number(current.lastTokenDecrement)
            : (serverNext ? (serverNext - REGEN_INTERVAL) : (now - REGEN_INTERVAL * toAdd));
          const serverIntervals = Math.floor((now - baseAnchor) / REGEN_INTERVAL);
          if (serverIntervals > 0) {
            out.lastTokenDecrement = baseAnchor + serverIntervals * REGEN_INTERVAL;
          } else {
            out.lastTokenDecrement = current.lastTokenDecrement || null;
          }
        }

        return out;
      });

      tasks.push(txPromise);
    });

    if (tasks.length > 0) await Promise.all(tasks);
  } catch (e) {
    console.error('scheduledTokenRegen failed', e);
  }
  return null;
});
