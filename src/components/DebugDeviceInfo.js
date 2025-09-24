/**
 * DebugDeviceInfo — small overlay showing device/window metrics to aid responsive tuning
 * @module src/components/DebugDeviceInfo
 * @since 2025-09-24
 */
import React from 'react';
import { View, Text, StyleSheet, Platform, PixelRatio, Dimensions, NativeModules } from 'react-native';

export default function DebugDeviceInfo({ style }) {
  const { width, height } = Dimensions.get('window');
  const pr = PixelRatio.get();
  let model = 'unknown';
  try {
    if (Platform.OS === 'android') model = (NativeModules?.PlatformConstants?.Model || NativeModules?.Build?.MODEL || NativeModules?.RNDeviceInfo?.model) || model;
    if (Platform.OS === 'ios') model = NativeModules?.PlatformConstants?.platform || model;
  } catch (e) {
    // ignore
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Text style={styles.text}>W×H: {width}×{height}</Text>
      <Text style={styles.text}>PixelRatio: {pr}</Text>
      <Text style={styles.text}>Platform: {Platform.OS}</Text>
      <Text style={styles.text}>Model: {String(model)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 8, left: 8, backgroundColor: '#0008', padding: 6, borderRadius: 6, zIndex: 9999 },
  text: { color: '#fff', fontSize: 11, lineHeight: 14 },
});
