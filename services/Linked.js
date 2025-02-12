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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('Error ocurred!');
  const [errorModalMessage, setErrorModalMessage] = useState('Try again later.');

  const { playerId, setPlayerId, setIsLinked } = useGame();

  const handleLinkAccount = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorModalTitle("Tiedot puuttuvat");
      setErrorModalMessage("Ole hyvä ja syötä sekä sähköposti että salasana.");
      setErrorModalVisible(true);
      return;
    }
    try {
      // If user is not signed in, sign in anonymously
      if (!auth.currentUser) {
        const result = await signInAnonymously(auth);
        console.log("Kirjautuminen onnistui, uid:", result.user.uid);
      }
      
      // Create credential with email and password
      const credential = EmailAuthProvider.credential(email, password);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setErrorModalTitle("Virhe");
        setErrorModalMessage("Käyttäjää ei ole kirjautuneena, eikä kirjautuminen onnistunut.");
        setErrorModalVisible(true);
        return;
      }
      
      // Link the credential to the current user
      await linkWithCredential(currentUser, credential);
      console.log("Linkitys onnistui, uusi UID:", currentUser.uid);
      
      // Get the old UUID from GameContext
      const oldUuid = playerId; // Old UUID
      const newUid = currentUser.uid; // New UUID
      
      // If there is an old UUID, update the new player data with isLinked set to true
      if (oldUuid && oldUuid !== newUid) {
        const oldPlayerRef = ref(database, `players/${oldUuid}`);
        const snapshot = await get(oldPlayerRef);
        const oldData = snapshot.val() || {};

        const newPlayerRef = ref(database, `players/${newUid}`);
        await update(newPlayerRef, { ...oldData, isLinked: true });
        console.log("Data kopioitu uuteen tietueeseen:", { ...oldData, isLinked: true });

        // Remove the old anynomous player data
        await remove(oldPlayerRef);
        console.log("Vanha tietue poistettu:", oldUuid);
      } else {
        const newPlayerRef = ref(database, `players/${newUid}`);
        await update(newPlayerRef, { isLinked: true });
        console.log("Uusi tietue päivitetty, isLinked true:", newUid);
      }
      
      // Update SecureStore with the new UID
      await SecureStore.setItemAsync("user_id", newUid);
      console.log("SecureStore päivitetty uudella UID:llä:", newUid);
      
      // Set the new UID to GameContext and set isLinked to true
      setPlayerId(newUid);
      setIsLinked(true);
      
      // Show success modal
      setSuccessModalVisible(true);
      
    } catch (error) {
      console.error("Tilin linkitys epäonnistui:", error);
      setErrorModalTitle("Linkityksessä tapahtui virhe");
      setErrorModalMessage(error.message);
      setErrorModalVisible(true);
    }
  };

  // Close success modal
  const handleSuccessOk = () => {
    setSuccessModalVisible(false);
    onClose();
  };

  // Close error modal
  const handleErrorOk = () => {
    setErrorModalVisible(false);
  };

  return (
    <>
      <Modal
        transparent={true}
        animationType="slide"
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link your account</Text>
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

            <Pressable style={styles.linkButton} onPress={handleLinkAccount}>
              <Text style={styles.buttonText}>Link Account</Text>
              <FontAwesome5 name="link" size={20} color="gold" />
            </Pressable>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Onnistumis-modal */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={successModalVisible}
        onRequestClose={handleSuccessOk}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Account</Text>
            <Text style={styles.modalText}>Your account is now linked <FontAwesome5 name="link" size={20} color="gold" /></Text>
            <Pressable style={styles.linkButton} onPress={handleSuccessOk}>
              <Text style={styles.buttonText}> OK </Text>
              <FontAwesome5 name="check" size={20} color="gold" />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Virhe-modal */}
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
            <Pressable style={styles.linkButton} onPress={handleErrorOk}>
              <Text style={styles.buttonText}> OK </Text>
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
  },
});

export default Linked;
