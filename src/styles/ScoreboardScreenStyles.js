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
    tabContainer: {
        position: 'relative',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        backgroundColor: COLORS.overlayExtraDark,
        paddingVertical: 6,
        paddingHorizontal: SPACING.xs,
        minHeight: 60,
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
        flex: 1.2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerHeaderCell: {
        flex: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    durationHeaderCell: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 5,
    },
    pointsHeaderCell: {
        flex: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankCell: {
        flex: 1.2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    medal: {
        width: isSmallScreen ? 38 : 42,
        height: isSmallScreen ? 38 : 42,
        marginLeft: 0,
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
        flex: 3,
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
        marginRight: 10,
        marginLeft: 15,
        backgroundColor: 'transparent',
    },
    beginnerAvatar: {
        width: 35,
        height: 25,
        resizeMode: 'cover',
        marginLeft: 18,
        marginRight: 12,
        backgroundColor: 'transparent',
    },
    advancedAvatar: {
        borderRadius: 0,
        width: 40,
        height: 30,
        resizeMode: 'cover',
        marginLeft: 18,
        marginRight: 12,
        backgroundColor: 'transparent',
    },
    defaultAvatarIcon: {
        width: isSmallScreen ? 30 : 40,
        height: isSmallScreen ? 30 : 40,
        borderRadius: isSmallScreen ? 15 : 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginLeft: 15,
        backgroundColor: 'transparent',
    },
    playerNameText: {
        fontFamily: TYPOGRAPHY.fontFamily.montserrat,
        fontSize: TYPOGRAPHY.md,
        color: COLORS.textLight,
        marginLeft: 5,
        letterSpacing: -0.8,
    },
    durationCell: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    durationText: {
        fontFamily: TYPOGRAPHY.fontFamily.montserrat,
        fontSize: TYPOGRAPHY.md,
        color: COLORS.textLight,
        textAlign: 'center',
        marginLeft: 15,
    },
    pointsCell: {
        flex: 1.5,
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