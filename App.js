import * as Updates from 'expo-updates';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import Scoreboard from './components/Scoreboard';
import Gameboard from './components/Gameboard';
import About from './components/AboutMe';
import Rules from './components/Rules';
import Home from './components/Home';
import Header from './components/Header';
import Footer from './components/Footer';
import styles from './styles/styles';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { GameProvider } from './components/GameContext';

export default function App() {
  const [isUserRecognized, setIsUserRecognized] = useState(false);
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const Tab = createMaterialTopTabNavigator();

  // Update check if not in development environment
  useEffect(() => {
    
    if (!__DEV__) {
      const checkForUpdates = async () => {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            setUpdateAvailable(true); 
          }
        } catch (e) {
          console.error('Update failure: ', e);
        }
      };
      checkForUpdates();
    }
  }, []);

  // Lataa fontit, kun päivitys on tarkistettu
  const [loaded] = useFonts({
    AntonRegular: require('./assets/fonts/Anton-Regular.ttf'),
  });

  useEffect(() => {
    if (updateAvailable) {
      alert('Update available. Reloading...');
      Updates.reloadAsync(); // Lataa sovellus uudelleen päivityksen jälkeen
    }
  }, [updateAvailable]);

  // Jos fontit eivät ole ladattu, palauta null
  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GameProvider>
        <SafeAreaView style={styles.container}>
          <Header isUserRecognized={isUserRecognized} name={name} playerId={playerId} />
          <NavigationContainer>
            <Tab.Navigator
              tabBarPosition="bottom"
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                  height: 75,
                  backgroundColor: 'darkorange',
                },
                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: '#22201e',
                tabBarLabelStyle: {
                  fontSize: 9,
                  fontFamily: 'AntonRegular',
                },
                tabBarIndicatorStyle: { height: 0 },
                tabBarIcon: ({ focused }) => {
                  let iconName;

                  if (route.name === 'Home') {
                    iconName = 'home';
                    return (
                      <MaterialCommunityIcons
                        name={iconName}
                        size={24}
                        color={focused ? '#ffffff' : 'black'}
                      />
                    );
                  } else if (route.name === 'Gameboard') {
                    iconName = 'dice';
                    return (
                      <FontAwesome5
                        name={iconName}
                        size={24}
                        color={focused ? '#ffffff' : 'black'}
                        style={{ marginLeft: -5 }}
                      />
                    );
                  } else if (route.name === 'Scoreboard') {
                    iconName = 'list';
                    return (
                      <FontAwesome5
                        name={iconName}
                        size={24}
                        color={focused ? '#ffffff' : 'black'}
                      />
                    );
                  } else if (route.name === 'Rules') {
                    iconName = 'book';
                    return (
                      <FontAwesome5
                        name={iconName}
                        size={24}
                        color={focused ? '#ffffff' : 'black'}
                        style={{ marginLeft: 0 }}
                      />
                    );
                  } else if (route.name === 'About Me') {
                    iconName = 'info';
                    return (
                      <FontAwesome5
                        name={iconName}
                        size={24}
                        color={focused ? '#ffffff' : 'black'}
                        style={{ marginLeft: 4 }}
                      />
                    );
                  }
                },
              })}>
              <Tab.Screen
                name="Home"
                options={{
                  tabBarStyle: { display: 'none' },
                }}>
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
                component={Gameboard}
                playerId={playerId}
              />
              <Tab.Screen name="Scoreboard" component={Scoreboard} />
              <Tab.Screen name="Rules" component={Rules} />
              <Tab.Screen name="About Me" component={About} />
            </Tab.Navigator>
            <Footer />
          </NavigationContainer>
          <StatusBar style="light" backgroundColor="black" />
        </SafeAreaView>
      </GameProvider>
    </SafeAreaProvider>
  );
}
