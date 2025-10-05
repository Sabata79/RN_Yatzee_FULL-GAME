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

      // Run transaction on dedicated tokensAtomic child to avoid stomping unrelated
      // top-level fields (presence, profile, etc.). After the atomic transaction
      // we mirror minimal fields back to the legacy root for compatibility.
      // Transaction directly on player root: update only tokens and TokensLastAnchor
      const playerPath = `players/${pid}`;
      const txPromise = db.ref(playerPath).transaction((currentPlayer) => {
        const node = currentPlayer || {};
        const curTokens = Number.isFinite(node.tokens) ? Math.trunc(node.tokens) : (Number.isFinite(p.tokens) ? Math.trunc(p.tokens) : 0);
        if (curTokens >= MAX_TOKENS) return node;

        const serverNext = node.nextTokenTime ? new Date(node.nextTokenTime).getTime() : (p.nextTokenTime ? new Date(p.nextTokenTime).getTime() : null);
        if (!serverNext || isNaN(serverNext) || serverNext > now) return node;

        const diff = now - serverNext;
        const toAdd = Math.min(MAX_TOKENS - curTokens, Math.floor(diff / REGEN_INTERVAL) + 1);
        if (toAdd <= 0) return node;

        const newTokens = Math.min(curTokens + toAdd, MAX_TOKENS);
        const out = { ...node, tokens: newTokens };

        if (newTokens >= MAX_TOKENS) {
          // When full, clear anchor information on root
          out.tokensLastAnchor = null;
          // NOTE: intentionally do NOT write nextTokenTime to DB from server; UI derives display from tokensLastAnchor
        } else {
          // Compute anchor: prefer existing TokensLastAnchor then existing lastTokenDecrement fallback
          const curAnchor = (node.tokensLastAnchor && !isNaN(Number(node.tokensLastAnchor)))
            ? Number(node.tokensLastAnchor)
            : (node.lastTokenDecrement && !isNaN(Number(node.lastTokenDecrement)) ? Number(node.lastTokenDecrement) : (serverNext ? (serverNext - REGEN_INTERVAL) : (now - REGEN_INTERVAL * toAdd)));
          const serverIntervals = Math.floor((now - curAnchor) / REGEN_INTERVAL);
          if (serverIntervals > 0) {
            out.tokensLastAnchor = curAnchor + serverIntervals * REGEN_INTERVAL;
          } else {
            out.tokensLastAnchor = node.tokensLastAnchor || node.lastTokenDecrement || null;
          }
          // compute next token time locally as needed (do NOT persist nextTokenTime here)
        }

        return out;
      });

      // After transaction completes, mirror minimal fields back to legacy location.
      const mirrorPromise = txPromise.then(async (res) => {
        try {
          // Read the final player value and compute fields
          const snapPlayer = await db.ref(`players/${pid}`).once('value');
          const playerVal = snapPlayer.val() || {};
          const serverTokens = Number.isFinite(playerVal.tokens) ? playerVal.tokens : 0;
          const serverAnchor = (playerVal.tokensLastAnchor && !isNaN(Number(playerVal.tokensLastAnchor))) ? Number(playerVal.tokensLastAnchor) : null;

          const updateObj = { tokens: serverTokens, tokensLastAnchor: serverAnchor };
          if (serverTokens >= MAX_TOKENS) {
            // keep anchor null when full
            updateObj.tokensLastAnchor = null;
          }

          // Mirror back to root (best-effort; don't block the scheduler if this fails)
          await db.ref(`players/${pid}`).update(updateObj);
          // write a lightweight audit record so clients/ops can attribute who updated tokens
          try {
            const auditRef = db.ref(`tokenAudit/${pid}/${Date.now()}`);
            // Do not persist nextTokenTime in audit; keep audit focused on tokens and timing
            await auditRef.set({ actor: 'server', source: 'scheduledTokenRegen', tokens: serverTokens, ts: Date.now() });
          } catch (e) {
            console.error('scheduledTokenRegen audit write failed for', pid, e);
          }
        } catch (e) {
          // swallow mirror errors to avoid failing the whole scheduled run
          console.error('scheduledTokenRegen mirror failed for', pid, e);
        }
        return res;
      }).catch((e) => {
        // transaction failed for this player; ignore and continue
        return null;
      });

      tasks.push(mirrorPromise);
    });

    if (tasks.length > 0) await Promise.all(tasks);
  } catch (e) {
    console.error('scheduledTokenRegen failed', e);
  }
  return null;
});
