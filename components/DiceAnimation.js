import React, { useEffect } from 'react';
import { Animated, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DiceAnimation({ diceName, isSelected, onSelect, animationValue, color, isRolling }) {

  const rotation = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateY = animationValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '0deg'],
  });

  const animatedStyle = {
    transform: [
      { rotate: rotation },
      { rotateY: rotateY },
    ],
    opacity: isRolling ? 0.5 : 1,
  }

  return (
    <Pressable onPress={onSelect}>
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons name={diceName} size={55} color={color} />
      </Animated.View>
    </Pressable>
  );
}
