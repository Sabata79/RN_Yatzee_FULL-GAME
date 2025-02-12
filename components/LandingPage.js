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

  // Kirjaudu anonyymisti Firebase Authilla ja tallenna uid SecureStoreen
  const doSignInAnonymously = async () => {
    try {
      const result = await signInAnonymously(auth);
      const uid = result.user.uid;
      await SecureStore.setItemAsync("user_id", uid);
      console.log("Anonyymi kirjautuminen onnistui, uid:", uid);
      // Asetetaan pelaajan uid, mutta ei vielä tunnisteta käyttäjää
      setPlayerId(uid);
      return uid;
    } catch (error) {
      console.error("Anonyymin kirjautumisen virhe:", error);
      return null;
    }
  };

  // Yritä hakea uid SecureStoresta, ja jos sitä ei löydy, kirjaudu anonyymisti
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
    // Animoidaan näkymää
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Hae tai luo käyttäjän uid ja tarkista käyttäjätiedot tietokannasta
    getOrCreateUserId()
      .then((userId) => {
        if (userId) {
          setPlayerId(userId);
          checkExistingUser(userId);
        } else {
          // Mikäli uid:a ei saada, asetetaan käyttäjäksi ei tunnistettu
          setUserRecognized(false);
          navigation.navigate("MainApp");
        }
      })
      .catch((error) => {
        console.error("Virhe käyttäjän asetuksessa:", error);
      });
  }, []);

  // Tarkista, löytyykö käyttäjän data tietokannasta ja päivitä GameContextin tilat
  const checkExistingUser = async (userId) => {
    const playerRef = ref(database, `players/${userId}`);
    try {
      const snapshot = await get(playerRef);
      const playerData = snapshot.val();
      if (playerData) {
        // Jos pelaajan data löytyy, asetetaan käyttäjä tunnistetuksi
        setPlayerIdContext(userId);
        setPlayerNameContext(playerData.name);
        setPlayerName(playerData.name);
        setPlayerId(userId);
        setIsLinked(!!playerData.isLinked);
        setUserRecognized(true);
      } else {
        // Jos dataa ei löydy, käyttäjää ei tunnisteta
        console.log("Ei löytynyt pelaajatietoja ID:lle:", userId);
        setUserRecognized(false);
      }
      incrementProgress(100);
    } catch (error) {
      console.error("Virhe haettaessa pelaajatietoja:", error);
    }
  };

  // Päivittää latausprogressia
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
