
/**
 * homeStyles - Styles for the home screen, including overlays, rules, buttons, and images.
 * Used to style the main home screen and its UI elements.
 * @module styles/homeStyles
 * @author Sabata79
 * @since 2025-09-02
 */
import { StyleSheet, Dimensions } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  input: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    width: '80%',
    maxWidth: 400,
    minHeight: 48,
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.accentLight,
    marginBottom: SPACING.lg,
    alignSelf: 'center',
  },
  homeBackground: {
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: 'transparent',
  },
  homeContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  tokenText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.warning,
    textAlign: 'center',
    marginTop: SPACING.xxs,
  },
  homeAuxillaryText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    fontFamily: TYPOGRAPHY.fontFamily.montserratLight,
    textAlign: 'center',
  },
  registerImage: {
    width: width * 0.65,
    height: width * 0.65,
    resizeMode: 'contain',
  },
  homeButtonPressed: {
    opacity: 0.8,
  },
  hiThereImage: {
    position: 'relative',
    zIndex: 0,
    left: 0,
    right: 0,
    top: 10,
    width: width * 0.65,
    height: width * 0.65,
    resizeMode: 'contain',
    opacity: 0.1,
    alignSelf: 'center',
    zIndex: 1,
  },
  energyIcon: {
    marginTop: 4,
    left: -3,
    transform: [{ rotate: '+5deg' }],
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  homeText: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.montserrat,
    marginRight: SPACING.xs,
    zIndex: 1,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});

export default styles;