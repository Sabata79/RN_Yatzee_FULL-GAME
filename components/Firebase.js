import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

// Kirjautumisen ulos-funktio
const handleSignOut = async () => {
  try {
    await auth().signOut();
    console.log("User signed out");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

export { auth, database, handleSignOut };