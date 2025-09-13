/**
 * App.js - Main entry point for the Yatzy app
 * Sets up navigation, context providers, and global styles.
 * @module App
 * @author Sabata79
 * @since 2025-08-30
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Linking,
  Dimensions,
  Easing,
  AppState,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { GameProvider } from './src/constants/GameContext';
import { AudioProvider } from './src/services/AudioManager';
import LandingPage from './src/screens/LandingPage';
import Home from './src/screens/Home';
import Gameboard from './src/screens/Gameboard';
import Scoreboard from './src/screens/Scoreboard';
import SettingScreen from './src/screens/SettingScreen';
import Rules from './src/screens/Rules';

import updateModalStyles from './src/styles/UpdateModalStyles';
import EnergyTokenSystem from './src/components/EnergyTokenSystem';

import * as NavigationBar from 'expo-navigation-bar';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 720;
const isBigScreen = height >= 900;

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

function AppShell() {
  const [isUserRecognized, setIsUserRecognized] = useState(false);
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  // --- ANDROID NAV BAR: keep hidden; do NOT react to keyboard events ---
  const navHiddenOnceRef = useRef(false);

  const applyHidden = async (reason = '') => {
    if (Platform.OS !== 'android') return;
    try {
      await NavigationBar.setButtonStyleAsync('light');
      await NavigationBar.setVisibilityAsync('hidden');
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    // Hide on mount
    const t0 = setTimeout(() => {
      applyHidden('mount');
      navHiddenOnceRef.current = true;
    }, 0);

    // Re-hide whenever app returns to foreground (OEMs may reset)
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') applyHidden('app active');
    });

    return () => {
      clearTimeout(t0);
      sub?.remove?.();
      // Optionally restore visible on unmount:
      NavigationBar.setVisibilityAsync('visible').catch(() => {});
    };
  }, []);

  const handleUpdate = async () => {
    const url = 'https://play.google.com/store/apps/details?id=com.SimpleYatzee';
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  const ICON_SIZE = isSmallScreen ? 22 : isBigScreen ? 28 : 26;

  const IconWrap = ({ children }) => (
    <View style={{ width: ICON_SIZE + 14, alignItems: 'center', overflow: 'visible' }}>
      {children}
    </View>
  );

  const TabNavigator = () => {
    const baseHeight = isSmallScreen ? 56 : isBigScreen ? 84 : 68;
    const bottomPad = Math.max(insets.bottom, 12);

    return (
      <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: 'black' }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            height: baseHeight + bottomPad,
            paddingBottom: bottomPad,
            paddingTop: 6,
            backgroundColor: 'black',
            borderTopWidth: 0,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
          },
          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: 'black', borderTopWidth: 0.6, borderTopColor: 'gold' }} />
          ),
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: 'gray',
          tabBarLabelStyle: {
            fontSize: isSmallScreen ? 9 : isBigScreen ? 16 : 12,
            letterSpacing: -0.1,
            fontFamily: 'AntonRegular',
          },
          tabBarItemStyle: { paddingHorizontal: 8, minWidth: isSmallScreen ? 64 : 72 },
          tabBarIcon: ({ focused }) => {
            const color = focused ? '#eae6e6' : 'gray';
            const common = {
              size: ICON_SIZE,
              color,
              allowFontScaling: false,
              style: { includeFontPadding: false, textAlign: 'center' },
            };

            if (route.name === 'Home') return <IconWrap><FontAwesome5 name="home" {...common} /></IconWrap>;
            if (route.name === 'Gameboard') return <IconWrap><FontAwesome5 name="dice" {...common} /></IconWrap>;
            if (route.name === 'Scoreboard') return <IconWrap><FontAwesome5 name="trophy" {...common} /></IconWrap>;
            if (route.name === 'Rules') return <IconWrap><FontAwesome5 name="book" {...common} /></IconWrap>;
            if (route.name === 'Settings') return <IconWrap><Feather name="settings" {...common} /></IconWrap>;
            return null;
          },
        })}
      >
        <Tab.Screen
          name="Home"
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused }) => {
              const color = focused ? '#eae6e6' : 'gray';
              return (
                <IconWrap>
                  <FontAwesome5
                    name="home"
                    size={ICON_SIZE}
                    color={color}
                    allowFontScaling={false}
                    style={{ includeFontPadding: false, textAlign: 'center' }}
                  />
                </IconWrap>
              );
            },
            tabBarStyle: { display: 'none' },
          }}
        >
          {() => (
            <Home
              setIsUserRecognized={setIsUserRecognized}
              setName={setName}
              setPlayerId={setPlayerId}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Gameboard" options={{ tabBarLabel: 'Game' }} component={Gameboard} />
        <Tab.Screen name="Scoreboard" options={{ tabBarLabel: 'Scores' }} component={Scoreboard} />
        <Tab.Screen name="Rules" options={{ tabBarLabel: 'Help' }} component={Rules} />
        <Tab.Screen name="Settings" options={{ tabBarLabel: 'Settings' }} component={SettingScreen} />
      </Tab.Navigator>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }} edges={['top', 'left', 'right']}>
      <EnergyTokenSystem hidden />

      {/* Update modal */}
      <Modal
        visible={updateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <View style={updateModalStyles.updateModalOverlay}>
          <View style={updateModalStyles.updateModalContent}>
            <Text style={updateModalStyles.updateModalTitle}>New Update Available!</Text>
            <Text style={updateModalStyles.updateModalMessage}>
              A new version of the app is available. Please update to get the latest features and improvements.
            </Text>
            <Pressable style={updateModalStyles.updateModalUpdateButton} onPress={handleUpdate}>
              <Text style={updateModalStyles.updateModalUpdateButtonText}>Update</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <NavigationContainer
        theme={navTheme}
        onStateChange={() => {
          setTimeout(() => applyHidden('route change'), 60);
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'transparent' },
            gestureEnabled: false,
            transitionSpec: {
              open: { animation: 'timing', config: { duration: 3000, easing: Easing.out(Easing.cubic) } },
              close: { animation: 'timing', config: { duration: 3000, easing: Easing.out(Easing.cubic) } },
            },
            cardStyleInterpolator: ({ current }) => ({ cardStyle: { opacity: current.progress } }),
          }}
        >
          <Stack.Screen name="LandingPage" component={LandingPage} />
          <Stack.Screen name="MainApp" options={{ headerShown: false, swipeEnabled: false }}>
            {() => <TabNavigator />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>

      {/* Edge-to-edge: translucent so content can draw behind, we pad only where needed */}
      <StatusBar style="light" translucent backgroundColor="transparent" />
    </SafeAreaView>
  );
}

export default function App() {
  const [loaded] = useFonts({
    AntonRegular: require('./assets/fonts/Anton-Regular.ttf'),
    BangersRegular: require('./assets/fonts/Bangers-Regular.ttf'),
    MontserratBlack: require('./assets/fonts/Montserrat-Black.ttf'),
    MontserratExtraBold: require('./assets/fonts/Montserrat-ExtraBold.ttf'),
    MontserratBold: require('./assets/fonts/Montserrat-Bold.ttf'),
    MontserratSemiBold: require('./assets/fonts/Montserrat-SemiBold.ttf'),
    MontserratMedium: require('./assets/fonts/Montserrat-Medium.ttf'),
    MontserratRegular: require('./assets/fonts/Montserrat-Regular.ttf'),
    MontserratLight: require('./assets/fonts/Montserrat-Light.ttf'),
    MontserratExtraLight: require('./assets/fonts/Montserrat-ExtraLight.ttf'),
    MontserratThin: require('./assets/fonts/Montserrat-Thin.ttf'),
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <AudioProvider>
        <GameProvider>
          <AppShell />
        </GameProvider>
      </AudioProvider>
    </SafeAreaProvider>
  );
}
