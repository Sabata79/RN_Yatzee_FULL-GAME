/**
 * AboutMeScreenStyles.js - Styles for the AboutMe screen
 *
 * Contains all style definitions for the AboutMe screen, including background, overlays, info boxes, and text styles.
 * All color and font constants should be imported from the constants folder for consistency.
 *
 * Usage:
 *   import styles from '../styles/AboutMeScreenStyles';
 *   ...
 *   <View style={styles.headerInfoBox}>...</View>
 *
 * @module styles/AboutMeScreenStyles
 * @author Sabata79
 * @since 2025-09-06
 */
import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const aboutMeStyles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    maxWidth: 420,
    alignSelf: 'center',
  },
  container: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.warning,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    marginLeft: '10%',
    marginBottom: -50,
  },
  boxTitle: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: COLORS.overlayDark,
    padding: SPACING.md,
    borderRadius: 5,
    marginBottom: SPACING.md,
  },
  infoText: {
    color: 'white',
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: SPACING.lg,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    textAlign: 'center',
    marginBottom: SPACING.xxs,
  },
  linkText: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.fontSize.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.montserratMedium,
    backgroundColor: COLORS.overlayExtraDark,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  footer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.xxs,
    color: COLORS.textLight,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
  },
  headerInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.overlayDark,
    padding: SPACING.md,
    borderRadius: 5,
    marginBottom: SPACING.md,
  },
  profileImageLarge: {
    width: 90,
    height: 90,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
    marginRight: SPACING.md,
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerSubtitle: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.montserratLight,
  },
});

export default aboutMeStyles;
