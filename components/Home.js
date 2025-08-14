import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, Alert, ImageBackground, Image, Animated } from "react-native";
import * as SecureStore from "expo-secure-store";
import { FontAwesome5 } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video'; // 👈 MP4-video
import styles from '../styles/homeStyles';
import { dbGet, dbSet } from '../components/Firebase';
import uuid from 'react-native-uuid';
import { useNavigation } from '@react-navigation/native';
import { useGame } from '../components/GameContext';
import Linked from "../services/Linked";
import Recover from "../services/Recover";
import PlayerCard from "./PlayerCard";

export default function Home({ setPlayerId }) {
  const [localName, setLocalName] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [isRecoverModalVisible, setIsRecoverModalVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const videoRef = useRef(null); // 👈 viittaus videoon

  const videoPlayer = useVideoPlayer(
    require('../assets/hiThere.mp4'),
    (p) => {
      p.loop = false;            // ei looppausta
      p.muted = true;            // ei ääntä
      p.playbackRate = 0.60;     // hidastus 60 %
      p.play();                  // käynnistä
    }
  );

  const {
    setPlayerIdContext,
    setPlayerNameContext,
    userRecognized,
    setUserRecognized,
    playerName,
    playerId,
    setPlayerName,
    isLinked
  } = useGame();

  useEffect(() => {
    if (localName && playerId) {
      console.log("Updating context with playerId:", playerId);
      setPlayerIdContext(playerId);
      setPlayerNameContext(localName);
      setLocalPlayerId(playerId);
    }
  }, [localName, playerId, setPlayerIdContext, setPlayerNameContext]);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  // Vapauta videon resurssit kun komponentti unmounttaa (hyvä tapa Androidilla)
  useEffect(() => {
    return () => {
      videoRef.current?.unloadAsync?.();
    };
  }, []);

  const checkIfNameExists = async (name) => {
    const snapshot = await dbGet('players');
    if (snapshot.exists()) {
      const playersData = snapshot.val();
      for (let pid in playersData) {
        if (playersData[pid]?.name === name) {
          return true;
        }
      }
    }
    return false;
  };

  const saveNewPlayer = async (name, userId) => {
    const snap = await dbGet(`players/${userId}`);
    const playerData = snap.val();

    const formattedDate = new Date().toLocaleDateString('fi-FI');

    await dbSet(`players/${userId}`, {
      ...playerData,
      name,
      level: 'beginner',
      progresspoints: 0,
      dateJoined: playerData?.dateJoined || formattedDate,
    });

    await SecureStore.setItemAsync('user_id', userId);

    setPlayerName(name);
    setPlayerId(userId);
    console.log('Saving player data:', { name, userId });
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

  const handleViewPlayerCard = () => {
    setSelectedPlayer({ playerId: playerId, playerName: playerName });
    setModalVisible(true);
  };

  const handleLinkAccount = () => {
    setIsLinkModalVisible(true);
  };

  return (
    <ImageBackground source={require("../assets/diceBackground.webp")} style={styles.background}>
      <View style={styles.overlay}>
        {!userRecognized ? (
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesText}>Hi, Stranger! Can you tell your nickname?</Text>
            <Text style={styles.rulesAuxillaryText}>(Nickname must be 3-10 characters long.)</Text>
            <Image source={require("../assets/register.webp")} style={styles.registerImage} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Enter your nickname"
              placeholderTextColor={"white"}
              value={localName}
              onChangeText={(text) => setLocalName(sanitizeInput(text))}
            />
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
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
              <FontAwesome5 name="redo" size={30} color="black" style={{ marginLeft: 'auto' }} />
            </Pressable>
            <Recover
              isVisible={isRecoverModalVisible}
              onClose={() => setIsRecoverModalVisible(false)}
            />
          </View>
        ) : (
          <View style={styles.rulesContainer}>
            <Text style={styles.rulesText}>Hi {playerName}, let's roll the dice!</Text>

            {/* 👇 Korvaa aiempi still-kuva MP4-animaatiolla */}
            <VideoView
              player={videoPlayer}
              style={styles.hiThereImage} 
              contentFit="contain"
              nativeControls={false}
              allowsFullscreen={false}
            />

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                styles.fullWidthButton,
              ]}
              onPressOut={handlePlay}
            >
              <Text style={styles.buttonText}>PLAY</Text>
              <FontAwesome5 name="play" size={30} color="black" style={{ marginLeft: 'auto' }} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                styles.fullWidthButton,
              ]}
              onPressOut={handleViewPlayerCard}
            >
              <Text style={styles.buttonText}>View Player Card</Text>
              <FontAwesome5 name="id-card" size={30} color="black" style={{ marginLeft: 'auto' }} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                styles.fullWidthButton,
              ]}
              onPressOut={handleChangeName}
            >
              <Text style={styles.buttonText}>Change name</Text>
              <FontAwesome5 name="user-edit" size={30} color="black" style={{ marginLeft: 'auto' }} />
            </Pressable>
            {!isLinked && (
              <Pressable
                style={({ pressed }) => [styles.homeButton, pressed && styles.homeButtonPressed]}
                onPressOut={handleLinkAccount}
              >
                <Text style={styles.buttonText}>Link your account</Text>
              </Pressable>
            )}
            <Linked
              isVisible={isLinkModalVisible}
              onClose={() => setIsLinkModalVisible(false)}
              onLinkAccount={handleLinkAccount}
            />
          </View>
        )}
        {isModalVisible && selectedPlayer && (
          <PlayerCard
            playerId={selectedPlayer.playerId}
            playerName={selectedPlayer.playerName}
            isModalVisible={isModalVisible}
            setModalVisible={setModalVisible}
          />
        )}
      </View>
    </ImageBackground>
  );
}
