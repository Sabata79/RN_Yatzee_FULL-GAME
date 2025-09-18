/**
 * Coin – animated coin image for CoinLayer and rewards.
 * Used in CoinLayer and other animated reward UIs. Supports position and rotation via props.
 *
 * Props:
 *  - left: number (horizontal position)
 *  - translateY: Animated.Value (vertical animation)
 *  - rotation: Animated.Value (rotation animation)
 *
 * @module Coin
 * @author Sabata79
 * @since 2025-09-18
 */
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
