/**
 * landingPageStyles - Styles for the landing page, including container, logo, progress bar, and buttons.
 * Used to style the app's landing and loading screens.
 * JSDoc comments and inline code comments must always be in English.
 * @module styles/landingPageStyles
 */
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get("window");
const isSmallScreen = height < 650;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
   backgroundColor: '#2c3e50', // Darker and softer background
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: isSmallScreen ? 15 : 30,
  },
  logo: {
    width: width * 1.6,
    height: width * 1.6,
    maxWidth: 600,
    maxHeight: 600,
    marginBottom: 5,
  },
  progressBar: {
    width: width * 0.8,
    height: 20,
    marginHorizontal: 20,
    borderRadius: 5,
   backgroundColor: "rgba(245,245,245,0.3)", // Soft light gray background for progress bar
    overflow: "hidden",
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: "#ecf0f1",
    fontFamily: "Roboto",
    textAlign: "center",
  },
  // Esimerkkityyli nappeille, mikäli haluat yhtenäistää myös etusivun nappuloita
  button: {
    backgroundColor: "gold", // Kultaista väriä, joka löytyy myös InterfaceGuiden otsikoista
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontFamily: "AntonRegular", // Voit käyttää myös InterfaceGuiden tyylejä
    textAlign: "center",
  },
  progressOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default styles;
