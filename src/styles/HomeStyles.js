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
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '80%',
    maxWidth: 400,
    minHeight: 48,
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: 'BangersRegular',
    fontSize: 20,
    color: '#222',
    backgroundColor: '#f5e9c6',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'orange',
    marginBottom: 18,
    alignSelf: 'center',
    letterSpacing: 1,
  },

  rulesContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.982)',
    borderRadius: 10,
  },
  rulesText: {
    fontSize: 20,
    color: 'gold',
    fontFamily: 'AntonRegular',
    textAlign: 'center',
    marginBottom: 10,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.742)',
  },
  rulesAuxillaryText: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'Roboto',
    textAlign: 'center',
    marginBottom: 20,
  },
  registerImage: {
    width: width * 0.65,
    height: width * 0.65,
    resizeMode: 'contain',
    marginBottom: -20,
  },
  homeButton: {
    backgroundColor: '#eeac1ef5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'orange',
  },
  homeButtonPressed: {
    opacity: 0.8,
  },
  hiThereImage: {
    width: width * 0.65,
    height: width * 0.65,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  },
});

export default styles;