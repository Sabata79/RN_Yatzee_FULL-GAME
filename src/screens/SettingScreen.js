

import React, { useState } from 'react';
import { View, Text, Pressable, ImageBackground, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import Linked from '../services/Linked';
import HomeScreenButton from '../components/HomeScreenButton';
import Slider from '@react-native-community/slider';
import settingScreenStyles from '../styles/SettingScreenStyles';
import { useGame } from '../constants/GameContext';
import * as SecureStore from 'expo-secure-store';
import { remove, dbRef } from '../services/Firebase';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SettingScreen = () => {
    const [musicVolume, setMusicVolume] = useState(0.5);
    const [musicMuted, setMusicMuted] = useState(false);
    const [sfxVolume, setSfxVolume] = useState(0.7);
    const [sfxMuted, setSfxMuted] = useState(false);
    const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
    const { playerId, playerName, isLinked, setIsLinked, setPlayerId, setPlayerName } = useGame();
    const navigation = useNavigation();
    const [wipeDataModalVisible, setWipeDataModalVisible] = useState(false);
    const [wipeNameInput, setWipeNameInput] = useState('');
    const [wipeError, setWipeError] = useState('');
    const [wiping, setWiping] = useState(false);

        return (
            <View style={settingScreenStyles.root}>
                <ImageBackground
                    source={require('../../assets/diceBackground.webp')}
                    style={settingScreenStyles.background}
                    resizeMode="cover"
                >
                    <View style={settingScreenStyles.overlay} />
                    <View style={settingScreenStyles.card}>
                        <Text style={settingScreenStyles.title}>PLAYER SETTINGS</Text>

                        <View style={settingScreenStyles.nameRow}>
                            <Ionicons name="person-outline" size={22} color="#fff" style={settingScreenStyles.muteIcon} />
                            <Text style={settingScreenStyles.name}>{playerName}</Text>
                            <TouchableOpacity onPress={() => {/* nimi editointi */}}>
                                <Feather name="edit-2" size={18} color="#FFD600" style={settingScreenStyles.editIcon} />
                            </TouchableOpacity>
                        </View>

                        <Text style={settingScreenStyles.playerId}>ID: {playerId}</Text>

                        {/* Music row */}
                        <View style={settingScreenStyles.row}>
                            <MaterialCommunityIcons name={musicMuted ? 'music-off' : 'music'} size={22} color={musicMuted ? '#aaa' : '#FFD600'} style={settingScreenStyles.muteIcon} />
                            <TouchableOpacity onPress={() => setMusicMuted(!musicMuted)}>
                                <Ionicons name={musicMuted ? 'volume-mute' : 'volume-high'} size={22} color={musicMuted ? '#aaa' : '#FFD600'} style={settingScreenStyles.muteIcon} />
                            </TouchableOpacity>
                            <Text style={settingScreenStyles.rowLabel}>Music</Text>
                        </View>
                        <Slider
                            style={settingScreenStyles.slider}
                            minimumValue={0}
                            maximumValue={1}
                            value={musicVolume}
                            onValueChange={setMusicVolume}
                            minimumTrackTintColor="#FFD600"
                            maximumTrackTintColor="#888"
                            thumbTintColor="#FFD600"
                            disabled={musicMuted}
                        />

                        {/* SFX row */}
                        <View style={settingScreenStyles.row}>
                            <MaterialCommunityIcons name={sfxMuted ? 'volume-off' : 'volume-medium'} size={22} color={sfxMuted ? '#aaa' : '#FFD600'} style={settingScreenStyles.muteIcon} />
                            <TouchableOpacity onPress={() => setSfxMuted(!sfxMuted)}>
                                <Ionicons name={sfxMuted ? 'volume-mute' : 'volume-high'} size={22} color={sfxMuted ? '#aaa' : '#FFD600'} style={settingScreenStyles.muteIcon} />
                            </TouchableOpacity>
                            <Text style={settingScreenStyles.rowLabel}>SFX</Text>
                        </View>
                        <Slider
                            style={settingScreenStyles.slider}
                            minimumValue={0}
                            maximumValue={1}
                            value={sfxVolume}
                            onValueChange={setSfxVolume}
                            minimumTrackTintColor="#FFD600"
                            maximumTrackTintColor="#888"
                            thumbTintColor="#FFD600"
                            disabled={sfxMuted}
                        />
                        <View style={settingScreenStyles.linkButtonContainer}>
                            <View style={settingScreenStyles.linkShadowLayer} />
                            <Pressable
                                style={({ pressed }) => [
                                    settingScreenStyles.linkButton,
                                    isLinked && settingScreenStyles.linkButtonDisabled,
                                    pressed && settingScreenStyles.linkButtonPressed,
                                ]}
                                onPress={() => setIsLinkModalVisible(true)}
                                disabled={isLinked}
                            >
                                <FontAwesome5 name="link" size={18} color="#FFD600" style={{ marginRight: 8 }} />
                                <Text style={settingScreenStyles.linkButtonText}>Link your account</Text>
                            </Pressable>
                        </View>
                        <Linked
                            isVisible={isLinkModalVisible}
                            onClose={() => setIsLinkModalVisible(false)}
                        />

                        {/* Wipe all data button */}
                        <View style={settingScreenStyles.linkButtonContainer}>
                            <View style={settingScreenStyles.linkShadowLayer} />
                            <Pressable
                                style={({ pressed }) => [
                                    settingScreenStyles.wipeButton,
                                    pressed && settingScreenStyles.wipeButtonPressed,
                                ]}
                                onPress={() => {
                                    setWipeDataModalVisible(true);
                                    setWipeNameInput('');
                                    setWipeError('');
                                }}
                            >
                                <FontAwesome5 name="trash" size={16} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={settingScreenStyles.wipeButtonText}>Wipe all your data</Text>
                            </Pressable>
                        </View>

                        {/* Wipe confirmation modal */}
                        <Modal
                            transparent
                            visible={wipeDataModalVisible}
                            animationType="fade"
                            onRequestClose={() => setWipeDataModalVisible(false)}
                        >
                            <View style={settingScreenStyles.modalOverlay}>
                                <View style={settingScreenStyles.modalContent}>
                                    <Text style={settingScreenStyles.modalTitle}>Delete all your data?</Text>
                                    <Text style={settingScreenStyles.modalWarning}>
                                        This will permanently delete your account, all progress, and linked info. This cannot be undone!
                                    </Text>
                                    <Text style={settingScreenStyles.modalLabel}>Type your player name to confirm:</Text>
                                    <TextInput
                                        style={settingScreenStyles.modalInput}
                                        value={wipeNameInput}
                                        onChangeText={setWipeNameInput}
                                        autoCapitalize="none"
                                        placeholder="Player name"
                                        editable={!wiping}
                                    />
                                    {!!wipeError && <Text style={settingScreenStyles.modalError}>{wipeError}</Text>}
                                    <View style={{ flexDirection: 'row', marginTop: 18, justifyContent: 'space-between' }}>
                                        <Pressable
                                            style={settingScreenStyles.modalCancelBtn}
                                            onPress={() => setWipeDataModalVisible(false)}
                                            disabled={wiping}
                                        >
                                            <Text style={settingScreenStyles.modalCancelText}>Cancel</Text>
                                        </Pressable>
                                        <Pressable
                                            style={settingScreenStyles.modalOkBtn}
                                            onPress={async () => {
                                                setWipeError('');
                                                if (wipeNameInput.trim() !== playerName) {
                                                    setWipeError('Name does not match.');
                                                    return;
                                                }
                                                setWiping(true);
                                                try {
                                                    // Remove player data from Firebase
                                                    await remove(dbRef(`players/${playerId}`));
                                                    // Remove local storage
                                                    await SecureStore.deleteItemAsync('user_id');
                                                    // Unlink locally
                                                    setIsLinked(false);
                                                    setPlayerId('');
                                                    setPlayerName('');
                                                    setWipeDataModalVisible(false);
                                                    Alert.alert(
                                                        'All data deleted',
                                                        'Your account and all data have been wiped.',
                                                        [
                                                            {
                                                                text: 'OK',
                                                                onPress: () => {
                                                                    try {
                                                                        BackHandler.exitApp();
                                                                    } catch (e) {
                                                                        // fallback: navigate to Home if exitApp fails
                                                                        if (navigation && navigation.navigate) {
                                                                            navigation.navigate('Home');
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        ]
                                                    );
                                                } catch (e) {
                                                    console.log('Wipe error:', e);
                                                    setWipeError('Error deleting data: ' + (e?.message || e?.toString() || 'Unknown error'));
                                                } finally {
                                                    setWiping(false);
                                                }
                                            }}
                                            disabled={wiping}
                                        >
                                            {wiping ? <ActivityIndicator color="#fff" /> : <Text style={settingScreenStyles.modalOkText}>OK</Text>}
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </View>

                </ImageBackground>
            </View>
        );
};

export default SettingScreen;