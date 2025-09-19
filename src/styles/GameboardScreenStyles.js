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
import { getBreakpoints, makeSizes, pick } from '../utils/breakpoints';

// Compute breakpoints statically for styles
const bp = getBreakpoints();
const S = makeSizes(bp);
const FIELD_W = Math.round(S.DIE_SIZE * 1.9);
const FACE = Math.round(S.DIE_SIZE * 0.90);
const FIELD_H = Math.round(S.DIE_SIZE * 0.88);
const BORDER_W = bp.isTablet ? 0.8 : bp.isBigScreen ? 2 : 1.5;  // Dice border width
const MARGIN = bp.isTablet ? 0.8 : bp.isBigScreen ? 5 : 4;


// Preserve original size logic with breakpoint helpers
const GRID_H = pick(bp, 35, 40, 40); // was: isSmallScreen ? 35 : isBigScreen ? 40 : 40
const GRID_W = pick(bp, 35, 40, 60); // was: isSmallScreen ? 35 : isBigScreen ? 60 : 40

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
    gameboardContainer: {
        width: '100%',
        alignSelf: 'center',
    },
    gameboard: {
        flex: 1,
        marginTop: Math.max(8, S.HEADER_HEIGHT - 4),
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionContainer: {
        width: 70,
        height: 70,
        marginTop: 90,
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
        width: FIELD_W,
        height: FIELD_H,
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
        width: FIELD_W,
        height: FIELD_H,
        marginRight: 15,
        marginTop: SPACING.xs,
        fontSize: TYPOGRAPHY.fontSize.lg,
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
        height: S.DIE_SIZE,
        width: S.DIE_SIZE,
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
        paddingVertical: 4,
    },
    diceRowContainer: {
        backgroundColor: '#0a0a0a',
        borderRadius: 8,
        paddingHorizontal: 2,
        paddingVertical: 2,
    },

    diceBorder: {
        width: FIELD_W * 4,
        alignSelf: 'center',
        backgroundColor: '#0a0a0a',
        borderWidth: BORDER_W,        // ← tästä säädät kehyksen paksuutta
        borderColor: '#eee',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 2,
    },
    dieFace: {
        width: S.FACE,
        height: S.FACE,
        resizeMode: 'contain'
    },
});

export default styles;
