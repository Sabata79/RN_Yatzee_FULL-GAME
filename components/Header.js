import React, { useState } from 'react';
import { View, Text, Pressable, Image, Modal } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PlayerCard from './PlayerCard';
import EnergyTokenSystem from './EnergyTokenSystem';
import headerStyles from '../styles/headerStyles';
import { useGame } from './GameContext';
import { avatars } from '../constants/AvatarPaths';

export default function Header() {
  const [isModalVisible, setModalVisible] = useState(false);
  const {
    playerId,
    playerName,
    userRecognized,
    avatarUrl,
    isLinked,
    playerLevel,
    setPlayerLevel,
  } = useGame();

  const userAvatar = avatars.find((avatar) => avatar.path === avatarUrl)?.display;

  const isBeginnerAvatar = (avatarPath) => {
    const avatar = avatars.find(av => av.path === avatarPath);
    return avatar && avatar.level === 'Beginner';
  };

  const selectedPlayer = {
    playerId: playerId,
    playerName: playerName,
  };

  console.log('selectedPlayer:', selectedPlayer);

  const handleGamePlay = () => {
    console.log('Peli aloitettu!');
  };

  return (
    <View style={headerStyles.header}>
      {/* Header/Logo */}
      <View style={headerStyles.section1}>
        <Text style={headerStyles.headerTitle}>SMR</Text>
        <Image source={require('../assets/desktopIcon.webp')} style={headerStyles.headerImage} />
      </View>

      {/* EnergyTokenSystem */}
      {userRecognized && (
        <View style={headerStyles.section2}>
          <EnergyTokenSystem onPlay={handleGamePlay} />
        </View>
      )}

      {/* UserName */}
      {userRecognized && playerName && (
        <Pressable onPress={() => setModalVisible(true)}>
          <View style={headerStyles.section3}>
            <Text style={headerStyles.userName}>{playerName}</Text>
          </View>
        </Pressable>
      )}

      {/* Avatar */}
      {userRecognized && (
        <Pressable onPress={() => setModalVisible(true)}>
          <View style={headerStyles.section4}>
            <View style={{ position: 'relative' }}>
              {userAvatar ? (
                <Image
                  source={userAvatar}
                  style={[
                    isBeginnerAvatar(avatarUrl)
                      ? headerStyles.beginnerAvatar
                      : headerStyles.headerAvatarImage,
                  ]}
                />
              ) : (
                <FontAwesome5
                  name="user"
                  size={22}
                  color="white"
                  style={headerStyles.defaultUserIcon}
                />
              )}
              {isLinked && (
                <View
                  style={[
                    isBeginnerAvatar(avatarUrl)
                      ? headerStyles.beginnerLinkIconContainer
                      : headerStyles.linkIconContainer,
                  ]}
                >
                  <FontAwesome5 name="link" size={10} color="gold" />
                </View>
              )}
            </View>
          </View>
        </Pressable>
      )}

      {/* PlayerCard modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedPlayer && (
          <PlayerCard
            playerId={selectedPlayer.playerId}
            playerName={selectedPlayer.playerName}
            isModalVisible={isModalVisible}
            setModalVisible={setModalVisible}
            playerScores={selectedPlayer.playerScores}
          />
        )}
      </Modal>
    </View>
  );
}
