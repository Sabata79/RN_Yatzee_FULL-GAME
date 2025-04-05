import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get("window");
const isSmallScreen = height < 650; 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)", // Tummempi ja pehmeämpi tausta
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
    height: 10,
    marginHorizontal: 20,
    borderRadius: 5,
    backgroundColor: "rgba(245,245,245,0.3)", // Pehmeä vaaleanharmaa taustaksi progressBarille
    overflow: "hidden",
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: "#ecf0f1",
    fontFamily: "Roboto", // Yhtenäinen fontti, kuten InterfaceGuidessa
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
});

export default styles;
