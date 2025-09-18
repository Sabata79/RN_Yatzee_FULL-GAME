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
  TabViewContainer: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
  },
  TabBarStyle: {
    backgroundColor: COLORS.overlayDark,
    marginTop: 0,
    height: 60,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 5,
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
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.warning,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    textAlign: 'center',
    marginBottom: 6,
  },
  combination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor:COLORS.overlayDark,
    padding: SPACING.sm,
    borderRadius: 5,
    justifyContent: 'center',
  },
  combinationText: {
    marginLeft: SPACING.sm,
    flex: 1,
    justifyContent: 'center',
  },
  smallText: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
  },
  description: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
  },
  scoreItem: {
    backgroundColor: COLORS.overlayDark,
    padding: SPACING.md,
    borderRadius: 5,
    marginBottom: SPACING.sm,
  },
  scoreTitle: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    marginBottom: 5,
  },
  scoreDescription: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    lineHeight: 20,
  },

  // Info box styles
  infoBox: {
    backgroundColor: COLORS.overlayDark,
    padding: SPACING.md,
    borderRadius: 5,
    marginBottom: SPACING.sm,
  },
  infoText: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
  },
  infoTitle: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 550,
    borderRadius: 12,
    marginBottom: SPACING.md,
    resizeMode: 'contain',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  bullet: {
    backgroundColor: COLORS.warning,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    color: COLORS.black,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
  },
});

export default gameRulesStyles;
