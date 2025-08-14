// App.js
import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Linking, Dimensions, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator, SceneStyleInterpolators } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { GameProvider } from './components/GameContext';
import LandingPage from './components/LandingPage';
import Home from './components/Home';
import Gameboard from './components/Gameboard';
import Scoreboard from './components/Scoreboard';
import About from './components/AboutMe';
import Rules from './components/Rules';
import Header from './components/Header';

import styles from './styles/styles';
import updateModalStyles from './styles/updateModalStyles';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 720;
const isBigScreen = height >= 900;

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AppShell() {
  const [isUserRecognized, setIsUserRecognized] = useState(false);
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  const updateMessage =
    'A new version of the app is available. Please update to get the latest features and improvements.';

  const insets = useSafeAreaInsets();

  const handleUpdate = async () => {
    const url = 'https://play.google.com/store/apps/details?id=com.SimpleYatzee';
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  const ICON_SIZE = isSmallScreen ? 22 : isBigScreen ? 28 : 28;

  const IconWrap = ({ children }) => (
    <View
      style={{
        width: ICON_SIZE + 14, // extra horizontal room so glyphs don't clip
        alignItems: 'center',
        overflow: 'visible',
      }}
    >
      {children}
    </View>
  );

  const TabNavigator = () => (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: isSmallScreen ? 55 : isBigScreen ? 85 : 70,
          paddingTop: isSmallScreen ? 0 : 5,
          backgroundColor: '#000000e0',
          borderTopWidth: 0,
          position: 'absolute',
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: '#000000e0',
              borderTopWidth: 0.6,
              borderTopColor: 'gold',
            }}
          />
        ),
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: isSmallScreen ? 9 : isBigScreen ? 16 : 12,
          letterSpacing: -0.1,
          fontFamily: 'AntonRegular',
        },
        tabBarItemStyle: {
          paddingHorizontal: 8,
          minWidth: isSmallScreen ? 64 : 72,
        },
        tabBarIcon: ({ focused }) => {
          const color = focused ? '#eae6e6' : 'gray';
          const common = {
            size: ICON_SIZE,
            color,
            allowFontScaling: false,
            style: { includeFontPadding: false, textAlign: 'center' },
          };

          if (route.name === 'Home') {
            return (
              <IconWrap>
                <FontAwesome5 name="home" {...common} />
              </IconWrap>
            );
          }
          if (route.name === 'Gameboard') {
            return (
              <IconWrap>
                <FontAwesome5 name="dice" {...common} />
              </IconWrap>
            );
          }
          if (route.name === 'Scoreboard') {
            return (
              <IconWrap>
                <FontAwesome5 name="trophy" {...common} />
              </IconWrap>
            );
          }
          if (route.name === 'Rules') {
            return (
              <IconWrap>
                <FontAwesome5 name="book" {...common} />
              </IconWrap>
            );
          }
          if (route.name === 'About Me') {
            return (
              <IconWrap>
                <FontAwesome5 name="user" {...common} />
              </IconWrap>
            );
          }
          return null;
        },
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          },
        },
        sceneStyleInterpolator: SceneStyleInterpolators?.forFade,
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
          <Home setIsUserRecognized={setIsUserRecognized} setName={setName} setPlayerId={setPlayerId} />
        )}
      </Tab.Screen>

      <Tab.Screen name="Gameboard" options={{ tabBarLabel: 'Game' }} component={Gameboard} />
      <Tab.Screen name="Scoreboard" options={{ tabBarLabel: 'Scores' }} component={Scoreboard} />
      <Tab.Screen name="Rules" options={{ tabBarLabel: 'Help' }} component={Rules} />
      <Tab.Screen name="About Me" options={{ tabBarLabel: 'About' }} component={About} />
    </Tab.Navigator>
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom, // keep content above system nav bar
          backgroundColor: '#000', // avoid white flashes on edge-to-edge
        },
      ]}
    >
      <Modal
        visible={updateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <View style={updateModalStyles.updateModalOverlay}>
          <View style={updateModalStyles.updateModalContent}>
            <Text style={updateModalStyles.updateModalTitle}>New Update Available!</Text>
            <Text style={updateModalStyles.updateModalMessage}>{updateMessage}</Text>
            <Pressable style={updateModalStyles.updateModalUpdateButton} onPress={handleUpdate}>
              <Text style={updateModalStyles.updateModalUpdateButtonText}>Update</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LandingPage" component={LandingPage} />
          <Stack.Screen
            name="MainApp"
            component={TabNavigator}
            options={{
              headerShown: true,
              swipeEnabled: false,
              header: () => (
                <Header isUserRecognized={isUserRecognized} name={name} playerId={playerId} />
              ),
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      <StatusBar style="light" translucent backgroundColor="transparent" />
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    AntonRegular: require('./assets/fonts/Anton-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <GameProvider>
        <AppShell />
      </GameProvider>
    </SafeAreaProvider>
  );
}
