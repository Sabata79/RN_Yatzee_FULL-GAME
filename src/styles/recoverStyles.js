/**
 * EnergyTokenStyles - Styles for the energy token system, including progress bars, modals, and icons.
 * Used to style the energy token UI elements and modal dialogs.
 * JSDoc comments and inline code comments must always be in English.
 * @module styles/recoverStyles
 */

import { StyleSheet } from 'react-native';

export const recoverStyles = StyleSheet.create({

  modalContainer: { 
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
    },
  modalContent: { 
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center' 
   },
  modalTitle: { 
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  modalText: { 
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: { 
    width: '100%',
    padding: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
    color: '#333'
  },
  forgotPassword: { 
    color: 'blue',
    fontSize: 14,
    marginBottom: 10,
    alignSelf: 'flex-start',
    textDecorationLine: 'underline'
  },
  resetMessage: { 
    color: 'green',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center'
  },
  passwordContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 12,
    marginBottom: 20
  },
  passwordInput: { 
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  actionButton: { 
    backgroundColor: '#62a346',
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  closeButton: { 
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center'
  },
  buttonText: { 
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8
  },
  buttonPressed: { 
    opacity: 0.7
  },
  notificationContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  notificationContent: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 10, 
    width: '80%', 
    alignItems: 'center' 
  },
  notificationTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  notificationMessage: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 20 
  },
  notificationButton: { 
    backgroundColor: '#62a346', 
    padding: 12, 
    borderRadius: 5, 
    width: '100%', 
    alignItems: 'center' 
  },
  notificationButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});