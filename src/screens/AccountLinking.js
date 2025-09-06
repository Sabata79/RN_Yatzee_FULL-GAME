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
// Account linking info screen component
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { linkingText } from '../constants/AboutContent';

export default function AccountLinking() {
  return (
    // Scrollable view for account linking info
    <ScrollView contentContainerStyle={styles.container}>
      
      <View style={styles.sectionHeader}>
        <FontAwesome5 name="link" size={24} color="gold" />
        <Text style={styles.sectionTitle}>Account Linking</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>{linkingText}</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    color: 'gold',
    fontFamily: 'AntonRegular',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
});
