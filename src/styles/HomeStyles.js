/**
 * homeStyles - Styles for the home screen, including overlays, rules, buttons, and images.
 * Used to style the main home screen and its UI elements.
 * JSDoc comments and inline code comments must always be in English.
 * @module styles/homeStyles
 */
import { StyleSheet, Dimensions } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Only home-specific styles left here
  input: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    width: '80%',
    maxWidth: 400,
    minHeight: 48,
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: 'BangersRegular',
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'orange',
    marginBottom: SPACING.lg,
    alignSelf: 'center',
    letterSpacing: 1,
  },
  homeBackground: {
    flex: 1, 
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#000000',
  },
  homeContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.982)',
    borderRadius: 10,
  },
  homeText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: 'gold',
    marginBottom: SPACING.xxs,
    textAlign: 'center',
    width: '80%',
    zIndex: 1,
  },
  homeAuxillaryText: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'Roboto',
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
    top: SPACING.sm,
    width: width * 0.65,
    height: width * 0.65,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  },
});

export default styles;