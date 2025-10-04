/**
 * WeeklyScores — Scene component rendering the Weekly scoreboard rows.
 * Receives `rows`, `avatarMap` and helper callbacks from `Scoreboard`.
 * @module src/screens/scoreboardTabs/WeeklyScores
 * @since 2025-09-17
 * @updated 2025-09-25
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Image } from 'react-native';
import { useGame } from '../../constants/GameContext';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import scoreboardStyles from '../../styles/ScoreboardScreenStyles';
import { NBR_OF_SCOREBOARD_ROWS } from '../../constants/Game';

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

  const renderRow = (item, index) => {
  if (!item || index >= NBR_OF_SCOREBOARD_ROWS) return null;
  const isCurrentUser = item.playerId === effectiveUserId;
    return (
      <DataTable.Row key={item.playerId} onPress={() => openPlayerCard(item.playerId, item.name, item.scores)} style={isCurrentUser ? { backgroundColor: '#d3bd867a' } : null}>
        <DataTable.Cell style={[scoreboardStyles.rankCell]}>
          {index === 0 && (
            <View style={scoreboardStyles.medalWrapper}>
              <Image source={require('../../../assets/medals/firstMedal.webp')} style={scoreboardStyles.medal} />
            </View>
          )}
          {index === 1 && (
            <View style={scoreboardStyles.medalWrapper}>
              <Image source={require('../../../assets/medals/silverMedal.webp')} style={scoreboardStyles.medal} />
            </View>
          )}
          {index === 2 && (
            <View style={scoreboardStyles.medalWrapper}>
              <Image source={require('../../../assets/medals/bronzeMedal.webp')} style={scoreboardStyles.medal} />
            </View>
          )}
          {index > 2 && <Text style={scoreboardStyles.rankText}>{index + 1}.</Text>}
        </DataTable.Cell>

        <DataTable.Cell style={[scoreboardStyles.playerCell]}>
          <View style={scoreboardStyles.playerWrapper}>
            {(() => {
              const avatarObj = avatarMap.get(item.avatar) || avatarMap.get((item.avatar || '').split('/').pop());
              if (avatarObj && avatarObj.display) {
                return <Image source={avatarObj.display} style={getAvatarStyle(avatarObj.path)} />;
              }
              return (
                <View style={scoreboardStyles.defaultAvatarIcon}>
                  <FontAwesome5 name="user" size={22} color="#d1d8e0" />
                </View>
              );
            })()}

            <Text style={isCurrentUser ? [scoreboardStyles.playerNameText, { color: '#fff', fontFamily: 'montserrat-bold' }] : scoreboardStyles.playerNameText}>{item.name}</Text>
          </View>
        </DataTable.Cell>

        <DataTable.Cell style={[scoreboardStyles.durationCell]}>
          <View style={scoreboardStyles.durationCellContent}>
            <View style={[scoreboardStyles.timeDot, { backgroundColor: getDurationDotColor(item.duration) }]} />
            <Text style={scoreboardStyles.durationText}>{item.duration}s</Text>
          </View>
        </DataTable.Cell>
        <DataTable.Cell style={[scoreboardStyles.pointsCell]}>
          <Text style={scoreboardStyles.pointsText}>{item.points}</Text>
        </DataTable.Cell>

        <DataTable.Cell style={[scoreboardStyles.presenceCell]}>
          {presenceMap[item.playerId] && presenceMap[item.playerId].online ? (
            <FontAwesome5 name="wifi" size={16} color="#4caf50" />
          ) : (
            <FontAwesome5 name="wifi" size={16} color="#9e9e9e" />
          )}
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

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
          return <Text style={scoreboardStyles.headerSubtitle}>{`Week ${getWeekNumber(new Date())}`}</Text>;
        })()}
      </View>
      <DataTable style={scoreboardStyles.scoreboardContainer}>{listTableHeader()}</DataTable>
      <View>
        {effectiveRows.map((r, i) => renderRow(r, i))}
      </View>
    </ScrollView>
  );
}
