// components/Coin.js
import { Animated, StyleSheet } from 'react-native';

const coinImage = require('../assets/coins/coin.webp');

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
