/**
 * GameboardScreenButtonStyles – Styles for GameboardButtons.
 *
 * Usage:
 *   import gameboardBtnstyles from '@/styles/GameboardScreenButtonStyles';
 *
 * Notes:
 * - `buttonGhost`/`invisible` keep footer width and spacing when rounds <= 0.
 * - `minHeight` on container prevents layout collapse during state transitions.
 *
 * @module styles/GameboardScreenButtonStyles.js
 * @author Sabata79
 * @since 2025-09-16
 */
import { Dimensions, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 650;

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '92%',
    alignSelf: 'center',
    paddingVertical: 8,
  },

  buttonWrapper: {
    width: '48%',
    alignItems: 'center',
    position: 'relative',
    marginVertical: SPACING.sm,
  },

  // Ghost button to keep layout intact when rounds <= 0
  buttonGhost: {
    width: '48%',
    height: isSmallScreen ? 60 : 64,
    marginVertical: SPACING.sm,
  },

  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accentLight,
    borderWidth: 2,
    borderRadius: 8,
    width: '100%',
    height: isSmallScreen ? 60 : 64,
  },

  shadowLayer: {
    position: 'absolute',
    top: 3,
    left: 4,
    right: 10,
    width: '100%',
    height: isSmallScreen ? 60 : 64,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
  },

  iconContainer: {
    marginLeft: SPACING.md,
    color: 'black',
  },

  buttonPressed: {
    backgroundColor: COLORS.accentLight,
    transform: [{ translateX: 4 }, { translateY: 3 }],
  },

  buttonText: {
    color: 'black',
    fontSize: TYPOGRAPHY.fontSize.lg,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
  },

  nbrThrowsTextContainer: {
    marginLeft: SPACING.md,
  },

  nbrThrowsText: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nbrThrowsTextValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    color: 'black',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default styles;
