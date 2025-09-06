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
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { linkingText } from '../constants/AboutContent';

import COLORS from '../constants/colors';
import SPACING from '../constants/spacing';
import TYPOGRAPHY from '../constants/typography';

export default function AccountLinking() {
  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.sectionHeader}>
        <FontAwesome5 name="link" size={20} color={COLORS.warning} />
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
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.warning,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.sm,
  },
  infoText: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
  },
});
