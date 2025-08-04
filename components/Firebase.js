import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
import { 
  initializeAuth, 
  getReactNativePersistence, 
  signOut 
} from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { 
  API_KEY, AUTH_DOMAIN, DATABASE_URL, PROJECT_ID, 
  STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID 
} from '@env';

// Firebase config
const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  databaseURL: DATABASE_URL,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Init Auth with persistence (IMPORTANT!)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Init Database
const database = getDatabase(app);

// Sign out the current user
const handleSignOut = async () => {
  try {
    await signOut(auth);
    console.log("User signed out");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export { database, auth, handleSignOut };
