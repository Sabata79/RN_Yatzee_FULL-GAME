/**
 * ScoreRow — Memoized single row used by scoreboard scenes.
 * Small, self-contained rendering for a scoreboard row. Uses a custom props comparator
 * to avoid re-rendering when unrelated parent state changes.
 * @module src/components/ScoreRow
 * @author Sabata79
 * @since 2025-10-04
 * @updated 2025-10-04
 */
import React, { memo } from 'react';
import { View, Image, Text } from 'react-native';
import { DataTable } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';
import scoreboardStyles from '../styles/ScoreboardScreenStyles';

const getDurationDotColor = (secs) => (secs > 150 ? '#e53935' : secs > 100 ? '#ffa000' : '#2e7d32');

function ScoreRowImpl({ item, index, avatarMap, getAvatarStyle, openPlayerCard, presenceMap, effectiveUserId }) {
  if (!item) return null;
  const isCurrentUser = item.playerId === effectiveUserId;
  return (
    <DataTable.Row
      key={item.playerId}
      onPress={() => openPlayerCard(item.playerId, item.name, item.scores)}
      style={isCurrentUser ? { backgroundColor: '#d3bd867a' } : null}
    >
      <DataTable.Cell style={[scoreboardStyles.rankCell]}>
        {index === 0 && (
          <View style={scoreboardStyles.medalWrapper}>
            <Image source={require('../../assets/medals/firstMedal.webp')} style={scoreboardStyles.medal} />
          </View>
        )}
        {index === 1 && (
          <View style={scoreboardStyles.medalWrapper}>
            <Image source={require('../../assets/medals/silverMedal.webp')} style={scoreboardStyles.medal} />
          </View>
        )}
        {index === 2 && (
          <View style={scoreboardStyles.medalWrapper}>
            <Image source={require('../../assets/medals/bronzeMedal.webp')} style={scoreboardStyles.medal} />
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
}

// Custom comparator: only re-render when the visible row-relevant fields change.
function areEqual(prevProps, nextProps) {
  const p = prevProps.item || {};
  const n = nextProps.item || {};
  if (p.playerId !== n.playerId) return false;
  if (p.name !== n.name) return false;
  if (p.duration !== n.duration) return false;
  if (p.points !== n.points) return false;
  if ((p.avatar || '') !== (n.avatar || '')) return false;
  const prevPresence = (prevProps.presenceMap && prevProps.presenceMap[p.playerId]) ? prevProps.presenceMap[p.playerId].online : false;
  const nextPresence = (nextProps.presenceMap && nextProps.presenceMap[n.playerId]) ? nextProps.presenceMap[n.playerId].online : false;
  if (prevPresence !== nextPresence) return false;
  if (prevProps.effectiveUserId !== nextProps.effectiveUserId) return false;
  return true;
}

export default memo(ScoreRowImpl, areEqual);
