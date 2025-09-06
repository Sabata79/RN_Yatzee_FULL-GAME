/**
 * AccountLinking.js - Screen for displaying account linking information
 *
 * Contains the UI and logic for showing information and instructions for linking a user account.
 *
 * Usage:
 *   import AccountLinking from './AccountLinking';
 *   ...
 *   <AccountLinking />
 *
 * @module screens/AccountLinking
 * @author Sabata79
 * @since 2025-09-06
 */
import { ScrollView, View, Text } from 'react-native';
import gameRulesStyles from '../styles/GameRulesStyles';
import { FontAwesome5 } from '@expo/vector-icons';
import { linkingText } from '../constants/AboutContent';

import COLORS from '../constants/colors';

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


