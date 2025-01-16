import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';

const headerStyles = StyleSheet.create({
  header: {
    marginTop: Constants.statusBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 70,
    zIndex: 1,
  },
  recognizedUserHeader: {
    justifyContent: 'space-between',
    backgroundColor: 'black',
  },
  unrecognizedUserHeader: {
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  recognizedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  unrecognizedTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    marginLeft: 5,
    fontFamily: 'AntonRegular',
    color: '#ccc9c9',
  },
  energyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  userHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  userHeaderButton: {
    marginLeft: 10,
    top: -5,
  },
  userHeaderButtonPressed: {
    opacity: 0.7,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 18,
    marginRight: 75,
    letterSpacing: -1.2,
  },
  headerAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
    top: 0,
    right: 5,
    zIndex: 10,
  },
  defaultUserIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
});

export default headerStyles;
