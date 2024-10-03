import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, ImageBackground, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import { useNavigation } from '@react-navigation/native';
import { rulesTextContent, combinationsData } from '../constants/Game';
import * as SecureStore from 'expo-secure-store';
import { database } from '../components/Firebase';
import { ref, onValue, set, get } from 'firebase/database'; 
import uuid from 'react-native-uuid';

export default function Home({ setIsUserRecognized, setName, setPlayerId }) {
  const navigation = useNavigation();
  const [localName, setLocalName] = useState('');
  const [playerId, setLocalPlayerId] = useState(''); 
  const [loading, setLoading] = useState(true); 
  const [isUserRecognized, setUserRecognized] = useState(false); 

  useEffect(() => {
    getOrCreateUserId().then((userId) => {
      setLocalPlayerId(userId);
      setPlayerId(userId);
      checkExistingUser(userId);
    });
  }, []);

  async function getOrCreateUserId() {
    let userId = await SecureStore.getItemAsync('user_id');
    if (!userId) {
      userId = uuid.v4();
      await SecureStore.setItemAsync('user_id', userId);
    }
    return userId;
  }

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

  const saveNewPlayer = async (name, userId) => {
    const playerRef = ref(database, `players/${userId}`);
    const snapshot = await get(playerRef);
    const playerData = snapshot.val();

    set(playerRef, {
      ...playerData,
      name: name,
      userId: userId,
      dateJoined: playerData?.dateJoined || new Date().toLocaleDateString(),
    });

    setName(name);
    setPlayerId(userId); 
  };

  const handlePress = () => {
    if (localName.trim() === '') {
      Alert.alert('Name is required', 'Please enter your name.');
    } else if (localName.length < 3 || localName.length > 15) {
      Alert.alert('Name is too short', 'Please enter a name with at least 3 characters and maximum 15 characters.');
    } else {
      setUserRecognized(true);
      setIsUserRecognized(true);
      if (!playerId) {
        const newPlayerId = uuid.v4();
        setLocalPlayerId(newPlayerId);
        setPlayerId(newPlayerId); 
        saveNewPlayer(localName, newPlayerId);
      } else {
        saveNewPlayer(localName, playerId); 
      }
    }
  };

  const handlePlay = () => {
    navigation.navigate('Gameboard', { player: localName, playerId: playerId });
  };

  const handleChangeName = () => {
    setLocalName('');
    setUserRecognized(false);
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
          ) : (
            <View style={styles.homeContainer}>
              {!isUserRecognized ? (  
                <View style={styles.homeContainer}>
                  <Text style={styles.rulesText}>Hi, Stranger! Can you tell your name? </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={'white'}
                    value={localName}
                    onChangeText={(val) => setLocalName(val)}
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
                  <Text style={styles.rulesText}>{rulesTextContent}</Text>
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
          )}
        </View>
      </ImageBackground>
    </ScrollView>
  );
}
