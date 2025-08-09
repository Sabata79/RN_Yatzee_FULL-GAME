import * as Updates from 'expo-updates';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, Linking, Alert, Modal, View, Text, Pressable, Dimensions, Easing } from 'react-native';
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

const { height } = Dimensions.get('window');
const isSmallScreen = height < 720;
const isBigScreen = height >= 900;

export default function App() {
  // console.log("App initialized!");
  const [isUserRecognized, setIsUserRecognized] = useState(false);
  const [name, setName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const updateMessage = `A new version of the app is available. Please update to get the latest features and improvements.`;

  const Stack = createStackNavigator();
  const Tab = createBottomTabNavigator();

  // function isNewerVersion(latest, current) {
  //   const latestParts = latest.split('.').map(Number);
  //   const currentParts = current.split('.').map(Number);
  //   for (let i = 0; i < latestParts.length; i++) {
  //     if ((latestParts[i] || 0) > (currentParts[i] || 0)) return true;
  //     if ((latestParts[i] || 0) < (currentParts[i] || 0)) return false;
  //   }
  //   return false;
  // }

  // useEffect(() => {
  //   if (!__DEV__) {
  //     const checkEASAndFirebase = async () => {
  //       try {
  //         const versionRef = ref(database, 'latestVersion');
  //         const snapshot = await get(versionRef);
  //         const latestVersion = snapshot.exists() ? snapshot.val() : null;
  //         const currentVersion = Constants.nativeApplicationVersion;

  //         console.log('🔥 Firebase latest:', latestVersion);
  //         console.log('📱 App version:', currentVersion);

  //         if (latestVersion && isNewerVersion(latestVersion, currentVersion)) {
  //           setUpdateModalVisible(true);
  //           return;
  //         }

  //         const update = await Updates.checkForUpdateAsync();
  //         if (update.isAvailable) {
  //           const currentRuntimeVersion = Updates.manifest?.runtimeVersion;
  //           const newRuntimeVersion = update.manifest?.runtimeVersion;
  //           if (currentRuntimeVersion && newRuntimeVersion && currentRuntimeVersion !== newRuntimeVersion) {
  //             setUpdateModalVisible(true);
  //           }
  //         }
  //       } catch (e) {
  //         console.error('⚠️ Version check failed:', e);
  //       }
  //     };

  //     checkEASAndFirebase();
  //   }
  // }, []);

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
        tabBarIcon: ({ focused }) => {
          const iconStyle = {
            size: isSmallScreen ? 22 : isBigScreen ? 28 : 28,
            color: focused ? '#eae6e6' : 'gray',
          };

          if (route.name === 'Home') return <FontAwesome5 name="home" {...iconStyle} />;
          if (route.name === 'Gameboard') return <FontAwesome5 name="dice" {...iconStyle} />;
          if (route.name === 'Scoreboard') return <FontAwesome5 name="trophy" {...iconStyle} />;
          if (route.name === 'Rules') return <FontAwesome5 name="book" {...iconStyle} />;
          if (route.name === 'About Me') return <FontAwesome5 name="user" {...iconStyle} />;
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
                <Text style={updateModalStyles.updateModalMessage}>{updateMessage}</Text>
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
