import React from 'react';
import { ScrollView, View, Text, ImageBackground } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles/styles';
import { rulesTextContent, combinationsData, SCORE_COMPARSION_TEXT } from '../constants/Game';

export default function Rules() {
  return (
    <ScrollView contentContainerStyle={styles.rulesContainer}>
      <ImageBackground
        source={require('../assets/diceBackground.jpg')}
        style={styles.background} 
      >
        <View style={styles.overlay}>
          <MaterialCommunityIcons name="information-variant" size={100} color="white" />
          <Text style={styles.rulesText}>Here are the rules:</Text>
          <Text style={styles.rulesText}>{rulesTextContent}</Text>

          <Text style={[styles.rulesText, { marginTop: 5, fontSize: 25 }]}>Combinations</Text>
          
          {combinationsData.map((combination, index) => (
            <View style={styles.rulesCombination} key={index}>
              <MaterialCommunityIcons name={combination.icon} size={30} color="white" />
              <Text style={styles.smallText}>{combination.smallText}</Text>
              <Text style={styles.rulesCombinationTxt}>{combination.description}</Text>
            </View>
          ))}

          <Text style={[styles.rulesText, { fontSize: 20, marginTop: 100 ,marginBottom: 20}]}>
            {SCORE_COMPARSION_TEXT.title}
          </Text>
          <Text style={styles.rulesText}>{SCORE_COMPARSION_TEXT.points}</Text>
          <Text style={styles.rulesText}>{SCORE_COMPARSION_TEXT.duration}</Text>
          <Text style={styles.rulesText}>{SCORE_COMPARSION_TEXT.dateTime}</Text>

        </View>
      </ImageBackground>
    </ScrollView>
  );
}
