/**
 * Home – main screen for player login, linking, recovery, and welcome video.
 * Android uses CustomKeyboard (OK triggers handlePress), iOS uses system keyboard (return triggers handlePress).
 *
 * Props:
 *  - navigation: object (React Navigation)
 *  - route: object (React Navigation)
 *
 * @module Home
 * @author Sabata79
 * @since 2025-09-18
 */
// src/screens/Home.js

import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TextInput, Alert, Image, Animated, Platform, Keyboard, InteractionManager } from "react-native";
import * as SecureStore from "expo-secure-store";
import { FontAwesome5 } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import homeStyles from '../styles/HomeStyles';
import { dbGet, dbSet, dbUpdate, auth } from '../services/Firebase';
import { sanitizeInput, checkIfNameExists } from '../services/nameUtils';
import uuid from 'react-native-uuid';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useGame } from '../constants/GameContext';
import RecoverModal from "../components/modals/RecoverModal";
import PlayerCard from "../components/PlayerCard";
import HomeScreenButton from "../components/HomeScreenButton";
import { useAudio } from '../services/AudioManager';
import CustomKeyboard from '../components/CustomKeyboard'; // ⬅ custom keyboard
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MAX_TOKENS } from "../constants/Game";

export default function Home({ setPlayerId }) {
  // Local state
  const [localName, setLocalName] = useState('');
  const [localPlayerId, setLocalPlayerId] = useState('');
  const [loading, setLoading] = useState(false);

  const [kbVisible, setKbVisible] = useState(false); // ⬅ custom kbd visibility (Android)
  const [keyboardVisible, setKeyboardVisible] = useState(false); // iOS/system keyboard
  const inputRef = useRef(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const presenceCleanupRef = useRef(null);
  const presencePendingRef = useRef(false);
  const presencePendingTimerRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRecoverModalVisible, setIsRecoverModalVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Audio
  const { playSelect, prewarmSfx, ready } = useAudio();
  useFocusEffect(
    useCallback(() => {
      prewarmSfx().catch(() => { });
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
    tokensStabilized,
    gameVersion,
    gameVersionCode,
  } = useGame();

  const isFocused = useIsFocused();

  // Animate in only when Home is focused (visible)
  useEffect(() => {
    let cancelled = false;
    let runningAnim = null;
    if (isFocused) {
      // Start fade-in after interactions have settled to avoid jank
      fadeAnim.setValue(0);
      InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        runningAnim = Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        });
        runningAnim.start();
      });
    }
    return () => {
      cancelled = true;
      try {
        if (runningAnim && runningAnim.stop) runningAnim.stop();
      } catch (e) { }
    };
  }, [isFocused, fadeAnim]);

  // iOS / system keyboard visibility (used to adjust layout when user not recognized)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const show = () => setKeyboardVisible(true);
      const hide = () => setKeyboardVisible(false);
      const subShow = Keyboard.addListener('keyboardDidShow', show);
      const subHide = Keyboard.addListener('keyboardDidHide', hide);
      return () => {
        try { subShow.remove(); } catch (e) { }
        try { subHide.remove(); } catch (e) { }
      };
    }
    return undefined;
  }, []);

  // Sync context when localName/playerId change
  useEffect(() => {
    if (localName && playerId) {
      setPlayerIdContext(playerId);
      setPlayerNameContext(localName);
      setLocalPlayerId(playerId);
    }
  }, [localName, playerId, setPlayerIdContext, setPlayerNameContext]);

  // Mark player online when playerId is available and auth matches.
  // Presence is now handled centrally by GameContext; Home no longer manages goOnline/goOffline.

  const saveNewPlayer = async (name, userId) => {
    const snap = await dbGet(`players/${userId}`);
    const playerData = snap.val();
    const formattedDate = new Date().toLocaleDateString('fi-FI');
    // Determine whether this is a new player creation (only then set tokens)
    const isNew = !playerData || !playerData.name;
    const baseObj = {
      name,
      level: 'beginner',
      dateJoined: playerData?.dateJoined || formattedDate,
    };

    try {
      const profileUpdate = baseObj;
      await dbUpdate(`players/${userId}`, profileUpdate);
      if (isNew) {
        try {
          // Initialize canonical root token fields; avoid tokensAtomic child entirely.
          // Do NOT write nextTokenTime to the database; UI computes display locally from tokensLastAnchor.
          await dbUpdate(`players/${userId}`, { tokens: MAX_TOKENS, tokensLastAnchor: null, lastTokenDecrement: null });
        } catch (e) {
          try { await dbUpdate(`players/${userId}`, { tokens: MAX_TOKENS }); } catch (e2) { }
        }
      }
    } catch (e) {
      try {
        const setObj = baseObj;
        await dbUpdate(`players/${userId}`, setObj);
      } catch (e2) {
        const setObj = baseObj;
        await dbSet(`players/${userId}`, setObj);
      }
    }

    await SecureStore.setItemAsync('user_id', userId);

    setPlayerName(name);
    setPlayerId(userId);
  };

  const handlePress = async () => {
    const cleanedName = sanitizeInput(localName);
    if (cleanedName === '') {
      Alert.alert('Name is required', 'Please enter your name.');
      return;
    }
    if (cleanedName.length < 3 || cleanedName.length > 10) {
      Alert.alert('Invalid Name Length', 'Please enter a nickname with 3-10 characters.');
      return;
    }

    const nameExists = await checkIfNameExists(cleanedName);
    if (nameExists) {
      Alert.alert('Name already in use', 'That nickname is already in use. Please choose another.');
      return;
    }

    setUserRecognized(true);

    if (!playerId) {
      const newPlayerId = uuid.v4();
      setLocalPlayerId(newPlayerId);
      setPlayerId(newPlayerId);
      setPlayerIdContext(newPlayerId);
      setPlayerNameContext(cleanedName);
      await saveNewPlayer(cleanedName, newPlayerId);
    } else {
      setPlayerIdContext(playerId);
      setPlayerNameContext(cleanedName);
      await saveNewPlayer(cleanedName, playerId);
    }

    // Hide custom keyboard after submit (Android)
    if (Platform.OS === 'android') setKbVisible(false);
  };

  const handlePlay = async () => {
    if (!ready) {
      await prewarmSfx().catch(() => { });
    }
    try { await playSelect(); } catch { }
    navigation.navigate('Gameboard');
  };

  const handleScore = () => navigation.navigate('Scoreboard');
  const handleViewPlayerCard = () => { setSelectedPlayer({ playerId, playerName }); setModalVisible(true); };
  const handleSettings = () => navigation.navigate('Settings');

  // Custom keyboard helpers (Android)
  const insertChar = (ch) => {
    setLocalName(prev => sanitizeInput((prev || '') + ch).slice(0, 10));
  };
  const backspace = () => {
    setLocalName(prev => (prev || '').slice(0, -1));
  };

  // layout adjustments
  const bottomPad = insets.bottom || 0;
  let extraBottom = 24 + bottomPad;
  if (!userRecognized) {
    // if custom keyboard visible (Android) or system keyboard (iOS), give more bottom space
    const kbActive = Platform.OS === 'android' ? kbVisible : keyboardVisible;
    extraBottom = bottomPad + (kbActive ? 220 : 24);
  }

  // Preserve last known extraBottom while a modal is visible to avoid
  // layout reflows caused by insets/keyboard or transient changes when
  // opening overlays (PlayerCard). This prevents the bottom content from
  // 'jumping' down/up when the modal mounts.
  const lastExtraBottomRef = useRef(extraBottom);
  useEffect(() => {
    // Update stored value only when modal is NOT visible. When modal is
    // visible we keep the previous value fixed until it closes.
    if (!isModalVisible) {
      lastExtraBottomRef.current = extraBottom;
    }
  }, [extraBottom, isModalVisible]);

  const appliedExtraBottom = isModalVisible ? lastExtraBottomRef.current : extraBottom;

  const containerLayoutStyle = { flex: 1, justifyContent: userRecognized ? 'flex-end' : 'center', paddingBottom: appliedExtraBottom };

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[homeStyles.homeContainer, { opacity: fadeAnim }, containerLayoutStyle]}>
        {!userRecognized ? (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={homeStyles.homeText}>Hi, Stranger!</Text>
            <Text style={homeStyles.homeText}>Can you tell your nickname?</Text>
            <Text style={homeStyles.homeAuxillaryText}>(Nickname must be 3-10 characters long)</Text>

            <Image source={require("../../assets/register.webp")} style={homeStyles.registerImage} />

            <TextInput
              ref={inputRef}
              style={homeStyles.input}
              placeholder="Enter your nickname"
              placeholderTextColor={"#222f3e"}
              value={localName}
              onChangeText={(text) => setLocalName(sanitizeInput(text))}
              showSoftInputOnFocus={false}
              onFocus={() => setKbVisible(true)}
              onBlur={() => setKbVisible(false)}
            />

            <HomeScreenButton
              label="Recover linked player"
              icon={<FontAwesome5 name="redo" size={30} color="black" style={{ marginLeft: 8 }} />}
              onPress={() => setIsRecoverModalVisible(true)}
            />
            <RecoverModal
              visible={isRecoverModalVisible}
              onClose={() => setIsRecoverModalVisible(false)}
              bottomInset={insets.bottom}
              bottomOffset={0}
              dark
            />
          </View>
        ) : (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={[homeStyles.homeText]}>Hi {playerName},</Text>

            <View style={homeStyles.tokenRow}>
              <Text style={[homeStyles.homeText]}>you have</Text>
              <Text style={homeStyles.tokenText}>{typeof tokensStabilized === 'boolean' && !tokensStabilized ? '—' : (tokens ?? 0)}</Text>
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

        {/* PlayerCard intentionally not rendered here to avoid changing the layout
            of the Home screen when the modal mounts. It's rendered as a sibling
            (below) so the modal overlay does not cause reflow/jump of buttons. */}
      </Animated.View>
      {isModalVisible && selectedPlayer && (
        <PlayerCard
          playerId={selectedPlayer.playerId}
          playerName={selectedPlayer.playerName}
          isModalVisible={isModalVisible}
          setModalVisible={setModalVisible}
        />
      )}
      {Platform.OS === "android" && (
        <CustomKeyboard
          visible={kbVisible}
          bottomInset={insets.bottom}
          bottomOffset={0}
          onInsert={(ch) => {
            setLocalName((prev) => (prev + ch).slice(0, 10));
          }}
          onBackspace={() => setLocalName((prev) => prev.slice(0, -1))}
          onSubmit={handlePress}
          onHide={() => {
            setKbVisible(false);
            inputRef.current?.blur();
          }}
        />
      )}
    </View>
  );
}
