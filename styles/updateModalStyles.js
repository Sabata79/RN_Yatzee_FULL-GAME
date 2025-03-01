export default updateModalStyles = {
  updateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateModalContent: {
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
  updateModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  updateModalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  updateModalUpdateButton: {
    backgroundColor: '#4caf50',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  updateModalUpdateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  updateModalCancelButton: {
    backgroundColor: '#f44336',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  updateModalCancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
};

