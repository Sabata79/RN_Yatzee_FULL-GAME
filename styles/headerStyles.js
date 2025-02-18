// NOTICE: These styles are made whit section flex and flexDirection row. The styles are used in the Header.js component

import { StyleSheet, Dimensions, StatusBar, Platform } from 'react-native';

const { height, width } = Dimensions.get('window');
const isSmallScreen = height < 650;
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0;

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: isSmallScreen ? 50 : height * 0.1,
    backgroundColor: 'black',
    marginTop: statusBarHeight,
    overflow: 'hidden',
    marginTop: 0,
  },
  section1: {
    flex: isSmallScreen ? 1.5 : 1.5,
    flexDirection: 'row',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  section4: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: isSmallScreen ? 18 : width * 0.05,
    alignSelf: 'center',
    fontFamily: 'AntonRegular',
    color: '#ffffff',
  },
  headerImage: {
    height: height * 0.11,
    width: width * 0.15,
    marginLeft: -width * 0.02,
  },
  userName: {
    fontSize: isSmallScreen ? 14 : width * 0.04,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    justifyContent: 'center',
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
  linkIconContainer: {
    position: 'absolute',
    top: 5,
    left: 0,
    padding: 2,
    borderRadius: 40,
    borderColor: '#4c4949',
    borderWidth: 1,
    backgroundColor: '#000000ba',
  },
});

export default headerStyles;
