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

export default firstRowStyles = StyleSheet.create({

    firstRow: {
        marginTop: isBigScreen ? '30%' : 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0,
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
        fontFamily: TYPOGRAPHY.fontFamily.montserratExtraBold,
        fontSize: TYPOGRAPHY.fontSize.lg,
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