import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // pehmeä tumma overlay
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rulesContainer: {
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // yhtenäinen tumma sävy
    borderRadius: 10,
    alignItems: 'center',
  },
  rulesText: {
    fontSize: 20,
    color: 'gold',
    fontFamily: 'AntonRegular',
    textAlign: 'center',
    marginBottom: 10,
  },
  rulesAuxillaryText: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'Roboto',
    textAlign: 'center',
    marginBottom: 20,
  },
  registerImage: {
    width: width * 0.65,
    height: width * 0.65,
    resizeMode: 'contain',
    marginBottom: -20,
  },
  input: {
    width: '80%',
    borderColor: 'gold',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: 'white',
    marginBottom: 20,
    fontFamily: 'Roboto',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  homeButton: {
    backgroundColor: '#eeac1ef5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'orange',
  },
  homeButtonPressed: {
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#eeac1ef5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'orange',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  fullWidthButton: {
    width: '80%',
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'AntonRegular',
    textAlign: 'center',
    marginRight: 10,
  },
  hiThereImage: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: 'contain',
    marginVertical: 0,
  },
});

export default styles;
