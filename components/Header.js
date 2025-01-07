import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PlayerCard from './PlayerCard'; 
import styles from '../styles/styles';
import { useGame } from './GameContext';
import { avatars } from '../constants/AvatarPaths';

export default function Header({ isUserRecognized, name, playerId }) {
  const [isModalVisible, setModalVisible] = useState(false);
  const { avatarUrl } = useGame();

  const userAvatar = avatars.find((avatar) => avatar.path === avatarUrl)?.display;

  const selectedPlayer = {
    playerId: playerId,
    playerName: name,
  };

  useEffect(() => {
    if (avatarUrl) {
      console.log("Avatar URL is set:", avatarUrl);
    } else {
      console.log("No Avatar URL found.");
    }
  }, [avatarUrl]);

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        Yatzy <FontAwesome5 name="dice" size={35} color='#ccc9c9' />
      </Text>

      {isUserRecognized && name && (
        <Pressable
          style={({ pressed }) => [
            styles.userHeaderButton,
            pressed && styles.userHeaderButtonPressed,
            { marginLeft: 'auto', top: -5 },
          ]}
          onPress={() => setModalVisible(true)} 
        >
          <Text style={styles.userName}>{name}</Text>

          {userAvatar ? (
            <Image source={userAvatar} style={styles.headerAvatarImage} />
          ) : (
            <FontAwesome5 name="user" size={22} color="white" style={{ marginLeft: 5 }} />
          )}
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
