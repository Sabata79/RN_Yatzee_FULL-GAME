import React from 'react';
import { Text, View } from 'react-native';
import styles from '../styles/styles.js';

export default Footer = () => {
    return (
        <View style={styles.footer}>
            <Text style={styles.author}>
                © 2025 SMR
            </Text>
        </View>
    )
}