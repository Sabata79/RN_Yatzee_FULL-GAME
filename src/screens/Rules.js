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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFirstRowTopPadding } from '../styles/FirstRowStyles';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import GameRules from './helpTabs/GameRules';
import AccountLinking from './helpTabs/AccountLinking';
import InterfaceGuide from './helpTabs/InterfaceGuide';
import AboutMe from './helpTabs/AboutMe';
import gameRulesStyles from '../styles/GameRulesStyles';

import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';

const initialLayout = { width: Dimensions.get('window').width };

export default function RulesScreen() {
  const layout = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const topPad = getFirstRowTopPadding(insets);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'rules', title: '🎲 Rules' },
    { key: 'linking', title: '🔗 Link' },
    { key: 'interface', title: '🧭 Guide' },
    { key: 'about', title: '⚙️ About' },
  ]);

  const renderScene = SceneMap({
    rules: GameRules,
    linking: AccountLinking,
    interface: InterfaceGuide,
    about: AboutMe,
  });

  return (
    <ImageBackground
      source={require('../../assets/diceBackground.webp')}
      style={{ flex: 1, paddingTop: topPad }}
      resizeMode="cover"
    >
      <View style={gameRulesStyles.TabViewContainer}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
          swipeEnabled={true}
          commonOptions={{ labelStyle: {fontSize: 12, fontFamily: TYPOGRAPHY.fontFamily.montserratRegular } }}
          renderTabBar={props => (
            <TabBar
              {...props}
              indicatorStyle={{ backgroundColor: COLORS.accent }}
              style={gameRulesStyles.TabBarStyle}
              labelStyle={{ fontSize: 25 }}
            />
          )}
        />
      </View>
    </ImageBackground>
  );
}
