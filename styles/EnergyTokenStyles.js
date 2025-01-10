import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  energyContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 10, 
    paddingVertical: 5,
    width: '100%', 
  },
  energyIcon: {
    zIndex: 1,
    transform: [{ rotate: '-15deg' }],
  },
  progressBarContainer: {
    position: 'absolute',
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', 
  },
  progressBar: {
    position: 'relative',
    left: 28,
    height: 20,
    width: 75, 
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'green',
    borderWidth: 1,
    borderColor: 'white',
  },
  tokenText: {
    position: 'relative',
    left: -20,
    fontSize: 14,
    fontWeight: 'bold',
    width: '100%',
    color: 'white',
  },
});

export default styles;
