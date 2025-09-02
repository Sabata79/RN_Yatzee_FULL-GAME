/**
 * Home - Main screen for player login, linking, recovery, and welcome video.
 *
 * JSDoc comments and inline code comments must always be in English.
 * This file handles player login, account linking, recovery, and welcome video.
 * @author Sabata79
 * @since 2025-08-29
 */
import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, Alert, ImageBackground, Image, Animated, SafeAreaView } from "react-native";
import * as SecureStore from "expo-secure-store";
import { FontAwesome5 } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import styles from '../styles/styles';
import homeStyles from '../styles/HomeStyles';
import { dbGet, dbSet } from '../services/Firebase';
import uuid from 'react-native-uuid';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useGame } from '../constants/GameContext';
import Linked from "../services/Linked";
import Recover from "../services/Recover";
import PlayerCard from "../components/PlayerCard";
import HomeScreenButton from "../components/HomeScreenButton";

// Home screen component: handles player login, linking, recovery, and welcome video
export default function Home({ setPlayerId }) {

  // Local state for player name and ID
  const [localName, setLocalName] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [loading, setLoading] = useState(true);

  // Ref for focusing the name input
  const inputRef = useRef(null);
  const navigation = useNavigation();

  // Animation for fade-in effects
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const [isRecoverModalVisible, setIsRecoverModalVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  // Modal visibility states
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Error state for video playback
  const [videoError, setVideoError] = useState(false);

  // Video player setup (expo-video)
  const videoPlayer = useVideoPlayer(require('../../assets/hiThere.mp4'), (p) => {
    p.loop = false;        // no looping
    p.muted = true;        // muted
    p.playbackRate = 0.6;  // slightly slower
  });

  const {
    setPlayerIdContext,
    setPlayerNameContext,
    userRecognized,
    setUserRecognized,
    playerName,
    playerId,
    setPlayerName,
    isLinked
    // Game context values and setters
  } = useGame();

  const isFocused = useIsFocused();

  // Play or pause the welcome video when the screen is focused
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

  // Update game context when localName or playerId changes
  useEffect(() => {
    if (localName && playerId) {
      setPlayerIdContext(playerId);
      setPlayerNameContext(localName);
      setLocalPlayerId(playerId);
    }
  }, [localName, playerId, setPlayerIdContext, setPlayerNameContext]);

  // Animate the fade-in effect for the welcome message
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  // Check if the player name already exists
  const checkIfNameExists = async (name) => {
    const snapshot = await dbGet('players');
    if (snapshot.exists()) {
      const playersData = snapshot.val();
      for (let pid in playersData) {
        if (playersData[pid]?.name === name) return true;
      }
    }
    return false;
  };

  // Save a new player to the database
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
  };

  // Sanitize user input
  const sanitizeInput = (input) => input.replace(/[^a-zA-Z0-9 ]/g, '').trim();

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

  const handlePlay = () => navigation.navigate('Gameboard');
  const handleChangeName = () => { setLocalName(''); setUserRecognized(false); };
  const handleViewPlayerCard = () => { setSelectedPlayer({ playerId, playerName }); setModalVisible(true); };
  const handleLinkAccount = () => setIsLinkModalVisible(true);

  return (
    <ImageBackground style={styles.homeBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.overlay}>
        {!userRecognized ? (
          <View style={homeStyles.rulesContainer}>
            <Text style={styles.rulesText}>Hi, Stranger! Can you tell your nickname?</Text>
            <Text style={styles.rulesAuxillaryText}>(Nickname must be 3-10 characters long.)</Text>
            <Image source={require("../../assets/register.webp")} style={styles.registerImage} />
            <TextInput
              ref={inputRef}
              style={homeStyles.input}
              placeholder="Enter your nickname"
              placeholderTextColor={"white"}
              value={localName}
              onChangeText={(text) => setLocalName(sanitizeInput(text))}
            />
            <HomeScreenButton
              label="OK"
              icon={<FontAwesome5 name="check" size={30} color="black" style={{ marginLeft: 8 }} />}
              onPress={handlePress}
            />
            <HomeScreenButton
              label="Recover linked player"
              icon={<FontAwesome5 name="redo" size={30} color="black" style={{ marginLeft: 8 }} />}
              onPress={() => setIsRecoverModalVisible(true)}
            />
            <Recover
              isVisible={isRecoverModalVisible}
              onClose={() => setIsRecoverModalVisible(false)}
            />
          </View>
        ) : (
          <View style={homeStyles.rulesContainer}>
            <Text style={styles.rulesText}>Hi {playerName}, let's roll the dice!</Text>

            {!videoError ? (
              <VideoView
                player={videoPlayer}
                style={styles.hiThereImage}
                contentFit="contain"
                nativeControls={false}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                pointerEvents="none"
                focusable={false}
                onError={(e) => {
                  console.log("Home hiThere video error:", e);
                  setVideoError(true);
                }}
              />
            ) : (
              <Image source={require("../../assets/hiThere.webp")} style={styles.hiThereImage} />
            )}

            <HomeScreenButton
              label="PLAY"
              icon={<FontAwesome5 name="play" size={30} color="black" style={{ marginLeft: 8 }} />}
              onPress={handlePlay}
            />
            <HomeScreenButton
              label="View Player Card"
              icon={<FontAwesome5 name="id-card" size={30} color="black" style={{ marginLeft: 8 }} />}
              onPress={handleViewPlayerCard}
            />
            <HomeScreenButton
              label="Change name"
              icon={<FontAwesome5 name="user-edit" size={30} color="black" style={{ marginLeft: 8 }} />}
              onPress={handleChangeName}
            />
            {!isLinked && (
              <HomeScreenButton
                label="Link your account"
                icon={<FontAwesome5 name="link" size={30} color="black" style={{ marginLeft: 8 }} />}
                onPress={handleLinkAccount}
              />
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
      </SafeAreaView>
    </ImageBackground>
  );
}
