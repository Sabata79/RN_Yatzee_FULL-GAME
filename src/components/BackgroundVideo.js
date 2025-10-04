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
  // Allow disabling the background video during profiling or when running CI/dev diagnostics.
  // Set environment variable DISABLE_BG_VIDEO=1 or global __DISABLE_BG_VIDEO__ = true to disable.
  const disableFlag = (typeof __DEV__ !== 'undefined' && typeof __DISABLE_BG_VIDEO__ !== 'undefined' && __DISABLE_BG_VIDEO__) || process.env.DISABLE_BG_VIDEO === '1';
  if (disableFlag) return null;

  const player = useVideoPlayer(require('../../assets/video/newBGVideo.m4v'), (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 0.8;
  });

  useEffect(() => {
    if (!player) return;
    try {
      if (isActive) {
        try { player.play(); } catch (e) { /* ignore play errors */ }
      } else {
        try { player.pause(); } catch (e) { /* ignore pause errors */ }
      }
    } catch {}
  }, [player, isActive]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Solid fallback so transparent roots never show white */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#253445' }]} />
      {player && isActive ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
          focusable={false}
        />
      ) : null}
    </View>
  );
}
