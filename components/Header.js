import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, FlatList, Alert, TouchableOpacity, Platform, BackHandler } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import styles from '../styles/styles';
import { database } from './Firebase';
import { ref, onValue } from 'firebase/database';

export default function Header({ isUserRecognized, name, playerId }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [topScores, setTopScores] = useState([]);

  useEffect(() => {
    if (modalVisible && playerId) {
      fetchTopScores();
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
              const sortedScores = Object.values(scores)
                .sort((a, b) => b.points - a.points)
                .slice(0, 5);
              setTopScores(sortedScores);
            } else {
              setTopScores([]);
            }
          } else {
            setTopScores([]);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching top scores:', error);
    }
  };

  const getTopScoresWithEmptySlots = () => {
    const emptyScores = Array(5 - topScores.length).fill({ points: '---', date: '' });
    return [...topScores, ...emptyScores].slice(0, 5);
  };

  // Close the app
  const handleAppClose = () => {
    Alert.alert(
      'Exit Game',
      'Are you sure you want to exit the game?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => handleCloseApp() },
      ],
      { cancelable: false }
    );
  };

  const handleCloseApp = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    }
  };

  return (
    <View style={styles.header}>
      <Text style={styles.title}>
        Yatzy <FontAwesome5 name="dice" size={35} color="black" />
      </Text>
      {isUserRecognized && name && (
        <Pressable
          style={({ pressed }) => [
            styles.button,
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
                    <Text style={styles.modalText}>{`${index + 1}. ${item.points} points`}</Text>
                    <Text style={styles.modalSubText}>{item.date || 'No date'}</Text>
                  </View>
                  <View style={styles.modalDivider} />
                </View>
              )}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleAppClose}>
              <Text style={styles.modalButtonText}>Close Application</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
