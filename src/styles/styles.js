/**
 * styles - Main global styles for the application, including containers, backgrounds, overlays, and UI elements.
 * Used throughout the app for layout and visual consistency.
 *
 * Refactor ongoing to improve organization and modularity.
 *
 * @module styles/styles
 * @author Sabata79
 * @since 2025-08-29
 */
import { Dimensions, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 650;
const isBigScreen = height >= 1050;

export default styles = StyleSheet.create({

    container: {
        flex: 1,
        alignSelf: 'stretch',
        backgroundColor: 'transparent',
    },
    background: {
        flex: 1,
        justifyContent: 'flex-start',
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    overlay: {
        flex: 1,
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.537)',
        maxWidth: 420,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectScorePressed: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        color: 'black',
        width: 80,
        marginRight: 15,
        marginTop: 5,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        borderWidth: 2,
        borderColor: 'red',
        borderRadius: 4,
        backgroundColor: '#cf6d52b8',
    },
    row: {
        marginTop: 20,
        padding: 10,
    },
    flex: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    // Gridfield
    smallText: {
        fontSize: 10,
        marginLeft: 10,
        color: 'white',
        width: 60,
    },
    // Modal Alert!
    modalView: {
        margin: 20,
        backgroundColor: '#ffffff',
        borderRadius: 5,
        padding: 30,
        alignItems: 'center',
        opacity: 0.95,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    modalText: {
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 16,
        color: 'black',
        fontWeight: '500',
    },
    modalButtonText: {
        color: 'black',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
    },
});
