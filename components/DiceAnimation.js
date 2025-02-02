import React, { useEffect } from 'react';
import { Animated, Image, TouchableOpacity, View, StyleSheet,Easing } from 'react-native';

const DiceAnimation = ({ diceName, isSelected, onSelect, animationValue, color, isRolling }) => {
    const CONTAINER_SIZE = 45;

    const totalFrames = 16;
    const SPRITE_SHEET = require('../assets/Spritesheet/dice_spritesheet.png');
    const SPRITE_WIDTH = 412;  
    const SPRITE_HEIGHT = 4923; 

    const frameHeightOriginal = SPRITE_HEIGHT / totalFrames;
    const scaleFactor = CONTAINER_SIZE / frameHeightOriginal;
    const scaledSpriteHeight = SPRITE_HEIGHT * scaleFactor;
    const scaledSpriteWidth = SPRITE_WIDTH * scaleFactor;

    const extraOffset = 0;

    const translateY = animationValue.interpolate({
        inputRange: [0, totalFrames - 1],
        outputRange: [extraOffset, -CONTAINER_SIZE * (totalFrames - 1) + extraOffset],
    });

    useEffect(() => {
        if (isRolling) {
            const loopAnimation = Animated.loop(
                Animated.timing(animationValue, {
                    toValue: totalFrames - 1,
                    duration: 500,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                })
            );
            loopAnimation.start();

            return () => loopAnimation.stop();
        } else {
            animationValue.stopAnimation();
            animationValue.setValue(0);
        }
    }, [isRolling, animationValue, totalFrames]);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={onSelect} activeOpacity={0.2}>
                {isRolling ? (
                    <View style={styles.spriteContainer}>
                        <Animated.Image
                            source={SPRITE_SHEET}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: 45,
                                height: scaledSpriteHeight,
                                transform: [{ translateY }],
                            }}
                            resizeMode="cover"
                        />
                    </View>
                ) : (
                    <Image
                        source={diceName}
                        style={{
                            width: '100%',
                            height: '100%',
                            resizeMode: 'contain',
                        }}
                    />
                )}
                {isSelected && (
                    <View style={[styles.overlay, { borderColor: 'green' }]} />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 45,
        height: 45,
        margin: 5,
    },
    spriteContainer: {
        width: 45,
        height: 45,
        overflow: 'hidden',
    },
    overlay: {
        position: 'absolute',
        width: 45,
        height: 45,
        backgroundColor: '#00ff112c',
        borderWidth: 2,
        borderRadius: 5,
    },
});

export default DiceAnimation;
