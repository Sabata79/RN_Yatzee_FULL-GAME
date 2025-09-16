// src/styles/GameboardScreenButtonStyles.js
/**
 * GameboardScreenButtonStyles – Responsive styles for GameboardButtons.
 *
 * Usage (responsive):
 *   import { createGameboardButtonStyles } from '@/styles/GameboardScreenButtonStyles';
 *   const { width } = useWindowDimensions();
 *   const gameboardBtnstyles = useMemo(() => createGameboardButtonStyles(width), [width]);
 *
 * Legacy (non-responsive, computed at load):
 *   import gameboardBtnstyles from '@/styles/GameboardScreenButtonStyles';
 *
 * @module styles/GameboardScreenButtonStyles.js
 * @author
 * @since 2025-09-16
 */
import { Dimensions, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export const createGameboardButtonStyles = (
  width = Dimensions.get('window').width
) => {
  // --- Responsive tokens ---
  const containerWidthPct = 0.92;
  const buttonHeight = Math.round(clamp(width * 0.16, 52, 72)); // 16% of width, clamped
  const shadowOffsetX = 4;
  const shadowOffsetY = 3;

  const bubbleSize = Math.round(buttonHeight * 0.62);
  const bubbleBorder = Math.max(2, Math.round(buttonHeight * 0.03));

  const titleFont = Math.round(
    clamp(width * 0.048, TYPOGRAPHY.fontSize.lg, TYPOGRAPHY.fontSize.xl)
  );
  const bubbleTextFont = Math.round(
    clamp(width * 0.06, TYPOGRAPHY.fontSize.lg, TYPOGRAPHY.fontSize.xxl)
  );

  return StyleSheet.create({
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: `${containerWidthPct * 100}%`,
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
      height: buttonHeight,
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
      height: buttonHeight,
    },

    shadowLayer: {
      position: 'absolute',
      top: shadowOffsetY,
      left: shadowOffsetX,
      right: 10,
      width: '100%',
      height: buttonHeight,
      backgroundColor: 'rgba(255,255,255,0.6)',
      borderRadius: 8,
    },

    iconContainer: {
      marginLeft: SPACING.md,
      color: 'black',
    },

    buttonPressed: {
      backgroundColor: COLORS.accentLight,
      transform: [{ translateX: shadowOffsetX }, { translateY: shadowOffsetY }],
    },

    buttonText: {
      color: 'black',
      fontSize: titleFont,
      textAlign: 'center',
      fontFamily: TYPOGRAPHY.fontFamily.bangers,
    },

    nbrThrowsTextContainer: {
      marginLeft: SPACING.md,
    },

    nbrThrowsText: {
      width: bubbleSize,
      height: bubbleSize,
      borderRadius: Math.round(bubbleSize / 2),
      borderWidth: bubbleBorder,
      backgroundColor: COLORS.error,
      alignItems: 'center',
      justifyContent: 'center',
    },

    nbrThrowsTextValue: {
      fontSize: bubbleTextFont,
      fontFamily: TYPOGRAPHY.fontFamily.bangers,
      color: 'black',
      textAlign: 'center',
      lineHeight: Math.round(bubbleTextFont * 1.1),
    },
  });
};

// Legacy default (non-responsive after load). Prefer createGameboardButtonStyles + useWindowDimensions.
export default createGameboardButtonStyles();
