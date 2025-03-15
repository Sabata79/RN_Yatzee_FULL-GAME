import React from 'react';
import { ScrollView, View, Text, ImageBackground, Image } from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles';
import { rulesTextContent, combinationsData, SCORE_COMPARSION_TEXT } from '../constants/Game';
import { linkingText } from '../constants/AboutContent';
import { navigationImages } from '../constants/NavigationImagePaths';

export default function Rules() {
  return (
    <ScrollView contentContainerStyle={styles.rulesContainer}>
      <ImageBackground
        source={require('../assets/diceBackground.jpg')}
        style={styles.background}
      >
        <View style={styles.overlay}>
          <Image
            source={navigationImages[3].display}
            style={{
              width: 150,
              height: 150,
              alignSelf: 'center',
              marginTop: 20,
              marginBottom: 50,
            }}
          />
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

          <Text style={[styles.rulesText, { fontSize: 20, marginTop: 100, marginBottom: 20 }]}>
            {SCORE_COMPARSION_TEXT.title}
          </Text>
          <Text style={styles.rulesText}>{SCORE_COMPARSION_TEXT.points}</Text>
          <Text style={styles.rulesText}>{SCORE_COMPARSION_TEXT.duration}</Text>
          <Text style={styles.rulesText}>{SCORE_COMPARSION_TEXT.dateTime}</Text>

          {/* Account Linking Help Section */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10 }}>
            <Text
              style={[
                styles.rulesText,
                {
                  fontSize: 22,
                  lineHeight: 26,
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Account Linking Help
            </Text>

            <View style={{ backgroundColor: 'black', padding: 5, borderRadius: 25, marginLeft: -40, marginBottom: 5 }}>
              <FontAwesome5 name="link" size={20} color="gold" />
            </View>
          </View>
          <View style={{ marginTop: 70 }}>
            <Text style={styles.rulesText}>{linkingText}</Text>
          </View>
        </View>
      </ImageBackground>
    </ScrollView>
  );

}
