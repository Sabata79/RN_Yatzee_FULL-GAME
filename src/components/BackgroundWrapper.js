/**
 * BackgroundWrapper — places a background layer (video/fallback) behind its children.
 * Ensures children are rendered above the background and receive pointer events.
 * @module src/components/BackgroundWrapper
 * @since 2025-10-04
 * @updated 2025-10-04
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import BackgroundVideo from './BackgroundVideo';

export default function BackgroundWrapper({ isActive = true, children }) {
  return (
    <View style={styles.container}>
      {/* Background layer - absolute fill so it doesn't affect layout */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BackgroundVideo isActive={isActive} />
      </View>

      {/* Foreground content - ensure it's above background */}
      <View style={styles.foreground} pointerEvents="auto">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  foreground: { flex: 1, zIndex: 1 },
});
