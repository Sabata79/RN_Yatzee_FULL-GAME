/**
 * Firebase - Centralized Firebase utility for authentication, database, and remote config.
 *
 * JSDoc comments and inline code comments must always be in English.
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
export const dbSet = (path, value) => set(dbRef(path), value);
export const dbUpdate = (path, value) => update(dbRef(path), value);

// Listener: use REF.on / REF.off (not top-level onValue/off)
export const dbOnValue = (path, cb) => {
  const r = dbRef(path);
  r.on('value', cb);
  return () => r.off('value', cb); // return unsubscribe
};

export const dbOff = (path, cb) => {
  const r = dbRef(path);
  return r.off('value', cb);
};

// RC helpers
export const rcSetDefaults = (defaults) => setDefaults(getRemoteConfig(), defaults);
export const rcSetSettings = (settings) => setConfigSettings(getRemoteConfig(), settings);
export const rcFetchAndActivate = () => fetchAndActivate(getRemoteConfig());
export const rcGet = (key) => getValue(getRemoteConfig(), key);

// Export raw functions if needed
export {
  ref, get, set, update, onValue, off, push, remove, child,
  onAuthStateChanged,
};
