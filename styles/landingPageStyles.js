import { StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2c3e50",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: width * 1.2,
    height: width * 1.2,
    marginBottom: 20,
  },
  progressBar: {
    width: width * 0.8,
    height: 10,
    marginLeft: 20,
    marginRight: 20,
    marginTop: 20,
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