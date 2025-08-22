// App.js
// Main entry point for the Yatzy app
import { useState } from 'react';
import { View, Text, Pressable, Modal, Linking, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

import updateModalStyles from './styles/updateModalStyles';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 720;
const isBigScreen = height >= 900;


// Navigation stacks for the app
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main shell component containing navigation and modals
function AppShell() {
  const [isUserRecognized, setIsUserRecognized] = useState(false);
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  const updateMessage =
    'A new version of the app is available. Please update to get the latest features and improvements.';

  const insets = useSafeAreaInsets();

  // Open app store link for updating the app
  const handleUpdate = async () => {
    const url = 'https://play.google.com/store/apps/details?id=com.SimpleYatzee';
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

  const ICON_SIZE = isSmallScreen ? 22 : isBigScreen ? 28 : 26;

  // Wrapper for tab bar icons to prevent clipping
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

  // Bottom tab navigator for main app screens
  const TabNavigator = () => {
    const baseHeight = isSmallScreen ? 56 : isBigScreen ? 84 : 68;
    const bottomPad = Math.max(insets.bottom, 8);

    return (
      // Tab navigator with custom icons and styles
      <Tab.Navigator
        sceneContainerStyle={{ backgroundColor: '#000' }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            height: baseHeight + bottomPad,
            paddingBottom: bottomPad,
            paddingTop: 6,
            backgroundColor: '#000000E6',
            borderTopWidth: 0,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
          },
          tabBarBackground: () => (
            <View
              style={{
                flex: 1,
                backgroundColor: '#000000E6',
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

        <Tab.Screen
          name="Gameboard"
          options={{ tabBarLabel: 'Game' }}
          component={Gameboard}
        />
        <Tab.Screen
          name="Scoreboard"
          options={{ tabBarLabel: 'Scores' }}
          component={Scoreboard}
        />
        <Tab.Screen
          name="Rules"
          options={{ tabBarLabel: 'Help' }}
          component={Rules}
        />
        <Tab.Screen
          name="About Me"
          options={{ tabBarLabel: 'About' }}
          component={About}
        />
      </Tab.Navigator>
    );
  };

  return (
    // Main app view, includes update modal and navigation
    <View style={{ flex: 1, backgroundColor: '#000' }}>
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
            options={{
              headerShown: true,
              swipeEnabled: false,
              header: () => (
                <View style={{ paddingTop: insets.top, backgroundColor: '#000' }}>
                  <Header isUserRecognized={isUserRecognized} name={name} playerId={playerId} />
                </View>
              ),
            }}
          >
            {() => <TabNavigator />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>

      {/* Edge-to-edge: translucent so content can draw behind, we pad only where needed */}
      <StatusBar style="light" translucent backgroundColor="transparent" />
    </View>
  );
}

// Root component: loads fonts, provides context, and renders AppShell
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
