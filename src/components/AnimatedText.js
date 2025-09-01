/**
 * GlowingText - Animated glowing text component.
 *
 * JSDoc comments and inline code comments must always be in English.
 * This file displays animated glowing text for highlights or effects.
 * @author Sabata79
 * @since 2025-08-29
 */
import { useState, useEffect } from 'react';
import { Animated } from 'react-native';

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
        color: 'gold',
        textAlign: 'center',
        fontSize: 38,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 0, 0, 1)',  
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
        opacity: glowAnim,
    };

    return <Animated.Text style={glowStyle}>{children}</Animated.Text>;
}
