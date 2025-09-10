

import React, { useState, useEffect } from 'react';

import audioManager from '../services/AudioManager';
import { View, Text, Pressable, ImageBackground, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import Linked from '../services/Linked';
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
    const [isLoaded, setIsLoaded] = useState(false);

    // Load audio settings from AudioManager on mount
    useEffect(() => {
        let mounted = true;
        (async () => {
            await audioManager.loadSettings();
            if (mounted) {
                console.log('[SFX] useEffect: asetusten lataus, arvo:', audioManager.sfxVolume);
                setMusicVolume(audioManager.musicVolume);
                setMusicMuted(audioManager.musicMuted);
                setSfxVolume(audioManager.sfxVolume);
                setSfxMuted(audioManager.sfxMuted);
                setIsLoaded(true);
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Estä sliderin arvojen päivitys AudioManagerista päin kun isLoaded=true
    // (ei tarvita enää, koska sliderin arvoa ei päivitetä missään muualla kuin käyttäjän toimesta)

    // Handlers to update AudioManager and persist settings
    const handleMusicVolume = (value) => {
        console.log('[MUSIC] handleMusicVolume: käyttäjä säätää, arvo:', value, 'isLoaded:', isLoaded);
        setMusicVolume(value);
        audioManager.setMusicVolume(value);
    };

    // Toista musiikki preview vain kun käyttäjä lopettaa sliderin säädön
    const handleMusicSlidingComplete = (value) => {
        console.log('[MUSIC] handleMusicSlidingComplete: käyttäjä lopetti säädön, arvo:', value, 'isLoaded:', isLoaded);
        // Ei preview-soittoa, mutta tähän voisi lisätä esim. pienen preview-soiton jos halutaan
    };
    const handleMusicMuted = (muted) => {
        setMusicMuted(muted);
        audioManager.setMusicMuted(muted);
        if (!muted) {
            audioManager.playMusic(); // Käynnistä musiikki uudelleen jos mute pois päältä
        }
    };
    const handleSfxVolume = (value) => {
        console.log('[SFX] handleSfxVolume: käyttäjä säätää, arvo:', value, 'isLoaded:', isLoaded);
        setSfxVolume(value);
        audioManager.setSfxVolume(value);
    };

    // Toista SFX-ääni vain kun käyttäjä lopettaa sliderin säädön
    const handleSfxSlidingComplete = (value) => {
        console.log('[SFX] handleSfxSlidingComplete: käyttäjä lopetti säädön, arvo:', value, 'isLoaded:', isLoaded);
        if (!sfxMuted && isLoaded) {
            audioManager.playSfx();
        }
    };
    const handleSfxMuted = (muted) => {
        setSfxMuted(muted);
        audioManager.setSfxMuted(muted);
    };
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
                            <TouchableOpacity onPress={() => handleMusicMuted(!musicMuted)}>
                                <Ionicons name={musicMuted ? 'volume-mute' : 'volume-high'} size={22} color={musicMuted ? '#aaa' : '#FFD600'} style={settingScreenStyles.muteIcon} />
                            </TouchableOpacity>
                            <Text style={settingScreenStyles.rowLabel}>Music</Text>
                        </View>
                        {/* Music step indicators as numbers (10 steps) */}
                        <View style={settingScreenStyles.stepIndicatorRow}>
                            {Array.from({length: 10}, (_, i) => i).map((i) => {
                                const v = i * 0.1;
                                const isActive = Math.abs(musicVolume - v) < 0.05;
                                return (
                                    <Text
                                        key={i}
                                        style={[settingScreenStyles.stepNumber, isActive && settingScreenStyles.stepNumberActive]}
                                    >
                                        {i+1}
                                    </Text>
                                );
                            })}
                        </View>
                        <Slider
                            style={settingScreenStyles.slider}
                            minimumValue={0}
                            maximumValue={0.9}
                            step={0.1}
                            value={musicVolume}
                            onValueChange={handleMusicVolume}
                            onSlidingComplete={handleMusicSlidingComplete}
                            minimumTrackTintColor="#FFD600"
                            maximumTrackTintColor="#888"
                            thumbTintColor="#FFD600"
                            disabled={musicMuted || !isLoaded}
                        />

                        {/* SFX row */}
                        <View style={settingScreenStyles.row}>
                            <TouchableOpacity onPress={() => handleSfxMuted(!sfxMuted)}>
                                <Ionicons name={sfxMuted ? 'volume-mute' : 'volume-high'} size={22} color={sfxMuted ? '#aaa' : '#FFD600'} style={settingScreenStyles.muteIcon} />
                            </TouchableOpacity>
                            <Text style={settingScreenStyles.rowLabel}>SFX</Text>
                        </View>
                        {/* SFX step indicators as numbers */}
                        <View style={settingScreenStyles.stepIndicatorRow}>
                            {Array.from({length: 5}, (_, i) => i).map((i) => {
                                const v = i * 0.25;
                                const isActive = Math.abs(sfxVolume - v) < 0.13;
                                return (
                                    <Text
                                        key={i}
                                        style={[settingScreenStyles.stepNumber, isActive && settingScreenStyles.stepNumberActive]}
                                    >
                                        {i+1}
                                    </Text>
                                );
                            })}
                        </View>
                        <Slider
                            style={settingScreenStyles.slider}
                            minimumValue={0}
                            maximumValue={1}
                            step={0.25}
                            value={sfxVolume}
                            onValueChange={handleSfxVolume}
                            onSlidingComplete={handleSfxSlidingComplete}
                            minimumTrackTintColor="#FFD600"
                            maximumTrackTintColor="#888"
                            thumbTintColor="#FFD600"
                            disabled={sfxMuted || !isLoaded}
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