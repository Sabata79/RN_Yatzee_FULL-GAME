/**
 * EnergyTokenStyles - Styles for the energy token system, including progress bars, modals, and icons.
 * Used to style the energy token UI elements and modal dialogs.
 *
 * @module styles/EnergyTokenStyles
 * @author Sabata79
 * @since 2025-08-29
 */
import { StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

const styles = StyleSheet.create({
  energyContainer: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    left: 0,
  },
  energyIcon: {
    zIndex: 1,
    top: 0,
    transform: [{ rotate: '-15deg' }],
  },
  progressBarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  progressWrap: {
    position: 'relative',
    width: 90,
    height: 15,
    marginBottom: 2,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'white',
  },
  progressPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
  },
  tokenText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    lineHeight: TYPOGRAPHY.fontSize.xs,
    color: 'white',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  energyIconOverlay: {
    position: 'absolute',
    left: -14,
    top: -5,
    zIndex: 3,
    transform: [{ rotate: '-15deg' }],
    pointerEvents: 'none',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyModalButtonPressed: {
    backgroundColor: '#388e3c',
    transform: [{ scale: 0.95 }],
  },
  energyModalCloseButton: {
    position: 'absolute',
    width: 30,
    height: 30,
    right: 15,
    top: -10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  energyModalCloseButtonText: {
    position: 'absolute',
    color: 'Black',
    fontSize: 30,
    padding: 5,
    top: 5,
    right: 0,
    zIndex: 3,
  },
  energyModalButtonText: {
    color: 'white',
    marginTop: 5,
  },
  energyModalFooterText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  }

});

export default styles;
