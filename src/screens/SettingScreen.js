

import React, { useState } from 'react';
import { View, Text, Pressable, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import Linked from '../services/Linked';
import HomeScreenButton from '../components/HomeScreenButton';
import Slider from '@react-native-community/slider';
import settingScreenStyles from '../styles/SettingScreenStyles';
import { useGame } from '../constants/GameContext';

const SettingScreen = () => {
    const [musicVolume, setMusicVolume] = useState(0.5);
    const [musicMuted, setMusicMuted] = useState(false);
    const [sfxVolume, setSfxVolume] = useState(0.7);
    const [sfxMuted, setSfxMuted] = useState(false);
    const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
    const { playerId, playerName, isLinked } = useGame();

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
                    </View>

                </ImageBackground>
            </View>
        );
};

export default SettingScreen;