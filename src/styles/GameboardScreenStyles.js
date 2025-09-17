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
import { getBreakpoints, makeSizes, pick } from '../utils/breackpoints';

// Compute breakpoints statically for styles
const bp = getBreakpoints();
const S = makeSizes(bp); // e.g., { DIE_SIZE, HEADER_HEIGHT, AVATAR }
const FIELD_W = Math.round(S.DIE_SIZE * 1.9); 
const FACE = Math.round(S.DIE_SIZE * 0.90);

// Preserve original size logic with breakpoint helpers
const GRID_H = pick(bp, 35, 40, 40); // was: isSmallScreen ? 35 : isBigScreen ? 40 : 40
const GRID_W = pick(bp, 35, 40, 60); // was: isSmallScreen ? 35 : isBigScreen ? 60 : 40

const styles = StyleSheet.create({
    // Containers
    gameboardContainer: {
        width: '100%',
        alignSelf: 'center',
    },
    gameboard: {
        flex: 1,
        marginTop: Math.max(8, S.HEADER_HEIGHT - 4),
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 500,
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
        height: S.DIE_SIZE,
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
        height: S.DIE_SIZE,
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
        height: S.DIE_SIZE,
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
        height: GRID_H, // was: isSmallScreen ? 35 : isBigScreen ? 40 : 40
        width: GRID_W,  // was: isSmallScreen ? 35 : isBigScreen ? 60 : 40
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

    diceBorder: {
        width: '92%',
        alignSelf: 'center',
        backgroundColor: '#0a0a0a',
        borderWidth: 2,
        borderColor: '#eee',
        borderRadius: 8,
        paddingHorizontal: bp.isNarrow ? 8 : 12,
        paddingVertical: bp.isNarrow ? 2 : 2,
        minHeight: Math.round(S.DIE_SIZE * 1.6), 
    },
    dieFace: {
        width: FACE,
        height: FACE,
        resizeMode: 'contain'
    },
});

export default styles;
