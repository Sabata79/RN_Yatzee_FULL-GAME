// NOTICE: These styles are made whit section flex and flexDirection row. The styles are used in the Header.js component

import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: 70,
    backgroundColor: 'black',
    marginTop: Constants.statusBarHeight,
    overflow: 'visible',
  },
  section1: {
    flex: 2,
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
    fontSize: 24,
    fontFamily: 'AntonRegular',
    color: '#ccc9c9',
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    width: '100%',
    paddingRight: 10,
    letterSpacing: -1.5,
  },
  headerAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 10,
    marginTop: 10, 
  },
  defaultUserIcon: {
    fontSize: 22,
    color: 'white',
    marginLeft: 10,
  },
});

export default headerStyles;
