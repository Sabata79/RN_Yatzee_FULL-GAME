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
import { View, Text, Pressable, Image, ImageBackground, TouchableOpacity, TextInput, Alert, Platform, BackHandler, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import LinkedModal from '../components/modals/LinkedModal';
import settingScreenStyles from '../styles/SettingScreenStyles';
import playerCardStyles from '../styles/PlayerCardStyles';
import { useGame } from '../constants/GameContext';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { remove, dbRef, dbUpdate } from '../services/Firebase';
import { useNavigation } from '@react-navigation/native';
import { useAudio } from '../services/AudioManager';
import { sanitizeInput, checkIfNameExists } from '../services/nameUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WipeModal from '../components/modals/WipeModal';
import CustomKeyboard from '../components/CustomKeyboard';
import PlayerCardBGSelector from '../components/PlayerCardBGSelector';

const SettingScreen = () => {
  const { musicMuted, setMusicMuted, sfxMuted, setSfxMuted, playSelect } = useAudio();

  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialLoad = useRef(true);

  const navigation = useNavigation();
  const [isLinkModalVisible, setIsLinkModalVisible] = useState(false);

  const { playerId, playerName, isLinked, setIsLinked, setPlayerId, setPlayerName } = useGame();

  const insets = useSafeAreaInsets();

  // Custom-näppis nimen editointiin
  const [kbVisible, setKbVisible] = useState(false);

  // WipeModal
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wiping, setWiping] = useState(false);

  const handleMusicMuted = (muted) => {
    setMusicMuted(muted);
  };

  const handleSfxMuted = async (muted) => {
    setSfxMuted(muted);
    if (!muted) {
      try { await playSelect(); } catch { }
    }
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
      setKbVisible(false);
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
    setKbVisible(false);
  };

  // Wipe account function
  const wipeAccount = async () => {
    if (wiping) return;
    setWiping(true);
    try {
      await remove(dbRef(`players/${playerId}`));
      await SecureStore.deleteItemAsync('user_id');
      await AsyncStorage.clear();

      setIsLinked(false);
      setPlayerId('');
      setPlayerName('');

      setWipeOpen(false);
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
      Alert.alert('Error', e?.message || String(e));
    } finally {
      setWiping(false);
    }
  };

  return (
    <View style={settingScreenStyles.root}>
      <ImageBackground
        source={require('../../assets/diceBackground.webp')}
        style={settingScreenStyles.background}
        resizeMode="cover"
      >
  <View style={settingScreenStyles.overlay} pointerEvents="none" />
        <Text style={settingScreenStyles.title}>PLAYER SETTINGS</Text>
        <ScrollView
          style={settingScreenStyles.card}
          contentContainerStyle={[settingScreenStyles.cardContent, { paddingBottom: (insets?.bottom || 0) + 150 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* Section 1: User + audio */}
          <View style={settingScreenStyles.section}>
            <View style={settingScreenStyles.sectionCard}>
                {/* Linked ribbon in top-left of section 1 when user is linked */}
                {isLinked && (
                  <View style={playerCardStyles.ribbonLinkedImageWrapper} pointerEvents="none">
                    <Image source={require('../../assets/ribbonlinked.webp')} style={playerCardStyles.ribbonImage} />
                    <View style={[playerCardStyles.nameAndLinkContainer, { position: 'absolute', left: 8, top: 8, zIndex: 40, transform: [{ rotate: '-45deg' }] }]}> 
                      <FontAwesome5 name="link" size={12} color='white' style={playerCardStyles.ribbonIcon} />
                      <Text style={playerCardStyles.ribbonLinkedLabel}>Linked</Text>
                    </View>
                  </View>
                )}
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
                    showSoftInputOnFocus={false}
                    onFocus={() => setKbVisible(true)}
                    onBlur={() => setKbVisible(false)}
                  />
                ) : (
                  <Text style={settingScreenStyles.name}>{playerName}</Text>
                )}

                {isEditingName ? (
                  <TouchableOpacity onPress={handleSaveName}>
                    <View style={settingScreenStyles.rowLabel}>
                      <Text style={[settingScreenStyles.linkButtonText, { paddingLeft: 4, paddingTop: 2, color: "#FFD600" }]}>OK</Text>
                      <Feather name="check" size={24} color="#FFD600" style={settingScreenStyles.editIcon} />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setEditName(playerName);
                      setIsEditingName(true);
                      setTimeout(() => { editNameInputRef.current?.focus(); }, 100);
                    }}
                  >
                    <Feather name="edit-2" size={18} color="#FFD600" style={settingScreenStyles.editIcon} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={settingScreenStyles.nameRow}>
                <MaterialCommunityIcons name="identifier" style={settingScreenStyles.idIcon} />
                <Text style={settingScreenStyles.playerId}>{playerId}</Text>
              </View>

              {/* Audio controls moved to their own section below */}
            </View>
          </View>

          {/* Section: Audio controls */}
          <Text style={settingScreenStyles.sectionTitle}>AUDIO</Text>
          <View style={settingScreenStyles.section}>
            <View style={settingScreenStyles.sectionCard}>
              <View style={settingScreenStyles.rowMusic}>
                <TouchableOpacity onPress={() => handleMusicMuted(!musicMuted)}>
                  <Ionicons name={musicMuted ? 'volume-mute' : 'volume-high'} size={22} color={musicMuted ? '#aaa' : '#f1c40f'} style={settingScreenStyles.muteIcon} />
                </TouchableOpacity>
                <Text style={[settingScreenStyles.rowLabel, { flex: 0 }]}>Music {musicMuted ? 'Off' : 'On'}</Text>
              </View>

              <View style={settingScreenStyles.rowMusic}>
                <TouchableOpacity onPress={() => handleSfxMuted(!sfxMuted)}>
                  <Ionicons name={sfxMuted ? 'volume-mute' : 'volume-high'} size={22} color={sfxMuted ? '#aaa' : '#f1c40f'} style={settingScreenStyles.muteIcon} />
                </TouchableOpacity>
                <Text style={[settingScreenStyles.rowLabel, { flex: 0 }]}>SFX {sfxMuted ? 'Off' : 'On'}</Text>
              </View>
            </View>
          </View>

          {/* Section 2: Background selector */}
          <Text style={settingScreenStyles.sectionTitle}>PLAYER CARD BACKGROUND</Text>
          <View style={settingScreenStyles.section}>
            <View style={settingScreenStyles.sectionCard}>
              <View style={[settingScreenStyles.row, { marginLeft: 0 }]}>
                <PlayerCardBGSelector />
              </View>
            </View>
          </View>

          {/* Section 3: Link account + wipe */}
          <Text style={settingScreenStyles.sectionTitle}>ACCOUNT MANAGEMENT</Text>
          <View style={settingScreenStyles.section}>
            <View style={settingScreenStyles.sectionCard}>
              {/* Link button area: only render when user is NOT linked. If linked, the ribbon in section 1 shows status. */}
              {!isLinked && (
                <>
                  <View style={settingScreenStyles.linkButtonContainer}>
                    <View style={settingScreenStyles.linkShadowLayer} />
                    <Pressable
                      style={({ pressed }) => [settingScreenStyles.linkButton, pressed && settingScreenStyles.linkButtonPressed]}
                      onPress={() => setIsLinkModalVisible(true)}
                    >
                      <FontAwesome5 name="link" size={18} color="#f1c40f" style={{ marginRight: 8 }} />
                      <Text style={settingScreenStyles.linkButtonText}>Link your account</Text>
                    </Pressable>
                  </View>

                  <LinkedModal
                    visible={isLinkModalVisible}
                    onClose={() => setIsLinkModalVisible(false)}
                    bottomInset={insets.bottom}
                    bottomOffset={75}
                    dark
                  />
                </>
              )}

              <View style={settingScreenStyles.linkButtonContainer}>
                <View style={settingScreenStyles.linkShadowLayer} />
                <Pressable
                  style={({ pressed }) => [settingScreenStyles.wipeButton, pressed && settingScreenStyles.wipeButtonPressed]}
                  onPress={() => setWipeOpen(true)}
                >
                  <FontAwesome5 name="trash" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={settingScreenStyles.wipeButtonText}>Wipe all your data</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* WipeModal (ohut UI), varsinainen wipeAccount tässä komponentissa */}
        <WipeModal
          visible={wipeOpen}
          onCancel={() => setWipeOpen(false)}
          onConfirm={wipeAccount}
          confirmWord={playerName}
          title="Delete all your data?"
          description="This will permanently delete your account, all progress, and linked info. This cannot be undone!"
          bottomInset={insets.bottom}
          bottomOffset={75}
          okLabel="OK"
          cancelLabel="Cancel"
          dark
          busy={wiping}
        />

        {Platform.OS === "android" && (
          <CustomKeyboard
            visible={kbVisible}
            bottomInset={insets.bottom}
            bottomOffset={75}
            enableSpecials={false}
            onInsert={(ch) => setEditName((prev) => (prev + ch).slice(0, 10))}
            onBackspace={() => setEditName((prev) => prev.slice(0, -1))}
            onSubmit={handleSaveName}
            onHide={() => { editNameInputRef.current?.blur(); setKbVisible(false); }}
          />
        )}

      </ImageBackground>
    </View>
  );
};

export default SettingScreen;
