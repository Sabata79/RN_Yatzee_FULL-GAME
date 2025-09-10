/**
 * LandingPage.js - Screen for app boot, progress, and remote config loading
 *
 * Handles the app's initial loading, progress bar, and remote config fetch.
 *
 * Usage:
 *   import LandingPage from './LandingPage';
 *   ...
 *   <LandingPage />
 *
 * @module screens/LandingPage
 * @author Sabata79
 * @since 2025-09-06
 */
// LandingPage screen: handles app boot, progress, and remote config
import { useState, useEffect, useRef } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Image, Animated, Alert, Linking } from "react-native";
import * as SecureStore from "expo-secure-store";
import { signInAnon, dbGet } from "../services/Firebase";
import { useGame } from "../constants/GameContext";
import { ProgressBar } from "react-native-paper";
import styles from "../styles/LandingPageStyles";
import Constants from "expo-constants";
import { Asset } from "expo-asset";
import { avatars } from "../constants/AvatarPaths";
import { PlayercardBg } from "../constants/PlayercardBg";
import { additionalImages } from "../constants/AdditionalImages";
import { fetchRemoteConfig } from "../services/RemoteConfigService";
import { Animations } from "../constants/AnimationPaths";
import { VideoView, useVideoPlayer } from 'expo-video';
import { useIsFocused } from '@react-navigation/native';


import audioManager from '../services/AudioManager';
import COLORS from "../constants/colors";

