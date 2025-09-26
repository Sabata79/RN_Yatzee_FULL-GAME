/**
 * GameRules.js - Screen for displaying gameplay rules and combinations
 *
 * Contains the UI and logic for showing the rules and scoring combinations of the game.
 * Uses icons and styled sections for clarity.
 *
 * @module src/screens/helpTabs/GameRules
 * @since 2025-09-06
 */
import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import gameRulesStyles from '../../styles/GameRulesStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { rulesTextContent, combinationsData, SCORE_COMPARSION_TEXT } from '../../constants/Game';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export default function GameRules() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <ScrollView
      contentContainerStyle={[
        gameRulesStyles.container,
        { paddingBottom: insets.bottom + tabBarHeight + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={gameRulesStyles.sectionHeader}>
        <MaterialCommunityIcons
          name="book-open-page-variant-outline"
          size={26}
          color="gold"
        />
        <Text style={gameRulesStyles.sectionTitle}>Gameplay Rules</Text>
      </View>

      <Text style={gameRulesStyles.paragraph}>{rulesTextContent}</Text>

      {/* Combinations Section Title with Icon */}
      <View style={gameRulesStyles.sectionHeader}>
        <Text style={gameRulesStyles.sectionTitle}>Combinations</Text>
      </View>

      {combinationsData.map((combination, index) => (
        <View style={gameRulesStyles.combination} key={index}>
          <View style={gameRulesStyles.combinationText}>
            <Text style={gameRulesStyles.smallText}>{combination.smallText}</Text>
            <Text style={gameRulesStyles.description}>{combination.description}</Text>
          </View>
        </View>
      ))}

      {/* Time bonus / extra notes */}
      <View style={gameRulesStyles.sectionHeader}>
        <Text style={gameRulesStyles.sectionTitle}>Time Bonus</Text>
      </View>

      <View style={[gameRulesStyles.scoreItem, { flexDirection: 'row', alignItems: 'center' }]}
      >
        <Image
          source={require('../../../assets/trafficlights.webp')}
          style={gameRulesStyles.trafficImage}
        />
        <View style={{ flex: 1 }}>
          <View style={gameRulesStyles.bonusRow}>
            <Text style={[gameRulesStyles.bonusText, { color: '#e74c3c' }]}>Red (over 150 sec): -10 pts</Text>
          </View>
          <View style={gameRulesStyles.bonusRow}>
            <Text style={[gameRulesStyles.bonusText, { color: '#f39c12' }]}>Orange (101-150 sec): +0 pts</Text>
          </View>
          <View style={gameRulesStyles.bonusRow}>
            <Text style={[gameRulesStyles.bonusText, { color: '#27ae60' }]}>Green (under 100 sec): +10 pts</Text>
          </View>
        </View>
      </View>

      {/* Scores comparison section */}
      <View style={gameRulesStyles.sectionHeader}>
        <Text style={gameRulesStyles.sectionTitle}>{SCORE_COMPARSION_TEXT.title}</Text>
      </View>

      <View style={gameRulesStyles.scoreItem}>
        <Text style={gameRulesStyles.scoreTitle}>1. Points</Text>
        <Text style={gameRulesStyles.scoreDescription}>{SCORE_COMPARSION_TEXT.points}</Text>
      </View>

      <View style={gameRulesStyles.scoreItem}>
        <Text style={gameRulesStyles.scoreTitle}>2. Duration</Text>
        <Text style={gameRulesStyles.scoreDescription}>{SCORE_COMPARSION_TEXT.duration}</Text>
      </View>

      <View style={gameRulesStyles.scoreItem}>
        <Text style={gameRulesStyles.scoreTitle}>3. Date/Time</Text>
        <Text style={gameRulesStyles.scoreDescription}>{SCORE_COMPARSION_TEXT.dateTime}</Text>
      </View>
    </ScrollView>
  );
}
