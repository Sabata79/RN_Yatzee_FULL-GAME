import React, { useEffect, useState } from 'react';
import { Linking, Modal, View, Text, Pressable, Dimensions, Easing, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

import { GameProvider } from './components/GameContext';
import LandingPage from './components/LandingPage';
import Home from './components/Home';
import Gameboard from './components/Gameboard';
import Scoreboard from './components/Scoreboard';
import About from './components/AboutMe';
import Rules from './components/Rules';
import Header from './components/Header';
import updateModalStyles from './styles/updateModalStyles';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 720;
const isBigScreen = height >= 900;

export default function App() {
  const [isUserRecognized, setIsUserRecognized] = useState(false);
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const updateMessage =
    'A new version of the app is available. Please update to get the latest features and improvements.';

  const Stack = createStackNavigator();
  const Tab = createBottomTabNavigator();

  const makeIcon = (name) => ({ focused }) => {
    const boxW = isSmallScreen ? 28 : isBigScreen ? 34 : 30;   // laatikon leveys
    const size = isSmallScreen ? 18 : isBigScreen ? 24 : 20;  // itse ikonin koko
    return (
      <View style={{ width: boxW, alignItems: 'center' }}>
        <FontAwesome5 name={name} size={size} color={focused ? '#eae6e6' : 'gray'} />
      </View>
    );
  };

  // Android: tumma navigaatiopalkki + vaaleat ikonit, edge-to-edge-ystävällinen
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    (async () => {
      try {
        await NavigationBar.setBackgroundColorAsync('#000000');
        await NavigationBar.setButtonStyleAsync('light'); // vaaleat ikonit
        // Halutessasi: jätetään nav bar näkyväksi, mutta käyttäjä voi swipeaamalla tuoda sen esiin
        await NavigationBar.setBehaviorAsync('inset-swipe');
      } catch (e) {
        console.log('[NavigationBar] not available:', e?.message);
      }
    })();
  }, []);

  const handleUpdate = async () => {
    const url = 'https://play.google.com/store/apps/details?id=com.SimpleYatzee';
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  const [loaded] = useFonts({
    AntonRegular: require('./assets/fonts/Anton-Regular.ttf'),
  });
  if (!loaded) return null;

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
          <View style={{ flex: 1, backgroundColor: '#000000e0', borderTopWidth: 0.6, borderTopColor: 'gold' }} />
        ),
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: isSmallScreen ? 9 : isBigScreen ? 16 : 12,
          letterSpacing: -0.1,
          fontFamily: 'AntonRegular',
        },
        // pientä vaakasuuntaista hengitystilaa itemille
        tabBarItemStyle: { paddingHorizontal: 4 },

        // ikonit: vakioitu laatikko -> ei enää klippausta
        tabBarIcon:
          route.name === 'Home' ? makeIcon('home') :
            route.name === 'Gameboard' ? makeIcon('dice') :
              route.name === 'Scoreboard' ? makeIcon('trophy') :
                route.name === 'Rules' ? makeIcon('book') :
                  route.name === 'About Me' ? makeIcon('user') :
                    undefined,
      })}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => {
            const iconStyle = {
              size: isSmallScreen ? 22 : 30,
              color: focused ? '#eae6e6' : 'gray',
            };
            return <FontAwesome5 name="home" {...iconStyle} />;
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
      <Tab.Screen name="About Me" options={{ tabBarLabel: 'About' }} component={About} />
    </Tab.Navigator>
  );

  return (
    <SafeAreaProvider>
      <GameProvider>
        {/* SafeAreaView täyttää koko näytön ja maalaa taustan mustaksi myös lovi/gesture-barin taakse */}
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#000' }}>
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

          {/* Expo StatusBar: vaalea teksti, läpinäkyvä tausta, edge-to-edge */}
          <StatusBar style="light" translucent backgroundColor="transparent" />
        </SafeAreaView>
      </GameProvider>
    </SafeAreaProvider>
  );
}
