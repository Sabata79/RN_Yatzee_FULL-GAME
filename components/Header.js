import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, FlatList, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles';
import { database } from './Firebase';
import { ref, onValue } from 'firebase/database';
import { useGame } from './GameContext'; // Tuodaan GameContext

export default function Header({ isUserRecognized, name }) {
  const { playerId } = useGame(); // Haetaan playerId GameContextista
  const [modalVisible, setModalVisible] = useState(false);
  const [topScores, setTopScores] = useState([]);

  useEffect(() => {
    if (modalVisible && playerId) {
      fetchTopScores(); // Haetaan top 5 tulokset, kun modal on avoinna ja playerId on olemassa
    }
  }, [modalVisible, playerId]);

  // Get top 5 scores for the user
  const fetchTopScores = () => {
    try {
      if (playerId) {
        const playerRef = ref(database, `players/${playerId}/scores`);
        onValue(playerRef, (snapshot) => {
          if (snapshot.exists()) {
            const scores = snapshot.val();
            if (scores) {
              // Käytetään Object.values(scores) ja järjestetään se points mukaan
              const sortedScores = Object.values(scores)
                .map(score => ({
                  points: score.points,  // Pisteet
                  date: score.date,      // Päivämäärä
                  duration: score.duration, // Duration
                  time: score.time,      // Aika
                }))
                .sort((a, b) => {
                  // Järjestetään pistemäärän mukaan, ja jos pistemäärät ovat samat, niin tarkastetaan duration
                  if (b.points === a.points) {
                    if (b.duration === a.duration) {
                      // Jos pistemäärät ja duration on samat, vertaa aikaleimaa (date + time)
                      const dateB = new Date(b.date + ' ' + b.time);
                      const dateA = new Date(a.date + ' ' + a.time);
                      return dateB - dateA;  // Järjestetään aikaleiman mukaan
                    }
                    return a.duration - b.duration;  // Jos duration sama, lajitellaan durationin mukaan
                  }
                  return b.points - a.points; // Muussa tapauksessa lajitellaan pistemäärän mukaan
                })
                .slice(0, 5); // Haetaan top 5
              setTopScores(sortedScores); // Asetetaan top 5
            } else {
              setTopScores([]); // Jos ei löydy tuloksia
            }
          } else {
            setTopScores([]); // Jos snapshot ei sisällä dataa
          }
        });
      }
    } catch (error) {
      console.error('Error fetching top scores:', error);
    }
  };

  const getTopScoresWithEmptySlots = () => {
    const emptyScores = Array(5 - topScores.length).fill({ points: '---', date: '', duration: '---' });
    return [...topScores, ...emptyScores].slice(0, 5); // Varmistetaan, että listassa on 5 tulosta
  };

  return (
    <View style={styles.header}>
      <Text style={styles.title}>
        Yatzy <FontAwesome5 name="dice" size={35} color="black" />
      </Text>
      {isUserRecognized && name && (
        <Pressable
          style={({ pressed }) => [
            styles.userButton,
            pressed && styles.buttonPressed,
            { marginLeft: 'auto', top: -5 }, 
          ]}
          onPress={() => {
            setModalVisible(true);
          }}
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalCenteredView}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>X</Text>
            </TouchableOpacity>

            <Text style={styles.modalText}>Your Top 5 Scores</Text>
            <FlatList
              data={getTopScoresWithEmptySlots()} 
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View>
                  <View style={styles.modalItemRow}>
                    <Text style={styles.modalText}>{`${index + 1}. ${item.points} points    (${item.duration} sec)`}</Text>
                    <Text style={styles.modalSubText}>{item.date || 'No date'}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
