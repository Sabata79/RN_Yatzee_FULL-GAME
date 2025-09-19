// EnergyModal.js
import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EnergyModal({ visible, onClose, tokens, maxTokens, timeToNextToken }) {
  if (!visible) return null;
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </Pressable>
          <MaterialCommunityIcons name="flash" size={48} color="gold" style={{ marginBottom: 12, alignSelf: 'center' }} />
          <Text style={styles.title}>Energy</Text>
          {tokens === maxTokens ? (
            <Text style={styles.message}>You have full energy, have fun!</Text>
          ) : (
            <>
              <Text style={styles.message}>You are out of energy tokens.</Text>
              <Text style={styles.message}>Time to next token regeneration:</Text>
              <Text style={[styles.message, { fontWeight: 'bold', fontSize: 18, marginTop: 4 }]}>{timeToNextToken}</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    marginHorizontal: 16,
    marginBottom: 400,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#12161a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 2,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#b9c0c7',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f2f4f5',
    marginBottom: 10,
    marginTop: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#b9c0c7',
    marginBottom: 6,
    textAlign: 'center',
  },
});
