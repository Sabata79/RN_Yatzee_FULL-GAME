/**
 * WeeklyScores — Scene component rendering the Weekly scoreboard rows.
 * Receives `rows`, `avatarMap` and helper callbacks from `Scoreboard`.
 * @module src/screens/scoreboardTabs/WeeklyScores
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
import TYPOGRAPHY from '../../constants/typography';

const getDurationDotColor = (secs) => (secs > 150 ? '#e53935' : secs > 100 ? '#ffa000' : '#2e7d32');

export default function WeeklyScores({ rows = [], avatarMap, getAvatarStyle, openPlayerCard, insets = { bottom: 0 }, tabBarHeight = 0, userId, listRef }) {
  const { scoreboardWeekly, playerId, presenceMap } = useGame();
  const effectiveRows = (rows && rows.length) ? rows : scoreboardWeekly || [];
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
      <DataTable.Title style={[scoreboardStyles.presenceHeaderCell]}>
        {/* empty header for presence icon column */}
        <Text style={scoreboardStyles.scoreboardHeader} />
      </DataTable.Title>
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
          const getWeekNumber = (date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
          };

          // Compute monday..sunday range for the given date (local)
          const getWeekRange = (date) => {
            const d = new Date(date);
            // getDay: 0 (Sun) .. 6 (Sat). Convert to ISO week day where Mon=0 .. Sun=6
            const isoDay = (d.getDay() + 6) % 7;
            const monday = new Date(d);
            monday.setDate(d.getDate() - isoDay);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const fmt = (dt) => `${dt.getDate()}.${dt.getMonth() + 1}`;
            return `${fmt(monday)} - ${fmt(sunday)}`;
          };

          const now = new Date();
          const weekNum = getWeekNumber(now);
          const range = getWeekRange(now);
          return (
            <>
              <Text style={scoreboardStyles.headerSubtitle}>{`Week ${weekNum}`}</Text>
              <Text style={[scoreboardStyles.headerSubtitle, { fontSize: TYPOGRAPHY.fontSize.xs, marginTop: 2 }]}>{range}</Text>
            </>
          );
        })()}
      </View>
      <DataTable style={scoreboardStyles.scoreboardContainer}>{listTableHeader()}</DataTable>
      <View>
        {effectiveRows.map((r, i) => renderRow(r, i))}
      </View>
    </ScrollView>
  );
}
