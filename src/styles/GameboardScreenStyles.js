/**
 * GameboardScreenStyles.js - Styles for the Gameboard screen only
 *
 * Breakpoint-aware: uses src/utils/breakpoints to compute sizes once at import time.
 * If you need rotation-reactive styles, convert this file into a factory
 * (export default bp => StyleSheet.create(...)) and pass useBreakpoints() from the component.
 *
 * @module styles/GameboardScreenStyles
 * @author Sabata79
 * @since 2025-09-04 (breakpoints integration 2025-09-17)
 */

import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import SPACING from '../constants/spacing';
import TYPOGRAPHY from '../constants/typography';
import { getBreakpoints, makeSizes } from '../utils/breakpoints';

// Compute breakpoints statically for styles
const bp = getBreakpoints();
const S = makeSizes(bp);
const FIELD_W = bp.isTablet ? 200 : bp.isBigScreen ? 80 : 80; // Score field width
const FIELD_H = bp.isTablet ? 60 : bp.isBigScreen ? 40 : 40; // Score field height
const BORDER_W = bp.isTablet ? 4 : bp.isBigScreen ? 2 : 1.5;  // Dice border width
const BORDER_WIDTH = bp.isTablet ? "65%" : bp.isBigScreen ? "92%" : "92%";  // Dice border width
const MARGIN = bp.isTablet ? 20 : bp.isBigScreen ? 7 : 7; // Margin for dice grid items
const ICON_SIZE = bp.isTablet ? 60 : bp.isBigScreen ? 45 : 40; // Icon size in Gameboard
const MARGINTOP = bp.isTablet ? -150 : bp.isBigScreen ? -8 : 6; // Margin top for dice row
const SECTIONCONTAINER = bp.isTablet ? 100 : bp.isBigScreen ? 90 : 80; // Section container size
const FONTSIZE = bp.isTablet ? 22 : bp.isBigScreen ? 15 : 13; // Font size for score text
const DIEFACE_MARGINBOTTOM = bp.isTablet ? 15 : bp.isBigScreen ? 2 : 2; // Die face margin bottom
const FOOTERWRAP_PADDINGVERTICAL = bp.isTablet ? 100 : bp.isBigScreen ? 0 : -2; // Footer wrap vertical padding


const styles = StyleSheet.create({
    // Containers
    centerHost: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: COLORS.overlayDark,
        width: '100%',
    },
    list: {
    marginTop: MARGINTOP,
    },
    gameboardContainer: {
        width: '100%',
        alignSelf: 'center',      
    },
    gameboard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionContainer: {
        width: SECTIONCONTAINER,
        height: SECTIONCONTAINER,
        marginTop: 90,
        marginLeft: 30, 
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.sm,
        borderRadius: SECTIONCONTAINER / 2,
        borderWidth: 1,
        borderColor: 'white',
        backgroundColor: COLORS.backgroundGray,
    },
    sectionContainerAchieved: {
        width: SECTIONCONTAINER,
        height: SECTIONCONTAINER,
        marginTop: 90,
        marginLeft: 30,
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
        width: FIELD_W,
        height: FIELD_H,
        marginRight: SPACING.md,
        marginTop: SPACING.xs,
        fontSize: FONTSIZE,
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
        width: FIELD_W,
        height: FIELD_H,
        marginRight: SPACING.md,
        marginTop: SPACING.xs,
        fontSize: FONTSIZE,
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
        width: FIELD_W,
        height: FIELD_H,
        marginRight: 15,
        marginTop: SPACING.xs,
        fontSize: FONTSIZE,
        textAlign: 'center',
        borderWidth: 2,
        borderColor: 'green',
        borderRadius: 10,
        backgroundColor: COLORS.success,
    },

    // Dice grid item (uses breakpoint DIE_SIZE)
    item: {
        flex: 1,
        width: S.DIE_SIZE,
        height: S.DIE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: MARGIN,
    },

    // Text styles
    sectionBonusTxt: {
        fontSize: FONTSIZE,
        textAlign: 'center',
        color: COLORS.textDark,
        fontFamily: TYPOGRAPHY.fontFamily.bangers,
    },
    inputIndexShown: {
        fontSize: FONTSIZE * 1.2,
        fontFamily: TYPOGRAPHY.fontFamily.montserratExtraBold,
        color: COLORS.textDark,
        textAlign: 'center',
        textAlignVertical: 'center',
        lineHeight: FONTSIZE * 1.2,
    },
    gridTxt: {
        height: ICON_SIZE,
        width: ICON_SIZE,
        fontFamily: TYPOGRAPHY.fontFamily.bangers,
        color: COLORS.textDark,
        fontSize: FONTSIZE * 1.2,
        textAlign: 'center',
        padding: SPACING.xs,
        marginTop: -5,                    //tähän säätö
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
        paddingVertical: FOOTERWRAP_PADDINGVERTICAL, // tähän säätö
    },
    diceRowContainer: {
        backgroundColor: '#0a0a0a',
        borderRadius: 8,
        paddingHorizontal: 0,
        paddingVertical: 2,
    },
    diceBorder: {
        // Scale the dice border relative to the die size so it remains
        // visually consistent across small phones and tablets.
        width: Math.round(S.DIE_SIZE * 1.15),
        alignSelf: 'center',
        backgroundColor: '#0a0a0a',
        borderWidth: BORDER_W,
        borderColor: '#eee',
        borderRadius: Math.round(S.DIE_SIZE * 0.18),
        paddingHorizontal: Math.max(4, Math.round(S.DIE_SIZE * 0.12)),
        paddingVertical: Math.max(2, Math.round(S.DIE_SIZE * 0.04)),
    },
    dieFace: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        marginBottom: DIEFACE_MARGINBOTTOM,
        resizeMode: 'contain'
    },
});

/**
 * computeGameboardVars(bp) — helper that returns the same responsive
 * constants used by the static styles above but computed at runtime from
 * a breakpoints object. Use this when you want rotation- or dimension-aware
 * styles from a component (pass useBreakpoints() or getBreakpoints()).
 *
 * This helper is intentionally additive and does not replace the default
 * static `styles` export to avoid breaking existing imports.
 * @param {object} bp breakpoints object (from getBreakpoints or hook)
 */
export const computeGameboardVars = (bp) => {
    const S = makeSizes(bp);
    return {
        S,
        FIELD_W: bp.isTablet ? 200 : bp.isBigScreen ? 80 : 80,
        FIELD_H: bp.isTablet ? 60 : bp.isBigScreen ? 40 : 40,
        BORDER_W: bp.isTablet ? 4 : bp.isBigScreen ? 2 : 1.5,
        // BORDER_WIDTH historically used a percent string; provide numeric fallback
        BORDER_WIDTH: bp.isTablet ? '65%' : bp.isBigScreen ? '92%' : '92%',
        MARGIN: bp.isTablet ? 20 : bp.isBigScreen ? 7 : 7,
        ICON_SIZE: bp.isTablet ? 60 : bp.isBigScreen ? 45 : 40,
        MARGINTOP: bp.isTablet ? -150 : bp.isBigScreen ? -8 : 6,
        SECTIONCONTAINER: bp.isTablet ? 100 : bp.isBigScreen ? 90 : 80,
        FONTSIZE: bp.isTablet ? 22 : bp.isBigScreen ? 15 : 13,
        DIEFACE_MARGINBOTTOM: bp.isTablet ? 15 : bp.isBigScreen ? 2 : 2,
        FOOTERWRAP_PADDINGVERTICAL: bp.isTablet ? 100 : bp.isBigScreen ? 0 : -2,
    };
};

export default styles;
