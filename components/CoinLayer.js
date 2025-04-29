import React, { useEffect } from 'react';
import { View, Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import Coin, { COIN_SIZE } from './Coin';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function CoinLayer({ weeklyWins }) {
  const slotSpacing = 5; // väli kolikoiden välillä
  const slotsPerRow = Math.floor((screenWidth - COIN_SIZE -45) / (COIN_SIZE + slotSpacing));

  const coins = Array.from({ length: weeklyWins }).map((_, index) => {
    const slotIndex = index % slotsPerRow;
    const row = Math.floor(index / slotsPerRow);

    const left = slotIndex * (COIN_SIZE + slotSpacing);
    const bottomOffset = row * (COIN_SIZE + slotSpacing);

    return {
      left,
      bottomOffset,
      translateY: new Animated.Value(-100),
      rotation: new Animated.Value(Math.random() * 360),
      delay: Math.random() * 500,
    };
  });

  useEffect(() => {
    coins.forEach((coin) => {
      const landingHeight = screenHeight - 233 - coin.bottomOffset;

      Animated.timing(coin.translateY, {
        toValue: landingHeight,
        duration: 900,
        delay: coin.delay,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start();

      Animated.timing(coin.rotation, {
        toValue: coin.rotation.__getValue() + (Math.random() * 360 + 90),
        duration: 1000 + Math.random() * 500,
        delay: coin.delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }).start();
    });
  }, []);

  return (
    <View style={styles.overlay} pointerEvents="none">
      {coins.map((coin, index) => (
        <Coin
          key={index}
          left={coin.left}
          translateY={coin.translateY}
          rotation={coin.rotation.interpolate({
            inputRange: [0, 360],
            outputRange: ['0deg', '360deg'],
          })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 8,
    width: '80%',
    height: '100%',
    zIndex: 0,
  },
});
