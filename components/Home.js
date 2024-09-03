import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, ImageBackground, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import { useNavigation } from '@react-navigation/native';
import { rulesTextContent, combinationsData } from '../constants/Game';
import * as Device from 'expo-device';
import { database } from '../components/Firebase';
import { ref, onValue, set, get } from 'firebase/database'; // Käytetään myös "get"-funktiota
import uuid from 'react-native-uuid';

export default function Home({ setIsUserRecognized, setName }) {
  const navigation = useNavigation();
  const [localName, setLocalName] = useState(''); // Käytetään paikallista tilaa tekstikenttään
  const [playerId, setPlayerId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Device.isDevice) {
      const deviceIdentifier = Device.osBuildId || Device.modelId || Device.osInternalBuildId;
      setDeviceId(deviceIdentifier);

      const timer = setTimeout(() => {
        checkExistingDevice(deviceIdentifier);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const checkExistingDevice = (deviceId) => {
    const playersRef = ref(database, 'players');
    onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const existingPlayer = Object.values(data).find(player => player.deviceId === deviceId);
        if (existingPlayer) {
          setPlayerId(existingPlayer.playerId);
          setLocalName(existingPlayer.name); // Päivitä paikallinen nimi
          setName(existingPlayer.name); // Päivitä App.js nimi
          setShowRules(true);
          setIsUserRecognized(true);
        } else {
          const newPlayerId = uuid.v4();
          setPlayerId(newPlayerId);
          setIsUserRecognized(false);
        }
      }
      setLoading(false);
    });
  };

  const saveNewPlayer = async (name, playerId, deviceId) => {
    const playerRef = ref(database, `players/${playerId}`);
    const snapshot = await get(playerRef);
    const playerData = snapshot.val();

    set(playerRef, {
      ...playerData, // Säilytetään olemassa oleva data
      name: name, // Päivitetään vain nimi
      deviceId: deviceId,
      dateJoined: playerData?.dateJoined || new Date().toLocaleDateString(), // Säilytetään olemassa oleva päivämäärä
    });

    setName(name); // Päivitetään App.js nimi
  };

  const handlePress = () => {
    if (localName.trim() === '') {
      Alert.alert('Name is required', 'Please enter your name.');
    } else if (localName.length < 3 || localName.length > 15) {
      Alert.alert('Name is too short', 'Please enter a name with at least 3 characters and maximum 15 characters.');
    } else {
      setShowRules(true);
      setIsUserRecognized(true);
      if (!playerId) {
        const newPlayerId = uuid.v4();
        setPlayerId(newPlayerId);
        saveNewPlayer(localName, newPlayerId, deviceId); // Käytetään paikallista nimeä
      } else {
        saveNewPlayer(localName, playerId, deviceId); // Käytetään paikallista nimeä
      }
    }
  };

  const handlePlay = () => {
    navigation.navigate('Gameboard', { player: localName, playerId: playerId }); // Käytä localName
  };

  const handleChangeName = () => {
    setLocalName(''); // Nollaa vain paikallinen nimi
    setShowRules(false);
    setIsUserRecognized(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ImageBackground
        source={require('../assets/diceBackground.jpg')}
        style={styles.background}>
        <View style={styles.overlay}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.rulesText}>Checking player data...</Text>
            </View>
          ) : !showRules ? (
            <View style={styles.homeContainer}>
              <Text style={styles.rulesText}>Hi, Stranger! Can you tell your name? </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={'white'}
                value={localName} // Käytetään paikallista nimeä
                onChangeText={(val) => setLocalName(val)} // Päivitetään paikallinen nimi
                autoFocus={true}
              />
              <Pressable
                style={({ pressed }) => [styles.homeButton, pressed && styles.homeButtonPressed]}
                onPress={handlePress}
              >
                <Text style={styles.buttonText}>OK</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.rulesContainer}>
              <MaterialCommunityIcons name="information-variant" size={100} color="white" />
              <Text style={styles.rulesText}>Hello, {localName}!</Text>
              <Text style={styles.rulesText}>Here are the rules:</Text>
              <Text style={styles.rulesText}>
                {rulesTextContent}
              </Text>
              <Text style={[styles.rulesText, { marginTop: 20, fontSize: 25 }]}>Combinations</Text>
              {combinationsData.map((combination, index) => (
                <View style={styles.rulesCombination} key={index}>
                  <MaterialCommunityIcons name={combination.icon} size={30} color="white" />
                  <Text style={{ fontSize: 10, color: 'white' }}>{combination.smallText}</Text>
                  <Text style={styles.rulesCombinationTxt}>{combination.description}</Text>
                </View>
              ))}
              <View style={styles.diceContainer}>
                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={handleChangeName}
                >
                  <Text style={[styles.buttonText, { fontSize: 18 }]}>Change name</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                  onPress={handlePlay}
                >
                  <Text style={styles.buttonText}>PLAY</Text>
                  <MaterialCommunityIcons name="play" size={30} color="black" />
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </ImageBackground>
    </ScrollView>
  );
}
