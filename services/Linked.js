import React, { useState } from 'react';
import { StyleSheet, Modal, View, Text, TextInput, Pressable, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { auth, database } from '../components/Firebase';
import { useGame } from '../components/GameContext';

const Linked = ({ isVisible, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const { playerId, setPlayerId, setIsLinked } = useGame();

  const handleLinkAccount = async () => {
    if (!email.trim() || password.length < 6) {
      setErrorModalTitle('Invalid input');
      setErrorModalMessage('Please enter a valid email and a password with at least 6 characters.');
      setErrorModalVisible(true);
      return;
    }

    try {
      // Varmista että käyttäjä on kirjautuneena (anonyymisti tarvittaessa)
      if (!auth().currentUser) {
        const res = await auth().signInAnonymously();
        console.log('Signed in anonymously, uid:', res.user.uid);
      }

      // Rakenna credential ja linkitä nykyiseen käyttäjään
      const cred = auth.EmailAuthProvider.credential(email, password);
      const currentUser = auth().currentUser;

      if (!currentUser) {
        setErrorModalTitle('Error');
        setErrorModalMessage('User is not signed in.');
        setErrorModalVisible(true);
        return;
      }

      await currentUser.linkWithCredential(cred);
      console.log('Link successful, UID (stays same):', currentUser.uid);

      const oldUuid = playerId;
      const newUid = currentUser.uid;

      const db = database();

      if (oldUuid && oldUuid !== newUid) {
        // Jos UID olisi muuttunut (yleensä ei linkityksessä), migroidaan data
        const oldPlayerRef = db.ref(`players/${oldUuid}`);
        const oldSnap = await oldPlayerRef.once('value');
        const oldData = oldSnap.val() || {};

        const newPlayerRef = db.ref(`players/${newUid}`);
        await newPlayerRef.update({ ...oldData, isLinked: true });

        await oldPlayerRef.remove();
      } else {
        // Tyypillisin polku: UID pysyy samana linkityksessä
        const newPlayerRef = db.ref(`players/${newUid}`);
        await newPlayerRef.update({ isLinked: true });
      }

      await SecureStore.setItemAsync('user_id', newUid);
      setPlayerId(newUid);
      setIsLinked(true);

      setSuccessModalVisible(true);
    } catch (error) {
      setErrorModalTitle('Error on linking account');
      setErrorModalMessage(error?.message ?? String(error));
      setErrorModalVisible(true);
    }
  };

  return (
    <>
      <Modal transparent={true} animationType="slide" visible={isVisible} onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link your account</Text>
            <Text style={styles.modalText}>Enter your email and password to link your account.</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <FontAwesome5 name={showPassword ? 'eye-slash' : 'eye'} size={20} color="gray" />
              </TouchableOpacity>
            </View>

            <Pressable
              style={({ pressed }) => [styles.linkButton, pressed && styles.buttonPressed]}
              onPress={handleLinkAccount}
            >
              <Text style={styles.buttonText}>Link Account</Text>
              <FontAwesome5 name="link" size={20} color="gold" />
            </Pressable>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Success / Error modaalit jos sinulla on erilliset komponentit niille, näytä tässä.
          Nyt vain state päivittyy; lisää omat modal-komponenttisi tarvittaessa. */}
    </>
  );
};

// Styles
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 12,
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
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
  buttonPressed: {
    opacity: 0.7,
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
