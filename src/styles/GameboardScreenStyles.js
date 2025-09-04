// GameboardScreenStyles.js
// Styles for the Gameboard screen only
import { StyleSheet, Dimensions } from 'react-native';
import COLORS from '../constants/colors';
const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 650;
const isBigScreen = height >= 1050;

const styles = StyleSheet.create({
    gameboardContainer: {
        flex: 1,
        alignSelf: 'stretch',
    },
    gameboard: {
        flex: 1,
        marginTop: 90,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 500,
    },
    selectScore: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        color: 'grey',
        width: 80,
        marginRight: 15,
        marginTop: 5,
        fontSize: 20,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'white',
        borderRadius: 4,
        backgroundColor: '#776c62',
    },
   lockedField: {
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
        borderWidth: 3,
        borderColor: 'green',
        borderRadius: 4,
        backgroundColor: '#3ea645b8',
    },
    item: {
        flex: 1,
        height: isSmallScreen ? 35 : isBigScreen ? 60 : 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 3,
        left: -10,
        ...COLORS.shadowStyle
    },
    icon: {
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
    },
    sectionContainer: {
        width: 70,
        height: 70,
        marginTop: 50,
        marginLeft: 30,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'white',
        backgroundColor: '#84786c',
        ...COLORS.shadowStyle
    },
    sectionContainerAchieved: {
        width: 72,
        height: 72,
        marginTop: 40,
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 100,
        borderWidth: 3,
        borderColor: 'green',
        backgroundColor: '#3ea645b8',
        ...COLORS.whiteShadow
    },
    sectionBonusTxt: {
        fontSize: 12,
        textAlign: 'center',
        color: '#2c2418',
        fontFamily: 'AntonRegular',
    },
    diceBorder: {
        width: isSmallScreen ? '80%' : '80%',
        height: isSmallScreen ? 50 : 60,
        borderWidth: 2,
        borderColor: '#ccc9c9',
        borderRadius: 4,
        alignItems: 'center',
        backgroundColor: '#000000',
        marginTop: -50,
    },
    inputIndexShown: {
        fontSize: isSmallScreen ? 16 : isBigScreen ? 20 : 18,
        fontFamily: 'AntonRegular',
        color: '#333131ff', // Tekstin väri
        textAlign: 'center',
        textShadowColor: '#b09e9e',
        textShadowOffset: { width: 0.2, height: 0.2 },
        textShadowRadius: 1,
    },
    gridTxt: {
        color: '#2c2418',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 5,
        marginTop: 5,
        borderColor: '#ccc9c9',
        borderRadius: 4,
        backgroundColor: '#ccc9c9',
    },
    scoreText: {
        color: 'white',
        fontFamily: 'AntonRegular',
        paddingRight: 10,
    },
    filterLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        paddingBottom: 150,
    },
    centeredText: {
        color: 'white',
        fontSize: isBigScreen ? 32 : 20,
        textAlign: 'center',
        textShadowColor: '#ff0000',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        zIndex: 1000,
    },
  // Lisää muut Gameboard-näkymän omat tyylit tähän...
});

export default styles;
