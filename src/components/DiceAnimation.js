/**
 * DiceAnimation - Dice animation component for rolling dice.
 * Comments in English.
 */
import React, { useEffect, memo, useRef } from 'react';
import { Animated, Image, Pressable, View, StyleSheet, Easing } from 'react-native';

const CONTAINER_SIZE = 60;
const TOTAL_FRAMES = 16;
const SPRITE_SHEET = require('../../assets/Spritesheet/dice_spritesheet.webp');
const SPRITE_WIDTH = 412;
const SPRITE_HEIGHT = 4923;

const frameHeightOriginal = SPRITE_HEIGHT / TOTAL_FRAMES;
const scaleFactor = CONTAINER_SIZE / frameHeightOriginal;
const scaledSpriteHeight = SPRITE_HEIGHT * scaleFactor;

const DiceAnimation = ({
  diceName,
  isSelected,
  onSelect,
  animationValue,
  color,             // not used in styles below, but keep prop if you want
  isRolling,
  canInteract = true // new: parent can disable interaction
}) => {
  // Precompute translation range once
  const translateY = animationValue.interpolate({
    inputRange: [0, TOTAL_FRAMES - 1],
    outputRange: [0, -CONTAINER_SIZE * (TOTAL_FRAMES - 1)],
  });

  // Keep a ref to the loop so we can stop it safely
  const loopRef = useRef(null);

  useEffect(() => {
    if (isRolling) {
      // No console.log here – logging inside animation loop hurts perf
      const loop = Animated.loop(
        Animated.timing(animationValue, {
          toValue: TOTAL_FRAMES - 1,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      );
      loopRef.current = loop;
      loop.start();
      return () => {
        loop.stop();
        loopRef.current = null;
      };
    } else {
      // Ensure animation resets cleanly
      loopRef.current?.stop?.();
      loopRef.current = null;
      animationValue.stopAnimation();
      animationValue.setValue(0);
    }
  }, [isRolling, animationValue]);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onSelect}
        disabled={!canInteract}
        android_disableSound
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        style={styles.pressArea}
      >
        {isRolling ? (
          <View style={styles.spriteContainer}>
            <Animated.Image
              pointerEvents="none"            // do not steal touches
              source={SPRITE_SHEET}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: CONTAINER_SIZE,
                height: scaledSpriteHeight,
                transform: [{ translateY }],
              }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <Image
            pointerEvents="none"
            source={diceName}
            style={styles.staticImage}
            resizeMode="contain"
          />
        )}
        {isSelected && (
          <View pointerEvents="none" style={styles.overlay} />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    margin: 5,
    zIndex: 2,
  },
  pressArea: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    // small GPU hint:
    renderToHardwareTextureAndroid: true,
  },
  spriteContainer: {
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    overflow: 'hidden',
  },
  staticImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    width: CONTAINER_SIZE,
    height: CONTAINER_SIZE,
    backgroundColor: '#00ff112c',
    borderWidth: 2,
    borderColor: 'green',
    borderRadius: 6,
  },
});

export default memo(DiceAnimation, (a, b) => (
  a.diceName === b.diceName &&
  a.isSelected === b.isSelected &&
  a.isRolling === b.isRolling &&
  a.onSelect === b.onSelect &&
  a.animationValue === b.animationValue &&
  a.color === b.color &&
  a.canInteract === b.canInteract
));
