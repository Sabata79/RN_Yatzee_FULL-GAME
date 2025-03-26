import * as Updates from 'expo-updates';
import React, { useState, useEffect } from 'react';
import { StatusBar, Linking } from 'react-native';
import { SafeAreaView, Modal, View, Text, Pressable, Dimensions, Easing } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator, TransitionSpecs, SceneStyleInterpolators } from '@react-navigation/bottom-tabs';
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
import updateModalStyles from './styles/updateModalStyles';
import { database } from './components/Firebase';
import Constants from 'expo-constants';
import { ref, get } from 'firebase/database';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 720;
const isBigScreen = height >= 900;

export default function App() {
  const [isUserRecognized, setIsUserRecognized] = useState(false);
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const updateMessage = ``;
  const [updateRequired, setUpdateRequired] = useState(false);

  const Stack = createStackNavigator();
  const Tab = createBottomTabNavigator();

  useEffect(() => {
    if (!__DEV__) {
      const checkEASAndFirebase = async () => {
        try {
          const versionRef = ref(database, 'latestVersion');
          const snapshot = await get(versionRef);
          const latestVersion = snapshot.exists() ? snapshot.val() : null;
          const currentVersion = Constants.nativeApplicationVersion;

          if (latestVersion && latestVersion !== currentVersion) {
            showUpdateAlert();
            return;
          }

          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            const currentRuntimeVersion = Updates.manifest?.runtimeVersion;
            const newRuntimeVersion = update.manifest?.runtimeVersion;

            if (currentRuntimeVersion && newRuntimeVersion && currentRuntimeVersion !== newRuntimeVersion) {
              showUpdateAlert();
            }
          }

        } catch (e) {
          console.error('Version check failed: ', e);
        }
      };

      checkEASAndFirebase();
    }
  }, []);

  const showUpdateAlert = () => {
    Alert.alert(
      'Update available',
      'A new version of the app is available. Do you want to update now?',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Update', onPress: handleUpdate },
      ],
      { cancelable: true }
    );
  };

  const handleUpdate = async () => {
    const url = 'https://play.google.com/store/apps/details?id=com.SimpleYatzee';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error("Can't open Play Store URL");
    }
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
          height: isSmallScreen ? 55 : isBigScreen ? 85 : 70,
          paddingTop: isSmallScreen ? 0 : 5,
          backgroundColor: 'black',
          borderTopWidth: 0.2,
          borderTopColor: 'darkorange',
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: isSmallScreen ? 9 : isBigScreen ? 16 : 12,
          letterSpacing: -0.1,
          fontFamily: 'AntonRegular',
        },
        tabBarIcon: ({ focused }) => {
          const iconStyle = {
            size: isSmallScreen ? 22 : isBigScreen ? 28 : 28,
            color: focused ? '#eae6e6' : 'gray',
          };

          if (route.name === 'Home') {
            return <FontAwesome5 name="home" {...iconStyle} />;
          } else if (route.name === 'Gameboard') {
            return <FontAwesome5 name="dice" {...iconStyle} />;
          } else if (route.name === 'Scoreboard') {
            return <FontAwesome5 name="trophy" {...iconStyle} />;
          } else if (route.name === 'Rules') {
            return <FontAwesome5 name="book" {...iconStyle} />;
          } else if (route.name === 'About Me') {
            return <FontAwesome5 name="user" {...iconStyle} />;
          }
        },
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          },
        },
        sceneStyleInterpolator: SceneStyleInterpolators.forFade,
      })}
    >
      {/* Home Tab */}
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
      {/* Muut Tab Screen -komponentit */}
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
                  headerShown: true,
                  swipeEnabled: false,
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
