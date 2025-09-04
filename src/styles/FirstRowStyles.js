import { Dimensions, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';  

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 650;
const isBigScreen = height >= 1050;

export default firstRowStyles = StyleSheet.create({

firstRow: {
        marginTop: isBigScreen ? '30%' : 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0,
        margin: 0,
        zIndex: 10,
    },
    firstRowItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 550,
        zIndex: 10,
    },
});