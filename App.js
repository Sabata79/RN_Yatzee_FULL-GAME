import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
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
  const [loaded] = useFonts({
    AntonRegular: require('./assets/fonts/Anton-Regular.ttf'),
  });
  if (!loaded) {
    console.log('Font not loaded yet');
    return null;
  }
  console.log('Font loaded successfully');
  const Tab = createBottomTabNavigator();

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          <Tab.Navigator
            screenOptions={{
              headerShown: false,
              tabBarStyle: {
                height: 65,
                backgroundColor: 'darkorange',
                 paddingBottom: 5,
              },
              tabBarActiveTintColor: 'red',
              tabBarInactiveTintColor: 'black',
              tabBarLabelStyle: {
                fontSize: 14,
                fontWeight: 'bold',
              },
            }}>
            <Tab.Screen
              name="Home"
              component={Home}
              options={{
                tabBarStyle: { display: 'none' },
                tabBarIcon: () => (
                  <MaterialCommunityIcons name="home" color={'black'} size={30} />
                ),
              }}
            />
            <Tab.Screen
              name="Gameboard"
              component={Gameboard}
              options={{
                tabBarIcon: () => (
                  <FontAwesome5 name="dice" size={30} color="black" />
                ),
              }}
            />
            <Tab.Screen
              name="Scoreboard"
              component={Scoreboard}
              options={{
                tabBarIcon: () => (
                  <FontAwesome5 name="list" size={30} color="black" />
                ),
              }}
            />
          </Tab.Navigator>
        </View>
        <Footer />
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
