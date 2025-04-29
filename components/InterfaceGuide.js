import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function InterfaceGuide() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Otsikko + Ikoni */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="compass-outline" size={24} color="gold" />
        <Text style={styles.sectionTitle}>Interface Guide</Text>
      </View>

      {/* Info: Miten korttiin pääsee */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🧍 Accessing Player Card</Text>
        <Text style={styles.infoText}>
          🔸 Tap your avatar in the top-right corner of the screen to open your personal Player Card.
        </Text>
        <Text style={[styles.infoText, { marginTop: 10 }]}>
          🔸Tap any player’s name on the Scoreboard to view their public Player Card.
        </Text>
      </View>

      {/* Playercard explain picture */}
      <Image
        source={require('../assets/playerCard_explained.png')} // ← vaihda tiedostonimi oikeaksi
        style={styles.image}
      />

      {/* Numbers and details */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📌 Player Card Sections</Text>

        <View style={styles.bulletRow}>
          <View style={styles.bullet}><Text style={styles.bulletText}>1</Text></View>
          <Text style={styles.infoText}>Avatar & Edit button</Text>
        </View>

        <View style={styles.bulletRow}>
          <View style={styles.bullet}><Text style={styles.bulletText}>2</Text></View>
          <Text style={styles.infoText}>Player level, progress bar, and statistics</Text>
        </View>

        <View style={styles.bulletRow}>
          <View style={styles.bullet}><Text style={styles.bulletText}>3</Text></View>
          <Text style={styles.infoText}>Top scores with duration and dates</Text>
        </View>

        <View style={styles.bulletRow}>
          <View style={styles.bullet}><Text style={styles.bulletText}>4</Text></View>
          <Text style={styles.infoText}>Monthly trophies for current year</Text>
        </View>

        <View style={styles.bulletRow}>
          <View style={styles.bullet}><Text style={styles.bulletText}>5</Text></View>
          <Text style={styles.infoText}>Coins that indicates weeklyWins</Text>
        </View>
      </View>

      {/* Avatar levels */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🔒 Avatar Unlocks</Text>
        <Text style={styles.infoText}>
          Some avatars are locked based on your level. Visit the Player Card to view and change unlocked avatars.
        </Text>
      </View>

      {/* PlayerCard Background info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🎴 Player Card Background</Text>
        <Text style={styles.infoText}>
          Your Player Card background updates automatically as you level up.
        </Text>
      </View>

      {/* Player level info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📈 Player Levels</Text>
        <Text style={styles.infoText}>Beginner: 0–400 games</Text>
        <Text style={styles.infoText}>Basic: 401–800 games</Text>
        <Text style={styles.infoText}>Advanced: 801–1200 games</Text>
        <Text style={styles.infoText}>Elite: 1201–2000 games</Text>
        <Text style={styles.infoText}>Legendary: 2000+ games</Text>
      </View>
      <View style={{ height: 80 }} />
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    color: 'gold',
    fontFamily: 'AntonRegular',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoTitle: {
    color: 'gold',
    fontSize: 16,
    fontFamily: 'AntonRegular',
    marginBottom: 5,
    textAlign: 'center',
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Roboto',
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 550,
    borderRadius: 12,
    marginBottom: 15,
    resizeMode: 'contain',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  bullet: {
    backgroundColor: 'gold',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Roboto',
  },
});
