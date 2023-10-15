import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import { useNavigation } from '@react-navigation/native';
import { rulesTextContent ,combinationsData } from '../constants/Game';

export default function Home() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [showRules, setShowRules] = useState(false);

  const handlePress = () => {
    if (name.trim() === '') {
      Alert.alert('Name is required', 'Please enter your name.');
    } else if (name.length < 3) {
      Alert.alert('Name is too short', 'Please enter a name with at least 3 characters.');
    } else if (/\d/.test(name) || /[!@#$%^&*(),.?":{}|<>]/.test(name)) {
      Alert.alert('Invalid characters', 'Please enter a name without numbers or special characters.');
    } else {
      setShowRules(true);
    }
  };

  const handlePlay = () => {
    navigation.navigate('Gameboard', { player: name});
  };

  const handleChangeName = () => {
    setName(''); // Resetoi nimen
    setShowRules(false);
  };

 return (
    <ScrollView contentContainerStyle={styles.container}>
      {!showRules && (
        <View style={styles.homeContainer}>
          <Text style={styles.rulesText}>Hi, Stranger! Can you tell your name? </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            onChangeText={(val) => setName(val)}
            autoFocus={true}
          />
          <Pressable
            style={({ pressed }) => [styles.homeButton, pressed && styles.homeButtonPressedbuttonPressed]}
            onPress={handlePress}
          >
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      )}
      {showRules && (
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
    </ScrollView>
  );
}