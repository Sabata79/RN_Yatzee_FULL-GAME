// src/utils/breakpoints.js
// Yksi paikka breakpointeille. Käytä getBreakpoints() tyylitiedostoissa ja
// useBreakpoints() komponenteissa (päivittyy rotaatiossa).

import { Dimensions, useWindowDimensions } from 'react-native';

export function computeBreakpoints({ width, height }) {
  const shortest = Math.min(width, height);
  const longest = Math.max(width, height);

  const isPortrait = height >= width;
  const isLandscape = !isPortrait;

  // Leveyteen perustuvat breakpoints
  const isNarrow = shortest < 360;     // kapea puhelin
  const isTablet = shortest >= 600;    // tablet/fold

  // Pituuteen perustuvat (statusbar/header-tilan takia)
  const isSmallScreen = longest < 650; // vähän pystytilaa
  const isBigScreen = longest >= 900;  // isot puhelimet / tabletit

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

// Staattinen versio tyylitiedostoihin (ei päivity automaattisesti rotaatiossa)
export function getBreakpoints() {
  const { width, height } = Dimensions.get('window');
  return computeBreakpoints({ width, height });
}

// Hook komponenteille (päivittyy rotaatiossa)
export function useBreakpoints() {
  const { width, height } = useWindowDimensions();
  return computeBreakpoints({ width, height });
}

// Apuri: valitse arvojen joukosta breakpointeilla
export function pick(bp, small, normal, big) {
  return bp.isSmallScreen ? small : bp.isBigScreen ? big : normal;
}

// Apuri: clamp (jos tarvitset peilattuja leveyksiä tms.)
export function clamp(n, min, max) {
  return Math.max(min, Math.min(n, max));
}

// Esimerkkikoot yhdessä paikassa; voit laajentaa tarpeen mukaan
export function makeSizes(bp) {
  return {
    DIE_SIZE: pick(bp, 35, 40, 50),           // pienet / normi / isot
    HEADER_HEIGHT: bp.isNarrow ? 60 : 70,
    AVATAR: bp.isNarrow ? 46 : 60,
  };
}
