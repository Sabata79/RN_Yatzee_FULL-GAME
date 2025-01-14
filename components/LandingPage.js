import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, Animated } from "react-native";
import * as SecureStore from "expo-secure-store";
import { database } from "../components/Firebase";
import { ref, get } from "firebase/database";
import uuid from "react-native-uuid";
import { useGame } from "../components/GameContext";
import { ProgressBar } from "react-native-paper";
import styles from "../styles/landingPageStyles";

export default function LandingPage({ navigation }) {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [localName, setLocalName] = useState("");

    const { setPlayerIdContext, setPlayerNameContext, setUserRecognized, setPlayerId, setPlayerName } = useGame();

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
        }).start();

        getOrCreateUserId()
            .then((userId) => {
                setPlayerId(userId); 
                checkExistingUser(userId); 
            })
            .catch((error) => {
                console.error("Error during user setup:", error);
            });
    }, []);

    const getOrCreateUserId = async () => {
        try {
            let userId = await SecureStore.getItemAsync("user_id");
            if (!userId) {
                userId = uuid.v4(); 
                await SecureStore.setItemAsync("user_id", userId); 
            }
            return userId;
        } catch (error) {
            console.error("Error in getOrCreateUserId:", error);
            throw error; 
        }
    };

    // Player identification
    const checkExistingUser = async (userId) => {
        const playerRef = ref(database, `players/${userId}`);
        try {
            const snapshot = await get(playerRef);
            const playerData = snapshot.val();
            if (playerData) {
                setLocalName(playerData.name);
                setPlayerIdContext(userId);
                setPlayerNameContext(playerData.name);
                setUserRecognized(true);
                setPlayerName(playerData.name);
                setPlayerId(userId);
            }
            incrementProgress(100);
        } catch (error) {
            console.error("Error fetching player data:", error);
        }
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
                navigation.navigate("MainApp")
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

