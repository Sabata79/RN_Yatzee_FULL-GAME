import React from 'react';
import { Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles.js';

export default function Header({ isUserRecognized }) {
  // Debugging: Tarkkaile isUserRecognized arvoa
  console.log('Header - isUserRecognized:', isUserRecognized);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>
        Yatzy
        <FontAwesome5 name="dice" size={35} color="black" />
      </Text>
      {/* Näytetään käyttäjäikoni, jos käyttäjä on tunnistettu */}
      {isUserRecognized && (
        <FontAwesome5
          name="user"
          size={30}
          color="black"
          style={styles.userIcon}  // Käytetään uutta tyyliä oikeanpuoleiselle ikonille
        />
      )}
    </View>
  );
}