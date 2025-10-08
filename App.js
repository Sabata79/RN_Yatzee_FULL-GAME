/**
 * App.js - Main entry point for the Yatzy app
 * Sets up navigation, context providers, and global styles.
 * @module App
 * @author Sabata79
 * @since 2025-08-30
 */
import React, { useState, useRef } from 'react';
import 'react-native-gesture-handler';
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
import './src/polyfills/reactNativeUseWindowDimensionsPolyfill';

import { GameProvider } from './src/constants/GameContext';
import { ElapsedTimeProvider } from './src/constants/ElapsedTimeContext';
import { AudioProvider } from './src/services/AudioManager';
import LandingPage from './src/screens/LandingPage';
import Home from './src/screens/Home';
import BackgroundWrapper from './src/components/BackgroundWrapper';
import Gameboard from './src/screens/Gameboard';
import Scoreboard from './src/components/ScoreboardTabs';
import SettingScreen from './src/screens/SettingScreen';
import Rules from './src/screens/Rules';

import UpdateModal from './src/components/modals/UpdateModal';
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
    // Modal is hidden by default; it is shown when LandingPage calls onRequireUpdate
    const [updateModalVisible, setUpdateModalVisible] = useState(false);
    // Keep both camelCase and snake_case keys to be tolerant to different remote-config shapes
    const [updateModalData, setUpdateModalData] = useState({
      title: '',
      message: '',
      update_message: '',
      releaseNotes: '',
      release_notes: '',
      mandatory: false,
      forceUpdate: false,
      updateUrl: '',
    });
  const insets = useSafeAreaInsets();

  // --- ANDROID NAV BAR ---
  const applyHidden = React.useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      // Edge-to-edge ja painikkeet vaaleiksi
      await NavigationBar.setButtonStyleAsync('light');
      // Immersive status: nav bar overlay + hidden
      await NavigationBar.setVisibilityAsync('hidden');
    } catch {
      console.log('NavigationBar.applyHidden: ignored error / unsupported op');
    }
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    // Hide nav bar on mount
    const t0 = setTimeout(applyHidden, 0);

    // Hide again when app returns to foreground
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') applyHidden();
    });

    return () => {
      clearTimeout(t0);
      sub?.remove?.();
    };
  }, [applyHidden]);

  // Track current route so we can keep a single BackgroundVideo instance mounted
  const [routeName, setRouteName] = React.useState('');
  const navigationRef = React.useRef(null);
  const [bgActive, setBgActive] = React.useState(false);
  const bgTimeoutRef = React.useRef(null);
  React.useEffect(() => {
    // Keep background video active for LandingPage, Home and Scoreboard
    const shouldBeActive = routeName === 'LandingPage' || routeName === 'Home' || routeName === 'Scoreboard';
    if (shouldBeActive) {
      // Cancel any pending disable
      if (bgTimeoutRef.current) {
        clearTimeout(bgTimeoutRef.current);
        bgTimeoutRef.current = null;
      }
      setBgActive(true);
      return;
    }
    // Delay disabling to avoid flicker on quick transitions
    if (bgTimeoutRef.current) clearTimeout(bgTimeoutRef.current);
    bgTimeoutRef.current = setTimeout(() => {
      setBgActive(false);
      bgTimeoutRef.current = null;
    }, 600);
    return () => { if (bgTimeoutRef.current) { clearTimeout(bgTimeoutRef.current); bgTimeoutRef.current = null; } };
  }, [routeName]);

  const handleUpdate = async () => {
    const url = 'https://play.google.com/store/apps/details?id=com.SimpleYatzee';
    console.log('[App] handleUpdate -> opening fixed URL', url);
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
            <View style={{ flex: 1, backgroundColor: 'black', borderTopWidth: 0.6, borderTopColor: '#e67e22' }} />
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
            tabBarStyle: { display: 'none' }, // hide tab bar on Home
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

      {/* Update modal (themed) */}
      <UpdateModal
        visible={updateModalVisible}
        title={updateModalData.title || 'Update available'}
        message={updateModalData.message || updateModalData.update_message || 'A new version is available.'}
        releaseNotes={updateModalData.releaseNotes || updateModalData.release_notes || ''}
        mandatory={!!updateModalData.mandatory}
        onClose={() => setUpdateModalVisible(false)}
        onUpdate={handleUpdate}
      />

      <BackgroundWrapper isActive={bgActive}>
        <NavigationContainer
        ref={navigationRef}
        theme={navTheme}
        onReady={() => {
          setTimeout(applyHidden, 50);
          const route = navigationRef.current?.getCurrentRoute?.();
          setRouteName(route?.name || '');
        }}
        onStateChange={() => {
          setTimeout(applyHidden, 50);
          const route = navigationRef.current?.getCurrentRoute?.();
          setRouteName(route?.name || '');
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
            <Stack.Screen name="LandingPage">{({ navigation }) => <LandingPage navigation={navigation} onRequireUpdate={(data) => {
              // normalize incoming data and show themed modal
              const messageVal = data?.update_message || data?.message || '';
              const releaseVal = data?.release_notes || data?.releaseNotes || '';
              const forceVal = !!data?.forceUpdate;

              const normalized = {
                title: data?.title || 'Update needed',
                message: messageVal,
                update_message: messageVal,
                releaseNotes: releaseVal,
                release_notes: releaseVal,
                mandatory: forceVal,
                forceUpdate: forceVal,
                // no dynamic update URL; app uses fixed Play Store link
                updateUrl: '',
              };
              console.log('[App] Showing UpdateModal with data:', JSON.stringify(normalized));
              setUpdateModalData(normalized);
              setUpdateModalVisible(true);
            }} />}</Stack.Screen>
          <Stack.Screen name="MainApp" options={{ headerShown: false, swipeEnabled: false }}>
            {() => <TabNavigator />}
          </Stack.Screen>
        </Stack.Navigator>
        </NavigationContainer>
      </BackgroundWrapper>

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
        <ElapsedTimeProvider>
          <GameProvider>
            <AppShell />
          </GameProvider>
        </ElapsedTimeProvider>
      </AudioProvider>
    </SafeAreaProvider>
  );
}
