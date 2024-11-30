import React, { useState, useEffect } from 'react';
import { Text, Animated } from 'react-native';

export default function GlowingText({ children }) {
    const [glowAnim] = useState(new Animated.Value(0)); 

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

    const glowStyle = {
        color: 'white',
        textAlign: 'center',
        fontSize: 38,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 0, 0, 1)',  
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        opacity: glowAnim,
    };

    return <Animated.Text style={glowStyle}>{children}</Animated.Text>;
}
