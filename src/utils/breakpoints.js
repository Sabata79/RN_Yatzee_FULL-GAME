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
  const longest  = Math.max(width, height);

  const isPortrait  = height >= width;
  const isLandscape = !isPortrait;

  // Width-based breakpoints
  const isNarrow    = shortest < 360;   // small/compact phones
  const isTablet    = shortest >= 600;  // tablets / folds
  const isWidePhone = width >= 392;     // e.g., Pixel 7 / 7 Pro & similar

  // Height-based breakpoints (useful for header/status-bar vertical space)
  const isSmallScreen = longest < 650;  // limited vertical space
  const isBigScreen   = longest >= 820; // lowered from 900 to catch tall flagships

  return {
    width,
    height,
    shortest,
    longest,
    isPortrait,
    isLandscape,
    isNarrow,
    isTablet,
    isWidePhone,
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
      // RN >= 0.65: sub.remove();  RN < 0.65: Dimensions.removeEventListener(...)
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
  // Base unit chosen from width/height heuristics
  const BASE =
    bp.isWidePhone ? 54 :     // give wide phones (Pixel 7/Pro etc.) a larger base
    bp.isBigScreen ? 50 :     // tall/large phones
    bp.isSmallScreen ? 36 :   // compact devices
    44;                       // default mid-size

  const SCALE = 0.87;         // global fine-tune (0.92–0.96 typical)

  const DIE_SIZE = Math.round(BASE * SCALE); // drives score-field size

  // Derived sizes used across UI so everything scales in sync
  const FACE  = Math.round(DIE_SIZE * 0.92); // dice image
  const ICON  = Math.round(DIE_SIZE * 0.72); // MDI icons
  const LABEL = Math.round(DIE_SIZE * 0.28); // small label text blocks

  return {
    DIE_SIZE,
    FACE,
    ICON,
    LABEL,
    HEADER_HEIGHT: bp.isNarrow ? 60 : 70,
    AVATAR: bp.isNarrow ? 46 : 60,
  };
}
