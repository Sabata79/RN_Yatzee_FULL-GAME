import React from 'react';
import { ScrollView, View, Text, Image, ImageBackground } from 'react-native';
import { aboutTextContent, aboutTitle, aboutFeatures } from '../constants/AboutContent';
import styles from '../styles/styles';

export default function AboutMe() {
  return (
     <ImageBackground
      source={require('../assets/diceBackground.jpg')}
      style={styles.background}>
  <View style={styles.overlay}>
    <ScrollView contentContainerStyle={styles.aboutContainer}>
      <View style={styles.headerContainer}
      >
        <Image 
          source={require('../assets/profile.jpg')} 
          style={styles.profileImage} 
        />
        <Text style={styles.aboutTitle}>
          {aboutTitle}
        </Text>
      </View>
      <Text style={styles.aboutText}>
        {aboutTextContent}
      </Text>
      <Text style={styles.aboutFeatureText}>
        {aboutFeatures}
      </Text>
    </ScrollView>
  </View>
  </ImageBackground>
  );
}
