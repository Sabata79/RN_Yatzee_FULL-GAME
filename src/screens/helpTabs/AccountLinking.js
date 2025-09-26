/**
 * AccountLinking.js — Account linking help screen (original style)
 * Shows instructions and short help text for linking accounts.
 * @module src/screens/helpTabs/AccountLinking
 * @since 2025-09-06
 */
import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import gameRulesStyles from '../../styles/GameRulesStyles';
import { FontAwesome5 } from '@expo/vector-icons';
import { linkingText } from '../../constants/AboutContent';
import COLORS from '../../constants/colors';

export default function AccountLinking() {
  return (
    <ScrollView contentContainerStyle={gameRulesStyles.container}>
      <View style={gameRulesStyles.sectionHeader}>
        <FontAwesome5 name="link" size={20} color={COLORS.warning} />
        <Text style={gameRulesStyles.sectionTitle}>Account Linking</Text>
      </View>

      <View style={gameRulesStyles.infoBox}>
        <Text style={gameRulesStyles.infoText}>{linkingText}</Text>
      </View>
    </ScrollView>
  );
}
