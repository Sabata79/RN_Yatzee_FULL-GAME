/**
 * Presence.js — Lightweight presence helper
 * Small helper to subscribe to presence updates and to set presence for a player.
 * @module src/services/Presence
 * @author Sabata79
 * @since 2025-09-23
 * @updated 2025-09-25
 */
import { dbOnValue, dbSet, dbRef, dbGet, auth } from './Firebase';
import { onDisconnect } from '@react-native-firebase/database';

// Helper: format timestamp to dd.mm.yyyy / hh.mm.ss (24h)
function formatLastSeen(ts) {
  try {
    const d = new Date(Number(ts) || Date.now());
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const sec = String(d.getSeconds()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} / ${hh}.${min}.${sec}`;
  } catch (e) {
    return '';
  }
}

export const PRESENCE_ROOT = 'presence';
export const PLAYER_ROOT = 'players';

/**
 * Subscribe to presence root changes.
 * cb receives an object mapping playerId -> { online: boolean, lastSeen: number }
 * Returns an unsubscribe function.
 */
export function onPresenceChange(cb) {
  return dbOnValue(PRESENCE_ROOT, (snap) => {
    try {
      const val = snap && typeof snap.val === 'function' ? snap.val() : (snap && snap._value) || null;
      cb(val || {});
    } catch (e) {
      cb({});
    }
  });
}

/**
 * Fetch presence embedded under each player node (one-time read).
 * Returns an object mapping playerId -> presenceObj
 */
export async function fetchEmbeddedPresence() {
  try {
    const snap = await dbGet(PLAYER_ROOT);
    const val = snap && typeof snap.val === 'function' ? snap.val() : (snap && snap._value) || null;
    const out = {};
    if (!val) return out;
    // val is an object of players keyed by playerId
    Object.keys(val).forEach((k) => {
      const p = val[k];
      if (p && p.presence) {
        out[k] = p.presence;
      }
    });
    return out;
  } catch (e) {
    return {};
  }
}

// Combined listener: merges top-level /presence and embedded players/*/presence (one-time fetch for embedded).
// Returns an unsubscribe function for the top-level listener.
export async function onCombinedPresenceChange(cb) {
  // Combined listener that watches both the top-level `presence` index and the `players` root
  // so we reliably capture presence whether it's stored under `/presence/{playerId}` or
  // under `/players/{playerId}/presence`.
  const lastTop = { ref: {} };
  const lastEmbedded = { ref: {} };

  const extractVal = (snap) => (snap && typeof snap.val === 'function' ? snap.val() : (snap && snap._value) || null);

  // initial fetch: embedded players + top-level presence
  try {
    const [embeddedNow, topSnap] = await Promise.all([fetchEmbeddedPresence(), dbGet(PRESENCE_ROOT).catch(() => null)]);
    const topNow = extractVal(topSnap) || {};
    lastEmbedded.ref = embeddedNow || {};
    lastTop.ref = topNow || {};
    const mergedInitial = { ...(embeddedNow || {}), ...(topNow || {}) };
    // console.log('Presence: initial merged keys', Object.keys(mergedInitial).length);
    cb(mergedInitial);
  } catch (e) {
    // ignore initial failures
  }

  // subscribe to top-level presence
  const unsubTop = dbOnValue(PRESENCE_ROOT, (snap) => {
    try {
      const top = extractVal(snap) || {};
      lastTop.ref = top;
      const merged = { ...(lastEmbedded.ref || {}), ...(top || {}) };
      // prefer top-level where present
      // console.log('Presence: top-level keys', Object.keys(top).length);
      cb(merged);
    } catch (e) {
      cb(lastEmbedded.ref || {});
    }
  });

  // subscribe to players root to pick up embedded presence changes
  const unsubPlayers = dbOnValue(PLAYER_ROOT, (snap) => {
    try {
      const players = extractVal(snap) || {};
      const embedded = {};
      Object.keys(players).forEach((k) => {
        const p = players[k];
        if (!p) return;
        if (p.presence && typeof p.presence === 'object' && typeof p.presence.online !== 'undefined') {
          embedded[k] = p.presence;
        } else if (typeof p.presence === 'boolean') {
          embedded[k] = { online: !!p.presence };
        } else if (typeof p.online !== 'undefined') {
          embedded[k] = { online: !!p.online, lastSeen: p.lastSeen };
        }
      });
      lastEmbedded.ref = embedded;
      const merged = { ...(embedded || {}), ...(lastTop.ref || {}) };
      // console.log('Presence: embedded keys', Object.keys(embedded).length);
      cb(merged);
    } catch (e) {
      cb(lastTop.ref || {});
    }
  });

  // return combined unsubscribe
  return () => {
    try {
      if (typeof unsubTop === 'function') unsubTop();
    } catch (e) {}
    try {
      if (typeof unsubPlayers === 'function') unsubPlayers();
    } catch (e) {}
  };
}

/**
 * Helper to read presence for a single playerId (checks top-level presence first, then embedded player node).
 * Returns an object: { online: boolean, lastSeen?: number, source: 'top'|'embedded'|'none' }
 */
export async function getPresenceForPlayer(playerId) {
  try {
    // try top-level
    // top-level presence is stored under /presence/{playerId}
    const topSnap = await dbGet(`${PRESENCE_ROOT}/${playerId}`);
    const topVal = topSnap && typeof topSnap.val === 'function' ? topSnap.val() : (topSnap && topSnap._value) || null;
    // Support multiple storage shapes: { online: true }, true, { online: 'true' }, or null
    if (topVal !== null && typeof topVal !== 'undefined') {
      // direct boolean
      if (typeof topVal === 'boolean') {
        return { online: !!topVal, source: 'top' };
      }
      // object with 'online' key
      if (typeof topVal === 'object' && typeof topVal.online !== 'undefined') {
        return { online: !!topVal.online, lastSeen: topVal.lastSeen, source: 'top' };
      }
      // legacy shape: presence may be stored as nested object with different key
    }

    // fallback to embedded
    const playerSnap = await dbGet(`${PLAYER_ROOT}/${playerId}`);
    const playerVal = playerSnap && typeof playerSnap.val === 'function' ? playerSnap.val() : (playerSnap && playerSnap._value) || null;
    // playerVal may be: { presence: { online: true, lastSeen: ... } } OR { presence: true } OR { online: true }
    if (playerVal) {
      // presence as object
      if (playerVal.presence && typeof playerVal.presence === 'object' && typeof playerVal.presence.online !== 'undefined') {
        return { online: !!playerVal.presence.online, lastSeen: playerVal.presence.lastSeen, source: 'embedded' };
      }
      // presence directly boolean under player
      if (typeof playerVal.presence === 'boolean') {
        return { online: !!playerVal.presence, source: 'embedded' };
      }
      // some exports may have online at root of player
      if (typeof playerVal.online !== 'undefined') {
        return { online: !!playerVal.online, lastSeen: playerVal.lastSeen, source: 'embedded' };
      }
    }

    return { online: false, source: 'none' };
  } catch (e) {
    return { online: false, source: 'none' };
  }
}

/**
 * Set presence for a single playerId (simple write).
 */
export function setPresence(playerId, online = true, meta = {}) {
  const path = `${PRESENCE_ROOT}/${playerId}`;
  const ts = Date.now();
  const base = { online: !!online, lastSeen: ts, lastSeenHuman: formatLastSeen(ts) };
  const payload = { ...base, ...(meta && typeof meta === 'object' ? meta : {}) };
  return dbSet(path, payload);
}

/**
 * Try to mark player online and schedule an onDisconnect write to mark offline.
 * Returns a cleanup function that will set the player offline immediately and try to cancel the onDisconnect.
 * If onDisconnect is not available, the cleanup will still set offline immediately.
 */
export async function goOnline(playerId, meta = {}) {
  const path = `${PRESENCE_ROOT}/${playerId}`;
  // dev log removed
  // set online now (include optional meta such as gameVersion)
  try {
  await setPresence(playerId, true, meta);
  // success (no debug log)
  } catch (e) {
    // if top-level write was rejected due to security rules, we'll attempt a guarded
    // fallback to write presence under the player's embedded node (players/{playerId}/presence)
    // but only when the current auth user matches playerId. This avoids allowing
    // arbitrary clients to write other players' presence.
    try {
      if (e && e.code && String(e.code).includes('permission-denied')) {
        const current = auth && auth().currentUser;
        if (current && String(current.uid) === String(playerId)) {
          const ts = Date.now();
          const payload = { online: true, lastSeen: ts, lastSeenHuman: formatLastSeen(ts), ...(meta && typeof meta === 'object' ? meta : {}) };
          const embeddedPath = `${PLAYER_ROOT}/${playerId}/presence`;
          await dbSet(embeddedPath, payload);
          // try schedule onDisconnect on embedded path if possible
          try {
            const r2 = dbRef(embeddedPath);
            const od2 = onDisconnect(r2);
            if (od2 && typeof od2.set === 'function') {
              const t2 = Date.now();
              const offPayload = { online: false, lastSeen: t2, lastSeenHuman: formatLastSeen(t2), ...(meta && typeof meta === 'object' ? meta : {}) };
              od2.set(offPayload);
            }
            // return cleanup that cancels od2 and writes offline
            return async () => {
              try { if (od2 && typeof od2.cancel === 'function') await od2.cancel(); } catch (er) {}
              try { await dbSet(embeddedPath, { online: false, lastSeen: Date.now(), lastSeenHuman: formatLastSeen(Date.now()) }); } catch (er) {}
              // embedded cleanup executed
            };
          } catch (inner) {
            // even if onDisconnect fails, return cleanup that sets offline
            return async () => {
              try { await dbSet(embeddedPath, { online: false, lastSeen: Date.now(), lastSeenHuman: formatLastSeen(Date.now()) }); } catch (er) {}
            };
          }
        }
      }
    } catch (fallbackErr) {
      // swallow fallback errors and continue to top-level cleanup below
    }
    // if we couldn't write top-level or embedded, still return a cleanup that
    // will try to set top-level presence offline (best-effort)
    return async () => {
      try { await setPresence(playerId, false); } catch (er) { /* ignore */ }
    };
  }

  try {
    const r = dbRef(path);
    const od = onDisconnect(r);
    // schedule offline on disconnect (include meta where available)
    if (od && typeof od.set === 'function') {
      const ts = Date.now();
      const offPayload = { online: false, lastSeen: ts, lastSeenHuman: formatLastSeen(ts), ...(meta && typeof meta === 'object' ? meta : {}) };
      od.set(offPayload);
    }

    // return cleanup
    return async () => {
      try {
        // try cancel if available
        if (od && typeof od.cancel === 'function') {
          await od.cancel();
        }
      } catch (e) {
        // ignore
      }
  // top-level cleanup executing
      return setPresence(playerId, false);
    };
  } catch (e) {
    // fallback: just return cleanup that sets offline
    return async () => setPresence(playerId, false);
  }
}

/**
 * Convenience to set offline immediately.
 */
export function goOffline(playerId) {
  // dev log removed
  return setPresence(playerId, false);
}

export default {
  PRESENCE_ROOT,
  onPresenceChange,
  fetchEmbeddedPresence,
  onCombinedPresenceChange,
  setPresence,
  goOnline,
  goOffline,
};
