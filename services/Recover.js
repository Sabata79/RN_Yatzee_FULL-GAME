import React, { useState } from 'react';
import { StyleSheet, Modal, View, Text, TextInput, Pressable, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { auth, database } from '../components/Firebase';
import { useGame } from '../components/GameContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, update, get, remove } from 'firebase/database';
import * as Updates from 'expo-updates';

const Recover = ({ isVisible, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Toggle for password visibility

    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorModalTitle, setErrorModalTitle] = useState('');
    const [errorModalMessage, setErrorModalMessage] = useState('');

    const { playerId, setPlayerId, setIsLinked } = useGame();

    const handleRecoverAccount = async () => {
        if (!email.trim() || password.length < 6) {
            setErrorModalTitle("Invalid Input");
            setErrorModalMessage("Please enter a valid email and a password with at least 6 characters.");
            setErrorModalVisible(true);
            return;
        }

        try {
            const oldUid = playerId;

            if (auth.currentUser) {
                await auth.signOut();
            }

            const result = await signInWithEmailAndPassword(auth, email, password);
            const currentUser = result.user;
            console.log("Recovered account, UID:", currentUser.uid);
            const newUid = currentUser.uid;

            if (oldUid && oldUid !== newUid) {
                const oldPlayerRef = ref(database, `players/${oldUid}`);
                const snapshot = await get(oldPlayerRef);
                const oldData = snapshot.val() || {};

                const newPlayerRef = ref(database, `players/${newUid}`);
                await update(newPlayerRef, { ...oldData, isLinked: true });

                await remove(oldPlayerRef);
            } else {
                const newPlayerRef = ref(database, `players/${newUid}`);
                await update(newPlayerRef, { isLinked: true });
            }

            await SecureStore.setItemAsync("user_id", newUid);
            setPlayerId(newUid);
            setIsLinked(true);

            setSuccessModalVisible(true);
        } catch (error) {
            setErrorModalTitle("Recovery Error");
            setErrorModalMessage(error.message);
            setErrorModalVisible(true);
        }
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

                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Enter your password"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <FontAwesome5 name={showPassword ? "eye-slash" : "eye"} size={20} color="gray" />
                            </TouchableOpacity>
                        </View>

                        <Pressable
                            style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
                            onPress={handleRecoverAccount}
                        >
                            <Text style={styles.buttonText}>Recover Account</Text>
                            <FontAwesome5 name="redo" size={20} color="gold" />
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
                            onPress={onClose}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
    actionButton: {
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
        marginRight: 8,
    },
    buttonPressed: {
        opacity: 0.7,
    },
});

export default Recover;
