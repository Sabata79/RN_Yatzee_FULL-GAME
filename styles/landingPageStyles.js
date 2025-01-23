import { StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';

const { width,height } = Dimensions.get("window");
const isSmallScreen = height < 720;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c3e50",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: isSmallScreen ? 15: 30,
  },
  logo: {
    width: width * 1.6,
    height: width * 1.6,
    maxWidth: 300,
    maxHeight: 300,
    marginBottom: 5,
  },
  progressBar: {
    width: width * 0.8,
    height: 10,
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: "#080808", 
    overflow: "hidden",
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: "#ecf0f1",
  },
});

export default styles;