import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { database } from './Firebase';
import { ref, onValue } from 'firebase/database';
import styles from '../styles/playerCardStyles'; // Käytetään styles.js tiedostosta

export default function PlayerCard({ playerId, playerName, isModalVisible, setModalVisible }) {
    const [topScores, setTopScores] = useState([]);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [monthlyRanks, setMonthlyRanks] = useState(Array(12).fill(null));  // Alustetaan 12 kuukauden tyhjällä arvolla

    // Kuukausien nimet
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Get top 5 scores for the user
    const fetchTopScores = () => {
        if (playerId) {
            const playerRef = ref(database, `players/${playerId}/scores`);
            onValue(playerRef, (snapshot) => {
                if (snapshot.exists()) {
                    const scores = snapshot.val();
                    const sortedScores = Object.values(scores)
                        .map(score => ({
                            points: score.points, // Pisteet
                            date: score.date,     // Päivämäärä
                            duration: score.duration, // Duration
                            time: score.time,     // Aika
                        }))
                        .sort((a, b) => b.points - a.points) // Järjestetään pistemäärän mukaan
                        .slice(0, 5); // Haetaan top 5
                    setTopScores(sortedScores);
                } else {
                    setTopScores([]);
                }
            });
        }
    };

    // Get monthly ranks based on scores
    const fetchMonthlyRanks = () => {
        if (playerId) {
            console.log('fetchMonthlyRanks: Käynnistetään...');  // Debug: Varmistetaan, että funktio käynnistyy

            const playerRef = ref(database, `players`);
            onValue(playerRef, (snapshot) => {
                if (snapshot.exists()) {
                    console.log('Snapshot exists. Suoritetaan data-haku...');  // Debug: Varmistetaan, että data löytyy

                    const playersData = snapshot.val(); // Haetaan kaikkien pelaajien tiedot
                    const currentYear = new Date().getFullYear();
                    const currentMonth = new Date().getMonth(); // Nykyinen kuukausi
                    const monthlyScores = Array(12).fill([]); // Alustetaan kuukausittaiset tulokset tyhjillä taulukoilla

                    // Käydään läpi kaikkien pelaajien tulokset
                    Object.keys(playersData).forEach(playerId => {
                        const playerScores = playersData[playerId].scores || {}; // Hakee pelaajan tulokset

                        // Haetaan pelaajan paras tulos jokaiselta kuukaudelta
                        Object.values(playerScores).forEach(score => {
                            const scoreDate = new Date(score.date.split('.').reverse().join('-')); // Muotoillaan "4.12.2024" -> "2024-12-04"

                            console.log(`Score Date for ${playerId}:`, scoreDate); // Debug: Tulostetaan oikea päivämäärä

                            if (scoreDate.getFullYear() === currentYear) {
                                const monthIndex = scoreDate.getMonth();
                                console.log(`Score for ${playerId} on month ${months[monthIndex]}:`); // Debug: Näytetään mikä kuukauden tulos

                                // Lisätään pelaajan paras tulos kuukauden mukaan
                                const existingMonthScores = monthlyScores[monthIndex];
                                const playerBestScore = existingMonthScores.find(score => score.playerId === playerId);

                                if (!playerBestScore || playerBestScore.points < score.points) {
                                    // Jos pelaajalla ei ole vielä kuukauden parasta tulosta, tai uusi tulos on parempi, päivitetään
                                    monthlyScores[monthIndex] = existingMonthScores.filter(score => score.playerId !== playerId); // Poistetaan vanhat tulokset
                                    monthlyScores[monthIndex].push({
                                        playerId,    // Pelaajan ID
                                        points: score.points,
                                        time: score.time,
                                    });
                                }
                            }
                        });
                    });

                    console.log('Monthly Scores:', monthlyScores); // Debug: Näytetään kuukausittaiset tulokset

                    // Lasketaan sijoitukset kuukausittain
                    const monthRanks = monthlyScores.map((monthScores, index) => {
                        if (monthScores.length === 0) {
                            console.log(`Kuukausi ${months[index]} ei ole tuloksia`); // Debug: Näytetään, jos kuukaudelta ei löydy tuloksia
                            return '--'; // Näytetään -- merkillä tyhjä tulos
                        }

                        // Järjestetään kuukauden tulokset ja lasketaan sijoitus
                        monthScores.sort((a, b) => b.points - a.points); // Järjestetään tulokset
                        const rank = monthScores.findIndex(score => score.playerId === playerId) + 1; // Etsitään pelaajan sijoitus

                        console.log(`Kuukauden ${months[index]} sijoitus pelaajalle ${playerId}:`, rank); // Debug: Näytetään kuukauden sijoitus

                        return rank === 0 ? '--' : rank; // Jos sijoitus on 0, asetetaan -- (ei pelannut)
                    });

                    setMonthlyRanks(monthRanks); // Päivitetään kuukauden sijoitukset
                } else {
                    console.log('Ei löydy mitään tuloksia Firebase-tietokannasta.'); // Debug: Ei löydy tuloksia
                    setMonthlyRanks(Array(12).fill('--')); // Jos ei ole tuloksia, täytetään kaikki kuukaudet -- merkillä
                }
            });
        } else {
            console.log('fetchMonthlyRanks: playerId on tyhjä');  // Debug: Varmistetaan, että playerId on oikein
        }
    };

    useEffect(() => {
        if (isModalVisible && playerId) {
            fetchTopScores();
            fetchMonthlyRanks();
        }
    }, [isModalVisible, playerId]);

    const getTopScoresWithEmptySlots = () => {
        const emptyScores = Array(5 - topScores.length).fill({ points: '', date: '', duration: '' });
        return [...topScores, ...emptyScores].slice(0, 5); // Varmistetaan, että listassa on 5 tulosta
    };

    const getTrophyForMonth = (monthIndex) => {
        const rank = monthlyRanks[monthIndex];
        if (rank === '--') return <Text style={styles.emptySlotText}>--</Text>; // Jos ei tulosta kuukaudelta
        if (rank === 1) return <FontAwesome5 name="trophy" size={30} color="gold" />;
        if (rank === 2) return <FontAwesome5 name="trophy" size={25} color="silver" />;
        if (rank === 3) return <FontAwesome5 name="trophy" size={20} color="brown" />;
         return <Text style={[styles.playerCardMonthText, { fontWeight: 'bold', marginTop: 30, fontSize: 20 }]}>{rank}.</Text>; // Muut sijoitukset, kuten 4, 5, 6 jne.
    };

    return (
        <View style={styles.playerCardContainer}>
            {/* Pelaajakortti Modal */}
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

                        {/* Pelaajan avatar ja nimi yhdellä rivillä */}
                        <View style={styles.playerInfoContainer}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    style={styles.avatar}
                                    source={{ uri: avatarUrl || 'default_avatar_url_here' }}
                                />
                            </View>
                            <View style={styles.playerNameContainer}>
                                <Text style={styles.playerCardName}>{playerName}</Text>
                                <Text style={styles.playerCardPlayerID}>{`ID: ${playerId}`}</Text>
                            </View>
                        </View>

                        {/* TOP 5 tulokset */}
                        <ScrollView style={styles.playerCardScoresContainer}>
                            <Text style={styles.playerCardScoresTitle}>Your Top 5 Scores</Text>
                            {getTopScoresWithEmptySlots().map((score, index) => (
                                <View key={index} style={styles.scoreRow}>
                                    <Text style={styles.playerCardScoreItem}>
                                        {index + 1}. {score.points} points in {score.duration} sec
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Palkintokaappi */}
                        <View style={styles.playerCardTrophyCase}>
                            <Text style={styles.playerCardTrophyCaseTitle}>TROPHIES 2024</Text>
                            <View style={styles.playerCardMonthsContainer}>
                                {months.map((month, index) => (
                                    <View key={index} style={styles.playerCardMonth}>
                                        <Text style={styles.playerCardMonthText}>{month}</Text>
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
