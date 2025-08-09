// components/Firebase.js
import '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import remoteConfig from '@react-native-firebase/remote-config';

// Kirjautumisen ulos-funktio
const handleSignOut = async () => {
  try {
    await auth().signOut();
    console.log("User signed out");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export { auth, database, remoteConfig, handleSignOut };
