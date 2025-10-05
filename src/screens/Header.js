/**
 * Header.js - App header component with logo, avatar, and energy tokens
 *
 * Keeps the player name perfectly centered by mirroring the left slot width
 * (logo + energy bar) to the right slot (avatar). This avoids absolute layouts
 * and keeps the center aligned on all screen widths.
 *
 * @module screens/Header
 * @author Sabata79
 * @since 2025-09-06
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Pressable, Image, Modal, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PlayerCard from '../components/PlayerCard';
import EnergyTokenSystem from '../components/EnergyTokenSystem';
import headerStyles from '../styles/HeaderStyles';
import { useGame } from '../constants/GameContext';
import { avatars } from '../constants/AvatarPaths';

const _norm = (s) => String(s || '').replace(/\\/g, '/').replace(/^\.\//, '');
const _last2 = (s) => _norm(s).split('/').slice(-2).join('/').toLowerCase();

function findAvatarMeta(rawPath) {
  const target = _norm(rawPath);
  if (!target) return null;
  const key = _last2(target);
  const hit = avatars.find(av => {
    const ap = _norm(av.path);
    return ap === target || _last2(ap) === key;
  });
  return hit || null;
}

function resolveUserAvatarDisplay(rawPath) {
  return findAvatarMeta(rawPath)?.display;
}

function Header() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [leftWidth, setLeftWidth] = useState(0);

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const CENTER_MIN = Math.floor(SCREEN_WIDTH * 0.4);
  const MIN_RIGHT = 56;
  const MAX_MIRROR = Math.floor(SCREEN_WIDTH * 0.4); // clamp so left cannot push name off-center

  const {
    playerId,
    playerName,
    userRecognized,
    avatarUrl,
    isLinked,
  } = useGame();

  // Memoize derived avatar display and beginner check to avoid repeated lookups
  const userAvatar = useMemo(() => resolveUserAvatarDisplay(avatarUrl), [avatarUrl]);
  const isBeginner = useMemo(() => {
    try {
      const avatar = findAvatarMeta(avatarUrl);
      return !!avatar && String(avatar.level || '').toLowerCase() === 'beginner';
    } catch (e) { return false; }
  }, [avatarUrl]);

  // Stable callback to open modal
  const openModal = useCallback(() => setModalVisible(true), []);

  // Mirror width calculation memoized
  const mirroredWidth = useMemo(() => Math.max(
    MIN_RIGHT,
    Math.min(leftWidth, Math.max(0, SCREEN_WIDTH - leftWidth - CENTER_MIN))
  ), [leftWidth, SCREEN_WIDTH]);

  const selectedPlayer = useMemo(() => ({ playerId, playerName }), [playerId, playerName]);

  return (
    <View style={headerStyles.header}>
      {/* Left: logo + energy (measured) */}
      <View
        style={headerStyles.sectionLeft}
        onLayout={(e) => setLeftWidth(e.nativeEvent.layout.width)}
      >
        <Image
          source={require('../../assets/whiteDicesHeaderLogo.webp')}
          style={headerStyles.headerImage}
        />
        {userRecognized && (
          <View style={headerStyles.energyWrap}>
            <EnergyTokenSystem />
          </View>
        )}
      </View>

      {/* Center: always centered name */}
      <View style={headerStyles.sectionCenter}>
        {userRecognized && !!playerName && (
          <Pressable onPress={openModal} style={headerStyles.userNamePressable}>
            <Text style={headerStyles.userName} numberOfLines={1} ellipsizeMode="tail">
              {playerName}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Right: avatar – width mirrored from left */}
      {userRecognized ? (
        <Pressable onPress={openModal}>
          <View style={[headerStyles.sectionRight, { width: mirroredWidth }]}>
            <View style={{ position: 'relative' }}>
              {userAvatar ? (
                <Image
                  source={userAvatar}
                  style={[
                    isBeginner
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
                    isBeginner
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
      ) : (
        <View style={[headerStyles.sectionRight, { width: mirroredWidth }]} />
      )}

      {/* PlayerCard modal */}
      <Modal
        animationType="fade"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <PlayerCard
            playerId={selectedPlayer?.playerId ?? ''}
            playerName={selectedPlayer?.playerName ?? ''}
            isModalVisible={isModalVisible}
            setModalVisible={setModalVisible}
            playerScores={selectedPlayer?.playerScores ?? []}
          />
        </View>
      </Modal>
    </View>
  );
}

export default React.memo(Header);