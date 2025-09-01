/**
 * Recover - Modal component for account recovery and password reset.
 *
 * JSDoc comments and inline code comments must always be in English.
 * This file provides UI and logic for account recovery and password reset.
 * @author Sabata79
 * @since 2025-08-29
 */
import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, TouchableOpacity } from 'react-native';
import { recoverStyles } from '../styles/recoverStyles';
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

      // Sign out anonymous user if any
      if (auth.currentUser) {
        await signOut(auth);
      }

      // Sign in with email/password
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      const currentUser = result.user;
      const newUid = currentUser.uid;
      console.log('Recovered account, UID:', newUid);

      if (oldUid && oldUid !== newUid) {
        // Migrate old UID's data to new
        const oldSnap = await dbGet(`players/${oldUid}`);
        const oldData = oldSnap.val() || {};

        await dbUpdate(`players/${newUid}`, { ...oldData, isLinked: true });
        await dbRemove(dbRef(`players/${oldUid}`));
      } else {
        // Mark as linked
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
        <View style={recoverStyles.modalContainer}>
          <View style={recoverStyles.modalContent}>
            <Text style={recoverStyles.modalTitle}>
              Recover <FontAwesome5 name="link" size={20} color="gold" /> Account
            </Text>
            {isResetMode ? (
              <>
                <Text style={recoverStyles.modalText}>Enter your email to reset your password.</Text>
                <TextInput
                  style={recoverStyles.input}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                {resetMessage && <Text style={recoverStyles.resetMessage}>{resetMessage}</Text>}
                <Pressable
                  style={({ pressed }) => [recoverStyles.actionButton, pressed && recoverStyles.buttonPressed]}
                  onPress={handleResetPassword}
                >
                  <Text style={recoverStyles.buttonText}>SEND!</Text>
                </Pressable>
                <TouchableOpacity onPress={() => setIsResetMode(false)}>
                  <Text style={recoverStyles.forgotPassword}>Back</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={recoverStyles.modalText}>
                  Enter your email and password to recover your linked account.
                </Text>
                <TextInput
                  style={recoverStyles.input}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={handleEmailChange}
                />
                <View style={recoverStyles.passwordContainer}>
                  <TextInput
                    style={recoverStyles.passwordInput}
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
                  style={({ pressed }) => [recoverStyles.actionButton, pressed && recoverStyles.buttonPressed]}
                  onPress={handleRecoverAccount}
                >
                  <Text style={recoverStyles.buttonText}>Recover Account</Text>
                  <FontAwesome5 name="redo" size={20} color="gold" />
                </Pressable>
                <TouchableOpacity onPress={() => setIsResetMode(true)}>
                  <Text style={recoverStyles.forgotPassword}>Forgot Password?</Text>
                </TouchableOpacity>
                <Pressable
                  style={({ pressed }) => [recoverStyles.closeButton, pressed && recoverStyles.buttonPressed]}
                  onPress={onClose}
                >
                  <Text style={recoverStyles.buttonText}>Cancel</Text>
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
          <View style={recoverStyles.notificationContainer}>
            <View style={recoverStyles.notificationContent}>
              <Text style={recoverStyles.notificationTitle}>{errorModalTitle}</Text>
              <Text style={recoverStyles.notificationMessage}>{errorModalMessage}</Text>
              <Pressable style={recoverStyles.notificationButton} onPress={() => setErrorModalVisible(false)}>
                <Text style={recoverStyles.notificationButtonText}>Close</Text>
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
          <View style={recoverStyles.notificationContainer}>
            <View style={recoverStyles.notificationContent}>
              <Text style={recoverStyles.notificationTitle}>Success</Text>
              <Text style={recoverStyles.notificationMessage}>Account recovered successfully!</Text>
              <Pressable style={recoverStyles.notificationButton} onPress={handleSuccessClose}>
                <Text style={recoverStyles.notificationButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

export default Recover;
