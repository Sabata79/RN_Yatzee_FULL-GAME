import React, {useState, useEffect} from 'react';
import { Text, View ,Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles.js';

export default Header = () => {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>
                Yatzy
                <FontAwesome5 name="dice" size={35} color="black" />
            </Text>
        </View>
    )
}