// screens/Scoreboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, Modal, Image } from 'react-native';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles';
import { NBR_OF_SCOREBOARD_ROWS } from '../constants/Game';
import * as SecureStore from 'expo-secure-store';
import PlayerCard from './PlayerCard';
import { useGame } from '../components/GameContext';
import { avatars } from '../constants/AvatarPaths';
import { dbOnValue } from '../components/Firebase';

export default function Scoreboard() {
  const [scores, setScores] = useState([]);
  const [scoreType, setScoreType] = useState('allTime');
  const [userId, setUserId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const { setViewingPlayerIdContext, setViewingPlayerNameContext } = useGame();

  useEffect(() => {
    SecureStore.getItemAsync('user_id').then((storedUserId) => {
      if (storedUserId) setUserId(storedUserId);
    });
  }, []);

  useEffect(() => {
    const path = 'players';

    const parseDate = (d) => {
      // "dd.mm.yyyy" → Date
      const parts = String(d).split('.');
      if (parts.length !== 3) return new Date('1970-01-01');
      const [dd, mm, yyyy] = parts;
      return new Date(`${yyyy}-${mm}-${dd}`);
    };

    const handleSnapshot = (snapshot) => {
      const playersData = snapshot.val();
      const tmpScores = [];
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentWeek = getWeekNumber(now);

      if (playersData) {
        Object.keys(playersData).forEach((pid) => {
          const player = playersData[pid];
          if (!player?.scores) return;

          let scoresToUse = [];

          if (scoreType === 'monthly') {
            scoresToUse = Object.values(player.scores).filter((s) => {
              const d = parseDate(s.date);
              return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
          } else if (scoreType === 'weekly') {
            scoresToUse = Object.values(player.scores).filter((s) => {
              const d = parseDate(s.date);
              return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
            });
          } else {
            // allTime
            scoresToUse = Object.values(player.scores);
          }

          if (scoresToUse.length > 0) {
            let best = null;
            scoresToUse.forEach((s) => {
              if (
                !best ||
                Number(s.points) > Number(best.points) ||
                (Number(s.points) === Number(best.points) && Number(s.duration) < Number(best.duration)) ||
                (Number(s.points) === Number(best.points) &&
                  Number(s.duration) === Number(best.duration) &&
                  parseDate(s.date) < parseDate(best.date))
              ) {
                best = s;
              }
            });

            if (best) {
              tmpScores.push({
                ...best,
                name: player.name,
                playerId: pid,
                avatar: player.avatar || null,
                scores: Object.values(player.scores),
              });
            }
          }
        });

        const sorted = tmpScores.sort((a, b) => {
          if (Number(b.points) !== Number(a.points)) return Number(b.points) - Number(a.points);
          if (Number(a.duration) !== Number(b.duration)) return Number(a.duration) - Number(b.duration);
          return parseDate(a.date) - parseDate(b.date);
        });

        setScores(sorted);
      } else {
        setScores([]);
      }
    };

    // Kiinnitä kuuntelija ja irrota kun scoreType vaihtuu / unmount
    const unsubscribe = dbOnValue(path, handleSnapshot);
    return () => {
      try {
        unsubscribe && unsubscribe();
      } catch (_) {
        // no-op
      }
    };
  }, [scoreType]);

  // ISO-viikkonumero (ma–su)
  function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // su=7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  const handlePlayerCard = (playerId, playerName, playerScores) => {
    const player = { playerId, playerName, playerScores };
    setSelectedPlayer(player);
    setViewingPlayerIdContext(playerId);
    setViewingPlayerNameContext(playerName);
    requestAnimationFrame(() => setModalVisible(true));
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPlayer(null);
    setViewingPlayerIdContext('');
    setViewingPlayerNameContext('');
  };

  const getAvatarStyle = (avatarPath) => {
    const avatar = avatars.find((av) => av.path === avatarPath);
    if (!avatar) return styles.defaultAvatarIcon;
    if (avatar.level === 'Beginner') return styles.beginnerAvatar;
    if (avatar.level === 'Advanced') return styles.advancedAvatar;
    return styles.avatar;
  };

  return (
    <ImageBackground source={require('../assets/diceBackground.webp')} style={styles.background}>
      <View style={styles.overlay}>
        <ScrollView style={styles.container}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={scoreType === 'allTime' ? styles.activeTab : styles.inactiveTab}
              onPress={() => setScoreType('allTime')}
            >
              <Text style={styles.tabText}>All Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={scoreType === 'monthly' ? styles.activeTab : styles.inactiveTab}
              onPress={() => setScoreType('monthly')}
            >
              <Text style={styles.tabText}>Monthly</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={scoreType === 'weekly' ? styles.activeTab : styles.inactiveTab}
              onPress={() => setScoreType('weekly')}
            >
              <Text style={styles.tabText}>Weekly</Text>
            </TouchableOpacity>
          </View>

          {scores.length === 0 ? (
            <Text style={styles.scoreboardText}>No scores yet</Text>
          ) : (
            <DataTable style={styles.scoreboardContainer}>
              <DataTable.Header>
                <DataTable.Title style={[styles.rankHeaderCell]}>
                  <Text style={styles.scoreboardHeader}>Rank #</Text>
                </DataTable.Title>
                <DataTable.Title style={[styles.playerHeaderCell]}>
                  <Text style={styles.scoreboardHeader}>Player</Text>
                </DataTable.Title>
                <DataTable.Title style={[styles.durationHeaderCell]}>
                  <Text style={styles.scoreboardHeader}>Duration</Text>
                </DataTable.Title>
                <DataTable.Title style={[styles.pointsHeaderCell]}>
                  <Text style={styles.scoreboardHeader}>Points</Text>
                </DataTable.Title>
              </DataTable.Header>

              {scores.slice(0, NBR_OF_SCOREBOARD_ROWS).map((score, index) => {
                const isCurrentUser = score.playerId === userId;

                return (
                  <DataTable.Row
                    key={`${score.playerId}-${index}`}
                    onPress={() => handlePlayerCard(score.playerId, score.name, score.scores)}
                    style={isCurrentUser ? { backgroundColor: '#d3bd867a' } : {}}
                  >
                    <DataTable.Cell style={[styles.rankCell]}>
                      {index === 0 && (
                        <View style={styles.medalWrapper}>
                          <Image source={require('../assets/medals/firstMedal.webp')} style={styles.medal} />
                        </View>
                      )}
                      {index === 1 && (
                        <View style={styles.medalWrapper}>
                          <Image source={require('../assets/medals/silverMedal.webp')} style={styles.medal} />
                        </View>
                      )}
                      {index === 2 && (
                        <View style={styles.medalWrapper}>
                          <Image source={require('../assets/medals/bronzeMedal.webp')} style={styles.medal} />
                        </View>
                      )}
                      {index > 2 && <Text style={styles.rankText}>{index + 1}.</Text>}
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.playerCell]}>
                      <View style={styles.playerWrapper}>
                        {(() => {
                          const avatarSource = avatars.find((a) => a.path === score.avatar)?.display;
                          return avatarSource ? (
                            <Image source={avatarSource} style={getAvatarStyle(score.avatar)} />
                          ) : (
                            <View style={styles.defaultAvatarIcon}>
                              <FontAwesome5 name="user" size={22} color="white" />
                            </View>
                          );
                        })()}
                        <Text style={styles.playerNameText}>{score.name}</Text>
                      </View>
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.durationCell]}>
                      <Text style={styles.durationText}>{score.duration}s</Text>
                    </DataTable.Cell>

                    <DataTable.Cell style={[styles.pointsCell]}>
                      <Text style={styles.pointsText}>{score.points}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>

      {/* PlayerCard modal */}
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        {selectedPlayer && (
          <PlayerCard
            playerId={selectedPlayer?.playerId ?? ''}
            playerName={selectedPlayer?.playerName ?? ''}
            playerScores={selectedPlayer?.playerScores ?? []}
            isModalVisible={modalVisible}
            setModalVisible={setModalVisible}  // anna suoraan setter, PlayerCard osaa kutsua falseksi
          />
        )}
      </Modal>
    </ImageBackground>
  );
}
