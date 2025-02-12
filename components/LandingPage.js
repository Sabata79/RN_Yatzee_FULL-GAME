import React, { useState, useEffect } from "react";
import { View, Text, Image, Animated } from "react-native";
import * as SecureStore from "expo-secure-store";
import { database, auth } from "../components/Firebase";
import { ref, get } from "firebase/database";
import { useGame } from "../components/GameContext";
import { ProgressBar } from "react-native-paper";
import styles from "../styles/landingPageStyles";
import { signInAnonymously } from "firebase/auth";

export default function LandingPage({ navigation }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loadingProgress, setLoadingProgress] = useState(0);
  const {
    setPlayerIdContext,
    setPlayerNameContext,
    setUserRecognized,
    setPlayerId,
    setPlayerName,
    setIsLinked,
  } = useGame();

  // Log as anonymous user and save uid to SecureStore
  const doSignInAnonymously = async () => {
    try {
      const result = await signInAnonymously(auth);
      const uid = result.user.uid;
      await SecureStore.setItemAsync("user_id", uid);
      console.log("Anonyymi kirjautuminen onnistui, uid:", uid);
      // Set player id to GameContext but dont recognize user
      setPlayerId(uid);
      return uid;
    } catch (error) {
      console.error("Anonyymin kirjautumisen virhe:", error);
      return null;
    }
  };

  // Try to get user id from SecureStore, if not found, sign in anonymously
  const getOrCreateUserId = async () => {
    try {
      let userId = await SecureStore.getItemAsync("user_id");
      if (!userId) {
        console.log("UserId:a ei löytynyt, kirjaututaan anonyymisti.");
        userId = await doSignInAnonymously();
      } else {
        console.log("UserId haettu SecureStoresta:", userId);
      }
      return userId;
    } catch (error) {
      console.error("Virhe getOrCreateUserId-funktiossa:", error);
      throw error;
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Get or create user id and check if user exists in database
    getOrCreateUserId()
      .then((userId) => {
        if (userId) {
          setPlayerId(userId);
          checkExistingUser(userId);
        } else {
          // If user id not found, set user as not recognized and navigate to MainApp
          setUserRecognized(false);
          navigation.navigate("MainApp");
        }
      })
      .catch((error) => {
        console.error("Virhe käyttäjän asetuksessa:", error);
      });
  }, []);

  // Check if user exists in database and set user data to GameContext
  const checkExistingUser = async (userId) => {
    const playerRef = ref(database, `players/${userId}`);
    try {
      const snapshot = await get(playerRef);
      const playerData = snapshot.val();
      if (playerData) {
        // If player data found, set player data to GameContext
        setPlayerIdContext(userId);
        setPlayerNameContext(playerData.name);
        setPlayerName(playerData.name);
        setPlayerId(userId);
        setIsLinked(!!playerData.isLinked);
        setUserRecognized(true);
      } else {
        // If player data not found, set user as not recognized
        console.log("Ei löytynyt pelaajatietoja ID:lle:", userId);
        setUserRecognized(false);
      }
      incrementProgress(100);
    } catch (error) {
      console.error("Virhe haettaessa pelaajatietoja:", error);
    }
  };

  // Update loading progress bar
  const incrementProgress = (toValue) => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      setLoadingProgress(Math.min(currentProgress, toValue));
      if (currentProgress >= toValue) {
        clearInterval(interval);
      }
    }, 50);
  };

  useEffect(() => {
    if (loadingProgress === 100) {
      setTimeout(() => {
        navigation.navigate("MainApp");
      }, 1500);
    }
  }, [loadingProgress]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.logoContainer}>
        <Image source={require("../assets/landingLogo.png")} style={styles.logo} />
      </View>
      <ProgressBar
        progress={loadingProgress / 100}
        color="#62a346"
        style={styles.progressBar}
      />
      <Text style={styles.progressText}>
        {loadingProgress < 100 ? "Checking player data..." : "Complete!"}
      </Text>
    </Animated.View>
  );
}
