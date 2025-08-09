import React, { useState, useEffect } from "react";
import { View, Text, Image, Animated, Alert, Linking } from "react-native";
import * as SecureStore from "expo-secure-store";
import { auth, database } from "../components/Firebase";
import { useGame } from "../components/GameContext";
import { ProgressBar } from "react-native-paper";
import styles from "../styles/landingPageStyles";
import Constants from "expo-constants";
import { Asset } from "expo-asset";
import { avatars } from "../constants/AvatarPaths";
import { PlayercardBg } from "../constants/PlayercardBg";
import { additionalImages } from "../constants/AdditionalImages";
import { fetchRemoteConfig } from "../services/RemoteConfigService";

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
    setPlayerLevel, // jos tätä ei ole kontekstissa, ei katastrofi (alla vartioitu kutsu)
    setGameVersion,
    gameVersion,
  } = useGame();

  const isVersionOlder = (current, minimum) => {
    const cur = current.split('.').map(Number);
    const min = minimum.split('.').map(Number);
    for (let i = 0; i < min.length; i++) {
      if ((cur[i] || 0) < min[i]) return true;
      if ((cur[i] || 0) > min[i]) return false;
    }
    return false;
  };

  const animateProgress = (toValue, durationMs) => {
    const start = Date.now();
    const fromValue = loadingProgress;
    const diff = toValue - fromValue;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - start;
      const progress = Math.min(fromValue + (diff * (elapsed / durationMs)), toValue);

      setLoadingProgress(progress);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setLoadingProgress(toValue);
      }
    }, 50);
  };

  const cacheImages = (images) => {
    return images.map((img) => Asset.fromModule(img.display).downloadAsync());
  };

  // --- RNFirebase auth ---
  const doSignInAnonymously = async () => {
    try {
      const result = await auth().signInAnonymously();
      const uid = result.user.uid;
      await SecureStore.setItemAsync("user_id", uid);
      console.log("Anonyymi kirjautuminen onnistui, uid:", uid);
      setPlayerId(uid);
      return uid;
    } catch (error) {
      console.error("Anonyymin kirjautumisen virhe:", error);
      return null;
    }
  };

  const getOrCreateUserId = async () => {
    try {
      let userId = await SecureStore.getItemAsync("user_id");
      if (!userId) {
        console.log("UserId:a ei löytynyt, kirjaututaan anonyymisti.");
        userId = await doSignInAnonymously();
      }
      return userId;
    } catch (error) {
      console.error("Virhe getOrCreateUserId-funktiossa:", error);
      throw error;
    }
  };

  // --- RNFirebase database ---
  const checkExistingUser = async (userId) => {
    const db = database();
    const playerRef = db.ref(`players/${userId}`);
    try {
      const snapshot = await playerRef.once('value');
      const playerData = snapshot.val();
      if (playerData && playerData.name !== undefined) {
        setPlayerIdContext(userId);
        setPlayerName(playerData.name);
        setPlayerId(userId);
        setIsLinked(!!playerData.isLinked);
        setUserRecognized(true);
        // kutsu vain jos funktio on olemassa kontekstissa
        if (typeof setPlayerLevel === 'function') {
          setPlayerLevel(playerData.level);
        }
      } else {
        console.log("Ei löytynyt pelaajatietoja ID:lle:", userId);
        setUserRecognized(false);
      }
      animateProgress(100, 1000);
    } catch (error) {
      console.error("Virhe haettaessa pelaajatietoja:", error);
    }
  };

  const checkRemoteUpdate = async () => {
    const config = await fetchRemoteConfig();
    if (!config) return;

    const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
    if (config.forceUpdate && isVersionOlder(currentVersion, config.minimum_supported_version)) {
      Alert.alert('Päivitys vaaditaan', config.update_message, [
        {
          text: 'Päivitä',
          onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.SimpleYatzee'),
        },
      ]);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    const version = Constants.expoConfig?.version ?? '0.0.0';
    console.log("App version from const version:", version);
    setGameVersion(version);

    const loadAllAssets = async () => {
      try {
        const allImages = [...avatars, ...PlayercardBg, ...additionalImages];
        const imageAssets = cacheImages(allImages);

        animateProgress(70, 2500);

        await Promise.all(imageAssets);

        const userId = await getOrCreateUserId();
        if (userId) {
          setPlayerId(userId);
          await checkExistingUser(userId);
        } else {
          setUserRecognized(false);
          navigation.navigate("MainApp");
        }
      } catch (error) {
        console.error("Assettien esilataus epäonnistui:", error);
      }
    };

    checkRemoteUpdate();
    loadAllAssets();
  }, []);

  useEffect(() => {
    if (loadingProgress === 100) {
      setTimeout(() => {
        navigation.navigate("MainApp");
      }, 1500);
    }
  }, [loadingProgress]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version: {gameVersion}</Text>
      </View>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/landingLogo.webp")}
          style={styles.logo}
        />
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
