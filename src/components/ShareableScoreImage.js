/**
 * ShareableScoreImage - Component for generating shareable score image
 * Creates a branded image with score details and Play Store link
 * @module components/ShareableScoreImage
 * @author Sabata79
 * @since 2025-11-15
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import COLORS from '../constants/colors';
import TYPOGRAPHY from '../constants/typography';

export default function ShareableScoreImage({ 
  playerName, 
  totalPoints, 
  duration, 
  basicPoints, 
  sectionBonus, 
  timeBonus 
}) {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/shareAssets/shareLogo.webp')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Main message */}
      <View style={styles.messageContainer}>
        <Text style={styles.playerName}>{playerName}</Text>
        <Text style={styles.messageText}>has just made an new score</Text>
        <Text style={styles.messageText}>in SMR YATZY!</Text>
        <Text style={styles.challengeText}>Can you beat it?</Text>
      </View>

      {/* Summary section */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Summary of the game</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time</Text>
          <View style={styles.summaryValueContainer}>
            <View style={styles.greenDot} />
            <Text style={styles.summaryValue}>{duration} s</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Basic</Text>
          <Text style={styles.summaryValue}>{basicPoints} pts</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Section bonus</Text>
          <Text style={styles.summaryValue}>{sectionBonus} pts</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time bonus</Text>
          <Text style={[styles.summaryValue, styles.greenText]}>
            {timeBonus > 0 ? '+' : ''}{timeBonus} pts
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{totalPoints} pts</Text>
        </View>
      </View>

      {/* Download section */}
      <View style={styles.downloadContainer}>
        <View style={styles.downloadHeader}>
          <Text style={styles.downloadText}>DOWNLOAD NOW FROM PLAY</Text>
          <FontAwesome5 name="google-play" size={18} color={COLORS.success} style={styles.playIcon} />
        </View>
        <Image 
          source={require('../../assets/qr/qr.png')} 
          style={styles.qrCode}
          resizeMode="contain"
        />
        <Text style={styles.scanText}>Scan to Download</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 400,
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  playerName: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: 20,
    color: COLORS.textLight,
    marginBottom: 5,
  },
  messageText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  challengeText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: 18,
    color: COLORS.textLight,
    marginTop: 5,
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratItalic,
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 15,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    fontSize: 16,
    color: COLORS.textLight,
  },
  summaryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  summaryValue: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: 16,
    color: COLORS.textLight,
  },
  greenText: {
    color: COLORS.success,
  },
  divider: {
    height: 2,
    backgroundColor: '#d4a574',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  totalLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: 20,
    color: COLORS.textLight,
  },
  totalValue: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: 20,
    color: COLORS.textLight,
  },
  downloadContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  downloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  downloadText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: 16,
    color: COLORS.success,
  },
  playIcon: {
    marginTop: -2,
  },
  qrCode: {
    width: 120,
    height: 120,
    marginBottom: 10,
    borderRadius: 5,
  },
  scanText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    fontSize: 14,
    color: COLORS.textLight,
    opacity: 0.9,
  },
});
