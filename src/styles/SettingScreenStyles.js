// ...existing code...
 /**
 * SettingScreenStyles.js - Styles for the SettingScreen view
 *
 * Jäljittelee GameRulesStyles.js:n tyyliä, mutta tarkoitettu asetussivulle.
 *
 * @module styles/SettingScreenStyles
 * @author Sabata79
 * @since 2025-09-09
 */
import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import SPACING from '../constants/spacing';
import TYPOGRAPHY from '../constants/typography';

const settingScreenStyles = StyleSheet.create({
    root: {
        flex: 1,
    },
    background: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: COLORS.overlayDark,
        opacity: 0.92,
    },
    card: {
        width: 340,
        maxWidth: '95%',
        backgroundColor: COLORS.overlayDark,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.textDark,
        padding: 24,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        color: COLORS.warning,
        fontFamily: TYPOGRAPHY.fontFamily.bangers,
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textLight,
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        flex: 1,
    },
    editIcon: {
        marginLeft: 8,
    },
    playerId: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
        marginBottom: 20,
        marginLeft: 5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    rowLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textLight,
        fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
        flex: 1,
    },
    muteIcon: {
        marginRight: 8,
    },
    slider: {
        width: '100%',
        height: 32,
        marginBottom: 18,
    },

    linkButtonContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 4,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accentLight,
        borderWidth: 2,
        borderRadius: 6,
        paddingVertical: 7,
        paddingHorizontal: 18,
        minWidth: 160,
        minHeight: 36,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
        elevation: 2,
    },
    linkButtonPressed: {
        backgroundColor: COLORS.accentLight,
        transform: [{ translateY: 4 }, { translateX: 4 }],
    },
    linkButtonDisabled: {
        opacity: 0.5,
    },
    linkButtonText: {
        color: COLORS.textLight,
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        letterSpacing: 0.5,
    },
    linkShadowLayer: {
        position: 'absolute',
        top: 4,
        left: 34,
        width: '78%',
        height: 43,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 6,
        zIndex: 0,
    },
});

export default settingScreenStyles;
