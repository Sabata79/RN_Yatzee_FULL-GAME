/**
 * HomeScreenButtonStyles.js - Styles for the Home screen action buttons
 *
 * Contains all styles for the Home screen action buttons and related elements.
 *
 * Usage:
 *   import homeScreenBtnStyles from '../styles/HomeScreenButtonStyles';
 *   ...
 *   <Pressable style={homeScreenBtnStyles.button}>...</Pressable>
 *
 * Note! All fonts and colors are centralized in the constants folder.
 *
 * @module styles/HomeScreenButtonStyles
 * @author Sabata79
 * @since 2025-09-04
 */

import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accentLight,
    borderWidth: 3,
    borderRadius: 10,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    width: '80%',
    alignSelf: 'center',
    zIndex: 1,
    height: 55,
  },
  buttonPressed: {
    backgroundColor: COLORS.accentLight,
    left: 3,
    top: 4,
  },
  shadowLayer: {
    position: 'absolute',
    top: SPACING.xxs,
    left: '11%',
    width: '80%',
    height: 57,
    backgroundColor: 'rgba(255, 255, 255, 0.635)',
    borderRadius: 10,
    zIndex: 1,
  },
  iconContainer: {
    marginRight: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    color: '#222',
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.xl,
    lineHeight: TYPOGRAPHY.fontSize.xl,
  },
});

export default styles;
