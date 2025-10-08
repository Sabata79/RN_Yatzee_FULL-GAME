/**
 * UpdateModal — Theme-aware modal used to prompt user about remote updates.
 * Shows title, short message and optional release notes. Provides primary action
 * to trigger update and a secondary close/dismiss action (hidden when mandatory).
 * @module src/components/modals/UpdateModal
 * @author Sabata79
 * @since 2025-10-08
 * @updated 2025-10-08
 */

import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import TYPOGRAPHY from '../../constants/typography';

export default function UpdateModal({
  visible,
  onClose = () => {},
  onUpdate = () => {},
  onLater = null,
  title = 'Update available',
  message = 'A new version of the app is available.',
  releaseNotes = '',
  mandatory = false,
  updateLabel = 'Update now',
  laterLabel = 'Later',
}) {
  const { width } = Dimensions.get('window');
  const sheetWidth = Math.min(720, Math.floor(width * 0.9));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!mandatory) onClose(); }} />
        <View style={[styles.sheet, { width: sheetWidth }]}>
          <MaterialCommunityIcons name="update" size={44} color={COLORS.accent} style={styles.icon} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {releaseNotes ? (
            <View style={styles.notesWrap}>
              <Text style={styles.notesTitle}>What's new</Text>
              <ScrollView style={styles.notesScroll} contentContainerStyle={{ paddingBottom: 6 }}>
                {/* Support array or newline-separated string */}
                {Array.isArray(releaseNotes)
                  ? releaseNotes.map((line, idx) => (
                      <View key={idx} style={styles.notesListRow}>
                        <Text style={styles.notesBullet}>•</Text>
                        <Text style={styles.notesText}>{String(line)}</Text>
                      </View>
                    ))
                  : String(releaseNotes).split(/\r?\n/).filter(Boolean).map((line, idx) => (
                      <View key={idx} style={styles.notesListRow}>
                        <Text style={styles.notesBullet}>•</Text>
                        <Text style={styles.notesText}>{line}</Text>
                      </View>
                    ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.buttonsRow}>
            {!mandatory && (
              <Pressable
                style={[styles.button, styles.ghostButton]}
                onPress={() => { if (typeof onLater === 'function') onLater(); else onClose(); }}
                accessibilityRole="button"
                accessibilityLabel="dismiss-update"
              >
                <Text style={[styles.buttonText, styles.ghostButtonText]}>{laterLabel}</Text>
              </Pressable>
            )}
            <Pressable style={[styles.button, styles.primaryButton]} onPress={onUpdate}>
              <Text style={[styles.buttonText, styles.primaryButtonText]}>{updateLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  sheet: {
    borderRadius: 12,
    padding: 18,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    alignItems: 'center',
  },
  icon: { marginBottom: 8 },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: TYPOGRAPHY.fontSize.l,
    color: COLORS.textLight,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    fontSize: TYPOGRAPHY.fontSize.m,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 12,
  },
  notesWrap: {
    width: '100%',
    maxHeight: 180,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 10,
  },
  notesTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratSemiBold,
    color: COLORS.textLight,
    marginBottom: 6,
  },
  notesScroll: {
    width: '100%'
  },
  notesText: {
    color: COLORS.textLight,
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    fontSize: TYPOGRAPHY.fontSize.s,
    paddingRight: 8,
  },
  notesListRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notesBullet: {
    color: COLORS.accent,
    marginRight: 8,
    fontSize: TYPOGRAPHY.fontSize.m,
    lineHeight: TYPOGRAPHY.fontSize.s + 4,
  },
  buttonsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)'
  },
  primaryButton: {
    backgroundColor: COLORS.accent || '#1e90ff',
  },
  buttonText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratSemiBold,
    fontSize: TYPOGRAPHY.fontSize.m,
  },
  ghostButtonText: {
    color: COLORS.textLight,
  },
  primaryButtonText: {
    color: COLORS.background || '#fff',
  },
});
