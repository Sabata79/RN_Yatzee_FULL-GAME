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