/**
 * GameRulesStyles.js - Styles for the GameRules view
 *
 * Contains all style definitions for the GameRules view.
 *
 * @module styles/GameRulesStyles
 * @author Sabata79
 * @since 2025-09-06
 */
import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import SPACING from '../constants/spacing';
import TYPOGRAPHY from '../constants/typography';

const gameRulesStyles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: -20,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    textAlign: 'center',
  },
  paragraph: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 22,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    backgroundColor: COLORS.overlayDark,
    padding: SPACING.sm,
    borderRadius: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: 30,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 20,
    color: COLORS.warning,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    textAlign: 'center',
  },
  combination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor:COLORS.overlayDark,
    padding: SPACING.sm,
    borderRadius: 10,
    justifyContent: 'center',
  },
  combinationText: {
    marginLeft: SPACING.sm,
    flex: 1,
    justifyContent: 'center',
  },
  smallText: {
    color: COLORS.warning,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
  },
  description: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
  },
  scoreItem: {
    backgroundColor: COLORS.overlayDark,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.sm,
  },
  scoreTitle: {
    color: COLORS.warning,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    marginBottom: 5,
  },
  scoreDescription: {
    color: COLORS.textLight,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    lineHeight: 20,
  },
});

export default gameRulesStyles;
