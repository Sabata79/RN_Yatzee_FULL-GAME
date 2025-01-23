import * as Updates from 'expo-updates';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Modal, View, Text, Pressable, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
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
import { updateMessage } from './constants/updateMessage';
import updateModalStyles from './styles/updateModalStyles';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 720;

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
          height: isSmallScreen ? 55 : 85, 
          backgroundColor: 'black',
        },
        tabBarIndicatorStyle: {
          display: 'none',
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          height: isSmallScreen ? 25 : 30,
          width: isSmallScreen ? 25 : 30,
          fontSize: isSmallScreen ? 9 : 12, 
          fontFamily: 'AntonRegular',
        },
        tabBarIcon: ({ focused }) => {
          const iconStyle = {
            size: isSmallScreen ? 22 : 32, 
            color: focused ? '#eae6e6' : 'gray',
          };

          if (route.name === 'Home') {
            return (
              <View style={{ marginLeft: -5 }}>
                <FontAwesome5 name="home" {...iconStyle} />
              </View>
            );
          } else if (route.name === 'Gameboard') {
            return (
              <View style={{ marginLeft: -5 }}>
                <FontAwesome5 name="dice" {...iconStyle} />
              </View>
            );
          } else if (route.name === 'Scoreboard') {
            return (
              <View style={{ marginLeft: -5 }}>
                <FontAwesome5 name="trophy" {...iconStyle} />
              </View>
            );
          } else if (route.name === 'Rules') {
            return (
              <View style={{ marginLeft: 3 }}>
                <FontAwesome5 name="book" {...iconStyle} />
              </View>
            );
          } else if (route.name === 'About Me') {
            return (
              <View style={{ marginLeft: 4 }}>
                <FontAwesome5 name="user" {...iconStyle} />
              </View>
            );
          }
        },
      })}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarStyle: { display: 'none' },
          tabBarButton: () => null,
          swipeEnabled: false,
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
        <SafeAreaView style={styles.container}>
          <Modal
            visible={updateModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setUpdateModalVisible(false)}
          >
            <View style={updateModalStyles.updateModalOverlay}>
              <View style={updateModalStyles.updateModalContent}>
                <Text style={updateModalStyles.updateModalTitle}>New Update Available!</Text>
                <Text style={updateModalStyles.updateModalMessage}>
                  {updateMessage}
                </Text>
                <Pressable
                  style={updateModalStyles.updateModalUpdateButton}
                  onPress={handleUpdate}
                >
                  <Text style={updateModalStyles.updateModalUpdateButtonText}>Update</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen name="LandingPage" component={LandingPage} />
              <Stack.Screen
                name="MainApp"
                component={TabNavigator}
                options={{
                  headerShown: true, // Näytetään navigaation header
                  header: () => (
                    <Header
                      isUserRecognized={isUserRecognized}
                      name={name}
                      playerId={playerId}
                    />
                  ),
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="light" backgroundColor="black" />
        </SafeAreaView>
      </GameProvider>
    </SafeAreaProvider>
  );
}
