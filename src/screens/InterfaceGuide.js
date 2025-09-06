/**
 * InterfaceGuide.js - Screen for guiding users through the app interface
 *
 * Contains instructions and tips for using the app interface.
 *
 * Usage:
 *   import InterfaceGuide from './InterfaceGuide';
 *   ...
 *   <InterfaceGuide />
 *
 * @module screens/InterfaceGuide
 * @author Sabata79
 * @since 2025-09-06
 */
import { ScrollView, View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';
import SPACING from '../constants/spacing';

export default function InterfaceGuide() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + tabBarHeight + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title and icon */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="compass-outline" size={24} color="gold" />
          <Text style={styles.sectionTitle}>Interface Guide</Text>
        </View>

        {/* Info: How to access the player card */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>🧍 Accessing Player Card</Text>
          <Text style={styles.infoText}>
            🔸 Tap your avatar in the top-right corner of the screen to open your personal Player Card.
          </Text>
          <Text style={[styles.infoText, { marginTop: 10 }]}>
            🔸Tap any player’s name on the Scoreboard to view their public Player Card.
          </Text>
        </View>

        {/* Player card explanation image */}
        <Image
          source={require('../../assets/playerCard_explained.webp')}
          style={styles.image}
        />

        {/* Player card sections and details */}
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

        {/* Player card background info */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.warning,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: COLORS.overlayDark,
    padding: SPACING.md,
    borderRadius: 10,
    marginBottom: SPACING.sm,
  },
  infoTitle: {
    color: COLORS.warning,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  infoText: {
    color: COLORS.textLight,
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 550,
    borderRadius: 12,
    marginBottom: SPACING.md,
    resizeMode: 'contain',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  bullet: {
    backgroundColor: COLORS.warning,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    color: COLORS.black,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
  },
});
