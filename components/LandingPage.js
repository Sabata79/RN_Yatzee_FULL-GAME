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
  const [remoteBlock, setRemoteBlock] = useState(false);

  const rafRef = useRef(null); // progress-animaation rAF
  const alertShownRef = useRef(false);
  const bootStartedRef = useRef(false); // estä tuplasuoritukset Strict Modessa

  // Smart progressin tilan seurannat
  const bootDoneRef = useRef(false);
  const remoteBlockRef = useRef(false);

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

  const fire = (name, fn) => {
    const t0 = Date.now();
    console.log(`🟡 [BOOT] ${name}…`);
    Promise.resolve(fn())
      .then(() => console.log(`🟢 [BOOT] ${name} OK (${Date.now() - t0} ms)`))
      .catch((e) =>
        console.error(`🔴 [BOOT] ${name} FAIL (${Date.now() - t0} ms)`, e)
      );
  };

  const step = async (name, fn) => {
    const t0 = Date.now();
    console.log(`🟡 [BOOT] ${name}…`);
    try {
      const res = await fn();
      console.log(`🟢 [BOOT] ${name} OK (${Date.now() - t0} ms)`);
      return res;
    } catch (e) {
      console.error(`🔴 [BOOT] ${name} FAIL (${Date.now() - t0} ms)`, e);
      throw e;
    }
  };

  // ---- SMART PROGRESS ----
  // 0 -> holdAt (esim. 92%) minMs-ajassa, sitten odottaa kunnes bootDone tai remoteBlock,
  // ja viimeistelee finishMs-ajassa 100%:iin (smooth).
  const startSmartProgress = (minMs = 2500, holdAt = 0.92, finishMs = 400) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = Date.now();
    let finishing = false;
    let finishStart = 0;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - start;

      // peruskulku kohti holdAt
      const base = Math.min(elapsed / minMs, 1) * holdAt;

      // kun boot valmis TAI remoteBlock laukeaa, aloita finalisointi
      if ((bootDoneRef.current || remoteBlockRef.current) && !finishing) {
        finishing = true;
        finishStart = now;
      }

      let target = base;

      if (finishing) {
        const finishT = Math.min((now - finishStart) / finishMs, 1);
        // ease-out
        const eased = 1 - Math.pow(1 - finishT, 3);
        target = holdAt + (1 - holdAt) * eased;
      }

      const pct = Math.max(0, Math.min(100, Math.round(target * 100)));
      setLoadingProgress(pct);

      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };
  // ------------------------

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
    try {
      const config = await fetchRemoteConfig();
      if (!config) return false;

      const currentVersion = Constants.expoConfig?.version ?? "0.0.0";
      const mustUpdate =
        !!config.forceUpdate &&
        isVersionOlder(currentVersion, config.minimum_supported_version);

      if (mustUpdate && !alertShownRef.current) {
        alertShownRef.current = true;
        setRemoteBlock(true);
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
      return mustUpdate;
    } catch (e) {
      console.error("[RC] checkRemoteUpdate error", e);
      return false;
    }
  };

  // pidä refit synkassa statejen kanssa (smart progress)
  useEffect(() => {
    bootDoneRef.current = bootDone;
  }, [bootDone]);

  useEffect(() => {
    remoteBlockRef.current = remoteBlock;
  }, [remoteBlock]);

  useEffect(() => {
    // estä tuplasuoritus devissä
    if (bootStartedRef.current) return;
    bootStartedRef.current = true;

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    const version = Constants.expoConfig?.version ?? "0.0.0";
    setGameVersion(version);

    const loadAllAssets = async () => {
      try {
        // Käynnistä älykäs progress: 0 -> 92% ~2.5s, sitten finalisoi 400ms kun valmis
        startSmartProgress(2500, 0.92, 400);

        // Remote update tarkistus rinnalla (ei estä navigointia)
        fire("Remote update check (non-blocking)", checkRemoteUpdate);

        // Lataa assetit
        await step("Esiladataan kuvat", async () => {
          const allImages = [...avatars, ...PlayercardBg, ...additionalImages];
          console.log(`[BOOT] Kuvia yhteensä: ${allImages.length}`);
          const imageAssets = cacheImages(allImages);
          await Promise.all(imageAssets);
        });

        // Hae käyttäjä
        const userId = await step("Haetaan/luodaan userId", async () => {
          const id = await getOrCreateUserId();
          console.log(`[BOOT] getOrCreateUserId -> ${id}`);
          return id;
        });

        if (userId) {
          setPlayerId(userId);
          await step("Tarkistetaan käyttäjän olemassaolo", async () => {
            await checkExistingUser(userId);
          });
        } else {
          console.warn("[BOOT] userId puuttuu -> navigate('MainApp')");
          setUserRecognized(false);
          navigation.navigate("MainApp");
          return;
        }

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
  }, []);

  // Navigoi vasta kun progress = 100, bootDone = true, eikä pakotettua päivitystä
  useEffect(() => {
    if (!remoteBlock && loadingProgress === 100 && bootDone) {
      const t = setTimeout(() => {
        navigation.navigate("MainApp");
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [remoteBlock, loadingProgress, bootDone, navigation]);

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

      {/* ProgressBar + prosentti overlayna keskelle */}
      <View style={{ position: "relative" }}>
        <ProgressBar
          progress={loadingProgress / 100}
          color="#62a346"
          style={styles.progressBar}
        />
        <View style={styles.progressOverlay}>
          <Text style={styles.progressPercentText}>
            {Math.round(loadingProgress)}%
          </Text>
        </View>
      </View>

      <Text style={styles.progressText}>
        {loadingProgress < 100 ? "Checking player data..." : "Complete!"}
      </Text>
    </Animated.View>
  );
}
