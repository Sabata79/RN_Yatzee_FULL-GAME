/**
* Settings screen component for managing player settings such as audio preferences,
* account linking, and data wiping.
*
* Usage: import SettingScreen from './SettingScreen';
*   
* @module screens/SettingScreen
* @author Sabata79
* @since 2025-08-29
*/
import { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ImageBackground, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import Linked from '../services/Linked';
import settingScreenStyles from '../styles/SettingScreenStyles';
import { useGame } from '../constants/GameContext';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { remove, dbRef, dbUpdate } from '../services/Firebase';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAudio } from '../services/AudioManager';
import { sanitizeInput, checkIfNameExists } from '../services/nameUtils';

const SettingScreen = () => {
  // ⬅️ Haetaan useAudio vain KERRAN, ei duplikaatteja
  const { musicMuted, setMusicMuted, sfxMuted, setSfxMuted, playSelect } = useAudio();

  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialLoad = useRef(true);

  const navigation = useNavigation();
  const [wipeDataModalVisible, setWipeDataModalVisible] = useState(false);
  const [wipeNameInput, setWipeNameInput] = useState('');
  const [wipeError, setWipeError] = useState('');
  const [wiping, setWiping] = useState(false);

  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);
  const { playerId, playerName, isLinked, setIsLinked, setPlayerId, setPlayerName } = useGame();

  // Mute handlerit: Provider hoitaa pause/resume → ei stop/play kutsuja
  const handleMusicMuted = (muted) => {
    setMusicMuted(muted);
  };

  const handleSfxMuted = async (muted) => {
    setSfxMuted(muted);
    if (!muted) { try { await playSelect(); } catch {} }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      setIsLoaded(true);
      isInitialLoad.current = false;
    })();
    return () => { mounted = false; };
  }, []);

  // Player name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(playerName);
  useEffect(() => { setEditName(playerName); }, [playerName]);

  const editNameInputRef = useRef(null);
  const handleSaveName = async () => {
    const cleanedName = sanitizeInput(editName);
    if (cleanedName === '') {
      Alert.alert('Name is required', 'Please enter your name.');
      return;
    } else if (cleanedName.length < 3 || cleanedName.length > 10) {
      Alert.alert('Invalid Name Length', 'Please enter a nickname with 3-10 characters.');
      return;
    } else if (cleanedName === playerName) {
      setIsEditingName(false);
      return;
    } else {
      const nameExists = await checkIfNameExists(cleanedName);
      if (nameExists && cleanedName !== playerName) {
        Alert.alert('Name already in use', 'That nickname is already in use. Please choose another.');
        return;
      }
    }
    await dbUpdate(`players/${playerId}`, { name: cleanedName });
    setPlayerName(cleanedName);
    setIsEditingName(false);
  };

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
            <Ionicons name="person-outline" size={22} color="#F5F5F5" style={settingScreenStyles.muteIcon} />
            {isEditingName ? (
              <TextInput
                ref={editNameInputRef}
                style={[settingScreenStyles.name, { backgroundColor: '#222', color: '#FFD600', paddingHorizontal: 8, borderRadius: 6, minWidth: 80 }]}
                value={editName}
                onChangeText={text => setEditName(sanitizeInput(text))}
                maxLength={10}
                autoFocus
                onSubmitEditing={handleSaveName}
                onBlur={() => setIsEditingName(false)}
                placeholder="Enter name"
                placeholderTextColor="#888"
                returnKeyType="done"
              />
            ) : (
              <Text style={settingScreenStyles.name}>{playerName}</Text>
            )}
            {isEditingName ? (
              <TouchableOpacity onPress={handleSaveName}>
                <Feather name="check" size={18} color="#FFD600" style={settingScreenStyles.editIcon} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => { setEditName(playerName); setIsEditingName(true); setTimeout(() => editNameInputRef.current && editNameInputRef.current.focus(), 100); }}>
                <Feather name="edit-2" size={18} color="#FFD600" style={settingScreenStyles.editIcon} />
              </TouchableOpacity>
            )}
          </View>

          <View style={settingScreenStyles.nameRow}>
            <MaterialCommunityIcons name="identifier" style={settingScreenStyles.idIcon} />
            <Text style={settingScreenStyles.playerId}>{playerId}</Text>
          </View>

          {/* Music on/off */}
          <View style={settingScreenStyles.row}>
            <TouchableOpacity onPress={() => handleMusicMuted(!musicMuted)}>
              <Ionicons name={musicMuted ? 'volume-mute' : 'volume-high'} size={22} color={musicMuted ? '#aaa' : '#f1c40f'} style={settingScreenStyles.muteIcon} />
            </TouchableOpacity>
            <Text style={settingScreenStyles.rowLabel}>Music {musicMuted ? 'Off' : 'On'}</Text>
          </View>

          {/* SFX on/off */}
          <View style={settingScreenStyles.row}>
            <TouchableOpacity onPress={() => handleSfxMuted(!sfxMuted)}>
              <Ionicons name={sfxMuted ? 'volume-mute' : 'volume-high'} size={22} color={sfxMuted ? '#aaa' : '#f1c40f'} style={settingScreenStyles.muteIcon} />
            </TouchableOpacity>
            <Text style={settingScreenStyles.rowLabel}>SFX {sfxMuted ? 'Off' : 'On'}</Text>
          </View>

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
              <FontAwesome5 name="link" size={18} color='#f1c40f' style={{ marginRight: 8 }} />
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
                        await remove(dbRef(`players/${playerId}`));
                        await SecureStore.deleteItemAsync('user_id');
                        await AsyncStorage.clear();
                        setIsLinked(false);
                        setPlayerId('');
                        setPlayerName('');
                        setWipeDataModalVisible(false);
                        Alert.alert(
                          'All data deleted',
                          'Your account and all data have been wiped.',
                          [{
                            text: 'OK',
                            onPress: () => {
                              try { BackHandler.exitApp(); }
                              catch {
                                if (navigation && navigation.navigate) navigation.navigate('Home');
                              }
                            }
                          }]
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
                    {wiping ? <ActivityIndicator color='#F5F5F5' /> : <Text style={settingScreenStyles.modalOkText}>OK</Text>}
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
