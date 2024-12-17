import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, Alert, ImageBackground, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles';
import * as SecureStore from 'expo-secure-store';
import { database } from '../components/Firebase';
import { ref, onValue, set, get } from 'firebase/database';
import uuid from 'react-native-uuid';
import { useNavigation } from '@react-navigation/native';  
import { useGame } from '../components/GameContext';

export default function Home({ setIsUserRecognized, setName, setPlayerId }) {
  const [localName, setLocalName] = useState('');
  const [playerId, setLocalPlayerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUserRecognized, setUserRecognized] = useState(false);
  const inputRef = useRef(null);
  const navigation = useNavigation();

  const { setPlayerIdContext, setPlayerNameContext } = useGame();

  
  useEffect(() => {
    if (localName && playerId) {
      setPlayerIdContext(playerId);
      setPlayerNameContext(localName);
    }
  }, [localName, playerId]);

  useEffect(() => {
    getOrCreateUserId().then((userId) => {
      setLocalPlayerId(userId);
      checkExistingUser(userId);
    });
  }, []);

  const getOrCreateUserId = async () => {
    let userId = await SecureStore.getItemAsync('user_id');
    if (!userId) {
      userId = uuid.v4();
      await SecureStore.setItemAsync('user_id', userId);
    }
    return userId;
  };

  const checkExistingUser = (userId) => {
    const playerRef = ref(database, `players/${userId}`);
    onValue(playerRef, (snapshot) => {
      const playerData = snapshot.val();
      if (playerData) {
        setLocalName(playerData.name);
        setName(playerData.name);
        setUserRecognized(true);
        setIsUserRecognized(true);
      } else {
        setUserRecognized(false);
        setIsUserRecognized(false);
      }
      setLoading(false);
    });
  };

    const checkIfNameExists = async (name) => {
    const playersRef = ref(database, 'players');
    const snapshot = await get(playersRef);
    if (snapshot.exists()) {
      const playersData = snapshot.val();
      for (let playerId in playersData) {
        if (playersData[playerId].name === name) {
          return true;  // Name already exists
        }
      }
    }
    return false;  // Name is available
  };

  const saveNewPlayer = async (name, userId) => {
    const playerRef = ref(database, `players/${userId}`);
    const snapshot = await get(playerRef);
    const playerData = snapshot.val();

    set(playerRef, {
      ...playerData,
      name: name,
      dateJoined: playerData?.dateJoined || new Date().toLocaleDateString(),
    });

    setName(name);
    setPlayerId(userId);
  };

  const handlePress = async () => {
    if (localName.trim() === '') {
      Alert.alert('Name is required', 'Please enter your name.');
    } else if (localName.length < 3 || localName.length > 10) {
      Alert.alert('Name is too short', 'Please enter a name with at least 3 characters and maximum 10 characters.');
    } else {
      const nameExists = await checkIfNameExists(localName);
      if (nameExists) {
        Alert.alert('Name already in use', 'That nickname is already in use. Please choose another.');
      } else {
        setUserRecognized(true);
        setIsUserRecognized(true);

        if (!playerId) {
          const newPlayerId = uuid.v4();
          setLocalPlayerId(newPlayerId); 
          setPlayerId(newPlayerId);
          setPlayerIdContext(newPlayerId); 
          setPlayerNameContext(localName); 
          saveNewPlayer(localName, newPlayerId);
        } else {
          setPlayerIdContext(playerId);
          setPlayerNameContext(localName);
          saveNewPlayer(localName, playerId);
        }
      }
    }
  }

  const handlePlay = () => {
    navigation.navigate('Gameboard');
  };

  const handleChangeName = () => {
    setLocalName('');
    setUserRecognized(false);
    setIsUserRecognized(false);
  };

  return (
    <ImageBackground source={require('../assets/diceBackground.jpg')} style={styles.background}>
      <View style={styles.overlay}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.rulesText}>Checking player data...</Text>
          </View>
        ) : (
          <View style={styles.rulesContainer}>
            {!isUserRecognized ? (
              <View style={styles.rulesContainer}>
                <Text style={styles.rulesText}>Hi, Stranger! Can you tell your name?</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={'white'}
                  value={localName}
                  onChangeText={(val) => setLocalName(val)}
                  autoFocus={false}
                />
                <Pressable
                  style={({ pressed }) => [styles.homeButton, pressed && styles.homeButtonPressed]}
                  onPress={handlePress}
                >
                  <Text style={styles.buttonText}>OK</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.rulesContainer}>
                <Text style={styles.rulesText}>Hello, {localName}!</Text>
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
                    onPress={() => navigation.navigate('Rules')}
                  >
                    <Text style={styles.buttonText}>Rules</Text>
                    <FontAwesome5 name="book" size={30} color="black" />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </ImageBackground>
  );
}
