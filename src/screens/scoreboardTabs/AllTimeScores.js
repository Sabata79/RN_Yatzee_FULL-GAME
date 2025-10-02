/**
 * AllTimeScores — Scene component rendering the All Time scoreboard rows.
 * Keeps rendering local to this component; receives `rows`, `avatarMap` and helper callbacks
 * as props from the parent `Scoreboard` container.
 * @module src/screens/scoreboardTabs/AllTimeScores
 * @since 2025-09-17
 * @updated 2025-09-25
 */
import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, Image } from 'react-native';
import { useGame } from '../../constants/GameContext';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import { onCombinedPresenceChange } from '../../services/Presence';
import scoreboardStyles from '../../styles/ScoreboardScreenStyles';
import { NBR_OF_SCOREBOARD_ROWS } from '../../constants/Game';

const getDurationDotColor = (secs) => (secs > 150 ? '#e53935' : secs > 100 ? '#ffa000' : '#2e7d32');

export default function AllTimeScores({ rows = [], avatarMap, getAvatarStyle, openPlayerCard, insets = { bottom: 0 }, tabBarHeight = 0, userId, listRef }) {
  const { scoreboardData, playerId } = useGame();
  const [presenceMap, setPresenceMap] = useState({});

  useEffect(() => {
    let unsub = null;
    (async () => {
      try {
        unsub = await onCombinedPresenceChange((map) => {
          setPresenceMap(map || {});
        });
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (e) {}
    };
  }, []);
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

            <Text
              style={isCurrentUser ? [scoreboardStyles.playerNameText, { color: '#fff', fontFamily: 'montserrat-bold' }] : scoreboardStyles.playerNameText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
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
      <DataTable style={scoreboardStyles.scoreboardContainer}>{listTableHeader()}</DataTable>
      <View>
        {effectiveRows.map((r, i) => renderRow(r, i))}
      </View>
    </ScrollView>
  );
}
