/**
 * Rules.js - Multi-tab screen for game rules, account linking, and interface guide
 *
 * Contains the UI and logic for displaying rules, account linking info, and interface guide in tabs.
 *
 * Usage:
 *   import Rules from './Rules';
 *   ...
 *   <Rules />
 *
 * @module screens/Rules
 * @author Sabata79
 * @since 2025-09-06
 */
import { useState } from 'react';
import { Dimensions, useWindowDimensions, ImageBackground, View } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import GameRules from '../screens/GameRules';
import AccountLinking from '../screens/AccountLinking';
import InterfaceGuide from './InterfaceGuide';

import COLORS from '../constants/colors';

const initialLayout = { width: Dimensions.get('window').width };

export default function RulesScreen() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'rules', title: '🎲 Rules' },
    { key: 'linking', title: '🔗 Linking' },
    { key: 'interface', title: '🧭 Guide' },
  ]);

  const renderScene = SceneMap({
    rules: GameRules,
    linking: AccountLinking,
    interface: InterfaceGuide,
  });

  return (
    <ImageBackground
      source={require('../../assets/diceBackground.webp')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
          swipeEnabled={false}
          renderTabBar={props => (
            <TabBar
              {...props}
              indicatorStyle={{ backgroundColor: COLORS.accent }}
              style={{ backgroundColor: COLORS.overlayDark, marginTop: -10 }}
              labelStyle={{ color: 'white', fontSize: 14 }}
            />
          )}
        />
      </View>
    </ImageBackground>
  );
}
