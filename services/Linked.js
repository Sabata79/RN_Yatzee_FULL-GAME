import React, { useState } from 'react';
import { StyleSheet, Modal, View, Text, TextInput, Pressable, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getAuth, EmailAuthProvider, linkWithCredential } from '@react-native-firebase/auth';
import { signInAnon, dbGet, dbUpdate, dbRef, remove as dbRemove } from '../components/Firebase';
import { useGame } from '../components/GameContext';

const Linked = ({ isVisible, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const { playerId, setPlayerId, setIsLinked } = useGame();

  const handleLinkAccount = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      Alert.alert('Invalid input', 'Please enter a valid email and a password with at least 6 characters.');
      return;
    }

    try {
      setBusy(true);
      const auth = getAuth();

      // Varmista että currentUser on olemassa (anon fallback)
      if (!auth.currentUser) {
        console.log('[Link] No currentUser → signInAnon fallback');
        const res = await signInAnon(); // sun wrapperi
        console.log('[Link] Signed in anonymously, uid:', res?.user?.uid);
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'User is not signed in.');
        return;
      }

      console.log('[Link] Linking credential to uid:', currentUser.uid);
      const cred = EmailAuthProvider.credential(trimmedEmail, password);
      await linkWithCredential(currentUser, cred);
      const newUid = currentUser.uid;
      console.log('[Link] Link success, uid (same):', newUid);

      // Migraatio jos id vaihtuu (yleensä EI linkityksessä)
      const oldUuid = playerId;
      if (oldUuid && oldUuid !== newUid) {
        console.log('[Link] Migrating data from', oldUuid, '→', newUid);
        const oldSnap = await dbGet(`players/${oldUuid}`);
        const oldData = oldSnap.val() || {};
        await dbUpdate(`players/${newUid}`, { ...oldData, isLinked: true });
        await dbRemove(dbRef(`players/${oldUuid}`));
      } else {
        await dbUpdate(`players/${newUid}`, { isLinked: true });
      }

      await SecureStore.setItemAsync('user_id', newUid);
      setPlayerId(newUid);
      setIsLinked(true);

      Alert.alert('Success', 'Account linked successfully!', [
        { text: 'OK', onPress: () => onClose?.() },
      ]);
    } catch (error) {
      console.log('[Link] Error:', error);
      // Näytä yleiset Firebase-virheet ihmiselle järkevämmin
      let msg = error?.message ?? String(error);
      if (error?.code === 'auth/email-already-in-use') {
        msg = 'This email is already in use. Try recovering the account instead.';
      } else if (error?.code === 'auth/invalid-email') {
        msg = 'Email address is invalid.';
      } else if (error?.code === 'auth/weak-password') {
        msg = 'Password is too weak (min 6 characters).';
      } else if (error?.code === 'auth/credential-already-in-use') {
        msg = 'These credentials are already linked to another account.';
      }
      Alert.alert('Linking failed', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent={true} animationType="slide" visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Link your account</Text>
          <Text style={styles.modalText}>Enter your email and password to link your account.</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
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
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={busy}>
              <FontAwesome5 name={showPassword ? 'eye-slash' : 'eye'} size={20} color="gray" />
            </TouchableOpacity>
          </View>

          <Pressable
            style={({ pressed }) => [styles.linkButton, pressed && !busy && styles.buttonPressed, busy && { opacity: 0.6 }]}
            onPress={handleLinkAccount}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Link Account</Text>
                <FontAwesome5 name="link" size={20} color="gold" />
              </>
            )}
          </Pressable>

          <Pressable style={styles.closeButton} onPress={busy ? undefined : onClose} disabled={busy}>
            <Text style={styles.buttonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff', width: '80%', borderRadius: 10, padding: 20, alignItems: 'center',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  modalText: { fontSize: 16, color: '#555', marginBottom: 20, textAlign: 'center' },
  input: {
    width: '100%', padding: 12, borderColor: '#ccc', borderWidth: 1,
    borderRadius: 5, marginBottom: 20, fontSize: 16, color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    borderColor: '#ccc', borderWidth: 1, borderRadius: 5, padding: 12, marginBottom: 20,
  },
  passwordInput: { flex: 1, fontSize: 16, color: '#333' },
  linkButton: {
    backgroundColor: '#62a346', padding: 12, borderRadius: 5,
    width: '100%', alignItems: 'center', marginBottom: 10, flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  buttonPressed: { opacity: 0.7 },
  closeButton: { backgroundColor: '#999', padding: 12, borderRadius: 5, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
});

export default Linked;
