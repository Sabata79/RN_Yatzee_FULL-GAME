import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PlayerCard from './PlayerCard';
import EnergyTokenSystem from './EnergyTokenSystem';
import headerStyles from '../styles/headerStyles';
import { useGame } from './GameContext';
import { avatars } from '../constants/AvatarPaths';

export default function Header({ isUserRecognized, name }) {
  const [isModalVisible, setModalVisible] = useState(false);
  const { playerId, playerName, userRecognized, avatarUrl } = useGame();

  const userAvatar = avatars.find((avatar) => avatar.path === avatarUrl)?.display;

  const selectedPlayer = {
    playerId: playerId,
    playerName: playerName,
  };

  console.log('selectedPlayer:', selectedPlayer);

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
    <View
      style={[
        headerStyles.header,
        userRecognized ? headerStyles.recognizedUserHeader : headerStyles.unrecognizedUserHeader,
      ]}
    >
      {/* Otsikko ja logo */}
      <View
        style={[
          userRecognized
            ? headerStyles.recognizedTitleContainer
            : headerStyles.unrecognizedTitleContainer,
        ]}
      >
        <Text style={headerStyles.headerTitle}>
          Yatzy <FontAwesome5 name="dice" size={35} color="#ccc9c9" />
        </Text>
      </View>

      {/* EnergyTokenSystem näkyy vain tunnistetuille käyttäjille */}
      {userRecognized && (
        <View style={headerStyles.energyContainer}>
          <EnergyTokenSystem onPlay={handleGamePlay} />
        </View>
      )}

      {/* Käyttäjäprofiili */}
      {userRecognized && playerName && (
        <View style={headerStyles.userHeaderContainer}>
          <Pressable
            style={({ pressed }) => [
              headerStyles.userHeaderButton,
              pressed && headerStyles.userHeaderButtonPressed,
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={headerStyles.userName}>{playerName}</Text>
            {userAvatar ? (
              <Image source={userAvatar} style={headerStyles.headerAvatarImage} />
            ) : (
              <FontAwesome5
                name="user"
                size={22}
                color="white"
                style={headerStyles.defaultUserIcon}
              />
            )}
          </Pressable>
        </View>
      )}

      {/* Pelaajakortti */}
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
