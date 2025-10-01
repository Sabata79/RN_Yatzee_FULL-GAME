/**
 * Firebase - Centralized Firebase utility for authentication, database, and remote config.
 *
 * 
 * This file provides modular access to Firebase services for the app.
 * @author Sabata79
 * @since 2025-08-29
 */
// components/Firebase.js (modular, centralized)
import { getApp } from '@react-native-firebase/app';

// AUTH
import {
  getAuth,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from '@react-native-firebase/auth';

// REALTIME DATABASE
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  onValue,
  off,
  push,
  remove,
  child,
  runTransaction,
} from '@react-native-firebase/database';

// REMOTE CONFIG
import {
  getRemoteConfig,
  setDefaults,
  setConfigSettings,
  fetchAndActivate,
  getValue,
} from '@react-native-firebase/remote-config';

// ---- Singletons (modular style) ----
export const app = () => getApp();
export const auth = () => getAuth();
export const database = () => getDatabase();
export const remoteConfig = () => getRemoteConfig();

// ---- Handy helpers (NO namespaced methods) ----
export const signInAnon = () => signInAnonymously(getAuth());
export const handleSignOut = () => signOut(getAuth());

// DB helpers
export const dbRef = (path) => ref(getDatabase(), path);
export const dbGet = (path) => get(dbRef(path));
export const dbSet = (path, value) => {
  // Dev-only instrumentation: log stack and path when writing under players/ to trace overrides
  try {
    if (typeof __DEV__ !== 'undefined' && __DEV__ && typeof path === 'string' && path.startsWith('players/')) {
      try {
        // Avoid noisy logs for presence child writes — they're frequent and expected.
        if (path.includes('/presence')) {
          // do not instrument presence writes
        } else {
          // Only log potentially problematic writes: root player set or token/anchor/nextTokenTime children
          const significant = /players\/[^\/]+(?:$|\/(tokens|lastTokenDecrement|nextTokenTime))/.test(path);
          if (significant) {
            const st = new Error().stack || '';
            // Limit stack trace size to first 20 lines to keep logs readable
            const lines = st.split('\n').slice(0, 20).join('\n');
            console.log('[DB-INSTRUMENT] dbSet called for', path, '\nstack:\n', lines);
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
  return set(dbRef(path), value);
};
export const dbUpdate = (path, value) => update(dbRef(path), value);
export const dbRunTransaction = (path, updateFn) => runTransaction(dbRef(path), updateFn);

// Listener: use REF.on / REF.off (not top-level onValue/off)
export const dbOnValue = (path, cb) => {
  const r = dbRef(path);
  // Use modular onValue which returns an unsubscribe function
  try {
    const unsub = onValue(r, cb);
    // onValue in the modular API returns an unsubscribe function
    return typeof unsub === 'function' ? unsub : () => off(r, cb);
  } catch (e) {
    // Fallback to namespaced API if present
    r.on && r.on('value', cb);
    return () => r.off && r.off('value', cb);
  }
};

export const dbOff = (path, cb) => {
  const r = dbRef(path);
  try {
    // modular off supports (ref, callback) pattern
    return off(r, cb);
  } catch (e) {
    // fallback to namespaced API
    return r.off && r.off('value', cb);
  }
};

// RC helpers
export const rcSetDefaults = (defaults) => setDefaults(getRemoteConfig(), defaults);
export const rcSetSettings = (settings) => setConfigSettings(getRemoteConfig(), settings);
export const rcFetchAndActivate = () => fetchAndActivate(getRemoteConfig());
export const rcGet = (key) => getValue(getRemoteConfig(), key);

// Export raw functions if needed
export {
  ref, get, set, update, onValue, off, push, remove, child,
  runTransaction,
  onAuthStateChanged,
};
