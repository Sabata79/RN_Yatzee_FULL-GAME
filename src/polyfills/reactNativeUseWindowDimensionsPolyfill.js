// Polyfill for React Native's useWindowDimensions on older RN versions.
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