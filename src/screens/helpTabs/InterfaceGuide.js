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
import { ScrollView, View, Text, Image } from 'react-native';
import gameRulesStyles from '../../styles/GameRulesStyles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export default function InterfaceGuide() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          gameRulesStyles.container,
          { paddingBottom: insets.bottom + tabBarHeight + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title and icon */}
        <View style={gameRulesStyles.sectionHeader}>
          <MaterialCommunityIcons name="compass-outline" size={24} color="gold" />
          <Text style={gameRulesStyles.sectionTitle}>Interface Guide</Text>
        </View>

        {/* Info: How to access the player card */}
        <View style={gameRulesStyles.infoBox}>
          <Text style={gameRulesStyles.infoTitle}>Accessing Player Card</Text>
          <Text style={gameRulesStyles.infoText}>
            🔸 Tap your avatar in the top-right corner of the screen to open your personal Player Card.
          </Text>
          <Text style={[gameRulesStyles.infoText, { marginTop: 10 }]}>
            🔸Tap any player’s name on the Scoreboard to view their public Player Card.
          </Text>
        </View>

        {/* Player card explanation image */}
        <Image
          source={require('../../../assets/playerCard_explained.webp')}
          style={gameRulesStyles.image}
        />

        {/* Player card sections and details */}
        <View style={gameRulesStyles.infoBox}>
          <Text style={gameRulesStyles.infoTitle}>📌 Player Card Sections</Text>

          <View style={gameRulesStyles.bulletRow}>
            <View style={gameRulesStyles.bullet}><Text style={gameRulesStyles.bulletText}>1</Text></View>
            <Text style={gameRulesStyles.infoText}>Avatar & Edit button</Text>
          </View>

          <View style={gameRulesStyles.bulletRow}>
            <View style={gameRulesStyles.bullet}><Text style={gameRulesStyles.bulletText}>2</Text></View>
            <Text style={gameRulesStyles.infoText}>level, progress bar, and stats</Text>
          </View>

          <View style={gameRulesStyles.bulletRow}>
            <View style={gameRulesStyles.bullet}><Text style={gameRulesStyles.bulletText}>3</Text></View>
            <Text style={gameRulesStyles.infoText}>Scores with duration and dates</Text>
          </View>

          <View style={gameRulesStyles.bulletRow}>
            <View style={gameRulesStyles.bullet}><Text style={gameRulesStyles.bulletText}>4</Text></View>
            <Text style={gameRulesStyles.infoText}>Monthly trophies for current year</Text>
          </View>

          <View style={gameRulesStyles.bulletRow}>
            <View style={gameRulesStyles.bullet}><Text style={gameRulesStyles.bulletText}>5</Text></View>
            <Text style={gameRulesStyles.infoText}>Coins that indicates weeklyWins</Text>
          </View>
        </View>

        {/* Avatar levels */}
        <View style={gameRulesStyles.infoBox}>
          <Text style={gameRulesStyles.infoTitle}>🔒 Avatar Unlocks</Text>
          <Text style={gameRulesStyles.infoText}>
            Some avatars are locked based on your level. Visit the Player Card to view and change unlocked avatars.
          </Text>
        </View>

        {/* Player card background info */}
        <View style={gameRulesStyles.infoBox}>
          <Text style={gameRulesStyles.infoTitle}>🎴 Player Card Background</Text>
          <Text style={gameRulesStyles.infoText}>
            Your Player Card background updates automatically as you level up.
          </Text>
        </View>

        {/* Player level info */}
        <View style={gameRulesStyles.infoBox}>
          <Text style={gameRulesStyles.infoTitle}>📈 Player Levels</Text>
          <Text style={gameRulesStyles.infoText}>Beginner: 0–400 games</Text>
          <Text style={gameRulesStyles.infoText}>Basic: 401–800 games</Text>
          <Text style={gameRulesStyles.infoText}>Advanced: 801–1200 games</Text>
          <Text style={gameRulesStyles.infoText}>Elite: 1201–2000 games</Text>
          <Text style={gameRulesStyles.infoText}>Legendary: 2000+ games</Text>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView >
    </SafeAreaView>
  );
}
