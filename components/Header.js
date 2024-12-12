import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PlayerCard from './PlayerCard'; 
import styles from '../styles/styles'; 

export default function Header({ isUserRecognized, name, playerId }) {
  const [isModalVisible, setModalVisible] = useState(false);

  const selectedPlayer = {
    playerId: playerId,
    playerName: name,
  };

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        Yatzy <FontAwesome5 name="dice" size={35} color='#ccc9c9' />
      </Text>

      {isUserRecognized && name && (
        <Pressable
          style={({ pressed }) => [
            styles.userButton,
            pressed && styles.userButtonPressed,
            { marginLeft: 'auto', top: -5 },
          ]}
          onPress={() => setModalVisible(true)} 
        >
          <Text style={styles.userName}>{name}</Text>
          <FontAwesome5 name="user" size={22} color="black" style={{ marginLeft: 5 }} />
        </Pressable>
      )}

      {/* PlayerCard modal */}
      {isModalVisible && selectedPlayer && (
        <PlayerCard
          playerId={selectedPlayer.playerId}  
          playerName={selectedPlayer.playerName}  
          isModalVisible={isModalVisible} 
          setModalVisible={setModalVisible} 
        />
      )}
    </View>
  );
}
