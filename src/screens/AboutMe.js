/**
 * AboutMe.js - Screen for displaying app info, features, and contact links
 *
 * Contains the UI and logic for showing app information, features, and contact details.
 *
 * Usage:
 *   import AboutMe from './AboutMe';
 *   ...
 *   <AboutMe />
 *
 * @module screens/AboutMe
 * @author Sabata79
 * @since 2025-09-06
 */
import { ScrollView, View, Text, Image, ImageBackground, Linking } from 'react-native';
import aboutMeStyles from '../styles/AboutMeScreenStyles';
import { aboutTextContent, aboutFeatures } from '../constants/AboutContent';
import { useGame } from '../constants/GameContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

// About screen component: shows app info, features, and contact links
export default function AboutMe() {
  const { gameVersion } = useGame();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../../assets/diceBackground.webp')}
        style={aboutMeStyles.background}
        resizeMode="cover"
      >
        <View style={aboutMeStyles.overlay}>
          <ScrollView
            // Scrollable content for About screen
            contentContainerStyle={[
              aboutMeStyles.container,
              { paddingBottom: insets.bottom + tabBarHeight + 16 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile image and title section */}
            <Text style={aboutMeStyles.boxTitle}>About</Text>
            <View style={aboutMeStyles.headerInfoBox}>
              <Image
                source={require('../../assets/profile.webp')}
                style={aboutMeStyles.profileImageLarge}
              />
              <View style={aboutMeStyles.headerTextWrapper}>

                <Text style={aboutMeStyles.headerSubtitle}>
                  Creator of SMR Yatzy
                </Text>
              </View>
            </View>

            {/* Info paragraphs from AboutContent */}
            <View style={aboutMeStyles.infoBox}>
              {aboutTextContent.trim().split('\n\n').map((paragraph, index) => (
                <Text key={index} style={aboutMeStyles.infoText}>
                  {paragraph.trim()}
                </Text>
              ))}
            </View>

            <Text style={aboutMeStyles.boxTitle}>Features</Text>
            {/* Features section */}
            <View style={aboutMeStyles.infoBox}>
              <Text style={aboutMeStyles.infoText}>{aboutFeatures}</Text>
            </View>

<Text style={aboutMeStyles.boxTitle}>Credits</Text>
<View style={aboutMeStyles.infoBox}>
  <Text style={aboutMeStyles.infoText}>🔸 Thanks to all testers! 🔸</Text>

  <Text style={aboutMeStyles.infoText}>
    Special thanks <Text style={aboutMeStyles.rose}>🌹</Text>:
  </Text>

  <Text style={aboutMeStyles.nameItem}>Terhi</Text>
  <Text style={aboutMeStyles.nameItem}>Hiltsu</Text>
  <Text style={aboutMeStyles.nameItem}>Matti</Text>

  <Text style={aboutMeStyles.infoText}>
    Thank you for your patience and feedback during development!
  </Text>

  <Text style={aboutMeStyles.infoText}>Music &amp; SFX:</Text>
  <Text
    style={aboutMeStyles.linkText}
    onPress={() => Linking.openURL('https://pixabay.com/')}
  >
    Pixabay
  </Text>
</View>

            <Text style={aboutMeStyles.boxTitle}>Contact</Text>
            {/* Contact and external links */}
            <View style={aboutMeStyles.infoBox}>
              <Text
                style={aboutMeStyles.linkText}
                onPress={() =>
                  Linking.openURL(
                    'https://github.com/Sabata79/RN_Yatzee_FULL-GAME/discussions/1'
                  )
                }
              >
                💬 Feedback & Support
              </Text>
              <Text
                style={aboutMeStyles.linkText}
                onPress={() =>
                  Linking.openURL(
                    'https://sabata79.github.io/RN_Yatzee_FULL-GAME/privacy-policy.html'
                  )
                }
              >
                📜 Privacy Policy
              </Text>
              <Text
                style={aboutMeStyles.linkText}
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
            <View style={aboutMeStyles.footer}>
              <Text style={aboutMeStyles.footerText}>Version: {gameVersion}</Text>
              <Text style={aboutMeStyles.footerText}>© 2025 SMR Yatzy</Text>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

