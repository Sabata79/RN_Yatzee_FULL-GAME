import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PlayerCard from './PlayerCard';
import EnergyTokenSystem from './EnergyTokenSystem';
import headerStyles from '../styles/headerStyles';
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

  const handleGamePlay = () => {
    console.log('Peli aloitettu!');
  };

  useEffect(() => {
    if (avatarUrl) {
      console.log('Avatar URL is set:', avatarUrl);
    } else {
      console.log('No Avatar URL found.');
    }
  }, [avatarUrl]);

  return (
    <View style={headerStyles.header}>
      <Text style={headerStyles.headerTitle}>
        Yatzy <FontAwesome5 name="dice" size={35} color="#ccc9c9" />
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <EnergyTokenSystem onPlay={handleGamePlay} />
      </View>

      {isUserRecognized && name && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
          <Pressable
            style={({ pressed }) => [
              headerStyles.userHeaderButton,
              pressed && headerStyles.userHeaderButtonPressed,
              { marginLeft: 10, top: -5 },
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={headerStyles.userName}>{name}</Text>

            {userAvatar ? (
              <Image source={userAvatar} style={headerStyles.headerAvatarImage} />
            ) : (
              <FontAwesome5 name="user" size={22} color="white" style={{ marginLeft: 5 }} />
            )}
          </Pressable>
        </View>
      )}

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
