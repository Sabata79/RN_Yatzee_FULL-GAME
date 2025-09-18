/**
 * reactNativeUseWindowDimensionsPolyfill – polyfill for React Native's useWindowDimensions hook.
 * Provides a compatible useWindowDimensions implementation for older React Native versions.
 *
 * Usage:
 *  - Automatically adds useWindowDimensions to ReactNative if missing.
 *
 * @module reactNativeUseWindowDimensionsPolyfill
 * @author Sabata79
 * @since 2025-09-18
 */
import * as ReactNative from 'react-native';
import React, { useEffect, useState } from 'react';

if (!ReactNative.useWindowDimensions) {
  ReactNative.useWindowDimensions = function useWindowDimensionsPolyfill() {
    const [dims, setDims] = useState(ReactNative.Dimensions.get('window'));
    useEffect(() => {
      const sub = ReactNative.Dimensions.addEventListener('change', ({ window }) => {
        setDims(window);
      });
      return () => sub?.remove?.();
    }, []);
    return dims;
  };
}

export default null;