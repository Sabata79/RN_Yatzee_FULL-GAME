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
      const atomicPath = `players/${pid}/tokensAtomic`;
      const txPromise = db.ref(atomicPath).transaction((currentAtomic) => {
        // currentAtomic represents the value at players/{pid}/tokensAtomic (or null)
        const atomic = currentAtomic || {};
        const curTokens = Number.isFinite(atomic.tokens) ? Math.trunc(atomic.tokens) : (Number.isFinite(p.tokens) ? Math.trunc(p.tokens) : 0);
        if (curTokens >= MAX_TOKENS) return atomic;

        // We rely on the snapshot's nextTokenTime (p.nextTokenTime) to decide due-ness
        const serverNext = p.nextTokenTime ? new Date(p.nextTokenTime).getTime() : null;
        if (!serverNext || isNaN(serverNext) || serverNext > now) return atomic;

        const diff = now - serverNext;
        const toAdd = Math.min(MAX_TOKENS - curTokens, Math.floor(diff / REGEN_INTERVAL) + 1);
        if (toAdd <= 0) return atomic;

        const newTokens = Math.min(curTokens + toAdd, MAX_TOKENS);
        const out = { ...atomic, tokens: newTokens };

        if (newTokens >= MAX_TOKENS) {
          // When full, clear anchor information locally. The root mirroring will
          // also clear nextTokenTime/lastTokenDecrement.
          out.lastTokenDecrement = null;
        } else {
          const remainder = diff % REGEN_INTERVAL;
          // Compute a sensible lastTokenDecrement anchor. Prefer atomic.lastTokenDecrement,
          // fall back to root.lastTokenDecrement or serverNext - REGEN_INTERVAL when missing.
          const curAnchor = (atomic.lastTokenDecrement && !isNaN(Number(atomic.lastTokenDecrement)))
            ? Number(atomic.lastTokenDecrement)
            : (p.lastTokenDecrement && !isNaN(Number(p.lastTokenDecrement)) ? Number(p.lastTokenDecrement) : (serverNext ? (serverNext - REGEN_INTERVAL) : (now - REGEN_INTERVAL * toAdd)));
          const serverIntervals = Math.floor((now - curAnchor) / REGEN_INTERVAL);
          if (serverIntervals > 0) {
            out.lastTokenDecrement = curAnchor + serverIntervals * REGEN_INTERVAL;
          } else {
            out.lastTokenDecrement = atomic.lastTokenDecrement || p.lastTokenDecrement || null;
          }
          // We don't persist nextTokenTime inside tokensAtomic; nextTokenTime stays on root and
          // will be updated after the transaction via a separate mirror update.
        }

        return out;
      });

      // After transaction completes, mirror minimal fields back to legacy location.
      const mirrorPromise = txPromise.then(async (res) => {
        try {
          // Read the final atomic value and compute root-level nextTokenTime/fields
          const snapAtomic = await db.ref(`players/${pid}/tokensAtomic`).once('value');
          const atomicVal = snapAtomic.val() || {};
          const serverTokens = Number.isFinite(atomicVal.tokens) ? atomicVal.tokens : 0;
          const serverAnchor = (atomicVal.lastTokenDecrement && !isNaN(Number(atomicVal.lastTokenDecrement))) ? Number(atomicVal.lastTokenDecrement) : null;

          const updateObj = { tokens: serverTokens, lastTokenDecrement: serverAnchor };
          if (serverTokens >= MAX_TOKENS) {
            updateObj.nextTokenTime = null;
            updateObj.lastTokenDecrement = null;
          } else {
            // If we still have capacity, compute a sensible nextTokenTime using the anchor
            const baseAnchor = serverAnchor || (p.nextTokenTime ? new Date(p.nextTokenTime).getTime() - REGEN_INTERVAL : (now - REGEN_INTERVAL));
            const remainder = (now - baseAnchor) % REGEN_INTERVAL;
            const newNext = new Date(now + (REGEN_INTERVAL - remainder)).toISOString();
            updateObj.nextTokenTime = newNext;
          }

          // Mirror back to root (best-effort; don't block the scheduler if this fails)
          await db.ref(`players/${pid}`).update(updateObj);
          // write a lightweight audit record so clients/ops can attribute who updated tokens
          try {
            const auditRef = db.ref(`tokenAudit/${pid}/${Date.now()}`);
            await auditRef.set({ actor: 'server', source: 'scheduledTokenRegen', tokens: serverTokens, nextTokenTime: updateObj.nextTokenTime || null, ts: Date.now() });
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
