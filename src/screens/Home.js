/**
 * Home.js - Main screen for player login, linking, recovery, and welcome video
 *
 * Uses KeyboardAvoidingView + ScrollView to keep inputs visible with hidden nav bar.
 *
 * @module screens/Home
 * @author
 * @since 2025-09-06
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import stylesGlobal from '../styles/styles';
import homeStyles from '../styles/HomeStyles';
import { dbGet, dbSet } from '../services/Firebase';
import { sanitizeInput, checkIfNameExists } from '../services/nameUtils';
import uuid from 'react-native-uuid';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useGame } from '../constants/GameContext';
import Recover from "../services/Recover";
import PlayerCard from "../components/PlayerCard";
import HomeScreenButton from "../components/HomeScreenButton";
import { useAudio } from '../services/AudioManager';
import BackgroundVideo from '../components/BackgroundVideo';
import { MAX_TOKENS } from '../constants/Game';

export default function Home({ setPlayerId }) {
  // Local state
  const [localName, setLocalName] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRecoverModalVisible, setIsRecoverModalVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Audio
  const { playSelect, prewarmSfx, ready } = useAudio();

  // Warm samples whenever screen focuses
  useFocusEffect(
    useCallback(() => {
      prewarmSfx().catch(() => {});
    }, [prewarmSfx])
  );

  const {
    setPlayerIdContext,
    setPlayerNameContext,
    userRecognized,
    setUserRecognized,
    playerName,
    playerId,
    setPlayerName,
    tokens,
    timeToNextToken,
  } = useGame();

  const isFocused = useIsFocused();

  // Animate in when loaded
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Sync context when localName/playerId change
  useEffect(() => {
    if (localName && playerId) {
      setPlayerIdContext(playerId);
      setPlayerNameContext(localName);
      setLocalPlayerId(playerId);
    }
  }, [localName, playerId, setPlayerIdContext, setPlayerNameContext]);

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
      tokens: MAX_TOKENS,
    });

    await SecureStore.setItemAsync('user_id', userId);

    setPlayerName(name);
    setPlayerId(userId);
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

  const handlePlay = async () => {
    if (!ready) {
      await prewarmSfx().catch(() => {});
    }
    try { await playSelect(); } catch {}
    navigation.navigate('Gameboard');
  };

  const handleScore = () => navigation.navigate('Scoreboard');
  const handleViewPlayerCard = () => { setSelectedPlayer({ playerId, playerName }); setModalVisible(true); };
  const handleSettings = () => navigation.navigate('Settings');

  return (
    <View style={{ flex: 1 }}>
      <BackgroundVideo isActive={isFocused} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={16}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[homeStyles.homeContainer, { opacity: fadeAnim, alignSelf: 'stretch' }]}>
            {!userRecognized ? (
              <View style={homeStyles.homeContainer}>
                <Text style={homeStyles.homeText}>Hi, Stranger!</Text>
                <Text style={homeStyles.homeText}>Can you tell your nickname?</Text>
                <Text style={homeStyles.homeAuxillaryText}>(Nickname must be 3-10 characters long)</Text>

                <Image source={require("../../assets/register.webp")} style={stylesGlobal.registerImage} />

                <TextInput
                  ref={inputRef}
                  style={homeStyles.input}
                  placeholder="Enter your nickname"
                  placeholderTextColor={"#222f3e"}
                  value={localName}
                  onChangeText={(text) => setLocalName(sanitizeInput(text))}
                  returnKeyType="done"
                  blurOnSubmit={false}
                  onSubmitEditing={handlePress}
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
              <View style={homeStyles.homeContainer}>
                <Text style={[homeStyles.homeText]}>Hi {playerName},</Text>

                <View style={homeStyles.tokenRow}>
                  <Text style={[homeStyles.homeText]}>you have</Text>
                  <Text style={homeStyles.tokenText}>{tokens}</Text>
                  <View style={homeStyles.energyIcon}>
                    <MaterialCommunityIcons name="flash" size={18} color='#f1c40f' />
                  </View>
                  <Text style={[homeStyles.homeText, { left: -5 }]}>energy left.</Text>
                </View>

                {tokens > 0 ? (
                  <Text style={homeStyles.homeText}>Ready to roll the dice?</Text>
                ) : (
                  <View style={homeStyles.tokenRow}>
                    <Text style={homeStyles.homeText}>Next energy</Text>
                    <View style={[homeStyles.energyIcon, { left: -5 }]}>
                      <MaterialCommunityIcons name="flash" size={18} color='#f1c40f' />
                    </View>
                    <Text style={[homeStyles.homeText, { left: -5 }]}>in {timeToNextToken}</Text>
                  </View>
                )}

                <Animated.Image
                  source={require('../../assets/animations/hiThereAnimation.gif')}
                  style={homeStyles.hiThereImage}
                  resizeMode="contain"
                />

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
                  label="View Scoreboard"
                  icon={<FontAwesome5 name="trophy" size={30} color="black" style={{ marginLeft: 8 }} />}
                  onPress={handleScore}
                />
                <HomeScreenButton
                  label="Settings"
                  icon={<FontAwesome5 name="cog" size={30} color="black" style={{ marginLeft: 8 }} />}
                  onPress={handleSettings}
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
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
