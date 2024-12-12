import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useGame } from '../components/GameContext';  
import styles from '../styles/playerCardStyles';  
import { database } from './Firebase';
import { ref, onValue } from 'firebase/database';

export default function PlayerCard({ isModalVisible, setModalVisible }) {
    const { playerId, playerName, viewingPlayerId, viewingPlayerName, resetViewingPlayer } = useGame();  

    const [topScores, setTopScores] = useState([]);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [monthlyRanks, setMonthlyRanks] = useState(Array(12).fill(null));
    const currentMonth = new Date().getMonth();

    // Use the viewingPlayerId if it exists, otherwise use playerId
    const idToUse = viewingPlayerId || playerId;
    const nameToUse = viewingPlayerName || playerName;

    useEffect(() => {
        if (isModalVisible && idToUse) {
            console.log('Selected Player ID in PlayerCard:', idToUse);
            fetchTopScores();
            fetchMonthlyRanks();
        }
    }, [isModalVisible, idToUse]);

    useEffect(() => {
        // Reset viewing player when modal is closed
        if (!isModalVisible) {
            resetViewingPlayer();
        }
    }, [isModalVisible, resetViewingPlayer]);

    const fetchTopScores = () => {
        if (idToUse) {
            const playerRef = ref(database, `players/${idToUse}/scores`);
            onValue(playerRef, (snapshot) => {
                if (snapshot.exists()) {
                    const scores = snapshot.val();
                    const sortedScores = Object.values(scores)
                        .map(score => ({
                            points: score.points,
                            date: score.date,
                            duration: score.duration,
                            time: score.time,
                        }))
                        .sort((a, b) => b.points - a.points)  // Sort scores by points
                        .slice(0, 5); // Slice to get only top 5
                    setTopScores(sortedScores);  // Update topScores state
                } else {
                    setTopScores([]);  // If no scores exist
                }
            });
        }
    };

    const fetchMonthlyRanks = () => {
        const monthlyScores = Array(12).fill([]);

        const playerRef = ref(database, `players`);
        onValue(playerRef, (snapshot) => {
            if (snapshot.exists()) {
                const playersData = snapshot.val();
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth(); 

                // Loop through all players and their scores
                Object.keys(playersData).forEach(playerId => {
                    const playerScores = playersData[playerId].scores || {};

                    Object.values(playerScores).forEach(score => {
                        const scoreDate = new Date(score.date.split('.').reverse().join('-')); // "4.12.2024" -> "2024-12-04"

                        if (scoreDate.getFullYear() === currentYear) {
                            const monthIndex = scoreDate.getMonth();  // Month index 0-11
                            const existingMonthScores = monthlyScores[monthIndex];
                            const playerBestScore = existingMonthScores.find(score => score.playerId === playerId);

                            if (!playerBestScore || playerBestScore.points < score.points) {
                                monthlyScores[monthIndex] = existingMonthScores.filter(score => score.playerId !== playerId);
                                monthlyScores[monthIndex].push({
                                    playerId,
                                    points: score.points,
                                    time: score.time,
                                });
                            }
                        }
                    });
                });

                // Count ranks for each month
                const monthRanks = monthlyScores.map((monthScores, index) => {
                    if (monthScores.length === 0) {
                        return '--';
                    }


                    monthScores.sort((a, b) => b.points - a.points);
                    const rank = monthScores.findIndex(score => score.playerId === idToUse) + 1;

                    return rank === 0 ? '--' : rank;
                });

                setMonthlyRanks(monthRanks);
            } else {
                setMonthlyRanks(Array(12).fill('--'));
            }
        });
    };

    // Trophy visualizations
    const getTrophyForMonth = (monthIndex) => {
        const rank = monthlyRanks[monthIndex];
        if (rank === '--') return <Text style={styles.emptySlotText}>--</Text>;
        if (rank === 1) return <FontAwesome5 name="trophy" size={30} color="gold" />;
        if (rank === 2) return <FontAwesome5 name="trophy" size={25} color="silver" />;
        if (rank === 3) return <FontAwesome5 name="trophy" size={20} color="brown" />;
        return <Text style={[styles.playerCardMonthText, { fontWeight: 'bold', marginTop: 30, fontSize: 20 }]}>{rank}.</Text>;
    };

    const getTopScoresWithEmptySlots = () => {
        const emptyScores = Array(5 - topScores.length).fill({ points: '', date: '', duration: '' });
        return [...topScores, ...emptyScores].slice(0, 5);
    };

    return (
        <View style={styles.playerCardContainer}>
            {/* PlayerCard Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.playerCardModalBackground}>
                    <View style={styles.playerCardModalContainer}>
                        <Pressable
                            style={styles.playerCardCloseButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.playerCardCloseText}>X</Text>
                        </Pressable>

                        {/* Player name and Avatar */}
                        <View style={styles.playerInfoContainer}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    style={styles.avatar}
                                    source={{ uri: avatarUrl || 'default_avatar_url_here' }}
                                />
                            </View>
                            <View style={styles.playerNameContainer}>
                                <Text style={styles.playerCardName}>{nameToUse}</Text>
                            </View>
                        </View>

                        {/* TOP 5 */}
                        <ScrollView style={styles.playerCardScoresContainer}>
                            <Text style={styles.playerCardScoresTitle}>YOUR TOP 5 SCORES</Text>
                            {getTopScoresWithEmptySlots().map((score, index) => (
                                <View key={index} style={styles.scoreRow}>
                                    <View style={styles.scoreTextContainer}>
                                        <Text style={styles.playerCardScoreItem}>
                                            {index + 1}. {score.points} points in {score.duration} sec
                                        </Text>
                                    </View>
                                    <View style={styles.dateContainer}>
                                        <Text style={styles.playerCardScoreDate}>{score.date}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Throphy cabinet */}
                        <View style={styles.playerCardTrophyCase}>
                            <Text style={styles.playerCardTrophyCaseTitle}>TROPHIES 2024</Text>
                            <View style={styles.playerCardMonthsContainer}>
                                {Array(12).fill(null).map((_, index) => (
                                    <View
                                        key={index}
                                        style={[styles.playerCardMonth, index === currentMonth ? styles.playerCardOngoingMonth : null]}
                                    >
                                        <Text style={styles.playerCardMonthText}>{index + 1}</Text>
                                        {getTrophyForMonth(index)}
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}  
