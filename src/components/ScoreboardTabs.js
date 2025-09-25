/**
 * ScoreboardTabs — lightweight TabView wrapper used by Scoreboard screen
 * Keeps TabView configuration in one place so scoreboard file remains focused.
 * @module src/components/ScoreboardTabs
 * @author Sabata79
 * @since 2025-09-25
 * @updated 2025-09-25
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AllTimeScores from '../screens/scoreboardTabs/AllTimeScores';
import MonthlyScores from '../screens/scoreboardTabs/MonthlyScores';
import WeeklyScores from '../screens/scoreboardTabs/WeeklyScores';
import { COLORS } from '../constants/colors';
import { TYPOGRAPHY } from '../constants/typography';
import { useGame } from '../constants/GameContext';
import PlayerCard from '../components/PlayerCard';
import { avatars } from '../constants/AvatarPaths';
import scoreboardStyles from '../styles/ScoreboardScreenStyles';
import gamerulesStyles from '../styles/GameRulesStyles';

// ScoreboardTabs supports two modes:
// - If a `renderScene` prop is provided, it is used directly (backwards compatible).
// - Otherwise, provide the scene components via `allTimeComponent`, `monthlyComponent`, `weeklyComponent`
//   and ScoreboardTabs will build a SceneMap internally (same pattern as Rules.js).
export default function ScoreboardTabs({
  swipeEnabled = true,
  commonOptions = { labelStyle: { fontSize: 12, fontFamily: TYPOGRAPHY.fontFamily.montserratRegular } },
  labelStyle = { fontSize: 25 },
  // scene components (optional, used to build SceneMap)
  allTimeComponent: AllTimeComponent,
  monthlyComponent: MonthlyComponent,
  weeklyComponent: WeeklyComponent,
  // If parent provides navigationState (rare), we'll honor it — otherwise manage internally
  navigationState: externalNavigationState,
  onIndexChange: externalOnIndexChange,
}) {
  const layout = useWindowDimensions();
  const initialLayout = { width: layout.width };
  const insets = useSafeAreaInsets();


  // Game context provides precomputed slices
  const { scoreboardData, scoreboardMonthly, scoreboardWeekly, scoreboardIndices, setViewingPlayerId, setViewingPlayerName, playerId } = useGame();

  // Build avatarMap and helper like original Scoreboard
  const avatarMap = useMemo(() => {
    const m = new Map();
    avatars.forEach((a) => {
      m.set(a.path, a);
      const parts = a.path.split('/');
      m.set(parts[parts.length - 1], a);
    });
    return m;
  }, []);

  const getAvatarStyle = (avatarPath) => {
    const avatar = avatarMap.get(avatarPath) || avatarMap.get((avatarPath || '').split('/').pop());
    if (!avatar) return scoreboardStyles.defaultAvatarIcon;
    if (avatar.level === 'Beginner') return scoreboardStyles.beginnerAvatar;
    if (avatar.level === 'Advanced') return scoreboardStyles.advancedAvatar;
    return scoreboardStyles.avatar;
  };

  // Memoize helper to keep stable identity across renders
  const getAvatarStyleCb = useCallback((avatarPath) => getAvatarStyle(avatarPath), [avatarMap]);

  // Modal state for player card
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const openPlayerCard = (playerIdArg, playerName, playerScores) => {
    setSelectedPlayer({ playerId: playerIdArg, playerName, playerScores });
    try { setViewingPlayerId(playerIdArg); setViewingPlayerName(playerName); } catch {}
    requestAnimationFrame(() => setModalVisible(true));
  };

  const openPlayerCardCb = useCallback((playerIdArg, playerName, playerScores) => {
    setSelectedPlayer({ playerId: playerIdArg, playerName, playerScores });
    try { setViewingPlayerId(playerIdArg); setViewingPlayerName(playerName); } catch {}
    requestAnimationFrame(() => setModalVisible(true));
  }, [setViewingPlayerId, setViewingPlayerName]);

  // Scenes data
  const allRows = scoreboardData || [];
  const monRows = scoreboardMonthly || [];
  const weekRows = scoreboardWeekly || [];

  // Manage index/routes internally unless provided by parent
  const TYPE_TO_INDEX = { allTime: 0, monthly: 1, weekly: 2 };
  const INDEX_TO_TYPE = ['allTime', 'monthly', 'weekly'];

  const [index, setIndex] = useState(TYPE_TO_INDEX.weekly ?? 2);
  const [routes] = useState([
    { key: 'allTime', title: 'All Time' },
    { key: 'monthly', title: 'Monthly' },
    { key: 'weekly', title: 'Weekly' },
  ]);

  // If navigation params call for default tab, only set it once on focus
  const initialFocusSet = useRef(false);
  useFocusEffect(
    React.useCallback(() => {
      if (!initialFocusSet.current && scoreboardIndices) {
        // prefer indices if available (keeps user row centered)
        // keep existing index (weekly) otherwise
        setIndex(TYPE_TO_INDEX.weekly ?? 2);
        initialFocusSet.current = true;
      }
    }, [scoreboardIndices])
  );

  // Memoize navState to avoid accidental re-creation causing TabView to re-evaluate
  const navState = useMemo(() => (externalNavigationState || { index, routes }), [externalNavigationState, index, routes]);

  // Guard to prevent duplicate index updates causing extra mounts/animations
  const prevIndex = useRef(index);
  const onChangeIndex = externalOnIndexChange || ((i) => {
    if (prevIndex.current === i) return;
    prevIndex.current = i;
    setIndex(i);
  });

  // Build internal SceneMap renderer from supplied (or default) scene components.
  const AT = AllTimeComponent || AllTimeScores;
  const MS = MonthlyComponent || MonthlyScores;
  const WS = WeeklyComponent || WeeklyScores;

  // Refs to scene ScrollViews so we can auto-scroll to player's row
  const allRef = useRef(null);
  const monRef = useRef(null);
  const weekRef = useRef(null);

  // Memoize scene renderer so SceneMap reference is stable across renders
  const sceneRenderer = useMemo(() => {
    const AllTimeRoute = () => (
      <View style={{ flex: 1 }}>
        <AT avatarMap={avatarMap} getAvatarStyle={getAvatarStyleCb} openPlayerCard={openPlayerCardCb} insets={insets} tabBarHeight={56} listRef={allRef} />
      </View>
    );

    const MonthlyRoute = () => (
      <View style={{ flex: 1 }}>
        <MS avatarMap={avatarMap} getAvatarStyle={getAvatarStyleCb} openPlayerCard={openPlayerCardCb} insets={insets} tabBarHeight={56} listRef={monRef} />
      </View>
    );

    const WeeklyRoute = () => (
      <View style={{ flex: 1 }}>
        <WS avatarMap={avatarMap} getAvatarStyle={getAvatarStyleCb} openPlayerCard={openPlayerCardCb} insets={insets} tabBarHeight={56} listRef={weekRef} />
      </View>
    );

    return SceneMap({ allTime: AllTimeRoute, monthly: MonthlyRoute, weekly: WeeklyRoute });
  }, [AT, MS, WS, avatarMap, getAvatarStyleCb, openPlayerCardCb, insets]);

  // Auto-scroll effect: when active tab or scoreboardIndices change, scroll the corresponding list
  useEffect(() => {
    try {
      if (!scoreboardIndices) return;
      const target = INDEX_TO_TYPE[index];
      const idx = scoreboardIndices[target];
      if (idx == null || idx < 0) return;
      // conservative row height estimate (px)
      const ROW_H = 64;
      const y = Math.max(0, idx * ROW_H - ROW_H * 2); // offset a bit to show context above

      const refMap = { allTime: allRef, monthly: monRef, weekly: weekRef };
      const r = refMap[target] && refMap[target].current;
      if (r && typeof r.scrollTo === 'function') {
        r.scrollTo({ y, animated: true });
      } else if (r && typeof r.scrollToOffset === 'function') {
        // In case a FlatList is used inside the scene in future
        r.scrollToOffset({ offset: y, animated: true });
      }
    } catch (e) {
      // swallow — non-critical, keep UI stable
    }
  }, [index, scoreboardIndices]);

  return (
    <View style={{ flex: 1 }}>
      <TabView
        navigationState={navState}
        renderScene={sceneRenderer}
        onIndexChange={onChangeIndex}
        initialLayout={initialLayout}
        swipeEnabled={swipeEnabled}
        commonOptions={commonOptions}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: COLORS.accent }}
            style={gamerulesStyles.TabBarStyle}
            labelStyle={labelStyle}
          />
        )}
      />

      {modalVisible && selectedPlayer && (
        <PlayerCard
          playerId={selectedPlayer.playerId}
          playerName={selectedPlayer.playerName}
          playerScores={selectedPlayer.playerScores}
          isModalVisible={modalVisible}
          setModalVisible={(v) => {
            if (!v) {
              setModalVisible(false);
              setSelectedPlayer(null);
              try { setViewingPlayerId(''); setViewingPlayerName(''); } catch {}
            } else {
              setModalVisible(true);
            }
          }}
        />
      )}
    </View>
  );
}
