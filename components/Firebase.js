// components/Firebase.js (modular, keskitetty)
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

// ---- Singletons (modular-tyyliin) ----
export const app = () => getApp();
export const auth = () => getAuth();
export const database = () => getDatabase();
export const remoteConfig = () => getRemoteConfig();

// ---- Kätevät helperit (EI namespaced-metodeja) ----
export const signInAnon = () => signInAnonymously(getAuth());
export const handleSignOut = () => signOut(getAuth());

// DB helperit
export const dbRef = (path) => ref(getDatabase(), path);
export const dbGet = (path) => get(dbRef(path));
export const dbSet = (path, value) => set(dbRef(path), value);
export const dbUpdate = (path, value) => update(dbRef(path), value);
export const dbOnValue = (path, cb) => {
  const r = dbRef(path);
  const maybeUnsub = onValue(r, cb);
  if (typeof maybeUnsub === 'function') return maybeUnsub; // web-tyyli
  return () => off(r, 'value', cb); // rn-firebase-tyyli
};
export const dbOff = (path, cb) => off(dbRef(path), 'value', cb);

// RC helperit
export const rcSetDefaults = (defaults) => setDefaults(getRemoteConfig(), defaults);
export const rcSetSettings = (settings) => setConfigSettings(getRemoteConfig(), settings);
export const rcFetchAndActivate = () => fetchAndActivate(getRemoteConfig());
export const rcGet = (key) => getValue(getRemoteConfig(), key);

// Tarvittaessa raakafunktiot ulos
export {
  ref, get, set, update, onValue, off, push, remove, child,
  onAuthStateChanged,
};
