import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import Scoreboard from './components/Scoreboard';
import Gameboard from './components/Gameboard';
import About from './components/AboutMe';
import Home from './components/Home';
import Header from './components/Header';
import Footer from './components/Footer';
import styles from './styles/styles';
import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

export default function App() {
  const [isUserRecognized, setIsUserRecognized] = useState(false);
  const [name, setName] = useState('');

  const Tab = createMaterialTopTabNavigator();

  useEffect(() => { }, [isUserRecognized, name]);

  const [loaded] = useFonts({
    AntonRegular: require('./assets/fonts/Anton-Regular.ttf'),
  });
  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Header isUserRecognized={isUserRecognized} name={name} />
        <NavigationContainer>
          <Tab.Navigator
            tabBarPosition="bottom"
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: {
                height: 70,
                backgroundColor: 'darkorange',
              },
              tabBarActiveTintColor: '#ffffff',
              tabBarInactiveTintColor: '#22201e',
              tabBarLabelStyle: {
                fontSize: 12,
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
            })}
          >
            <Tab.Screen
              name="Home"
              options={{
                tabBarStyle: { display: 'none' },
              }}
            >
              {() => <Home setIsUserRecognized={setIsUserRecognized} setName={setName} />}
            </Tab.Screen>
            <Tab.Screen
              name="Gameboard"
              component={Gameboard}
            />
            <Tab.Screen
              name="Scoreboard"
              component={Scoreboard}
            />
            <Tab.Screen
              name="About Me"
              component={About}
            />
          </Tab.Navigator>
          <Footer />
        </NavigationContainer>
        <StatusBar style="light" backgroundColor="black" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
