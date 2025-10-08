/**
 * FirstRowStyles.js - Styles for the first row of the Gameboard
 *
 * Contains all style definitions for the first row component, including container, cell, and text styles.
 * All color and font constants are imported from the constants folder for consistency.
 *
 * Usage:
 *   import styles from '../styles/FirstRowStyles';
 *   ...
 *   <View style={styles.firstRowContainer}>...</View>
 *
 * @module styles/FirstRowStyles
 * @author Sabata79
 * @since 2025-09-04
 */

import { Dimensions, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 650;
const isBigScreen = height >= 1050;

const firstRowStyles = StyleSheet.create({

    firstRow: {
        marginTop: isBigScreen ? '30%' : 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 0, // runtime padding applied from RenderFirstRow (safe-area + header height)
        margin: 0,
        zIndex: 10,
    },
    firstRowItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 550,
        zIndex: 10,
    },
    firstRowCategoryText: {
        fontFamily: TYPOGRAPHY.fontFamily.bangers,
        fontSize: TYPOGRAPHY.fontSize.xl,
        color: COLORS.textLight,
        marginVertical: 0,
    },
    firstRowTimerText: {
        fontFamily: TYPOGRAPHY.fontFamily.montserratExtraBold,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.accentLight,
        marginVertical: 5,
    },
});
/**
 * Compute a responsive top padding that reserves space for the absolute header
 * and the device safe-area inset. Call this from components that need to
 * shift content below the header (for example RenderFirstRow).
 *
 * @param {object} insets - result from useSafeAreaInsets(), may be undefined
 * @returns {number} top padding in pixels
 */
export const getFirstRowTopPadding = (insets) => {
    const { width, height } = Dimensions.get('window');
    const isNarrowHeader = width < 360 || height < 650;
    const headerHeight = isNarrowHeader ? 60 : 70;
    const topInset = (insets && typeof insets.top === 'number') ? Math.max(0, insets.top) : 0;
    return headerHeight + topInset;
};

export default firstRowStyles;