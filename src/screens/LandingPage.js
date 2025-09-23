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
import React, { useState, useEffect, useRef } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, Image, Animated, Alert, Linking, InteractionManager } from "react-native";
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
import { useIsFocused } from '@react-navigation/native';

import { useAudio } from '../services/AudioManager';
import COLORS from "../constants/colors";
import BackgroundVideo from '../components/BackgroundVideo';

// --- Helper: image preloader (require-asset or URL) ---
const cacheImages = (images) => {
  return images.map((img) => {
    const mod = img?.display ?? img;
    if (typeof mod === 'number') {
      return Asset.fromModule(mod).downloadAsync();
    }
    if (typeof mod === 'string') {
      return Image.prefetch(mod);
    }
    return Promise.resolve();
  });
};

export default function LandingPage({ navigation }) {
  const insets = useSafeAreaInsets();
  const [fadeAnim] = useState(new Animated.Value(1));
  const [loadingProgress, setLoadingProgress] = useState(0); // 0..100
  const [bootDone, setBootDone] = useState(false); // all boot tasks done
  const [remoteBlock, setRemoteBlock] = useState(false);

  const rafRef = useRef(null);
  const alertShownRef = useRef(false);
  const bootStartedRef = useRef(false);

  // Smart progress state tracking
  const bootDoneRef = useRef(false);
  const remoteBlockRef = useRef(false);

  // Audio
  const { ready, musicMuted, playMusic } = useAudio();
  const musicStartedRef = useRef(false);

  const {
    setPlayerIdContext,
    setPlayerNameContext,
    setUserRecognized,
    setPlayerId,
    setPlayerName,
    setIsLinked,
    setPlayerLevel,
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

  // Start music once audio is ready and not muted
  useEffect(() => {
    console.log('[LandingPage Audio]', { ready, musicMuted, remoteBlock, bootDone, started: musicStartedRef.current });

    if (!ready) return;
    if (musicMuted) return;
    if (remoteBlock) return;
    if (musicStartedRef.current) return;

    let alive = true;

    InteractionManager.runAfterInteractions(() => {
      if (!alive) return;
      setTimeout(async () => {
        if (!alive) return;
        try {
          await playMusic(true);
          if (!alive) return;
          musicStartedRef.current = true;
          console.log('[LandingPage] Music started');
        } catch (e) {
          console.log('[LandingPage] Music start failed:', e);
        }
      }, 120);
    });

    return () => { alive = false; };
  }, [ready, musicMuted, remoteBlock, playMusic, bootDone]);

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

  // ---- SMART PROGRESS (smooth & slow) ----
  const startSmartProgress = (minMs = 8000, holdAt = 0.9, finishMs = 1600) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const start = Date.now();
    let finishing = false;
    let finishStart = 0;

    let displayed = 0;
    const smooth = 0.08;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - start;
      const base = Math.min(elapsed / minMs, 1) * holdAt;

      if ((bootDoneRef.current || remoteBlockRef.current) && !finishing) {
        finishing = true;
        finishStart = now;
      }

      let target = base;

      if (finishing) {
        const t = Math.min((now - finishStart) / finishMs, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        target = holdAt + (1 - holdAt) * eased;
      }

      displayed = displayed + (target - displayed) * smooth;

      const pct = Math.round(Math.max(0, Math.min(100, displayed * 100)));
      setLoadingProgress(pct);

      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
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
      console.error("Anynomous sign-in error:", error);
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
      if (!config) {
        console.warn('[RC] fetchRemoteConfig returned null/undefined');
        return false;
      }

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
    if (bootStartedRef.current) return;
    bootStartedRef.current = true;

    const version = Constants.expoConfig?.version ?? "0.0.0";
    setGameVersion(version);

    const loadAllAssets = async () => {
      try {
        // Smooth & slow progress
        startSmartProgress(8000, 0.9, 1600);

        // Remote update check in parallel (does not block navigation)
        fire("Remote update check (non-blocking)", checkRemoteUpdate);

        // Preload images
        await step("Preloading images & sounds", async () => {
          const allImages = [...avatars, ...PlayercardBg, ...additionalImages, ...Animations];
          const results = await Promise.allSettled(cacheImages(allImages));
          const failed = results.filter(r => r.status === 'rejected');
          if (failed.length) {
            console.warn('[BOOT] Some assets failed to preload:', failed.slice(0, 6).map(f => String(f.reason)).join(' | '));
          }
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

          if (playersData) {
            Object.keys(playersData).forEach(playerId => {
              const player = playersData[playerId];
              if (player.scores) {
                const scoresToUse = Object.values(player.scores);
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
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          navigation.navigate("MainApp");
        }
      });
    }
  }, [remoteBlock, loadingProgress, bootDone, navigation, fadeAnim]);

  return (
    <View style={{ flex: 1 }}>
      <BackgroundVideo isActive />
      <Animated.View style={[styles.container, { backgroundColor: 'transparent', opacity: fadeAnim }]}>
        <View style={[styles.versionContainer]}>
          <Text style={styles.versionText}>Version: {gameVersion}</Text>
        </View>

        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom || 16 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ position: "relative", marginBottom: 0 }}>
              <ProgressBar
                progress={loadingProgress / 100}
                color={COLORS.success}
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
    </View>
  );
}
