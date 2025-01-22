import React, { useState, useEffect } from "react";
import { View, Text, Image, Animated } from "react-native";
import * as SecureStore from "expo-secure-store";
import { database } from "../components/Firebase";
import { ref, get } from "firebase/database";
import { useGame } from "../components/GameContext";
import { ProgressBar } from "react-native-paper";
import styles from "../styles/landingPageStyles";

export default function LandingPage({ navigation }) {
    const [fadeAnim] = useState(new Animated.Value(0));
    const [loadingProgress, setLoadingProgress] = useState(0);

    const { setPlayerIdContext, setPlayerNameContext, setUserRecognized, setPlayerId, setPlayerName } = useGame();


    const getOrCreateUserId = async () => {
        try {
            let userId = await SecureStore.getItemAsync("user_id");
            if (!userId) {
                console.log("No userId found, returning null");
                return null;
            }
            console.log("UserId retrieved from SecureStore:", userId);
            return userId;
        } catch (error) {
            console.error("Error in getOrCreateUserId:", error);
            throw error;
        }
    };

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
        }).start();

        getOrCreateUserId()
            .then((userId) => {
                console.log("Retrieved user ID:", userId);
                if (userId) {
                    setPlayerId(userId);
                    checkExistingUser(userId);
                } else {
                    console.log("No user ID found, skipping user creation.");

                    setUserRecognized(false);
                    navigation.navigate("MainApp");
                }
            })
            .catch((error) => {
                console.error("Error during user setup:", error);
            });
    }, []);

    // Player identification
    const checkExistingUser = async (userId) => {
        const playerRef = ref(database, `players/${userId}`);
        try {
            const snapshot = await get(playerRef);
            const playerData = snapshot.val();
            if (playerData) { 
                setPlayerIdContext(userId);
                setPlayerNameContext(playerData.name);
                setUserRecognized(true);
                setPlayerName(playerData.name);
                setPlayerId(userId);
            } else {
                console.log("No player data found for ID:", userId); 
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
