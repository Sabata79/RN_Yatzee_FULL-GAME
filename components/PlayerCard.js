import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useGame } from '../components/GameContext';
import styles from '../styles/playerCardStyles';
import { database } from './Firebase';
import { ref, onValue, update } from 'firebase/database';
import { avatars } from '../constants/AvatarPaths';

export default function PlayerCard({ isModalVisible, setModalVisible }) {
    const { playerId, playerName, viewingPlayerId, viewingPlayerName, resetViewingPlayer, avatarUrl, setAvatarUrl } = useGame();

    const [viewingPlayerAvatar, setViewingPlayerAvatar] = useState('');
    const [avatarSelected, setAvatarSelected] = useState(null);
    const [monthlyRanks, setMonthlyRanks] = useState(Array(12).fill(null));
    const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
    const [topScores, setTopScores] = useState([]);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const idToUse = viewingPlayerId || playerId;
    const nameToUse = viewingPlayerName || playerName;

    const handleAvatarSelect = (avatar) => {
        const avatarPath = avatar.path;
        setAvatarSelected(avatarPath);
        setAvatarUrl(avatarPath); 
        saveAvatarToDatabase(avatarPath);
        setIsAvatarModalVisible(false);
    };

    const saveAvatarToDatabase = (avatarPath) => {
        if (avatarPath) {
            const playerRef = ref(database, `players/${playerId}`);
            update(playerRef, {
                avatar: avatarPath,
            })
                .then(() => {
                    setAvatarUrl(avatarPath);
                })
                .catch((error) => {
                    console.error('Error saving avatar to Firebase:', error);
                });
        } else {
            console.error('Avatarin polku on tyhjä!');
        }
    };

    useEffect(() => {
        if (isModalVisible && idToUse) {
            fetchTopScores();
            fetchMonthlyRanks();

            // Haetaan avatar Firebase-palvelusta
            const playerRef = ref(database, `players/${idToUse}/avatar`);
            onValue(playerRef, (snapshot) => {
                const avatarPath = snapshot.val();
                if (idToUse === playerId) {
                    setAvatarUrl(avatarPath || ''); 
                } else {
                    setViewingPlayerAvatar(avatarPath || '');
                }
            });
        }
    }, [isModalVisible, idToUse, playerId, setAvatarUrl]);

    useEffect(() => {
        if (!isModalVisible) {
            resetViewingPlayer();
        }
    }, [isModalVisible, resetViewingPlayer]);

    const getAvatarImage = (avatarPath) => {
        const avatar = avatars.find(av => av.path === avatarPath);
        return avatar ? avatar.display : require('../assets/whiteDices.png');
    };

    const getAvatarToDisplay = () => {
        return idToUse === playerId ? avatarUrl : viewingPlayerAvatar;
    };

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
                        .sort((a, b) => b.points - a.points)
                        .slice(0, 5);
                    setTopScores(sortedScores);
                } else {
                    setTopScores([]);
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

                Object.keys(playersData).forEach(playerId => {
                    const playerScores = playersData[playerId].scores || {};

                    Object.values(playerScores).forEach(score => {
                        const scoreDate = new Date(score.date.split('.').reverse().join('-'));

                        if (scoreDate.getFullYear() === currentYear) {
                            const monthIndex = scoreDate.getMonth();
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

                const monthRanks = monthlyScores.map((monthScores) => {
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

    const getTrophyForMonth = (monthIndex) => {
        const rank = monthlyRanks[monthIndex];

        if (rank === '--') return <Text style={styles.emptySlotText}>--</Text>;
        if (rank === 1) return (
            <View style={styles.trophyContainer}>
                <Image source={require('../assets/trophies/goldTrophy.jpeg')} style={styles.playerCardTrophyImage} />
                <Text style={styles.trophyText}>GOLD</Text>
            </View>
        );
        if (rank === 2) return (
            <View style={styles.trophyContainer}>
                <Image source={require('../assets/trophies/silverTrophy.jpeg')} style={styles.playerCardTrophyImage} />
                <Text style={styles.trophyText}>SILVER</Text>
            </View>
        );
        if (rank === 3) return (
            <View style={styles.trophyContainer}>
                <Image source={require('../assets/trophies/bronzeTrophy.jpeg')} style={styles.playerCardTrophyImage} />
                <Text style={styles.trophyText}>BRONZE</Text>
            </View>
        );
        return <Text style={[styles.playerCardMonthText, { fontWeight: 'bold', marginTop: 30, fontSize: 20 }]}>{rank}.</Text>;
    };

    const getTopScoresWithEmptySlots = () => {
        const emptyScores = Array(5 - topScores.length).fill({ points: '', date: '', duration: '' });
        return [...topScores, ...emptyScores].slice(0, 5);
    };

    return (
        <View style={styles.playerCardContainer}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.playerCardModalBackground}>
                    <View style={styles.playerCardModalContainer}>
                        <Image source={require('../assets/playercardBackground.jpeg')} style={styles.avatarModalBackgroundImage} />
                        <Pressable
                            style={styles.playerCardCloseButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.playerCardCloseText}>X</Text>
                        </Pressable>

                        <Modal
                            animationType="slide"
                            transparent={true}
                            visible={isAvatarModalVisible}
                            onRequestClose={() => setIsAvatarModalVisible(false)}
                        >
                            <View style={styles.avatarModalBackground}>
                                <View style={styles.avatarModalContainer}>
                                    <Text style={styles.avatarSelectText}>Choose your Avatar:</Text>
                                    <Pressable style={styles.closeAvatarModalButton} onPress={() =>
                                        setIsAvatarModalVisible(false)}>
                                        <Text style={styles.closeAvatarModalText}>X</Text>
                                    </Pressable>
                                    <View style={styles.avatarSelectionWrapper}>
                                        {avatars.map((avatar, index) => (
                                            <Pressable key={index} onPress={() => handleAvatarSelect(avatar)}>
                                                <Image style={styles.avatarModalImage} source={avatar.display} />
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </Modal>

                        <View style={styles.playerInfoContainer}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    style={styles.avatar}
                                    source={getAvatarImage(getAvatarToDisplay())}
                                />
                            </View>
                            {idToUse === playerId && (
                                <Pressable
                                    style={styles.editAvatarButton}
                                    onPress={() => setIsAvatarModalVisible(true)}
                                >
                                    <FontAwesome5 name="edit" size={20} color="white" />
                                </Pressable>
                            )}
                            <View style={styles.playerNameContainer}>
                                <Text style={styles.playerCardName}>{nameToUse}</Text>
                            </View>
                        </View>

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

                        <View style={styles.playerCardTrophyCase}>
                            <Text style={styles.playerCardTrophyCaseTitle}>TROPHIES {currentYear}</Text>
                            <View style={styles.playerCardMonthsContainer}>
                                {Array(12).fill(null).map((_, index) => (
                                    <View
                                        key={index}
                                        style={[styles.playerCardMonth, index === currentMonth ? styles.playerCardOngoingMonth : null]}
                                    >
                                        <Text style={styles.playerCardMonthText}>{monthNames[index]}</Text>
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
