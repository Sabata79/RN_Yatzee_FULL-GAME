// screens/LandingPage.js
import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, Animated, Alert, Linking } from "react-native";
import * as SecureStore from "expo-secure-store";
import { signInAnon, dbGet } from "../components/Firebase";
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
  const [loadingProgress, setLoadingProgress] = useState(0); // 0..100
  const [bootDone, setBootDone] = useState(false); // kaikki boot-työt valmiit
  const rafRef = useRef(null); // progress-animaation rAF

  const {
    setPlayerIdContext,
    setPlayerNameContext,
    setUserRecognized,
    setPlayerId,
    setPlayerName,
    setIsLinked,
    setPlayerLevel, // optional
    setGameVersion,
    gameVersion,
  } = useGame();

  const isVersionOlder = (current, minimum) => {
    const cur = current.split(".").map(Number);
    const min = minimum.split(".").map(Number);
    for (let i = 0; i < min.length; i++) {
      if ((cur[i] || 0) < min[i]) return true;
      if ((cur[i] || 0) > min[i]) return false;
    }
    return false;
  };

  // Yksi 4s animaatio 0 → 100
  const startProgress = (durationMs = 4000) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = Date.now();
    const tick = () => {
      const t = Math.min((Date.now() - start) / durationMs, 1);
      setLoadingProgress(t * 100);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const cacheImages = (images) => {
    return images.map((img) => Asset.fromModule(img.display).downloadAsync());
  };

  // --- Auth (modular) ---
  const doSignInAnonymously = async () => {
    try {
      const { user } = await signInAnon();
      const uid = user.uid;
      await SecureStore.setItemAsync("user_id", uid);
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
      if (!userId) userId = await doSignInAnonymously();
      return userId;
    } catch (error) {
      console.error("Virhe getOrCreateUserId-funktiossa:", error);
      throw error;
    }
  };

  // --- Database (modular) ---
  const checkExistingUser = async (userId) => {
    try {
      const snapshot = await dbGet(`players/${userId}`);
      const playerData = snapshot.val();
      if (playerData && playerData.name !== undefined) {
        setPlayerIdContext(userId);
        setPlayerName(playerData.name);
        setPlayerId(userId);
        setIsLinked(!!playerData.isLinked);
        setUserRecognized(true);
        if (typeof setPlayerLevel === "function") setPlayerLevel(playerData.level);
      } else {
        setUserRecognized(false);
      }
    } catch (error) {
      console.error("Virhe haettaessa pelaajatietoja:", error);
    }
  };

  const checkRemoteUpdate = async () => {
    const config = await fetchRemoteConfig();
    if (!config) return;

    const currentVersion = Constants.expoConfig?.version ?? "0.0.0";
    if (
      config.forceUpdate &&
      isVersionOlder(currentVersion, config.minimum_supported_version)
    ) {
      Alert.alert("Päivitys vaaditaan", config.update_message, [
        {
          text: "Päivitä",
          onPress: () =>
            Linking.openURL(
              "https://play.google.com/store/apps/details?id=com.SimpleYatzee"
            ),
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

    const version = Constants.expoConfig?.version ?? "0.0.0";
    setGameVersion(version);

    const loadAllAssets = async () => {
      try {
        // Käynnistä 4s progress
        startProgress(4000);

        // Lataa assetit
        const allImages = [...avatars, ...PlayercardBg, ...additionalImages];
        const imageAssets = cacheImages(allImages);
        await Promise.all(imageAssets);

        // Hae käyttäjä
        const userId = await getOrCreateUserId();
        if (userId) {
          setPlayerId(userId);
          await checkExistingUser(userId);
        } else {
          setUserRecognized(false);
          navigation.navigate("MainApp");
          return;
        }

        // Remote update tarkistus rinnalla (ei estä navigointia)
        checkRemoteUpdate();

        // Kaikki boot-työt valmiit
        setBootDone(true);
      } catch (error) {
        console.error("Assettien esilataus epäonnistui:", error);
      }
    };

    loadAllAssets();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigoi vasta kun progress = 100 JA bootDone = true
  useEffect(() => {
    if (loadingProgress === 100 && bootDone) {
      const t = setTimeout(() => {
        navigation.navigate("MainApp");
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [loadingProgress, bootDone, navigation]);

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

      {/* ProgressBar + prosentti overlayna keskelle ilman tyylimuutoksia */}
      <View style={{ position: "relative" }}>
        <ProgressBar
          progress={loadingProgress / 100}
          color="#62a346"
          style={styles.progressBar}
        />
        <View style={styles.progressOverlay}>
          <Text style={styles.progressPercentText}>{Math.round(loadingProgress)}%</Text>
        </View>
      </View>

      <Text style={styles.progressText}>
        {loadingProgress < 100 ? "Checking player data..." : "Complete!"}
      </Text>
    </Animated.View>
  );
}
