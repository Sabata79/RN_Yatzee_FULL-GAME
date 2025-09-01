/**
 * CoinLayer - Animated layer for displaying falling coins based on weekly wins.
 *
 * JSDoc comments and inline code comments must always be in English.
 * This file animates coins falling in the player card modal based on the number of weekly wins.
 * @author Sabata79
 * @since 2025-08-29
 */
import { useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import Coin, { COIN_SIZE } from './Coin';

const { width: screenWidth } = Dimensions.get('window');

// Animated layer for displaying falling coins based on weekly wins
export default function CoinLayer({ weeklyWins, modalHeight }) {
  const [coins, setCoins] = useState([]);

  // Generate coin objects for animation when weeklyWins changes
  useEffect(() => {
    const slotSpacing = 5;
    const slotsPerRow = Math.floor((screenWidth - COIN_SIZE - 45) / (COIN_SIZE + slotSpacing));

    const generatedCoins = Array.from({ length: weeklyWins }).map((_, index) => {
      const slotIndex = index % slotsPerRow;
      const row = Math.floor(index / slotsPerRow);

      const left = slotIndex * (COIN_SIZE + slotSpacing);
      const bottomOffset = row * (COIN_SIZE + slotSpacing);

      return {
        left,
        bottomOffset,
        translateY: new Animated.Value(-50 - Math.random() * 100),
        rotation: new Animated.Value(Math.random() * 360),
        delay: Math.random() * 500,
        startLeftOffset: Math.random() * 20 - 10,
      };
    });

    setCoins(generatedCoins);
  }, [weeklyWins]);


  // Animate coins falling and rotating when modalHeight is set
  useEffect(() => {
    if (!modalHeight) return;

    coins.forEach((coin) => {
      const landingHeight = modalHeight - COIN_SIZE - 1 - coin.bottomOffset;

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
  }, [coins, modalHeight]);


  // Render animated coins in an overlay view
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
    left: '5%',
    width: '90%',
    height: '100%',
    zIndex: 0,
  },
});
