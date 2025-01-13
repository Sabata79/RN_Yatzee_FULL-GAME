import * as Updates from 'expo-updates';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Modal, View, Text, Pressable, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import { navigationImages } from './constants/NavigationImagePaths';
import { updateMessage } from './constants/updateMessage';
import updateModalStyles from './styles/updateModalStyles';

export default function App() {
  const [isUserRecognized, setIsUserRecognized] = useState(false);
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  const Stack = createStackNavigator();
  const Tab = createMaterialTopTabNavigator();

  useEffect(() => {
    if (!__DEV__) {
      const checkForUpdates = async () => {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            setUpdateAvailable(true);
            setUpdateModalVisible(true);
          }
        } catch (e) {
          console.error('Update failure: ', e);
        }
      };
      checkForUpdates();
    }
  }, []);

  const handleUpdate = async () => {
    setUpdateModalVisible(false);
    await Updates.reloadAsync();
  };

  const [loaded] = useFonts({
    AntonRegular: require('./assets/fonts/Anton-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  // Tab navigator for the main application screens
  const TabNavigator = () => (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 80,
          backgroundColor: 'black',
        },
        tabBarIcon: ({ focused }) => {
          if (route.name === 'Home') {
            return (
              <Image
                source={navigationImages[0].display}
                style={{
                  width: 55,
                  height: 55,
                  top: -12,
                  left: -10,
                }}
              />
            );
          } else if (route.name === 'Gameboard') {
            return (
              <Image
                source={navigationImages[1].display}
                style={{
                  width: 40,
                  height: 40,
                  top: -5,
                  left: -8,
                  opacity: focused ? 1 : 0.5,
                }}
              />
            );
          } else if (route.name === 'Scoreboard') {
            return (
              <Image
                source={navigationImages[2].display}
                style={{
                  width: 40,
                  height: 40,
                  top: -5,
                  left: -10,
                  opacity: focused ? 1 : 0.5,
                }}
              />
            );
          } else if (route.name === 'Rules') {
            return (
              <Image
                source={navigationImages[3].display}
                style={{
                  width: 40,
                  height: 40,
                  top: -5,
                  left: -10,
                  opacity: focused ? 1 : 0.5,
                }}
              />
            );
          } else if (route.name === 'About Me') {
            return (
              <Image
                source={navigationImages[4].display}
                style={{
                  width: 45,
                  height: 45,
                  top: -5,
                  left: -10,
                  opacity: focused ? 1 : 0.5,
                }}
              />
            );
          }
        },
      })}
    >
      <Tab.Screen
        name="Home"
        options={{ tabBarStyle: { display: 'none' } }}
      >
        {() => (
          <Home
            setIsUserRecognized={setIsUserRecognized}
            setName={setName}
            setPlayerId={setPlayerId}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Gameboard" component={Gameboard} />
      <Tab.Screen name="Scoreboard" component={Scoreboard} />
      <Tab.Screen name="Rules" component={Rules} />
      <Tab.Screen name="About Me" component={About} />
    </Tab.Navigator>
  );

  return (
    <SafeAreaProvider>
      <GameProvider>
        <SafeAreaView style={styles.container}>
          {/* Update Modal */}
          <Modal
            visible={updateModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setUpdateModalVisible(false)}
          >
            <View style={updateModalStyles.updateModalOverlay}>
              <View style={updateModalStyles.updateModalContent}>
                <Text style={updateModalStyles.updateModalTitle}>
                  New Update Available!
                </Text>
                <Text style={updateModalStyles.updateModalMessage}>
                  {updateMessage}
                </Text>
                <Pressable
                  style={updateModalStyles.updateModalUpdateButton}
                  onPress={handleUpdate}
                >
                  <Text style={updateModalStyles.updateModalUpdateButtonText}>
                    Update
                  </Text>
                </Pressable>
                <Pressable
                  style={updateModalStyles.updateModalCancelButton}
                  onPress={() => setUpdateModalVisible(false)}
                >
                  <Text style={updateModalStyles.updateModalCancelButtonText}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <Header isUserRecognized={isUserRecognized} name={name} playerId={playerId} />
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="LandingPage" component={LandingPage} />
              <Stack.Screen name="MainApp" component={TabNavigator} />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="light" backgroundColor="black" />
        </SafeAreaView>
      </GameProvider>
    </SafeAreaProvider>
  );
}
