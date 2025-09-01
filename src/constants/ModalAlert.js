/**
 * ModalAlert - Modal component for displaying alert messages.
 *
 * JSDoc comments and inline code comments must always be in English.
 * This file provides a modal for showing alert messages to the user.
 * @author Sabata79
 * @since 2025-08-29
 */
// constants/ModalAlert.js
import { View, Text, Modal, Pressable } from 'react-native';

export default function ModalAlert({ visible, message, onClose }) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalCenteredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>{message}</Text>
          <Pressable
            style={styles.modalButton}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Play Again</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}