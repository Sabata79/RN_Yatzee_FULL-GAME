import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";
import * as SecureStore from "expo-secure-store";
import { database } from "../components/Firebase";
import { ref, onValue, set, get } from "firebase/database";
import uuid from "react-native-uuid";
import { useGame } from "../components/GameContext";
import { ProgressBar } from "react-native-paper";
import styles from "../styles/landingPageStyles";

export default function LandingPage({ navigation }) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [localName, setLocalName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [isUserRecognized, setUserRecognized] = useState(false);
  const { setPlayerIdContext, setPlayerNameContext } = useGame();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    getOrCreateUserId().then((userId) => {
      setPlayerId(userId);
      checkExistingUser(userId);
    });
  }, []);

  const getOrCreateUserId = async () => {
    let userId = await SecureStore.getItemAsync("user_id");
    if (!userId) {
      userId = uuid.v4();
      await SecureStore.setItemAsync("user_id", userId);
    }
    return userId;
  };

  const checkExistingUser = (userId) => {
    const playerRef = ref(database, `players/${userId}`);
    onValue(playerRef, (snapshot) => {
      const playerData = snapshot.val();
      if (playerData) {
        setLocalName(playerData.name);
        setPlayerIdContext(userId);
        setPlayerNameContext(playerData.name);
        setUserRecognized(true);
      }
      incrementProgress(100);
    });
  };

  const incrementProgress = (toValue) => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1; //Presets the speed of the progress bar
      setLoadingProgress(Math.min(currentProgress, toValue));
      if (currentProgress >= toValue) {
        clearInterval(interval);
      }
    }, 50); // Speed of the progress bar
  };

  useEffect(() => {
    if (loadingProgress === 100) {
      setTimeout(() => {
        if (isUserRecognized) {
          navigation.replace("MainApp");
        } else {
          navigation.replace("Registration");
        }
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
        {loadingProgress < 100 ? "Loading player data..." : "Complete!"}
      </Text>
    </Animated.View>
  );
}

