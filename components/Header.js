import React from 'react';
import { Text, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles.js';

export default function Header({ isUserRecognized }) {
  // console.log('Header - isUserRecognized:', isUserRecognized);

  return (
    <View style={styles.header}>
      <Text style={styles.title}>
        Yatzy
        <FontAwesome5 name="dice" size={35} color="black" />
      </Text>
      {isUserRecognized && (
        <FontAwesome5
          name="user"
          size={30}
          color="black"
          style={styles.userIcon}
        />
      )}
    </View>
  );
}