export default function LandingPage({ navigation }) {
  const insets = useSafeAreaInsets();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loadingProgress, setLoadingProgress] = useState(0); // 0..100
  const [bootDone, setBootDone] = useState(false); // all boot tasks done
  const [remoteBlock, setRemoteBlock] = useState(false);

  // Käynnistä taustamusiikki fade-inillä kun ruutu avataan
  useEffect(() => {
    (async () => {
      console.log('[LandingPage] Ladataan audioManager.loadSettings()');
      await audioManager.loadSettings();
      console.log('[LandingPage] Kutsutaan audioManager.playMusic(true)');
      audioManager.playMusic(true)
        .then(() => {
          console.log('[LandingPage] Musiikin käynnistys onnistui');
        })
        .catch((e) => {
          console.log('[LandingPage] Musiikin käynnistys epäonnistui:', e);
        });
    })();
    // Ei pysäytetä musiikkia kun LandingPage unmounttaa, koska halutaan jatkua muualla
  }, []);

  const rafRef = useRef(null); // progress animation rAF
  const alertShownRef = useRef(false);
  const bootStartedRef = useRef(false); // prevent double execution in Strict Mode

  // Smart progress state tracking
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
    setScoreboardData,
  } = useGame();

  const isFocused = useIsFocused();

  const isVersionOlder = (current, minimum) => {
    const cur = current.split(".").map(Number);
    const min = minimum.split(".").map(Number);
    for (let i = 0; i < min.length; i++) {
      if ((cur[i] || 0) < min[i]) return true;
      if ((cur[i] || 0) > min[i]) return false;
    }
    return false;
  };

  // Video player setup (expo-video)
  const videoPlayer = useVideoPlayer(require('../../assets/video/backgroundVideo.m4v'), (p) => {
    p.loop = false;        // no looping
    p.muted = true;        // muted
    p.playbackRate = 0.6;  // slightly slower
  });

  useEffect(() => {
    if (!videoPlayer) return;

    if (isFocused) {
      try {
        // always start from beginning when view becomes visible
        videoPlayer.currentTime = 0;
        videoPlayer.play();
      } catch (e) {
        console.log('video play failed', e);
      }
    } else {
      try { videoPlayer.pause(); } catch { }
    }
  }, [isFocused, videoPlayer]);

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
  const startSmartProgress = (minMs = 2500, holdAt = 0.92, finishMs = 400) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = Date.now();
    let finishing = false;
    let finishStart = 0;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - start;

      // base progress
      const base = Math.min(elapsed / minMs, 1) * holdAt;

      // when boot is done OR remoteBlock is triggered, start finalization
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

  const cacheImages = (images) => {
    return images.map((img) => Asset.fromModule(img.display).downloadAsync());
  };

  // Anonymous sign-in
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

  // Check if user exists in the database
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

  // Check for remote config updates
  const checkRemoteUpdate = async () => {
    try {
      const config = await fetchRemoteConfig();
      console.log('[RC] fetched', config);
      if (!config) return false;

      const currentVersion = Constants.expoConfig?.version ?? "0.0.0";
      const mustUpdate =
        !!config.forceUpdate &&
        isVersionOlder(currentVersion, config.minimum_supported_version);

      if (mustUpdate && !alertShownRef.current) {
        alertShownRef.current = true;
        setRemoteBlock(true);
        Alert.alert("Update needed", config.update_message, [
          {
            text: "Update",
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

  // Load all assets and initialize the app
  useEffect(() => {
    bootDoneRef.current = bootDone;
  }, [bootDone]);

  useEffect(() => {
    remoteBlockRef.current = remoteBlock;
  }, [remoteBlock]);

  useEffect(() => {
    // prevent double execution in Strict Mode
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
        // Start smart progress: 0 -> 92% ~2.5s, then finalize in 400ms when ready
        startSmartProgress(2500, 0.92, 400);

        // Remote update check in parallel (does not block navigation)
        fire("Remote update check (non-blocking)", checkRemoteUpdate);

        // Lataa kuvat ja äänet valmiiksi
        await step("Preloading images & sounds", async () => {
          const allImages = [...avatars, ...PlayercardBg, ...additionalImages, ...Animations];
          const imageAssets = cacheImages(allImages);
          await Promise.all(imageAssets);
          await audioManager.loadSettings(); // preload SFX ja musiikki
        });


        // Get or create user ID
        const userId = await step("Get or create user ID", async () => {
          const id = await getOrCreateUserId();
          return id;
        });

        if (userId) {
          setPlayerId(userId);
          await step("Check if user exists", async () => {
            await checkExistingUser(userId);
          });
        } else {
          console.warn("[BOOT] userId is missing -> navigate('MainApp')");
          setUserRecognized(false);
          navigation.navigate("MainApp");
          return;
        }

        // --- Scoreboard preload from players ---
        await step("Preload scoreboard data from players", async () => {
          const snapshot = await dbGet('players');
          const playersData = snapshot.val();
          const tmpScores = [];
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const currentWeek = (() => {
            const d = new Date();
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
          })();

          if (playersData) {
            Object.keys(playersData).forEach(playerId => {
              const player = playersData[playerId];
              if (player.scores) {
                let scoresToUse = Object.values(player.scores);
                // AllTime scoreboard, voit laajentaa monthly/weekly tarvittaessa
                if (scoresToUse.length > 0) {
                  let bestScore = null;
                  scoresToUse.forEach(score => {
                    if (
                      !bestScore ||
                      score.points > bestScore.points ||
                      (score.points === bestScore.points && score.duration < bestScore.duration) ||
                      (score.points === bestScore.points && score.duration === bestScore.duration &&
                        new Date(score.date) < new Date(bestScore.date))
                    ) {
                      bestScore = score;
                    }
                  });
                  if (bestScore) {
                    tmpScores.push({
                      ...bestScore,
                      name: player.name,
                      playerId,
                      avatar: player.avatar || null,
                      scores: Object.values(player.scores),
                    });
                  }
                }
              }
            });
            const sorted = tmpScores.sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              if (a.duration !== b.duration) return a.duration - b.duration;
              return new Date(a.date) - new Date(b.date);
            });
            setScoreboardData(sorted);
          } else {
            setScoreboardData([]);
          }
        });

        // Kaikki boot-työt valmiit
        setBootDone(true);
      } catch (error) {
        console.error("Asset loading failed:", error);
      }
    };

    loadAllAssets();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Navigate only when progress = 100, bootDone = true, and no forced update
  useEffect(() => {
    if (!remoteBlock && loadingProgress === 100 && bootDone) {
      const t = setTimeout(() => {
        navigation.navigate("MainApp");
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [remoteBlock, loadingProgress, bootDone, navigation]);


  return (

    <Animated.View style={[styles.container, { opacity: fadeAnim, flex: 1, backgroundColor: '#253445', justifyContent: 'center' }]}>
      <VideoView
        player={videoPlayer}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={true}
        allowsPictureInPicture={false}
        pointerEvents="none"
        focusable={false}
        onError={(e) => {
          console.log("LandingPageVideo error:", e);
          setVideoError(true);
        }}
      />
      <View style={[styles.versionContainer]}>
        <Text style={styles.versionText}>Version: {gameVersion}</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom || 16 }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ position: "relative", marginBottom: 0 }}>
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
        </View>
      </View>
      <View style={styles.logoContainer}>
        <Image
          source={require("../../assets/coins/coin.webp")}
          style={styles.logo}
        />
      </View>
    </Animated.View>
  );
}
