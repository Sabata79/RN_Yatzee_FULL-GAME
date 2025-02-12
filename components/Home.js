import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, Alert, ImageBackground, Image, Animated } from "react-native";
import * as SecureStore from "expo-secure-store";
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles';
import { database } from '../components/Firebase';
import { ref, set, get } from 'firebase/database';
import uuid from 'react-native-uuid';
import { useNavigation } from '@react-navigation/native';
import { useGame } from '../components/GameContext';
import Linked from "../services/Linked";
import Recover from "../services/Recover";

export default function Home({ setPlayerId }) {
  const [localName, setLocalName] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [isRecoverModalVisible, setIsRecoverModalVisible] = useState(false);

  const { setPlayerIdContext, setPlayerNameContext, userRecognized, setUserRecognized, playerName, playerId, setPlayerName, isLinked } = useGame();

  useEffect(() => {
    if (localName && playerId) {
      console.log("Updating context with playerId:", playerId);
      setPlayerIdContext(playerId);
      setPlayerNameContext(localName);
      setLocalPlayerId(playerId);
    }
  }, [localName, playerId]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);


  const checkIfNameExists = async (name) => {
    const playersRef = ref(database, 'players');
    const snapshot = await get(playersRef);
    if (snapshot.exists()) {
      const playersData = snapshot.val();
      for (let playerId in playersData) {
        if (playersData[playerId].name === name) {
          return true;
        }
      }
    }
    return false;
  };

  const saveNewPlayer = async (name, userId) => {
    const playerRef = ref(database, `players/${userId}`);
    const snapshot = await get(playerRef);
    const playerData = snapshot.val();

    set(playerRef, {
      ...playerData,
      name: name,
      level: "basic",
      dateJoined: playerData?.dateJoined || new Date().toLocaleDateString(),
    });

    await SecureStore.setItemAsync("user_id", userId);

    setPlayerName(name);
    setPlayerId(userId);
    console.log("Saving player data:", { name, userId });
  };

  const sanitizeInput = (input) => {
    const sanitized = input.replace(/[^a-zA-Z0-9 ]/g, '');
    return sanitized.trim();
  };

  const handlePress = async () => {
    const cleanedName = sanitizeInput(localName);

    if (cleanedName === '') {
      Alert.alert('Name is required', 'Please enter your name.');
    } else if (cleanedName.length < 3 || cleanedName.length > 10) {
      Alert.alert('Invalid Name Length', 'Please enter a nickname with 3-10 characters.');
    } else {
      const nameExists = await checkIfNameExists(cleanedName);
      if (nameExists) {
        Alert.alert('Name already in use', 'That nickname is already in use. Please choose another.');
      } else {
        setUserRecognized(true);

        if (!playerId) {
          const newPlayerId = uuid.v4();
          setLocalPlayerId(newPlayerId);
          setPlayerId(newPlayerId);
          setPlayerIdContext(newPlayerId);
          setPlayerNameContext(cleanedName);
          saveNewPlayer(cleanedName, newPlayerId);
        } else {
          setPlayerIdContext(playerId);
          setPlayerNameContext(cleanedName);
          saveNewPlayer(cleanedName, playerId);
        }
      }
    }
  };

  const handlePlay = () => {
    navigation.navigate('Gameboard');
  };

  const handleChangeName = () => {
    setLocalName('');
    setUserRecognized(false);
  };

  const handleLinkAccount = () => {
    setIsLinkModalVisible(true);
  };

  return (
    <ImageBackground source={require("../assets/diceBackground.jpg")} style={styles.background}>
      <View style={styles.overlay}>
        {!userRecognized ? (
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesText}>Hi, Stranger! Can you tell your nickname?</Text>
            <Text style={styles.rulesAuxillaryText}>(Nickname must be 3-10 characters long.)</Text>
            <Image source={require("../assets/register.png")} style={styles.registerImage} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Enter your nickname"
              placeholderTextColor={"white"}
              value={localName}
              onChangeText={(text) => setLocalName(sanitizeInput(text))}
            />
            <Pressable
              style={({ pressed }) => [styles.homeButton, pressed && styles.homeButtonPressed]}
              onPressOut={handlePress}
            >
              <Text style={styles.buttonText}>OK</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                styles.fullWidthButton,
              ]}
              onPressOut={() => setIsRecoverModalVisible(true)}
            >
              <Text style={styles.buttonText}>Recover linked player</Text>
              <FontAwesome5 name="redo" size={40} color="black" />
            </Pressable>

            {/* Recover-module */}
            <Recover
              isVisible={isRecoverModalVisible}
              onClose={() => setIsRecoverModalVisible(false)}
            />
          </View>
        ) : (

          <View style={styles.rulesContainer}>
            <Text style={styles.rulesText}>Hi {playerName}, let's roll the dice!</Text>
            <Image source={require("../assets/hiThere.png")} style={styles.hiThereImage} />
            <Pressable
              style={({ pressed }) => [
                styles.button, pressed && styles.buttonPressed,
                styles.fullWidthButton,
              ]}
              onPressOut={handlePlay}
            >
              <Text style={styles.buttonText}>PLAY</Text>
              <FontAwesome5 name="play" size={45} color="black" style={{ marginRight: 0 }} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button, pressed && styles.buttonPressed,
                styles.fullWidthButton,
              ]}
              onPressOut={handleChangeName}
            >
              <Text style={styles.buttonText}>Change name</Text>
              <FontAwesome5 name="user-edit" size={40} color="black" />
            </Pressable>


            {/* Show link button if not linked */}
            {!isLinked && (
              <Pressable
                style={({ pressed }) => [styles.homeButton, pressed && styles.homeButtonPressed]}
                onPressOut={handleLinkAccount}
              >
                <Text style={styles.buttonText}>Link your account</Text>
              </Pressable>
            )}

            {/* Opens link if player is not linked */}
            <Linked
              isVisible={isLinkModalVisible}
              onClose={() => setIsLinkModalVisible(false)}
              onLinkAccount={handleLinkAccount}
            />
          </View>
        )}
      </View>
    </ImageBackground>
  );
}
