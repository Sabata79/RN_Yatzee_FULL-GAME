import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import { useNavigation } from '@react-navigation/native';

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
          <Pressable style={({ pressed }) => [
            styles.homeButton,
            pressed && styles.homeButtonPressedbuttonPressed,
          ]} onPress={handlePress}>
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      )}
      {showRules && (
        <ScrollView contentContainerStyle={styles.rulesContainer}>
          <MaterialCommunityIcons name="information" size={50} color="white" />
          <Text style={styles.rulesText}>Hello, {name}!</Text>
          <Text style={styles.rulesText}>Here are the rules:</Text>
          <Text style={styles.rulesText}>
            Score as many points as possible{'\n'}
            by rolling dice to reach the 13 combinations{'\n'}
            predefined in the game.{'\n'}
            {'\n'}
            Dice can be rolled up to three{'\n'}
            times in a turn to make one of the{'\n'}
            possible scoring combinations.{'\n'}
            {'\n'}
            A game consists of rounds during which{'\n'}
            the player chooses which scoring{'\n'}
            combination is to be used in that round.{'\n'}
            Once a combination has been used in the{'\n'}
            game, it cannot be used again.{'\n'}
            {'\n'}
            You can select dice after your first or{'\n'}
            second roll, and you must score after{'\n'}
            your third roll. After the first and{'\n'}
            second roll you can save the dice by{'\n'}
            clicking on them or throw them in the{'\n'}
            spots. Dice that are set aside from the{'\n'}
            previous rolls can be taken out{'\n'}
            and re-rolled.{'\n'}
            {'\n'}
            When you want to record a{'\n'}
            combination in the scoreboard, click{'\n'}
            on the cell next to the combination{'\n'}
            and then press the play button.{'\n'}
            {'\n'}
            When you reach at least 63 in{'\n'}
            minor part of the scoreboard,{'\n'}
            you unlock as 35 bonus points.{'\n'}
            {'\n'}
            You have a Yatzy when you get 5 dice with{'\n'}
            the same side and it is worth 50 points. If{'\n'}
            you get another yatzy after that, it still{'\n'}
            gives you a bonus of 50 points whatever the{'\n'}
            combination you chose.{'\n'}
            {'\n'}
            The game ends when all categories have{'\n'}
            been scored.
          </Text>
          <Text style={[styles.text, { marginTop: 30 }]}>Combinations</Text>
          <View style={styles.rulesCombination}>
            <MaterialCommunityIcons name="dice-1" size={50} color="white" />
            <MaterialCommunityIcons name="arrow-right-bold" size={20} color="white" />
            <MaterialCommunityIcons name="dice-6" size={50} color="white" />
            <Text style={styles.rulesCombinationTxt}>
              Get the maximum of dice whit this{'\n'}
              side. It scores the sum of these{'\n'}
              specific dice only.</Text>
          </View>
          <View style={styles.rulesCombination}>
            <Text style={[styles.gridTxt, { marginLeft: 7 }]}>3X</Text>
            <Text style={{ marginLeft: 11, marginRight: 11, color: 'white' }}>&</Text>
            <Text style={[styles.gridTxt, {}]}>4X</Text>
            <Text style={styles.rulesCombinationTxt}>
              Three of a kind & Four of a kind.{'\n'}
              It scores the sum of all the dice.
            </Text>
          </View>
          <View style={styles.rulesCombination}>
            <MaterialCommunityIcons name="home" size={45} color="white" style={{ marginLeft: 5 }} />
            <Text style={styles.rulesCombinationTxt}>
              Fullhouse. Three of kind & pair | 25 points.
            </Text>
          </View>
          <View style={styles.rulesCombination}>
            <MaterialCommunityIcons name="cards-outline" size={30} color="white" style={{ marginLeft: 5 }} />
            <Text style={{ fontSize: 10, color: 'white' }}>small</Text>
            <Text style={styles.rulesCombinationTxt}>
              Small straight.{'\n'}
              4 concutive dice | 30 points.
            </Text>
          </View>
          <View style={styles.rulesCombination}>
            <MaterialCommunityIcons name="cards-outline" size={30} color="white" style={{ marginLeft: 5 }} />
            <Text style={{ fontSize: 10, color: 'white' }}>large</Text>
            <Text style={styles.rulesCombinationTxt}>
              Large straight.{'\n'}
              1-2-3-4-5 or 2-3-4-5-6 | 40 points.
            </Text>
          </View>
          <View style={styles.rulesCombination}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', marginLeft: 5 }}>Yatzy</Text>
            <Text style={styles.rulesCombinationTxt}>
              Yatzy.{'\n'}
              All dice with the same side | 50 points.
            </Text>
          </View>
          <View style={styles.rulesCombination}>
            <MaterialCommunityIcons name="account-question-outline" size={30} color="white" style={{ marginLeft: 5 }} />
            <Text style={{ fontSize: 10, color: 'white' }}>Change</Text>
            <Text style={styles.rulesCombinationTxt}>
              Change.{'\n'}
              Scores the sum of all dice.
            </Text>
          </View>
          <View style={styles.diceContainer}>
            <Pressable style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
              onPress={handleChangeName}>
              <Text style={[styles.buttonText, {fontSize: 18}]}>Change name</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
              onPress={handlePlay}>
              <Text style={styles.buttonText}>PLAY</Text>
              <MaterialCommunityIcons name="play" size={30} color="black" />
            </Pressable>
          </View>
        </ScrollView>
      )}
    </ScrollView>
  );
}