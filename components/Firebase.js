// Purpose: This file is used to connect to the Firebase database. It is used to store the data of the user's profile and the data of the user's posts.
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
import { API_KEY } from '@env';
import { AUTH_DOMAIN } from '@env';
import { DATABASE_URL } from '@env';
import { PROJECT_ID } from '@env';
import { STORAGE_BUCKET } from '@env';
import { MESSAGING_SENDER_ID } from '@env';
import { APP_ID } from '@env';


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

export { database };