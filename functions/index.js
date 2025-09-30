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
    const updates = {};
    snapshot.forEach((child) => {
      const pid = child.key;
      const p = child.val() || {};
      const tokens = Number.isFinite(p.tokens) ? Math.trunc(p.tokens) : 0;
      const next = p.nextTokenTime ? new Date(p.nextTokenTime).getTime() : null;
      if (tokens >= MAX_TOKENS) return; // skip
      if (!next || isNaN(next)) return; // skip
      if (next > now) return; // not due
      // compute how many to add
      const diff = now - next;
      const toAdd = Math.min(MAX_TOKENS - tokens, Math.floor(diff / REGEN_INTERVAL) + 1);
      if (toAdd <= 0) return;
      const newTokens = Math.min(tokens + toAdd, MAX_TOKENS);
      if (newTokens >= MAX_TOKENS) {
        updates[`players/${pid}/tokens`] = newTokens;
        updates[`players/${pid}/nextTokenTime`] = null;
      } else {
        // compute remainder and next time
        const remainder = diff % REGEN_INTERVAL;
        const newNext = new Date(now + (REGEN_INTERVAL - remainder)).toISOString();
        updates[`players/${pid}/tokens`] = newTokens;
        updates[`players/${pid}/nextTokenTime`] = newNext;
      }
    });
    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
    }
  } catch (e) {
    console.error('scheduledTokenRegen failed', e);
  }
  return null;
});
