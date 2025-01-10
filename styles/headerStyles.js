import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';

const styles = StyleSheet.create({
  header: {
    marginTop: Constants.statusBarHeight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 10,
    height: 70,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    marginLeft: 10,
    marginRight: 5,
    fontFamily: 'AntonRegular',
    color: '#ccc9c9',
  },
  userHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default styles;