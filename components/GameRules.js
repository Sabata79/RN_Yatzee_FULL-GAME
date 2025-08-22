// components/GameRules.js
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { rulesTextContent, combinationsData, SCORE_COMPARSION_TEXT } from '../constants/Game';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export default function GameRules() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom + tabBarHeight + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name="book-open-page-variant-outline"
          size={26}
          color="gold"
        />
        <Text style={styles.sectionTitle}>Gameplay Rules</Text>
      </View>

      <Text style={styles.paragraph}>{rulesTextContent}</Text>

      {/* Combinations Section Title with Icon */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="dice-multiple" size={26} color="gold" />
        <Text style={styles.sectionTitle}>Combinations</Text>
      </View>

      {combinationsData.map((combination, index) => (
        <View style={styles.combination} key={index}>
          <MaterialCommunityIcons name={combination.icon} size={30} color="gold" />
          <View style={styles.combinationText}>
            <Text style={styles.smallText}>{combination.smallText}</Text>
            <Text style={styles.description}>{combination.description}</Text>
          </View>
        </View>
      ))}

      {/* Scores Comparison Section Title with Icon */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="trophy-outline" size={24} color="gold" />
        <Text style={styles.sectionTitle}>{SCORE_COMPARSION_TEXT.title}</Text>
      </View>

      {/* Score Items */}
      <View style={styles.scoreItem}>
        <Text style={styles.scoreTitle}>1. Points</Text>
        <Text style={styles.scoreDescription}>Higher points are ranked first.</Text>
      </View>

      <View style={styles.scoreItem}>
        <Text style={styles.scoreTitle}>2. Duration</Text>
        <Text style={styles.scoreDescription}>
          If points are equal, the score with the shorter duration comes first.
        </Text>
      </View>

      <View style={styles.scoreItem}>
        <Text style={styles.scoreTitle}>3. Date/Time</Text>
        <Text style={styles.scoreDescription}>
          If both points and duration are equal, the score that was achieved earlier is ranked higher.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: -20,
  },
  title: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
    fontFamily: 'AntonRegular',
    textAlign: 'center',
  },
  paragraph: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Roboto',
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 10,
    borderRadius: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 30,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    color: 'gold',
    fontFamily: 'AntonRegular',
    textAlign: 'center',
  },
  combination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  combinationText: {
    marginLeft: 10,
    flex: 1,
    justifyContent: 'center',
  },
  smallText: {
    color: 'gold',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'AntonRegular',
  },
  description: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Roboto',
  },
  scoreItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  scoreTitle: {
    color: 'gold',
    fontSize: 16,
    fontFamily: 'AntonRegular',
    marginBottom: 5,
  },
  scoreDescription: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Roboto',
    lineHeight: 20,
  },
});
