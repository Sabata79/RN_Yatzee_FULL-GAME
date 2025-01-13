import React from "react";
import { View, Text, Pressable, ImageBackground, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import styles from "../styles/styles";
import { useNavigation } from "@react-navigation/native";
import { useGame } from "../components/GameContext";

export default function Home() {
  const navigation = useNavigation();
  const { playerName } = useGame();

  const handlePlay = () => {
    navigation.navigate("Gameboard");
  };

  const handleRules = () => {
    navigation.navigate("Rules");
  };

  const handleChangeName = () => {
    navigation.navigate("LandingPage");
  };

  return (
    <ImageBackground source={require("../assets/diceBackground.jpg")} style={styles.background}>
      <View style={styles.overlay}>
        {playerName ? (
          // Jos pelaaja on tunnistettu
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesText}>Hi {playerName}, let's roll the dice!</Text>
            <Image
              source={require("../assets/hiThere.png")}
              style={styles.hiThereImage}
            />
            <View style={styles.homeButtonContainer}>
              <View style={styles.rowButtons}>
                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={handleChangeName}
                >
                  <Text style={[styles.buttonText, { fontSize: 16 }]}>Change name</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={handlePlay}
                >
                  <Text style={styles.buttonText}>PLAY</Text>
                  <MaterialCommunityIcons name="play" size={30} color="black" />
                </Pressable>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                  styles.fullWidthButton,
                ]}
                onPress={handleRules}
              >
                <Text style={styles.buttonText}>Rules</Text>
                <FontAwesome5 name="book" size={30} color="black" />
              </Pressable>
            </View>
          </View>
        ) : (
          // Jos pelaajaa ei ole tunnistettu
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesText}>Hi, Stranger! Can you tell your nickname?</Text>
            <Text style={styles.rulesAuxillaryText}>( Nickname must be 3-10 characters long. )</Text>
            <Image
              source={require("../assets/register.png")}
              style={styles.registerImage}
            />
            <Pressable
              style={({ pressed }) => [styles.homeButton, pressed && styles.homeButtonPressed]}
              onPress={() => navigation.navigate("LandingPage")}
            >
              <Text style={styles.buttonText}>OK</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}
