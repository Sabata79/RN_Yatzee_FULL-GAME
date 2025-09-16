/**
 * DiceAnimation – Responsive dice sprite animation component.
 * Renders either a static face (when idle) or an Animated sprite strip (when rolling).
 * Tile size adapts to screen width; overlay indicates selection.
 *
 * Usage:
 *   import DiceAnimation from '@/components/DiceAnimation';
 *
 *   <DiceAnimation
 *     diceName={dicefaces[value - 1]?.display} // Image source for current face
 *     isSelected={selected}                    // Highlights with overlay when true
 *     onSelect={() => toggleSelect(i)}         // Called onPressIn (debounced by parent state)
 *     animationValue={animRefs[i]}             // Animated.Value(0)
 *     color="green"                            // Optional overlay borderColor
 *     isRolling={isRolling && !selected}       // When true, plays sprite animation loop
 *     canInteract={nbrOfThrowsLeft < NBR_OF_THROWS}
 *   />
 *
 * Props:
 *   @param {any} diceName               - Image source for the dice face (require(...) or { uri }).
 *   @param {boolean} isSelected         - If true, shows a semi-transparent overlay with border.
 *   @param {Function} onSelect          - Press handler (wired to onPressIn for snappy feel).
 *   @param {Animated.Value} animationValue - Shared/unique Animated value used to drive sprite frame index.
 *   @param {string} [color]             - Overlay border color (defaults to 'green' if not provided).
 *   @param {boolean} isRolling          - Toggles the rolling animation loop (Animated.Image translateY).
 *   @param {boolean} [canInteract=true] - Gates interaction from parent (e.g., only after first throw).
 *
 * Responsiveness:
 * - Tile SIZE is derived from `useWindowDimensions().width`:
 *     columns, H_PADDING, and marginEachSide -> SIZE → drives:
 *       • container width/height
 *       • spriteContainer crop area
 *       • overlay borderWidth/borderRadius
 *       • sprite scaleFactor (so the strip fits the tile)
 * - To make dice larger/smaller globally, adjust:
 *     `columns`, `H_PADDING`, or clamp range in `const SIZE = Math.max(MIN, Math.min(MAX, rawSize))`.
 *
 * Animation:
 * - TOTAL_FRAMES = 16; we translateY the sprite strip by SIZE * (frameIndex).
 * - Loop with `Animated.loop(Animated.timing(..., useNativeDriver: true))`.
 * - Android perf: `renderToHardwareTextureAndroid: true` on images.
 *
 * Accessibility / UX:
 * - `hitSlop` scales with SIZE for easier tapping on small tiles.
 * - Press used is `onPressIn` for quicker feedback during roll/lock interactions.
 *
 * Dependencies:
 * - react-native Animated, Easing, Image/Animated.Image, Pressable, Platform, useWindowDimensions
 *
 * @module components/DiceAnimation
 * @author
 * @since 2025-09-16
 */
import { useEffect, useMemo } from 'react';
import {
  Animated,
  Image,
  Pressable,
  View,
  StyleSheet,
  Easing,
  Platform,
  useWindowDimensions,
} from 'react-native';

const SPRITE_SHEET = require('../../assets/Spritesheet/dice_spritesheet.webp');
const SPRITE_WIDTH = 412;
const SPRITE_HEIGHT = 4923;
const TOTAL_FRAMES = 16;

const DiceAnimation = ({
  diceName,
  isSelected,
  onSelect,
  animationValue,
  color,
  isRolling,
  canInteract = true,
}) => {
  const { width } = useWindowDimensions();

  // --- Responsive sizing (5 dice across by default) ---
  const columns = 5;
  const H_PADDING = 65;                    // estimated horizontal padding of the row container
  const marginEachSide = Math.max(3, Math.round(width * 0.01)); // per-side margin for each tile
  const rawSize = Math.round(
    (width - H_PADDING - columns * 2 * marginEachSide) / columns
  );
  const SIZE = Math.max(44, Math.min(72, rawSize)); // clamp for usability on very small/large screens

  // Sprite scaling based on tile height
  const frameHeightOriginal = SPRITE_HEIGHT / TOTAL_FRAMES;
  const scaleFactor = SIZE / frameHeightOriginal;
  const scaledSpriteHeight = Math.round(SPRITE_HEIGHT * scaleFactor);

  // Interpolate sprite Y
  const translateY = useMemo(
    () =>
      animationValue.interpolate({
        inputRange: [0, TOTAL_FRAMES - 1],
        outputRange: [0, -SIZE * (TOTAL_FRAMES - 1)],
      }),
    [animationValue, SIZE]
  );

  // Loop animation while rolling
  useEffect(() => {
    if (isRolling) {
      const loopAnimation = Animated.loop(
        Animated.timing(animationValue, {
          toValue: TOTAL_FRAMES - 1,
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

  // Runtime style overrides derived from SIZE
  const r = useMemo(
    () => ({
      container: {
        width: SIZE,
        height: SIZE,
        margin: marginEachSide,
      },
      spriteContainer: {
        width: SIZE + 1,   // +1 to avoid sub-pixel gaps
        height: SIZE + 1,
      },
      overlay: {
        width: SIZE,
        height: SIZE,
        borderRadius: Math.round(SIZE * 0.1),
        borderWidth: Math.max(1, Math.round(SIZE * 0.04)),
      },
    }),
    [SIZE, marginEachSide]
  );

  return (
    <View style={[styles.container, r.container]} pointerEvents="box-none">
      <Pressable
        onPressIn={onSelect}
        android_disableSound
        disabled={!canInteract || isRolling}
        hitSlop={{
          top: Math.min(24, Math.round(SIZE * 0.4)),
          bottom: Math.min(24, Math.round(SIZE * 0.4)),
          left: Math.min(24, Math.round(SIZE * 0.4)),
          right: Math.min(24, Math.round(SIZE * 0.4)),
        }}
        style={{ flex: 1 }}
      >
        {isRolling ? (
          <View style={[styles.spriteContainer, r.spriteContainer]}>
            <Animated.Image
              source={SPRITE_SHEET}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: SIZE,
                height: scaledSpriteHeight,
                transform: [{ translateY }],
                backfaceVisibility: 'hidden',
                ...(Platform.OS === 'android'
                  ? { renderToHardwareTextureAndroid: true }
                  : null),
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
              ...(Platform.OS === 'android'
                ? { renderToHardwareTextureAndroid: true }
                : null),
            }}
          />
        )}

        {isSelected && (
          <View style={[styles.overlay, r.overlay, { borderColor: color || 'green' }]} />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 2,
  },
  spriteContainer: {
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    backgroundColor: '#00ff112c',
  },
});

export default DiceAnimation;
