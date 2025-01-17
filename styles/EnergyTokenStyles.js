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
  plusMark: {
    position: 'absolute',
    fontFamily: 'AntonRegular',
    left: 15,
    top: -30,
    fontSize: 40,
    fontWeight: 'bold',
    color: '#0bf012',
    textShadowOffset: { width: 1, height: 1 },
    zIndex: 5,
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
    marginBottom: 5,
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
  energyModalCloseButton: {
    backgroundColor: '#f44336',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
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
