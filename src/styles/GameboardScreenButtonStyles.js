import { Dimensions, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 650;
const isBigScreen = height >= 1050;

const styles = StyleSheet.create({
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: COLORS.accent,
        borderColor: 'orange',
        borderWidth: 3,
        borderRadius: 5,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        width: '80%',
        alignSelf: 'center',
        zIndex: 1,
        height: 40,
    },
    shadowLayer: {
        position: 'absolute',
        top: SPACING.xxs,
        left: '11%',
        width: '80%',
        height: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.635)',
        borderRadius: 8,
        zIndex: 1,
    },
    iconContainer: {
        marginRight: SPACING.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        margin: 5,
        marginTop: isSmallScreen ? 8 : 15,
        flexDirection: 'row',
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: '#eeac1ef5',
        borderWidth: 3,
        borderColor: 'orange',
        width: isSmallScreen ? '32%' : isBigScreen ? '45%' : '39%',  // Suuremmat napit suuremmilla näytöillä
        height: isSmallScreen ? 41 : isBigScreen ? 60 : 50,
        borderRadius: 5,
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 10,
    },
    buttonPressed: {
        margin: 5,
        marginTop: 15,
        flexDirection: 'row',
        paddingLeft: 10,
        paddingRight: 10,
        backgroundColor: '#c28d1af5',
        borderWidth: 3,
        borderColor: '#ff4500',
        width: isSmallScreen ? '32%' : isBigScreen ? '45%' : '39%',
        height: isSmallScreen ? 41 : isBigScreen ? 60 : 50,
        borderRadius: 5,
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.0,
        shadowRadius: 0,
        elevation: 0,
        transform: [{ scale: 0.95 }],
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
        fontSize: 18,
        textAlign: 'center',
        fontFamily: 'AntonRegular',
    },
    nbrThrowsTextContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nbrThrowsText: {
        fontSize: 17,
        fontFamily: 'Roboto',
        width: 30,
        height: 30,
        borderRadius: 60,
        borderWidth: 2,
        textAlign: 'center',
        alignContent: 'center',
        justifyContent: 'center',
        backgroundColor: '#fb0202ad',
    },
});

export default styles;
