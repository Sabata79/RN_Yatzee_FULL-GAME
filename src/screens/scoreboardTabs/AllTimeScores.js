/**
 * AllTimeScores — Scene component rendering the All Time scoreboard rows.
 * Keeps rendering local to this component; receives `rows`, `avatarMap` and helper callbacks
 * as props from the parent `Scoreboard` container.
 * @module src/screens/scoreboardTabs/AllTimeScores
 * @since 2025-09-17
 * @updated 2025-09-25
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Text, Image } from 'react-native';
import { useGame } from '../../constants/GameContext';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import ScoreRow from '../../components/ScoreRow';
import scoreboardStyles from '../../styles/ScoreboardScreenStyles';
import { NBR_OF_SCOREBOARD_ROWS } from '../../constants/Game';

const getDurationDotColor = (secs) => (secs > 150 ? '#e53935' : secs > 100 ? '#ffa000' : '#2e7d32');

export default function AllTimeScores({ rows = [], avatarMap, getAvatarStyle, openPlayerCard, insets = { bottom: 0 }, tabBarHeight = 0, userId, listRef }) {
  const { scoreboardData, playerId, presenceMap } = useGame();
  const effectiveRows = (rows && rows.length) ? rows : scoreboardData || [];
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
        <Text style={scoreboardStyles.headerSubtitle}>All Time</Text>
      </View>
      <DataTable style={scoreboardStyles.scoreboardContainer}>{listTableHeader()}</DataTable>
      <View>
        {effectiveRows.map((r, i) => renderRow(r, i))}
      </View>
    </ScrollView>
  );
}
