import React from 'react';
import { Animated, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DiceAnimation({ diceName, isSelected, onSelect, animationValue, color }) {
  // Change the animation value from 0 to 1 to rotate the dice around the z-axis
  const rotation = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Change the animation value from 0 to 1 to rotate the dice around the y-axis
  const rotateY = animationValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '0deg'],
  });

  const animatedStyle = {
    transform: [
      { rotate: rotation }, // Rotate around z-axis
      { rotateY: rotateY }, // 3D Rotate around y-axis
    ],
  };

  return (
    <Pressable onPress={onSelect}>
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons name={diceName} size={45} color={color} />
      </Animated.View>
    </Pressable>
  );
}
