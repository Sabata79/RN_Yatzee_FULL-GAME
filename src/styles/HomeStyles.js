/**
 * homeStyles - Styles for the home screen, including overlays, rules, buttons, and images.
 * Uses breakpoints/makeSizes for consistent responsive scaling across devices.
 * @module styles/homeStyles
 * @author Sabata79
 * @since 2025-09-02
 */

import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';
import { getBreakpoints, makeSizes, clamp, pick } from '../utils/breakpoints';

const BP = getBreakpoints();
const S = makeSizes(BP);
const isSmallishPhone = BP.shortest <= 375;

// Hero/register image size
const IMG_SIDE = clamp(
  Math.round(
    BP.shortest * (
      BP.isTablet ? 0.55 :
        isSmallishPhone ? 0.7 : 
          BP.isNarrow ? 0.60 :
            0.62
    )
  ),
  220,
  520
);

// Input min-height skaalattuna, mutta rajattu järkeviin rajoihin
const INPUT_HEIGHT = clamp(Math.round(S.DIE_SIZE + 10), 44, 56);

// Energiakuvakkeelle kevyt skaala
const ENERGY_OFFSET_TOP = 4;
const ENERGY_ROTATE_DEG = '5deg';

const styles = StyleSheet.create({
  input: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    width: '80%',
    maxWidth: 400,
    minHeight: INPUT_HEIGHT,
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

  overlayTransparent: {
    flex: 1,
    backgroundColor: 'red', // debug overlay; vaihda tai poista kun et enää tarvitse
    justifyContent: 'center',
    alignItems: 'center',
  },

  homeContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 10,
    marginTop: 10,
  },

  tokenText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: pick(BP, TYPOGRAPHY.fontSize.md, TYPOGRAPHY.fontSize.lg, TYPOGRAPHY.fontSize.lg),
    color: COLORS.warning,
    textAlign: 'center',
    marginTop: SPACING.xxs,
  },

  homeAuxillaryText: {
    fontSize: pick(BP, TYPOGRAPHY.fontSize.xs, TYPOGRAPHY.fontSize.sm, TYPOGRAPHY.fontSize.md),
    color: COLORS.textLight,
    fontFamily: TYPOGRAPHY.fontFamily.montserratLight,
    textAlign: 'center',
  },

  registerImage: {
    position: 'relative',
    left: 0,
    right: 0,
    top: 43,
    width: IMG_SIDE,
    height: IMG_SIDE,
    resizeMode: 'contain',
    alignSelf: 'center',
  },

  hiThereImage: {
    position: 'relative',
    left: 0,
    right: 0,
    top: 43,
    width: IMG_SIDE,
    height: IMG_SIDE,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  homeButtonPressed: {
    opacity: 0.8,
  },

  energyIcon: {
    marginTop: ENERGY_OFFSET_TOP,
    left: -3,
    transform: [{ rotate: ENERGY_ROTATE_DEG }],
  },

  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },

  homeText: {
    color: COLORS.textLight,
    fontSize: pick(BP, TYPOGRAPHY.fontSize.md, TYPOGRAPHY.fontSize.lg, TYPOGRAPHY.fontSize.lg),
    fontFamily: TYPOGRAPHY.fontFamily.montserrat,
    marginRight: SPACING.xs,
    zIndex: 1,
  },
});

export default styles;
