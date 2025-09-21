/**
 * Full-screen background video layer.
 * - Renders behind content (use as the FIRST child of your screen)
 * - Adds a solid fallback color so transparent navigation never shows white
 * @module components/BackgroundVideo
 * @author Sabata79
 * @since 2025-09-02
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';


export default function BackgroundVideo({ isActive = true }) {
  const player = useVideoPlayer(require('../../assets/video/backgroundVideo.m4v'), (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 0.6;
  });

  useEffect(() => {
    if (!player) return;
    try {
      if (isActive) player.play();
      else player.pause();
    } catch {}
  }, [player, isActive]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Solid fallback so transparent roots never show white */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#253445' }]} />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
        focusable={false}
      />
    </View>
  );
}
