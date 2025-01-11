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
    backgroundColor: 'transparent',
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

// Modal
  energyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  energyModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  energyModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  energyModalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  energyModalButton: {
    backgroundColor: '#4caf50',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  energyModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  energyModalFooterText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },

});

export default styles;
