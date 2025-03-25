import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { linkingText } from '../constants/AboutContent';

export default function AccountLinking() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* Otsikko + Ikoni */}
      <View style={styles.sectionHeader}>
        <FontAwesome5 name="link" size={24} color="gold" />
        <Text style={styles.sectionTitle}>Account Linking</Text>
      </View>

      {/* Info-box tyyliin */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>{linkingText}</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    color: 'gold',
    fontFamily: 'AntonRegular',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.546)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
});
