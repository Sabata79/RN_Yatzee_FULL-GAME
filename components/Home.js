import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, ImageBackground, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import { useNavigation } from '@react-navigation/native';
import { rulesTextContent, combinationsData } from '../constants/Game';
import * as Device from 'expo-device'; 
import { database } from '../components/Firebase';
import { ref, onValue, set } from 'firebase/database';
import uuid from 'react-native-uuid'; 

export default function Home({ setIsUserRecognized }) {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState(''); 
  const [deviceId, setDeviceId] = useState(''); 
  const [showRules, setShowRules] = useState(false);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    if (Device.isDevice) {
      const deviceIdentifier = Device.osBuildId || Device.modelId || Device.osInternalBuildId;
      setDeviceId(deviceIdentifier);
      checkExistingDevice(deviceIdentifier);
    }
  }, []);

const checkExistingDevice = (deviceId) => {
  const playersRef = ref(database, 'players');
  onValue(playersRef, (snapshot) => {
    try {
      const data = snapshot.val();
      console.log('Data retrieved from Firebase:', data); // Debugging: Tarkista data

      if (data) {
        const existingPlayer = Object.values(data).find(player => player.deviceId === deviceId);
        if (existingPlayer) {
          console.log('Existing player found:', existingPlayer); // Debugging
          setPlayerId(existingPlayer.playerId);
          setName(existingPlayer.name); 
          setShowRules(true); 
          setIsUserRecognized(true); 
        } else {
          console.log('No existing player found, creating new player ID');
          const newPlayerId = uuid.v4(); 
          setPlayerId(newPlayerId);
          setIsUserRecognized(false); 
        }
      } else {
        console.log('No data available for players'); 
        setIsUserRecognized(false);
      }
    } catch (error) {
      console.error('Error fetching player data from Firebase:', error); // Debugging: Tarkista virheet
    } finally {
      setLoading(false); 
    }
  });
};

  const saveNewPlayer = (name, playerId, deviceId) => {
    const newPlayerRef = ref(database, `players/${playerId}`);
    set(newPlayerRef, {
      playerId: playerId,
      name: name,
      deviceId: deviceId, 
      dateJoined: new Date().toLocaleDateString(),
    });
  };

  const handlePress = () => {
    if (name.trim() === '') {
      Alert.alert('Name is required', 'Please enter your name.');
    } else if (name.length < 3 || name.length > 15) {
      Alert.alert('Name is too short', 'Please enter a name with at least 3 characters and maximum 15 characters.');
    } else {
      setShowRules(true);
      setIsUserRecognized(true); // Varmistetaan, että käyttäjä on tunnistettu, kun tallennetaan uusi pelaaja
      if (!playerId) {
        const newPlayerId = uuid.v4(); 
        setPlayerId(newPlayerId);
        saveNewPlayer(name, newPlayerId, deviceId);
      } else {
        saveNewPlayer(name, playerId, deviceId);
      }
    }
  };

  const handlePlay = () => {
    navigation.navigate('Gameboard', { player: name, playerId: playerId });
  };

  const handleChangeName = () => {
    setName('');
    setShowRules(false);
    setIsUserRecognized(false); // Nollataan käyttäjän tunnistus
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
              <Text style={styles.loadingText}>Checking player data...</Text>
            </View>
          ) : !showRules ? (
            <View style={styles.homeContainer}>
              <Text style={styles.rulesText}>Hi, Stranger! Can you tell your name? </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={'white'}
                value={name} 
                onChangeText={(val) => setName(val)}
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
              <Text style={styles.rulesText}>Hello, {name}!</Text>
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
