/**
 * CoinLayer – animated layer for displaying falling coins based on weekly wins.
 * Used in PlayerCard modal to visualize weekly win rewards. Animates coins using react-native Animated API.
 *
 * Props:
 *  - weeklyWins: number (how many coins to animate)
 *  - modalHeight: number (height of the modal for animation bounds)
 *
 * @module CoinLayer
 * @author Sabata79
 * @since 2025-09-18
 */
import { useEffect, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions, Easing } from 'react-native';
import Coin, { COIN_SIZE } from './Coin';

const { width: screenWidth } = Dimensions.get('window');

// Animated layer for displaying falling coins based on weekly wins
export default function CoinLayer({ weeklyWins, modalHeight, modalWidth }) {
  const [coins, setCoins] = useState([]);

  // Generate coin objects for animation when weeklyWins changes
  useEffect(() => {
  const slotSpacing = 4;
  // Use modalWidth when available; fall back to ~90% of screen width (matches overlay default)
  const availableWidth = (modalWidth && modalWidth > 0) ? modalWidth : Math.floor(screenWidth * 0.9);

    // compute how many coins fit per row (coin + spacing)
    const slotsPerRow = Math.max(1, Math.floor((availableWidth + slotSpacing) / (COIN_SIZE + slotSpacing)));

    // center the row of coins within the available width
    const totalRowWidth = slotsPerRow * COIN_SIZE + Math.max(0, slotsPerRow - 1) * slotSpacing;
    const startX = Math.max(0, Math.floor((availableWidth - totalRowWidth) / 2));

    const generatedCoins = Array.from({ length: weeklyWins }).map((_, index) => {
      const slotIndex = index % slotsPerRow;
      const row = Math.floor(index / slotsPerRow);

      const left = startX + slotIndex * (COIN_SIZE + slotSpacing);
      const bottomOffset = row * (COIN_SIZE + slotSpacing -20);

      return {
        left,
        bottomOffset,
        // start slightly above the visible modal
        translateY: new Animated.Value(-30 - Math.random() * 80),
        rotation: new Animated.Value(Math.random() * 360),
        delay: Math.random() * 500,
        startLeftOffset: Math.random() * 20 - 10,
      };
    });

    setCoins(generatedCoins);
  }, [weeklyWins, modalWidth]);


  // Animate coins falling and rotating when modalHeight is set
  useEffect(() => {
    if (!modalHeight) return;

    coins.forEach((coin) => {
    // landingHeight is measured from the top of overlay; ensure it's not negative
    const landingHeight = Math.max(0, (modalHeight || 0) - COIN_SIZE - coin.bottomOffset);

      Animated.timing(coin.translateY, {
        toValue: landingHeight,
        duration: 900 + Math.random() * 300,
        delay: coin.delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
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
    <View style={[styles.overlay, { width: modalWidth || '100%', height: modalHeight || '100%', left: 0 }]} pointerEvents="none">
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
