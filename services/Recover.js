// Recover.js
import React, { useState } from 'react';
import { StyleSheet, Modal, View, Text, TextInput, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { auth, database } from '../components/Firebase';
import { useGame } from '../components/GameContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, update, get, remove } from 'firebase/database';
import * as Updates from 'expo-updates';

const Recover = ({ isVisible, onClose }) => {
  // State variables for input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State variables for modals
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // Game context variables
  const { playerId, setPlayerId, setIsLinked } = useGame();

  // Handler for account recovery
  const handleRecoverAccount = async () => {
    // Check if email and password fields are filled
    if (!email.trim() || !password.trim()) {
      setErrorModalTitle("Missing Information");
      setErrorModalMessage("Please enter both email and password.");
      setErrorModalVisible(true);
      return;
    }

    // Check if password is at least 6 characters long
    if (password.length < 6) {
      setErrorModalTitle("Password Error");
      setErrorModalMessage("Password must be at least 6 characters long.");
      setErrorModalVisible(true);
      return;
    }

    // Validate email format using a regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorModalTitle("Invalid Email");
      setErrorModalMessage("Please enter a valid email address.");
      setErrorModalVisible(true);
      return;
    }

    try {
      // Save the old UID from GameContext
      const oldUid = playerId;

      // If a user is currently signed in, sign out
      if (auth.currentUser) {
        await auth.signOut();
      }

      // Sign in using email and password
      const result = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = result.user;
      console.log("Recovered account, UID:", currentUser.uid);
      const newUid = currentUser.uid;

      // If an old UID exists and differs from the new UID, merge the account data
      if (oldUid && oldUid !== newUid) {
        const oldPlayerRef = ref(database, `players/${oldUid}`);
        const snapshot = await get(oldPlayerRef);
        const oldData = snapshot.val() || {};

        const newPlayerRef = ref(database, `players/${newUid}`);
        await update(newPlayerRef, { ...oldData, isLinked: true });
        console.log("Data merged into recovered account:", { ...oldData, isLinked: true });

        // Remove the old anonymous account data
        await remove(oldPlayerRef);
        console.log("Old account removed:", oldUid);
      } else {
        const newPlayerRef = ref(database, `players/${newUid}`);
        await update(newPlayerRef, { isLinked: true });
        console.log("Account updated, isLinked true:", newUid);
      }

      // Update SecureStore with the new UID
      await SecureStore.setItemAsync("user_id", newUid);
      console.log("SecureStore updated with new UID:", newUid);

      // Update the GameContext state
      setPlayerId(newUid);
      setIsLinked(true);

      // Show the success modal
      setSuccessModalVisible(true);

    } catch (error) {
      console.error("Account recovery failed:", error);
      setErrorModalTitle("Recovery Error");
      setErrorModalMessage(error.message);
      setErrorModalVisible(true);
    }
  };

  // Handler for when the success modal is acknowledged
  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    onClose();
    Updates.reloadAsync();
  };

  // Handler for closing the error modal
  const handleErrorOk = () => {
    setErrorModalVisible(false);
  };

  return (
    <>
      {/* Recover modal view */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Recover <FontAwesome5 name="link" size={20} color="gold" /> Account</Text>
            <Text style={styles.modalText}>
              Enter your email and password to recover your linked account.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]} onPress={handleRecoverAccount}>
              <Text style={styles.buttonText}>Recover Account</Text>
              <FontAwesome5 name="redo" size={20} color="gold" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Success modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={successModalVisible}
        onRequestClose={handleSuccessOk}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalText}>Account recovery was successful. The app will reload.</Text>
            <Pressable style={styles.linkButton} onPress={handleSuccessOk}>
              <Text style={styles.buttonText}>OK</Text>
              <FontAwesome5 name="redo" size={20} color="gold" />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Error modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={errorModalVisible}
        onRequestClose={handleErrorOk}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{errorModalTitle}</Text>
            <Text style={styles.modalText}>{errorModalMessage}</Text>
            <Pressable
              style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
              onPress={handleErrorOk}
            >
              <Text style={styles.buttonText}>OK</Text>
              <FontAwesome5 name="exclamation-triangle" size={20} color="gold" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 12,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  linkButton: {
    backgroundColor: '#62a346',
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
    linkButtonPressed: {
    opacity: 0.8,
  },
  closeButton: {
    backgroundColor: '#999',
    padding: 12,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default Recover;
