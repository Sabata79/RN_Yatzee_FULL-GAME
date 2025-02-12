import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
import { getAuth, signOut } from "firebase/auth"; 
import { API_KEY, AUTH_DOMAIN, DATABASE_URL, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID } from '@env';

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  databaseURL: DATABASE_URL,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);

const auth = getAuth(app);

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
