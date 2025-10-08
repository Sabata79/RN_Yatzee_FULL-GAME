/**
 * Header.js - App header component with logo, avatar, and energy tokens
 *
 * Keeps the player name perfectly centered by mirroring the left slot width
 * (logo + energy bar) to the right slot (avatar). This avoids absolute layouts
 * and keeps the center aligned on all screen widths.
 * @module screens/Header
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, Modal, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import PlayerCard from '../components/PlayerCard';
import EnergyTokenSystem from '../components/EnergyTokenSystem';
import headerStyles from '../styles/HeaderStyles';
import { useGame } from '../constants/GameContext';
import { avatars } from '../constants/AvatarPaths';

export default function Header() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [leftWidth, setLeftWidth] = useState(0);
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
  const isNarrowHeader = SCREEN_WIDTH < 360 || WINDOW_HEIGHT < 650;
  const headerHeight = isNarrowHeader ? 60 : 70;
  const headerTotal = headerHeight + (insets.top || 0);
  const translateY = useRef(new Animated.Value(-headerTotal)).current;
  const CENTER_MIN = Math.floor(SCREEN_WIDTH * 0.4);
  // Ensure right slot minimum fits the avatar image to avoid clipping when center is small
  const avatarWidth = (headerStyles && headerStyles.headerAvatarImage && headerStyles.headerAvatarImage.width) || 44;
  const MIN_RIGHT = Math.max(56, avatarWidth + 12);

  const {
    playerId,
    playerName,
    userRecognized,
    avatarUrl,
    displayAvatarUrl,
    isLinked,
    tokensStabilized,
    tokensStabilizedAt,
  } = useGame();

  const mountRef = useRef(null);
  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      mountRef.current = Date.now();
      try { console.debug('[Header] mount at', mountRef.current); } catch (e) {}
    }
  }, []);

  // Smooth reveal on mount to avoid pushing the underlying content
  useEffect(() => {
    Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }).start();
  }, [translateY]);

  // Use displayAvatarUrl (prefers pending local writes) so UI updates instantly.
  const avatarToUse = displayAvatarUrl || avatarUrl;

  // Normalization helpers (mirror PlayerCard rules): compare full normalized path
  // or last two path segments to allow old/new path formats to match.
  const _norm = (s) => String(s || '').replace(/\\/g, '/').replace(/^\.\//, '');
  const _last2 = (s) => _norm(s).split('/').slice(-2).join('/');
  const findAvatarMeta = (avatarPath) => {
    const target = _norm(avatarPath);
    if (!target) return null;
    const hit = avatars.find(av => {
      const ap = _norm(av.path);
      return ap === target || ap.endsWith(_last2(target)) || target.endsWith(_last2(ap));
    });
    return hit || null;
  };

  const meta = findAvatarMeta(avatarToUse);
  const avatarDisplay = meta ? meta.display : null;
  const isBeginner = !!meta && String(meta.level || '').toLowerCase() === 'beginner';

  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      try {
        console.debug('[Header] avatar resolved', {
          avatarToUse, metaFound: !!meta, avatarDisplay: !!avatarDisplay, isBeginner,
          elapsedMs: mountRef.current ? Date.now() - mountRef.current : null,
          tokensStabilized,
          tokensStabilizedAt,
          stabilizedDelta: tokensStabilizedAt && mountRef.current ? mountRef.current - tokensStabilizedAt : null,
        });
      } catch (e) {}
    }
  }, [avatarToUse, avatarDisplay, meta, isBeginner]);

  const openModal = useCallback(() => setModalVisible(true), []);

  const mirroredWidth = useMemo(() => Math.max(
    MIN_RIGHT,
    Math.min(leftWidth, Math.max(0, SCREEN_WIDTH - leftWidth - CENTER_MIN))
  ), [leftWidth, SCREEN_WIDTH]);

  const selectedPlayer = useMemo(() => ({ playerId, playerName }), [playerId, playerName]);

  return (
    <>
      <Animated.View
        style={[
          headerStyles.header,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: [{ translateY }],
            height: headerTotal,
            paddingTop: insets.top || 0,
            zIndex: 50,
            elevation: 50,
            backgroundColor: headerStyles.header?.backgroundColor || 'black',
          },
        ]}
      >
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

        {typeof __DEV__ !== 'undefined' && __DEV__ && (
          <View style={{ position: 'absolute', left: 0, top: 0, opacity: 0 }}>
            {/* Touchpoint for leftWidth measurement logging */}
          </View>
        )}

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
                {avatarDisplay ? (
                  <Image
                    source={avatarDisplay}
                    style={isBeginner ? headerStyles.beginnerAvatar : headerStyles.headerAvatarImage}
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
                  <View style={isBeginner ? headerStyles.beginnerLinkIconContainer : headerStyles.linkIconContainer}>
                    <FontAwesome5 name="link" size={10} color="gold" />
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        ) : (
          <View style={[headerStyles.sectionRight, { width: mirroredWidth }]} />
        )}
      </Animated.View>

      {/* PlayerCard modal - keep outside header Animated view */}
      <Modal
        animationType="fade"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <PlayerCard
            isModalVisible={isModalVisible}
            setModalVisible={setModalVisible}
          />
        </View>
      </Modal>
    </>
  );
}
