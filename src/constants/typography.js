/**
 * typography.js - Global typography settings for RN_Yatzee_FULL-GAME
 *
 * Centralizes all main font and typography definitions for easy style management and consistency.
 *
 * Fonts:
 * - AntonRegular: For headings and highlights
 * - BangersRegular: Playful, comic-style font for buttons
 * -  MontserratBlack: Versatile main font, all weights available
 *
 * Usage:
 *  import TYPOGRAPHY from '../constants/typography';
 *  ...
 *  style={{ fontFamily: TYPOGRAPHY.fontFamily.montserratBold, fontSize: TYPOGRAPHY.fontSize.lg }}
 *
 * Note! With custom fonts, fontWeight does not work—always use the correct fontFamily value directly.
 *
 * @author Sabata79
 * @since 2025-09-02
 */

export const TYPOGRAPHY = {
  fontFamily: {
    system: 'System',
    anton: 'AntonRegular',
    bangers: 'BangersRegular',
    montserratThin: 'MontserratThin',
    montserratExtraLight: 'MontserratExtraLight',
    montserratLight: 'MontserratLight',
    montserratRegular: 'MontserratRegular',
    montserratMedium: 'MontserratMedium',
    montserratSemiBold: 'MontserratSemiBold',
    montserratBold: 'MontserratBold',
    montserratExtraBold: 'MontserratExtraBold',
    montserratBlack: 'MontserratBlack',
  },
  fontSize: {
    xxxs: 8,
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    jumbo: 50,
  },
};

export default TYPOGRAPHY;
