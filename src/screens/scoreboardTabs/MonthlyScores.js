/**
 * MonthlyScores — Scene component rendering the Monthly scoreboard rows.
 * Receives `rows`, `avatarMap` and helper callbacks from `Scoreboard`.
 * @module src/screens/scoreboardTabs/MonthlyScores
 * @since 2025-09-17
 * @updated 2025-09-25
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Text, Image } from 'react-native';
import { useGame } from '../../constants/GameContext';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import ScoreRow from '../../components/ScoreRow';
// presenceMap is provided centrally by GameContext
import scoreboardStyles from '../../styles/ScoreboardScreenStyles';
import { NBR_OF_SCOREBOARD_ROWS } from '../../constants/Game';

const getDurationDotColor = (secs) => (secs > 150 ? '#e53935' : secs > 100 ? '#ffa000' : '#2e7d32');

export default function MonthlyScores({ rows = [], avatarMap, getAvatarStyle, openPlayerCard, insets = { bottom: 0 }, tabBarHeight = 0, userId, listRef }) {
  const { scoreboardMonthly, playerId, presenceMap } = useGame();
  const effectiveRows = (rows && rows.length) ? rows : scoreboardMonthly || [];
  const effectiveUserId = userId || playerId;
  const listTableHeader = () => (
    <DataTable.Header>
      <DataTable.Title style={[scoreboardStyles.rankHeaderCell]}>
        <Text style={scoreboardStyles.scoreboardHeader}>Rank #</Text>
      </DataTable.Title>
      <DataTable.Title style={[scoreboardStyles.playerHeaderCell]}>
        <Text style={scoreboardStyles.scoreboardHeader}>Player</Text>
      </DataTable.Title>
      <DataTable.Title style={[scoreboardStyles.durationHeaderCell]}>
        <Text style={scoreboardStyles.scoreboardHeader}>Duration</Text>
      </DataTable.Title>
      <DataTable.Title style={[scoreboardStyles.pointsHeaderCell]}>
        <Text style={scoreboardStyles.scoreboardHeader}>Points</Text>
      </DataTable.Title>
      <DataTable.Title style={[scoreboardStyles.presenceHeaderCell]} />
    </DataTable.Header>
  );

  const renderRow = useCallback((item, index) => {
    if (!item || index >= NBR_OF_SCOREBOARD_ROWS) return null;
    return (
      <ScoreRow
        key={item.playerId}
        item={item}
        index={index}
        avatarMap={avatarMap}
        getAvatarStyle={getAvatarStyle}
        openPlayerCard={openPlayerCard}
        presenceMap={presenceMap}
        effectiveUserId={effectiveUserId}
      />
    );
  }, [avatarMap, getAvatarStyle, openPlayerCard, presenceMap, effectiveUserId]);

  const bottomPadding = (insets?.bottom || 0) + (tabBarHeight || 56) + 24;

  return (
    <ScrollView ref={listRef} contentContainerStyle={{ paddingBottom: bottomPadding }} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        {(() => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return <Text style={scoreboardStyles.headerSubtitle}>{`${start.getDate()}.${start.getMonth() + 1} - ${end.getDate()}.${end.getMonth() + 1}`}</Text>;
        })()}
      </View>
      <DataTable style={scoreboardStyles.scoreboardContainer}>{listTableHeader()}</DataTable>
      <View>
        {effectiveRows.map((r, i) => renderRow(r, i))}
      </View>
    </ScrollView>
  );
}
