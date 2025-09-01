/**
 * Recover - Modal component for account recovery and password reset.
 *
 * JSDoc comments and inline code comments must always be in English.
 * This file provides UI and logic for account recovery and password reset.
 * @author Sabata79
 * @since 2025-08-29
 */
import { useState } from 'react';
import { StyleSheet, Modal, View, Text, TextInput, Pressable, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import {
  getAuth,
  signOut,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from '@react-native-firebase/auth';
import { dbGet, dbUpdate, dbRef } from './Firebase';
import { remove as dbRemove } from './Firebase';
import { useGame } from '../constants/GameContext';
import * as Updates from 'expo-updates';

const Recover = ({ isVisible, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  const [isResetMode, setIsResetMode] = useState(false);

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('');
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const { playerId, setPlayerId, setIsLinked } = useGame();

  const handleRecoverAccount = async () => {
    if (!email.trim() || password.length < 6) {
      setErrorModalTitle('Invalid Input');
      setErrorModalMessage('Please enter a valid email and a password with at least 6 characters.');
      setErrorModalVisible(true);
      return;
    }

    try {
      const auth = getAuth();
      const oldUid = playerId;

      // Kirjaa ulos mahdollinen aiempi käyttäjä
      if (auth.currentUser) {
        await signOut(auth);
      }

      // Kirjaudu sisään email+password
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const currentUser = result.user;
      const newUid = currentUser.uid;
      console.log('Recovered account, UID:', newUid);

      if (oldUid && oldUid !== newUid) {
        // Migroi vanhan UID:n data uuteen
        const oldSnap = await dbGet(`players/${oldUid}`);
        const oldData = oldSnap.val() || {};

        await dbUpdate(`players/${newUid}`, { ...oldData, isLinked: true });
        await dbRemove(dbRef(`players/${oldUid}`));
      } else {
        // Merkitse linkitetyksi
        await dbUpdate(`players/${newUid}`, { isLinked: true });
      }

      await SecureStore.setItemAsync('user_id', newUid);
      setPlayerId(newUid);
      setIsLinked(true);

      setSuccessModalVisible(true);
    } catch (error) {
      setErrorModalTitle('Recovery Error');
      setErrorModalMessage(error?.message ?? 'Failed to recover account. Please check your email and password.');
      setErrorModalVisible(true);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setResetMessage('Please enter your email to reset your password.');
      return;
    }

    try {
      setIsResetMode(true);
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email.trim());
      setResetMessage('Password reset link has been sent to your email.');
      setPassword('');
    } catch (error) {
      setResetMessage(error?.message ?? 'Failed to send reset email.');
      setIsResetMode(false);
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setResetMessage(null);
  };

  const handleSuccessClose = async () => {
    setSuccessModalVisible(false);
    onClose?.();
    await Updates.reloadAsync();
  };

  return (
    <>
      {/* Recover Modal */}
      <Modal transparent={true} animationType="slide" visible={isVisible} onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Recover <FontAwesome5 name="link" size={20} color="gold" /> Account
            </Text>
            {isResetMode ? (
              <>
                <Text style={styles.modalText}>Enter your email to reset your password.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                {resetMessage && <Text style={styles.resetMessage}>{resetMessage}</Text>}
                <Pressable
                  style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
                  onPress={handleResetPassword}
                >
                  <Text style={styles.buttonText}>SEND!</Text>
                </Pressable>
                <TouchableOpacity onPress={() => setIsResetMode(false)}>
                  <Text style={styles.forgotPassword}>Back</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalText}>
                  Enter your email and password to recover your linked account.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={handleEmailChange}
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
                  style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
                  onPress={handleRecoverAccount}
                >
                  <Text style={styles.buttonText}>Recover Account</Text>
                  <FontAwesome5 name="redo" size={20} color="gold" />
                </Pressable>
                <TouchableOpacity onPress={() => setIsResetMode(true)}>
                  <Text style={styles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
                <Pressable
                  style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Error Notification Modal */}
      {errorModalVisible && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={errorModalVisible}
          onRequestClose={() => setErrorModalVisible(false)}
        >
          <View style={styles.notificationContainer}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{errorModalTitle}</Text>
              <Text style={styles.notificationMessage}>{errorModalMessage}</Text>
              <Pressable style={styles.notificationButton} onPress={() => setErrorModalVisible(false)}>
                <Text style={styles.notificationButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Success Notification Modal */}
      {successModalVisible && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={successModalVisible}
          onRequestClose={handleSuccessClose}
        >
          <View style={styles.notificationContainer}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Success</Text>
              <Text style={styles.notificationMessage}>Account recovered successfully!</Text>
              <Pressable style={styles.notificationButton} onPress={handleSuccessClose}>
                <Text style={styles.notificationButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { backgroundColor: '#fff', width: '80%', borderRadius: 10, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  modalText: { fontSize: 16, color: '#555', marginBottom: 20, textAlign: 'center' },
  input: { width: '100%', padding: 12, borderColor: '#ccc', borderWidth: 1, borderRadius: 5, marginBottom: 20, fontSize: 16, color: '#333' },
  forgotPassword: { color: 'blue', fontSize: 14, marginBottom: 10, alignSelf: 'flex-start', textDecorationLine: 'underline' },
  resetMessage: { color: 'green', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', borderColor: '#ccc', borderWidth: 1, borderRadius: 5, padding: 12, marginBottom: 20 },
  passwordInput: { flex: 1, fontSize: 16, color: '#333' },
  actionButton: { backgroundColor: '#62a346', padding: 12, borderRadius: 5, width: '100%', alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center' },
  closeButton: { backgroundColor: '#999', padding: 12, borderRadius: 5, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  buttonPressed: { opacity: 0.7 },
  notificationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  notificationContent: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  notificationTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  notificationMessage: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  notificationButton: { backgroundColor: '#62a346', padding: 12, borderRadius: 5, width: '100%', alignItems: 'center' },
  notificationButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default Recover;
