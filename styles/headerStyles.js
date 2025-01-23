// NOTICE: These styles are made whit section flex and flexDirection row. The styles are used in the Header.js component

import { StyleSheet, Dimensions } from 'react-native';
import Constants from 'expo-constants';

const { height, width } = Dimensions.get('window');
const isSmallScreen = height < 720; // Tarkista pieni näyttö

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: isSmallScreen ? 50 : height * 0.1,
    backgroundColor: 'black',
    marginTop: Constants.statusBarHeight,
    overflow: 'hidden',
  },
  section1: {
    flex: isSmallScreen ? 1.5 : 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  section2: {
    flex: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  section3: {
    flex: 2,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  section4: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : width * 0.06, 
    fontFamily: 'AntonRegular',
    color: '#ccc9c9',
  },
  userName: {
    fontSize: isSmallScreen ? 14 : width * 0.04,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    width: '100%',
    paddingRight: isSmallScreen ? 20 : 10,
    letterSpacing: -1,
  },
  headerAvatarImage: {
    width: isSmallScreen ? 50 : 60, 
    height: isSmallScreen ? 50 : 60,
    borderRadius: isSmallScreen ? 25 : 30,
    marginLeft: 10,
    marginTop: 10,
  },
  defaultUserIcon: {
    fontSize: isSmallScreen ? 20 : 26, 
    color: 'white',
    marginLeft: 10,
    marginRight: 15,
  },
});

export default headerStyles;
