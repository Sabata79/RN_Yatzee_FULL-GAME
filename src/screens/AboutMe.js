// components/AboutMe.js
import {
  ScrollView,
  View,
  Text,
  Image,
  ImageBackground,
  Linking,
  StyleSheet,
} from 'react-native';
import {
  aboutTextContent,
  aboutFeatures,
} from '../constants/AboutContent';
import { useGame } from '../constants/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

// About screen component: shows app info, features, and contact links
export default function AboutMe() {
  const { gameVersion } = useGame();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    // Main background image and overlay for the About screen
    <ImageBackground
      source={require('../../assets/diceBackground.webp')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView
          // Scrollable content for About screen
          contentContainerStyle={[
            styles.container,
            {
              // riittävä pohjatila navipalkin ylle
              paddingBottom: insets.bottom + tabBarHeight + 16,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile image and title section */}
          <View style={styles.headerInfoBox}>
            <Image
              source={require('../../assets/profile.webp')}
              style={styles.profileImageLarge}
            />
            <View style={styles.headerTextWrapper}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.headerSubtitle}>
                Creator of SMR Yatzy
              </Text>
            </View>
          </View>

          {/* Info paragraphs from AboutContent */}
          <View style={styles.infoBox}>
            {aboutTextContent.trim().split('\n\n').map((paragraph, index) => (
              <Text key={index} style={styles.infoText}>
                {paragraph.trim()}
              </Text>
            ))}
          </View>

          <Text style={styles.boxTitle}>Features</Text>
          {/* Features section */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{aboutFeatures}</Text>
          </View>

          <Text style={styles.boxTitle}>Contact</Text>
          {/* Contact and external links */}
          <View style={styles.infoBox}>
            <Text
              style={styles.linkText}
              onPress={() =>
                Linking.openURL(
                  'https://github.com/Sabata79/RN_Yatzee_FULL-GAME/discussions/1'
                )
              }
            >
              💬 Feedback & Support
            </Text>
            <Text
              style={styles.linkText}
              onPress={() =>
                Linking.openURL(
                  'https://sabata79.github.io/RN_Yatzee_FULL-GAME/privacy-policy.html'
                )
              }
            >
              📜 Privacy Policy
            </Text>
            <Text
              style={styles.linkText}
              onPress={() =>
                Linking.openURL(
                  'https://sabata79.github.io/RN_Yatzee_FULL-GAME/terms-of-service.html'
                )
              }
            >
              ⚖️ Terms of Service
            </Text>
          </View>

          {/* Footer: version and copyright */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Version: {gameVersion}</Text>
            <Text style={styles.footerText}>© 2025 SMR Yatzy</Text>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    maxWidth: 420,
    alignSelf: 'center',
  },
  container: {
    padding: 20,
    flexGrow: 1,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  sectionTitle: {
    fontSize: 22,
    color: 'gold',
    fontFamily: 'AntonRegular',
    marginLeft: '10%',
    marginBottom: -50,
  },
  boxTitle: {
    color: 'gold',
    fontSize: 20,
    fontFamily: 'AntonRegular',
    marginBottom: 5,
    textAlign: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#e3dddd',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Roboto',
    textAlign: 'center',
    marginBottom: 10,
  },
  linkText: {
    color: '#ffd700',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    textAlign: 'center',
    fontFamily: 'Roboto',
    backgroundColor: '#00000088',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  footer: {
    marginTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#ccc9c9',
    fontFamily: 'Roboto',
  },
  headerInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  profileImageLarge: {
    width: 90,
    height: 90,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#e3dddd',
    marginRight: 15,
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerSubtitle: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'Roboto',
  },
});
