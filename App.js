import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import Scoreboard from './components/Scoreboard';
import Gameboard from './components/Gameboard';
import Home from './components/Home';
import Header from './components/Header';
import Footer from './components/Footer';
import styles from './styles/styles';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

export default function App() {
  const [isUserRecognized, setIsUserRecognized] = useState(false);
  const Tab = createBottomTabNavigator();

  const [loaded] = useFonts({
    AntonRegular: require('./assets/fonts/Anton-Regular.ttf'),
  });
  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header isUserRecognized={isUserRecognized} />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              height: 60,
              backgroundColor: 'darkorange',
            },
            tabBarActiveTintColor: '#ffffff',
            tabBarInactiveTintColor: '#22201e',
            tabBarLabelStyle: {
              fontSize: 12,
              fontFamily: 'AntonRegular',
            },
          }}>
          <Tab.Screen
            name="Home"
            options={{
              tabBarStyle: { display: 'none' },
              tabBarIcon: () => (
                <MaterialCommunityIcons name="home" color={'black'} size={28} />
              ),
            }}
          >
            {() => <Home setIsUserRecognized={setIsUserRecognized} />}
          </Tab.Screen>
          <Tab.Screen
            name="Gameboard"
            component={Gameboard}
            options={{
              tabBarIcon: () => (
                <FontAwesome5 name="dice" size={28} color="black" />
              ),
            }}
          />
          <Tab.Screen
            name="Scoreboard"
            component={Scoreboard}
            options={{
              tabBarIcon: () => (
                <FontAwesome5 name="list" size={28} color="black" />
              ),
            }}
          />
        </Tab.Navigator>
        <Footer />
      </NavigationContainer>
      <StatusBar style="light" backgroundColor="black" />
    </SafeAreaView>
  );
}
