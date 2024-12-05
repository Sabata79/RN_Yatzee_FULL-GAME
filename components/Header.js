import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useGame } from './GameContext'; // Tuodaan GameContext
import PlayerCard from './PlayerCard'; 
import styles from '../styles/styles'; // Tuodaan tyylit

export default function Header({ isUserRecognized, name }) {
  const { playerId } = useGame(); // Haetaan playerId GameContextista
  const [isModalVisible, setModalVisible] = useState(false); // Modalin näkyvyyden hallinta

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        Yatzy <FontAwesome5 name="dice" size={35} color='#ccc9c9' />
      </Text>
      {isUserRecognized && name && (
        <Pressable
          style={({ pressed }) => [
            styles.userButton,
            pressed && styles.buttonPressed,
            { marginLeft: 'auto', top: -5 },
          ]}
          onPress={() => setModalVisible(true)} // Avaa PlayerCard modaalin
        >
          <Text style={styles.userName}>{name}</Text>
          <FontAwesome5
            name="user"
            size={22}
            color="black"
            style={{ marginLeft: 5 }}
          />
        </Pressable>
      )}

      {/* Näytetään pelaajakortti modaalina */}
      {playerId && name && (
        <PlayerCard
          playerId={playerId}
          playerName={name}
          isModalVisible={isModalVisible} // Välitetään modalin näkyvyys
          setModalVisible={setModalVisible} // Asetetaan modalin näkyvyys
        />
      )}
    </View>
  );
}