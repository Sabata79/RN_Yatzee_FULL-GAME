/**
 * Header.js - App header component with logo, avatar, and energy tokens
 *
 * Displays the app header, logo, avatar, and energy token system.
 *
 * Usage:
 *   import Header from './Header';
 *   ...
 *   <Header />
 *
 * @module screens/Header
 * @author Sabata79
 * @since 2025-09-06
 */

import { useState } from 'react';
import { View, Text, Pressable, Image, Modal } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PlayerCard from '../components/PlayerCard';
import EnergyTokenSystem from '../components/EnergyTokenSystem';
import headerStyles from '../styles/HeaderStyles';
import { useGame } from '../constants/GameContext';
import { avatars } from '../constants/AvatarPaths';

export default function Header() {
  const [isModalVisible, setModalVisible] = useState(false);
  const {
    playerId,
    playerName,
    userRecognized,
    avatarUrl,
    isLinked,
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

  return (
    <View style={headerStyles.header}>
      {/* Header/Logo */}
      <View style={headerStyles.section1}>
        <Image source={require('../../assets/whiteDicesHeaderLogo.webp')} style={headerStyles.headerImage} />
      </View>

      {/* EnergyTokenSystem */}
      {userRecognized && (
        <View style={headerStyles.centerOverlay}>
          <EnergyTokenSystem />
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
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <PlayerCard
            playerId={selectedPlayer?.playerId ?? ""}
            playerName={selectedPlayer?.playerName ?? ""}
            isModalVisible={isModalVisible}
            setModalVisible={setModalVisible}
            playerScores={selectedPlayer?.playerScores ?? []}
          />
        </View>
      </Modal>
    </View>
  );
}
