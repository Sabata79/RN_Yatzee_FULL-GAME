/**
 * ScoreboardScreenStyles.js - Styles for the Scoreboard screen only
 *
 * Contains all style definitions for the Scoreboard screen, including containers, scoreboard, tabs,
 * player row, medals, avatar, and text styles. All color and font constants are imported
 * from the constants folder for consistency.
 *
 * Usage:
 *   import styles from '../styles/ScoreboardScreenStyles';
 *   ...
 *   <View style={styles.container}>...</View>
 *
 * @module styles/ScoreboardScreenStyles
 * @author Sabata79
 * @since 2025-09-05
 */
import { StyleSheet, Dimensions } from 'react-native';
import COLORS from '../constants/colors';
import SPACING from '../constants/spacing';
import TYPOGRAPHY from '../constants/typography';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 650;
const isNarrowScreen = width < 380;
const isBigScreen = height >= 1050;

const scoreboardStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: COLORS.overlayExtraDark,
    },
    background: {
        flex: 1,
        justifyContent: 'flex-start',
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    scoreboardContainer: {
        alignSelf: 'center',
        marginTop: SPACING.xs,
        borderRadiusBottom: 5,
        backgroundColor: COLORS.overlayDark,
        width: '100%',
        textAlign: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    scoreboardText: {
        fontSize: TYPOGRAPHY.sm,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        color: COLORS.textLight,
        paddingVertical: 5,
        lineHeight: 60,
    },
    scoreboardHeader: {
        flex: 1,
        fontSize: TYPOGRAPHY.sm,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        color: COLORS.textLight,
        paddingVertical: 5,
    },
    headerSubtitle: {
        fontFamily: TYPOGRAPHY.fontFamily.montserratThin,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textLight,
        textAlign: 'center',
    },
    tabContainer: {
        backgroundColor: COLORS.overlayDark,
        marginTop: 0,
        height: 60,
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabText: {
        fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        textAlign: 'center',
        height: 35,
    },
    activeTab: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.accent,
    },
    inactiveTab: {
        flex: 1,
    },
    tabTextActive: {
        color: COLORS.white,
    },
    tabTextInactive: {
        color: COLORS.disabled,
    },
    rankHeaderCell: {
        flex: 0.9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerHeaderCell: {
        flex: 2.6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    durationHeaderCell: {
        flex: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    pointsHeaderCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    presenceHeaderCell: {
        flex: 0.4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankCell: {
        flex: 0.9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    medal: {
        width: isSmallScreen ? 35 : 40,
        height: isSmallScreen ? 35 : 40,
        textAlign: 'center',
        alignSelf: 'center',
    },
    medalWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        fontSize: TYPOGRAPHY.md,
        color: COLORS.textLight,
        textAlign: 'center',
    },
    playerCell: {
        flex: 2.8,
        justifyContent: 'flex-start',
    },
    playerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: isSmallScreen ? 30 : 40,
        height: isSmallScreen ? 30 : 40,
        borderRadius: isSmallScreen ? 15 : 20,
        marginRight: isNarrowScreen ? 8 : 10,
        marginLeft: isNarrowScreen ? 8 : 15,
        backgroundColor: 'transparent',
    },
    beginnerAvatar: {
        width: 35,
        height: 25,
        resizeMode: 'cover',
        marginLeft: isNarrowScreen ? 8 : 18,
        marginRight: isNarrowScreen ? 8 : 12,
        backgroundColor: 'transparent',
    },
    advancedAvatar: {
        borderRadius: 0,
        width: 35,
        height: 30,
        resizeMode: 'cover',
        marginLeft: isNarrowScreen ? 8 : 18,
        marginRight: isNarrowScreen ? 8 : 12,
        backgroundColor: 'transparent',
    },
    defaultAvatarIcon: {
        width: isSmallScreen ? 30 : 40,
        height: isSmallScreen ? 30 : 40,
        borderRadius: isSmallScreen ? 15 : 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: isNarrowScreen ? 8 : 10,
        marginLeft: isNarrowScreen ? 8 : 15,
        backgroundColor: 'transparent',
    },
    playerNameText: {
        fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    fontSize: isNarrowScreen ? (TYPOGRAPHY.md - 2) : TYPOGRAPHY.md,
        color: COLORS.textLight,
        marginLeft: 5,
        letterSpacing: isNarrowScreen ? -0.4 : -0.8,
        flexShrink: 1,
    },
    durationCell: {
        flex: 1.6,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -20,
    },
    durationText: {
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        fontSize: TYPOGRAPHY.md,
        color: COLORS.textLight,
        textAlign: 'center',
        marginLeft: 5,
    },
    pointsCell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    presenceCell: {
        flex: 0.4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pointsText: {
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        fontSize: TYPOGRAPHY.lg,
        color: COLORS.textLight,
        textAlign: 'center',
    },
    durationCellContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.25)',
    },

});
export default scoreboardStyles;