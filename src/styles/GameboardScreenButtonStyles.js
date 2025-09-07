
/**
 * GameboardScreenButtonStyles.js - Styles for Gameboard screen actions (buttons, badge, shadows)
 *
 * Contains all styles for the Gameboard screen action buttons and related elements.
 *
 * Usage:
 *   import gameboardBtnstyles from '../styles/GameboardScreenButtonStyles';
 *   ...
 *   <Pressable style={gameboardBtnstyles.button}>...</Pressable>
 *
 * Note! All fonts and colors are centralized in the constants folder.
 *
 * @module styles/GameboardScreenButtonStyles
 * @author Sabata79
 * @since 2025-09-03
 */

import { Dimensions, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 650;
const isBigScreen = height >= 1050;

const styles = StyleSheet.create({
    singleButtonContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '96%',
    },
    buttonWrapper: {
        width: '47%',
        alignItems: 'center',
        position: 'relative',
        marginTop: SPACING.md,
        marginBottom: SPACING.md,
        marginHorizontal: SPACING.xs,
    },
    fullWidthButtonWrapper: {
        width: '96%',
        alignItems: 'center',
        position: 'relative',
        marginTop: SPACING.md,
        marginBottom: SPACING.md,
        marginHorizontal: '2%',
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accentLight,
        borderWidth: 2,
        borderRadius: 3,
        width: '100%',
        alignSelf: 'center',
        zIndex: 1,
        height: 50,
    },
    shadowLayer: {
        position: 'absolute',
        top: 2,
        left: 2,
        width: '100%',
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.635)',
        borderRadius: 4,
    },
    iconContainer: {
        marginBottom: 5,
        marginLeft: SPACING.lg,
        alignSelf: 'flex-end',
        color: 'black',
    },
    buttonPressed: {
        opacity: 0.5,
    },
    label: {
        fontFamily: TYPOGRAPHY.fontFamily.bangers,
        color: '#222',
        flex: 1,
        textAlign: 'center',
        fontSize: TYPOGRAPHY.fontSize.xl,
    },
    buttonText: {
        color: 'black',
        fontSize: TYPOGRAPHY.fontSize.lg,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.fontFamily.bangers,
    },
    nbrThrowsTextContainer: {
        alignSelf: 'flex-end',
        marginBottom: 5,
        marginLeft: SPACING.lg,
    },
    nbrThrowsText: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        backgroundColor: COLORS.error,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nbrThrowsTextValue: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontFamily: TYPOGRAPHY.fontFamily.bangers,
        color: 'black',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default styles;
