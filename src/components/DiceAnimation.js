/**
 * DiceAnimation - Dice animation component for rolling dice.
 * Uses a sprite sheet for smooth animation.
 * Press handling is tuned for responsiveness (onPressIn, hardware rendering on Android).
 * @author
 */
import { useEffect } from 'react';
import { Animated, Image, Pressable, View, StyleSheet, Easing, Platform } from 'react-native';

const DiceAnimation = ({
  diceName,
  isSelected,
  onSelect,
  animationValue,
  color,
  isRolling,
  canInteract = true, // gate from parent (e.g., only after first throw)
}) => {
  const CONTAINER_SIZE = 60;
  const totalFrames = 16;

  const SPRITE_SHEET = require('../../assets/Spritesheet/dice_spritesheet.webp');
  const SPRITE_WIDTH = 412;
  const SPRITE_HEIGHT = 4923;

  const frameHeightOriginal = SPRITE_HEIGHT / totalFrames;
  const scaleFactor = CONTAINER_SIZE / frameHeightOriginal;
  const scaledSpriteHeight = SPRITE_HEIGHT * scaleFactor;

  // Interpolate sprite Y
  const translateY = animationValue.interpolate({
    inputRange: [0, totalFrames - 1],
    outputRange: [0, -CONTAINER_SIZE * (totalFrames - 1)],
  });

  // Loop animation while rolling
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
  }, [isRolling, animationValue]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        onPressIn={onSelect}
        android_disableSound
        disabled={!canInteract || isRolling}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        style={{ flex: 1 }}
      >
        {isRolling ? (
          <View style={styles.spriteContainer}>
            <Animated.Image
              source={SPRITE_SHEET}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: CONTAINER_SIZE,
                height: scaledSpriteHeight,
                transform: [{ translateY }],
                backfaceVisibility: 'hidden',
                ...(Platform.OS === 'android' ? { renderToHardwareTextureAndroid: true } : null),
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
              ...(Platform.OS === 'android' ? { renderToHardwareTextureAndroid: true } : null),
            }}
          />
        )}

        {isSelected && <View style={[styles.overlay, { borderColor: 'green' }]} />}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 55,
    height: 55,
    margin: 5,
    zIndex: 2,
  },
  spriteContainer: {
    width: 56,
    height: 56,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    width: 55,
    height: 55,
    backgroundColor: '#00ff112c',
    borderWidth: 2,
    borderRadius: 5,
  },
});

export default DiceAnimation;
