// Linked.js
import React, { useState } from 'react';
import { StyleSheet, Modal, View, Text, TextInput, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { auth, database } from '../components/Firebase';
import { useGame } from '../components/GameContext';
import { EmailAuthProvider, linkWithCredential, signInAnonymously } from 'firebase/auth';
import { ref, update, get, remove } from 'firebase/database';

const Linked = ({ isVisible, onClose }) => {
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

  // Handler for linking account
  const handleLinkAccount = async () => {
    // Validate that both email and password are provided
    if (!email.trim() || !password.trim()) {
      setErrorModalTitle("Missing Information");
      setErrorModalMessage("Please enter both email and password.");
      setErrorModalVisible(true);
      return;
    }
    // Validate password length (at least 6 characters)
    if (password.length < 6) {
      setErrorModalTitle("Password Error");
      setErrorModalMessage("Password must be at least 6 characters long.");
      setErrorModalVisible(true);
      return;
    }
    // Validate email format with a regular expression
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorModalTitle("Invalid Email");
      setErrorModalMessage("Please enter a valid email address.");
      setErrorModalVisible(true);
      return;
    }

    try {
      // If the user is not signed in, sign in anonymously
      if (!auth.currentUser) {
        const result = await signInAnonymously(auth);
        console.log("Sign in successful, uid:", result.user.uid);
      }

      // Create credential using email and password
      const credential = EmailAuthProvider.credential(email, password);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setErrorModalTitle("Error");
        setErrorModalMessage("The user is not signed in.");
        setErrorModalVisible(true);
        return;
      }

      // Link the credential to the current user
      await linkWithCredential(currentUser, credential);
      console.log("Linking successful, new UID:", currentUser.uid);

      // Retrieve the old UID from GameContext
      const oldUuid = playerId; // Old UID
      const newUid = currentUser.uid; // New UID

      // If an old UID exists and is different from the new UID, merge account data
      if (oldUuid && oldUuid !== newUid) {
        const oldPlayerRef = ref(database, `players/${oldUuid}`);
        const snapshot = await get(oldPlayerRef);
        const oldData = snapshot.val() || {};

        const newPlayerRef = ref(database, `players/${newUid}`);
        await update(newPlayerRef, { ...oldData, isLinked: true });
        console.log("Data merged into new account:", { ...oldData, isLinked: true });

        // Remove the old anonymous account data
        await remove(oldPlayerRef);
        console.log("Old account removed:", oldUuid);
      } else {
        const newPlayerRef = ref(database, `players/${newUid}`);
        await update(newPlayerRef, { isLinked: true });
        console.log("Account updated, isLinked true:", newUid);
      }

      // Update SecureStore with the new UID
      await SecureStore.setItemAsync("user_id", newUid);
      console.log("SecureStore updated with new UID:", newUid);

      // Update GameContext state
      setPlayerId(newUid);
      setIsLinked(true);

      // Show the success modal
      setSuccessModalVisible(true);

    } catch (error) {
      console.error("Account linking failed:", error);
      setErrorModalTitle("Error on Linking Account");
      setErrorModalMessage(error.message);
      setErrorModalVisible(true);
    }
  };

  // Handler for closing the success modal
  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    onClose();
  };

  // Handler for closing the error modal
  const handleErrorOk = () => {
    setErrorModalVisible(false);
  };

  return (
    <>
      {/* Linked modal view */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link Your Account</Text>
            <Text style={styles.modalText}>
              Enter your email and password to link your account.
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

            <Pressable
              style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
              onPress={handleLinkAccount}
            >
              <Text style={styles.buttonText}>Link Account</Text>
              <FontAwesome5 name="link" size={20} color="gold" />
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
            <Text style={styles.modalTitle}>Account Linked</Text>
            <Text style={styles.modalText}>
              Your account is now linked <FontAwesome5 name="link" size={20} color="gold" />.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
              onPress={handleSuccessOk}
            >
              <Text style={styles.buttonText}>OK</Text>
              <FontAwesome5 name="check" size={20} color="gold" />
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
  closeButtonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Linked;
