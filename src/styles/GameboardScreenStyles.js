/**
 * GameboardScreenStyles.js - Styles for the Gameboard screen only
 *
 * Contains all style definitions for the Gameboard screen, including containers, score fields,
 * section bonuses, dice area, overlays, and text styles. All color and font constants are imported
 * from the constants folder for consistency.
 *
 * Usage:
 *   import styles from '../styles/GameboardScreenStyles';
 *   ...
 *   <View style={styles.gameboardContainer}>...</View>
 *
 *
 * @module styles/GameboardScreenStyles
 * @author Sabata79
 * @since 2025-09-04
 */

import { StyleSheet, Dimensions } from 'react-native';
import COLORS from '../constants/colors';
import SPACING from '../constants/spacing';
import TYPOGRAPHY from '../constants/typography';
const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 650;
const isBigScreen = height >= 1050;
const isNarrow = width < 360;

const styles = StyleSheet.create({
    // Containers
    gameboardContainer: {
        width: '100%',
        alignSelf: 'center',
    },
    gameboard: {
        flex: 1,
        marginTop: 90,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 500,
    },
    sectionContainer: {
        width: 70,
        height: 70,
        marginTop: 50,
        marginLeft: 30,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.sm,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'white',
        backgroundColor: COLORS.backgroundGray,
    },
    sectionContainerAchieved: {
        width: 72,
        height: 72,
        marginTop: 40,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
        borderRadius: 100,
        borderWidth: 3,
        borderColor: COLORS.secondaryDark,
        backgroundColor: COLORS.success,
    },
    filterLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.overlayDark,
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        paddingBottom: '25%',
    },

    // Score fields
    selectScore: {
        flex: 1,
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.overlayLight,
        width: 80,
        marginRight: SPACING.md,
        marginTop: SPACING.xs,
        fontSize: TYPOGRAPHY.fontSize.lg,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: COLORS.white,
        borderRadius: 10,
        backgroundColor: COLORS.backgroundGray,
    },
    selectScorePressed: {
        flex: 1,
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.black,
        width: 80,
        marginRight: SPACING.md,
        marginTop: SPACING.xs,
        fontSize: TYPOGRAPHY.fontSize.lg,
        textAlign: 'center',
        borderWidth: 2,
        borderColor: COLORS.error,
        borderRadius: 10,
        backgroundColor: COLORS.accentDark,
    },
    lockedField: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        color: COLORS.black,
        width: 80,
        marginRight: 15,
        marginTop: SPACING.xs,
        fontSize: TYPOGRAPHY.fontSize.lg,
        textAlign: 'center',
        borderWidth: 2,
        borderColor: 'green',
        borderRadius: 10,
        backgroundColor: COLORS.success,
    },
    item: {
        flex: 1,
        height: isSmallScreen ? 35 : isBigScreen ? 60 : 40,
        width: isSmallScreen ? 35 : isBigScreen ? 60 : 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.sm,
    },

    // Text styles
    sectionBonusTxt: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        textAlign: 'center',
        color: COLORS.textDark,
        fontFamily: TYPOGRAPHY.fontFamily.bangers,
    },
    inputIndexShown: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontFamily: TYPOGRAPHY.fontFamily.montserratExtraBold,
        color: COLORS.textDark,
        textAlign: 'center',
        textAlignVertical: 'center',
        lineHeight: TYPOGRAPHY.fontSize.lg,
    },
    gridTxt: {
        height: isSmallScreen ? 35 : isBigScreen ? 40 : 40,
        width: isSmallScreen ? 35 : isBigScreen ? 60 : 40,
        fontFamily: TYPOGRAPHY.fontFamily.bangers,
        color: COLORS.textDark,
        fontSize: TYPOGRAPHY.fontSize.md,
        textAlign: 'center',
        padding: SPACING.xs,
        marginTop: -2,
        borderColor: COLORS.backgroundDark,
        borderRadius: 5,
        backgroundColor: COLORS.backgroundDark,
    },
    scoreText: {
        color: COLORS.textLight,
        fontFamily: TYPOGRAPHY.fontFamily.montserratExtraBold,
        fontSize: TYPOGRAPHY.fontSize.md,
        paddingRight: 15,
    },
    icon: {
        justifyContent: 'center',
        alignItems: 'center',
        color: COLORS.textLight,
        marginTop: SPACING.xxs,
    },
    footerWrap: {
        alignItems: 'center',
        paddingVertical: 8,
        // IMPORTANT: do NOT put flex:1 here
    },

    diceBorder: {
        width: '92%',                  // prosentilla -> skaalaa leveys
        alignSelf: 'center',
        backgroundColor: '#0a0a0a',    // boksin tausta
        borderWidth: 2,
        borderColor: '#eee',           // valkoinen kehys
        borderRadius: 8,
        paddingHorizontal: isNarrow ? 8 : 12,
        paddingVertical: isNarrow ? 2 : 2,
        minHeight: 68, // varmistaa ettei romahda kapeilla näytöillä
    },
});

export default styles;
