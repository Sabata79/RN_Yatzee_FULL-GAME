/**
 * GlowingText - Animated glowing text component.
 *
 * This file displays animated glowing text for highlights or effects.
 * @author Sabata79
 * @since 2025-08-29
 */

import { useState, useEffect } from 'react';
import { Animated } from 'react-native';

import TYPOGRAPHY  from '../constants/typography';
import SPACING from '../constants/spacing';
import COLORS from '../constants/colors';

// Animated glowing text component
export default function GlowingText({ children }) {
    const [glowAnim] = useState(new Animated.Value(0)); 

    // Looping glow animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,  
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,  
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [glowAnim]);

    // Animated style for glowing effect
    const glowStyle = {
        fontFamily: TYPOGRAPHY.fontFamily.bangers,
        color: COLORS.accent,
        textAlign: 'center',
        fontSize: TYPOGRAPHY.fontSize.jumbo,
        textShadowColor: COLORS.primary,  
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
        letterSpacing: SPACING.xs,
        opacity: glowAnim,
    };

    return <Animated.Text style={glowStyle}>{children}</Animated.Text>;
}
