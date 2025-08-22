import { useState } from 'react';
import { Dimensions, useWindowDimensions, ImageBackground, View } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import GameRules from './GameRules';
import AccountLinking from './AccountLinking';
import InterfaceGuide from './InterfaceGuide';
// Multi-tab rules/help screen for the game (Rules, Account Linking, Guide)
import styles from '../styles/styles';

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
      source={require('../assets/diceBackground.webp')}
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
              indicatorStyle={{ backgroundColor: 'gold' }}
              style={{ backgroundColor: 'rgba(0,0,0,0.7)',marginTop: -10 }}
              labelStyle={{ color: 'white', fontSize: 14 }}
            />
          )}
        />
      </View>
    </ImageBackground>
  );
}
