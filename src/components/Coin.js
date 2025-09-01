/**
 * Coin - Animated coin component for use in CoinLayer.
 *
 * JSDoc comments and inline code comments must always be in English.
 * This file renders a single animated coin image.
 * @author Sabata79
 * @since 2025-08-29
 */
// components/Coin.js
import { Animated, StyleSheet } from 'react-native';

const coinImage = require('../../assets/coins/coin.webp');

export const COIN_SIZE = 45;

export default function Coin({ left, translateY, rotation }) {
  return (
    <Animated.Image
      source={coinImage}
      style={[
        styles.coin,
        {
          left,
          transform: [
            { translateY },
            { rotate: rotation },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  coin: {
    position: 'absolute',
    width: 45,
    height: 45,
    opacity: 0.85,
  },
});
