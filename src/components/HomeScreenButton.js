import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import styles from '../styles/HomeScreenButtonStyles';


const HomeScreenButton = ({ icon, label, onPress, style, ...props }) => (
  <View style={{ width: '100%', alignItems: 'center', marginBottom: 15 }}>
    <View style={styles.shadowLayer} />
    <TouchableOpacity style={[styles.button, style]} onPress={onPress} {...props}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  </View>
);

export default HomeScreenButton;
