import React from 'react';
import { Animated, Pressable,Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
console.log(height);
const isSmallScreen = height < 600; 

export default function DiceAnimation({ diceName, isSelected, onSelect, animationValue, color, isRolling, fadeOpacity }) {

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
        opacity: fadeOpacity || (isRolling ? 0.5 : 1),
    };

    return (
        <Pressable onPress={onSelect}>
            <Animated.View style={animatedStyle}>
                <MaterialCommunityIcons 
                name={diceName} 
                size={isSmallScreen ? 45 : 55} 
                color={color} />
            </Animated.View>
        </Pressable>
    );
}
