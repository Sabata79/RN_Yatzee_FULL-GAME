// src/utils/breakpoints.js
/**
 * breakpoints.js — Single source of truth for responsive breakpoints and sizes.
 *
 * Provides helpers to compute viewport-aware breakpoints and a small size system.
 * Use `getBreakpoints()` in style files (static at import time) and
 * `useBreakpoints()` in components (reactive to orientation/size changes).
 *
 * @module utils/breakpoints
 * @author Sabata79
 * @since 2025-09-17
 */

import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export function computeBreakpoints({ width, height }) {
  const shortest = Math.min(width, height);
  const longest = Math.max(width, height);

  const isPortrait = height >= width;
  const isLandscape = !isPortrait;

  // Width-based breakpoints
  const isNarrow = shortest < 360;     // small/compact phones
  const isTablet = shortest >= 600;    // tablets / folds

  // Height-based breakpoints (useful for header/status-bar vertical space)
  const isSmallScreen = longest < 650; // limited vertical space
  const isBigScreen = longest >= 900;  // large phones / tablets

  return {
    width,
    height,
    shortest,
    longest,
    isPortrait,
    isLandscape,
    isNarrow,
    isTablet,
    isSmallScreen,
    isBigScreen,
  };
}

// Static variant for style files (does NOT react to rotation automatically)
export function getBreakpoints() {
  const { width, height } = Dimensions.get('window');
  return computeBreakpoints({ width, height });
}

// Hook for components (reacts to rotation / window size changes) — legacy-safe
export function useBreakpoints() {
  const [dims, setDims] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDims(window);
    });
    return () => {
      // RN >= 0.65: sub.remove();  RN < 0.65: Dimensions.removeEventListener
      sub?.remove?.();
    };
  }, []);

  return computeBreakpoints({ width: dims.width, height: dims.height });
}

// Helper: pick a value based on breakpoints (small / normal / big)
export function pick(bp, small, normal, big) {
  return bp.isSmallScreen ? small : bp.isBigScreen ? big : normal;
}

// Helper: clamp number into a range
export function clamp(n, min, max) {
  return Math.max(min, Math.min(n, max));
}

// Common sizes — adjust SCALE to tweak vertical density across the app
export function makeSizes(bp) {
  const BASE = pick(bp, 35, 40, 50); // base unit: small / normal / big

  const SCALE = 0.90;                 // ← ADJUST THIS to shrink/grow vertical size
  // e.g. 0.92 (taller), 0.88 or 0.85 (shorter)

  const DIE_SIZE = Math.round(BASE * SCALE); // score-field height (drives dice/icons)

  // Optional derived sizes if you want to use them directly
  const FACE  = Math.round(DIE_SIZE * 0.90); // dice image size
  const ICON  = Math.round(DIE_SIZE * 0.70); // MaterialCommunityIcons
  const LABEL = Math.round(DIE_SIZE * 0.28); // labels like "FullHouse", "small", ...

  return {
    DIE_SIZE,
    FACE,
    ICON,
    LABEL,
    HEADER_HEIGHT: bp.isNarrow ? 60 : 70,
    AVATAR: bp.isNarrow ? 46 : 60,
  };
}
