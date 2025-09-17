/**
* SettingScreenStyles.js - Styles for the SettingScreen view
*
* Contains all style definitions for the SettingScreen view, including containers, text styles,
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
        fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        textAlign: 'center',
    },
    name: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textLight,
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        textAlign: 'center',
        flex: 1,
    },
    editIcon: {
        marginLeft: 8,
        marginTop: -4,

    },
    playerId: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        lineHeight: TYPOGRAPHY.fontSize.lg,
        color: COLORS.textLight,
        fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,

        marginBottom: 0,
        marginLeft: 0,
    },
    idIcon: {
        marginRight: 4,
        marginLeft: -4,
        color: COLORS.textLight,
        fontSize: TYPOGRAPHY.fontSize.xxl,
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
        position: 'relative',
        alignSelf: 'center',        // <-- estää venymisen koko kortin leveydelle
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
        zIndex: 1,                      // <-- varmistaa että on shadowin yläpuolella Androidilla
        position: 'relative',
    },
    linkButtonPressed: {
        backgroundColor: COLORS.accentLight,
        transform: [{ translateY: 4 }, { translateX: 4 }],
    },
    linkButtonDisabled: {
        opacity: 0.5,
    },

    linkShadowLayer: {
        ...StyleSheet.absoluteFillObject,
        transform: [{ translateX: 4 }, { translateY: 4 }],
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 6,
        zIndex: 0,
    },
    linkButtonText: {
        color: COLORS.textLight,
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        letterSpacing: 0.5,
        textAlign: 'center',
    },

    wipeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#c62828',
        borderColor: '#fff',
        borderWidth: 2,
        borderRadius: 6,
        paddingVertical: 7,
        paddingHorizontal: 18,
        minWidth: 160,
        minHeight: 36,
        marginTop: 0,
        zIndex: 1,                      // <-- sama kuin linkButton
        position: 'relative',
    },
    wipeButtonPressed: {
        backgroundColor: '#b71c1c',
        transform: [{ translateY: 2 }, { translateX: 2 }],
    },
    wipeButtonText: {
        color: '#fff',
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 24,
        width: 320,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#c62828',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalWarning: {
        color: '#c62828',
        fontSize: 15,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: 15,
        color: '#333',
        marginBottom: 6,
    },
    modalInput: {
        width: 220,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        marginBottom: 6,
        color: '#222',
        backgroundColor: '#f9f9f9',
    },
    modalError: {
        color: '#c62828',
        fontSize: 14,
        marginBottom: 2,
    },
    modalCancelBtn: {
        backgroundColor: '#aaa',
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 18,
        marginRight: 10,
    },
    modalCancelText: {
        color: '#fff',
        fontSize: 16,
    },
    modalOkBtn: {
        backgroundColor: '#c62828',
        borderRadius: 5,
        paddingVertical: 8,
        paddingHorizontal: 18,
    },
    modalOkText: {
        color: '#fff',
        fontSize: 16,
    },
    stepIndicatorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
        marginTop: 8,
        marginHorizontal: 8,
    },
    stepDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#888',
        opacity: 0.5,
    },
    stepDotActive: {
        backgroundColor: '#FFD600',
        opacity: 1,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    stepNumber: {
        fontSize: 12,
        color: '#888',
        opacity: 0.7,
        fontWeight: 'bold',
        marginHorizontal: 1,
    },
    stepNumberActive: {
        color: '#FFD600',
        opacity: 1,
        fontSize: 14,
        textShadowColor: '#222',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    linkInfoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#0d0d0f',
        borderWidth: 2,
        borderColor: COLORS.success,
    },
    linkInfoText: {
        color: COLORS.textLight,
        fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
        fontSize: TYPOGRAPHY.fontSize.xs,
    },
});

export default settingScreenStyles;
