// NOTICE: Styles of the component are in the file 'headerStyles.js'. Styles are made whit section flex and flexDirection row. 

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PlayerCard from './PlayerCard';
import EnergyTokenSystem from './EnergyTokenSystem';
import headerStyles from '../styles/headerStyles';
import { useGame } from './GameContext';
import { avatars } from '../constants/AvatarPaths';

export default function Header() {
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
    <View style={headerStyles.header}>
      {/* Header/Logo */}
      <View style={headerStyles.section1}>
        <Text style={headerStyles.headerTitle}>
          SMR </Text>
        <Image source={require('../assets/desktopIcon.png')} style={headerStyles.headerImage} />
      </View>

      {/* EnergyTokenSystem */}
      {userRecognized && (
        <View style={headerStyles.section2}>
          <EnergyTokenSystem onPlay={handleGamePlay} />
        </View>
      )}

      {/* UserName*/}
      {userRecognized && playerName && (
        <Pressable onPress={() => setModalVisible(true)}>
          <View style={headerStyles.section3}>
            <Text style={headerStyles.userName}>{playerName}</Text>
          </View>
        </Pressable>
      )}

      {/*Avatar*/}
      {userRecognized && (
        <Pressable onPress={() => setModalVisible(true)}>
          <View style={headerStyles.section4}>
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
          </View>
        </Pressable>
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
};
