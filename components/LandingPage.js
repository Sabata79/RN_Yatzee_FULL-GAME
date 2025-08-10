// screens/LandingPage.js (smooth progress with guaranteed min duration)
import React, { useState, useEffect, useRef, useCallback } from "react";
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

const PHASE1_MS = 4000; // 0 → 70% vähintään 4s
const PHASE2_MS = 2500; // 70% → 100% vähintään 2.5s

export default function LandingPage({ navigation }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loadingProgress, setLoadingProgress] = useState(0); // 0..100

  // Progress control (ei re-renderiä joka frame)
  const progressRef = useRef(0);
  const rafRef = useRef(null);
  const animCtrlRef = useRef(null); // { cancel: fn, cancelled: bool }

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

  // Easing + requestAnimationFrame – palauttaa Promise, joka resolvaa kun animaatio valmis
  const runProgress = useCallback((toValue, durationMs = 1000) => {
    // peru mahdollinen aiempi animaatio
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (animCtrlRef.current?.cancel) animCtrlRef.current.cancel();

    const clamp = (v) => Math.max(0, Math.min(100, v));
    const start = Date.now();
    const from = progressRef.current;
    const target = clamp(toValue);
    const delta = target - from;

    const ctrl = {
      cancelled: false,
      cancel() {
        this.cancelled = true;
      },
    };
    animCtrlRef.current = ctrl;

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    return new Promise((resolve) => {
      const tick = () => {
        if (ctrl.cancelled) return resolve(); // lopeta hiljaa
        const t = Math.min((Date.now() - start) / durationMs, 1);
        const eased = easeInOutCubic(t);
        const val = clamp(from + delta * eased);
        progressRef.current = val;
        setLoadingProgress(val);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          resolve();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    });
  }, []);

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

    const loadAll = async () => {
      try {
        // Phase 1: assettien lataus + progress 0 → 70%
        const allImages = [...avatars, ...PlayercardBg, ...additionalImages];
        const assetsPromise = Promise.all(cacheImages(allImages));
        const phase1Anim = runProgress(70, PHASE1_MS);
        await Promise.all([assetsPromise, phase1Anim]);

        // Haetaan käyttäjä & pelaajatiedot
        const userId = await getOrCreateUserId();
        if (userId) {
          await checkExistingUser(userId);
        } else {
          setUserRecognized(false);
          navigation.navigate("MainApp");
          return;
        }

        // Remote update tarkistus rinnalle (ei estä progressia)
        checkRemoteUpdate();

        // Phase 2: 70% → 100% aina vähintään PHASE2_MS
        await runProgress(100, PHASE2_MS);
      } catch (e) {
        console.error("Käynnistysvirhe:", e);
      }
    };

    loadAll();

    // cleanup
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (animCtrlRef.current?.cancel) animCtrlRef.current.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loadingProgress === 100) {
      const t = setTimeout(() => {
        navigation.navigate("MainApp");
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [loadingProgress, navigation]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version: {gameVersion}</Text>
      </View>

      <View style={styles.logoContainer}>
        <Image source={require("../assets/landingLogo.webp")} style={styles.logo} />
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
