
/**
 * ScoreModal – end-of-game summary modal with time-based bonus and Save/Cancel actions.
 * UI/UX matches RecoverModal/WipeModal. Shows time, score, and bonus. Delegates save/cancel to parent.
 *
 * Props:
 *  - visible: boolean
 *  - onSave: (scoreObj) => Promise<boolean>
 *  - onCancel?: () => void
 *  - time: number (seconds)
 *  - score: number
 *  - bonus: number
 *  - dark?: boolean
 *
 * @module ScoreModal
 * @author Sabata79
 * @since 2025-09-18
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  StyleSheet as RNStyleSheet,
  Animated,
  Easing,
  Alert,
  AppState,
  Share,
  Platform,
} from "react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { FontAwesome5 } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import TYPOGRAPHY from "../../constants/typography";
import SPACING from "../../constants/spacing";
import { useGame } from "../../constants/GameContext";
import ShareableScoreImage from "../ShareableScoreImage";
import { validateScoreConsistency } from "../../utils/errorTracking";

function formatTime(secs = 0) {
  return `${Math.floor(secs)} s`;
}

export default function ScoreModal({
  visible,
  onClose,
  onSave,
  onCancel,
  points = 0,
  elapsedSecs = 0,
  minorPoints = 0,
  sectionBonus = 0,
  scoringCategories = [],
  playerId = null,
  totalPoints = 0,
  hasAppliedBonus = false,
  bottomInset = 0,
  bottomOffset = 0,
  dark = true,
  okColor = COLORS.success,
  warnColor = COLORS.warning,
  errColor = COLORS.error,
  goodColor = COLORS.secondaryDark,
}) {

  const FAST_THRESHOLD = 100;
  const SLOW_THRESHOLD = 150;
  const FAST_BONUS = 10;
  const SLOW_BONUS = -10;
  const [busy, setBusy] = useState(false);
  const { setIsGameSaved } = useGame();

  useEffect(() => {
    if (!visible) setBusy(false);
  }, [visible]);

  const { bonus, dotColor } = useMemo(() => {
    if (elapsedSecs > SLOW_THRESHOLD) return { bonus: SLOW_BONUS, dotColor: errColor };
    if (elapsedSecs > FAST_THRESHOLD) return { bonus: 0, dotColor: warnColor };
    return { bonus: FAST_BONUS, dotColor: goodColor };
  }, [elapsedSecs, errColor, warnColor, goodColor]);

  const total = useMemo(() => points + bonus + sectionBonus, [points, bonus, sectionBonus]);

  // Track if validation has been done to avoid re-running on re-renders
  const validatedRef = useRef(false);

  // DEBUG: Log received values when modal opens
  useEffect(() => {
    if (visible) {
      console.log(`[ScoreModal DEBUG] Modal opened with:
  - points (basic): ${points}
  - sectionBonus: ${sectionBonus}
  - timeBonus: ${bonus}
  - TOTAL: ${total}
  - elapsedSecs: ${elapsedSecs}
  - minorPoints: ${minorPoints}`);
      
      // Validate score consistency ONCE when modal first opens
      if (scoringCategories.length > 0 && !validatedRef.current) {
        validatedRef.current = true;
        validateScoreConsistency({
          totalPoints,
          minorPoints,
          hasAppliedBonus,
          scoringCategories,
          playerId,
        });
      }
    } else {
      // Reset validation flag when modal closes
      validatedRef.current = false;
    }
  }, [visible, points, sectionBonus, bonus, total, elapsedSecs, minorPoints, totalPoints, hasAppliedBonus, scoringCategories, playerId]);

  // ANIMAATIO: summary rivit paljastuvat yksitellen SLIDE-efektillä
  const [revealIndex, setRevealIndex] = useState(0);
  const slideAnims = useRef([
    new Animated.Value(300), // Time
    new Animated.Value(300), // Basic
    new Animated.Value(300), // Section bonus
    new Animated.Value(300), // Time bonus
    new Animated.Value(300), // Total
  ]).current;

  useEffect(() => {
    if (!visible) {
      setRevealIndex(0);
      slideAnims.forEach(anim => anim.setValue(300));
      return;
    }
    setRevealIndex(0);
    slideAnims.forEach(anim => anim.setValue(300));
    let i = 0;
    const lines = 5;
    function next() {
      i++;
      if (i <= lines) {
        setRevealIndex(i);
        Animated.timing(slideAnims[i - 1], {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
      if (i < lines) setTimeout(next, 350);
    }
    setTimeout(next, 350);
    return () => {};
  }, [visible, points, bonus, sectionBonus, elapsedSecs, slideAnims]);

  const handleSave = useCallback(async () => {
    // CRITICAL: Prevent multiple simultaneous save operations
    if (busy) {
      console.warn('[ScoreModal DEBUG] Save already in progress - preventing duplicate!');
      return;
    }

    if (typeof onSave !== "function") {
      onClose?.();
      return;
    }

    setBusy(true);
    console.log(`[ScoreModal DEBUG] Saving: baseScore=${points}, bonus=${bonus}, total=${total}, elapsed=${elapsedSecs}`);
    
    try {
      const result = await onSave({ baseScore: points, bonus, total, elapsedSecs });

      if (result !== false) {
        // Mark game as saved so the app can perform the post-save flow
        // (navigation to scoreboard / weekly view is handled elsewhere).
        setIsGameSaved?.(true);
        onClose?.();
      }
    } catch (e) {
      console.warn("[ScoreModal] onSave error:", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }, [busy, onSave, points, bonus, total, elapsedSecs, onClose]);

  const handleCancel = useCallback(() => {
    if (busy) return;
    // CRITICAL: Don't allow cancel during share operation
    if (isSharingRef.current) {
      console.log('[ScoreModal DEBUG] handleCancel blocked - share in progress');
      return;
    }
    console.log('[ScoreModal DEBUG] handleCancel called');
    if (typeof onCancel === "function") {
      onCancel();
      return;
    }
    // fallback
    // Close/reset only. Do NOT trigger the saved-flow navigation when the
    // player cancels the save. Navigation to the scoreboard should only
    // happen when a score has actually been saved.
    onClose?.();
  }, [busy, onCancel, onClose, setIsGameSaved]);

  // Share functionality
  const shareRef = useRef();
  const { playerName: contextPlayerName } = useGame();
  const isSharingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  
  // Use playerName from GameContext, fallback to "Player"
  const playerName = contextPlayerName || "Player";
  
  // Track AppState to prevent modal close when sharing (app goes to background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // If app goes to background while sharing, keep blocking
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (isSharingRef.current) {
          console.log('[ScoreModal DEBUG] App backgrounded during share - maintaining block');
        }
      } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App returned to foreground - clear block after delay
        if (isSharingRef.current) {
          console.log('[ScoreModal DEBUG] App foregrounded after share - clearing block in 1s');
          setTimeout(() => {
            isSharingRef.current = false;
            console.log('[ScoreModal DEBUG] Share block cleared');
          }, 1000);
        }
      }
      appStateRef.current = nextAppState;
    });
    
    return () => subscription.remove();
  }, []);
  
  // DEBUG: Log player name when modal opens
  useEffect(() => {
    if (visible) {
      console.log('[ScoreModal DEBUG] Share image player name:', playerName, '| contextPlayerName:', contextPlayerName);
    }
  }, [visible, playerName, contextPlayerName]);


  const handleShare = useCallback(async () => {
    if (busy) return;
    try {
      isSharingRef.current = true;
      console.log('[ScoreModal DEBUG] Share started - blocking modal close');
      const uri = await shareRef.current.capture();
      
      const shareMessage = `${playerName} scored ${total} points in SMR YATZY! Can you beat it?\n\nDownload: https://play.google.com/store/apps/details?id=com.SimpleYatzee`;
      
      // Use expo-sharing with custom dialog title containing the link
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: shareMessage,
        });
        // Don't clear isSharingRef here - AppState listener handles it
      } else {
        Alert.alert("Share unavailable", "Sharing is not available on this device.");
        isSharingRef.current = false;
      }
    } catch (error) {
      console.warn("[ScoreModal] Share error:", error?.message || String(error));
      Alert.alert("Share failed", "Could not share score. Please try again.");
      isSharingRef.current = false;
    }
  }, [busy, playerName, total]);

  // Prevent modal close during sharing
  const handleModalClose = useCallback(() => {
    if (isSharingRef.current) {
      console.log('[ScoreModal DEBUG] Blocking modal close - share in progress (ref=true)');
      return;
    }
    console.log('[ScoreModal DEBUG] handleCancel called from onRequestClose');
    handleCancel();
  }, [handleCancel]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleModalClose}>
      <View style={styles.backdrop}>
        {/* Backdrop is non-interactive - user must explicitly Save or Cancel */}
        <View style={RNStyleSheet.absoluteFill} pointerEvents="none" />

        <View style={[styles.sheet, dark ? styles.sheetDark : styles.sheetLight]}>
          <Text style={styles.title}>Game Over</Text>
          <Text style={styles.desc}>Here’s your run summary</Text>


          {/* Labelit näkyvissä koko ajan, tulokset paljastuvat ylhäältä alas */}

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Time</Text>
            <View style={styles.rowCenter}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              <Animated.View style={{ transform: [{ translateX: slideAnims[0] }] }}>
                {revealIndex >= 1 ? (
                  <Text style={styles.value}>{formatTime(elapsedSecs)}</Text>
                ) : (
                  <Text style={styles.value}> </Text>
                )}
              </Animated.View>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Basic</Text>
            <Animated.View style={{ transform: [{ translateX: slideAnims[1] }] }}>
              {revealIndex >= 2 ? (
                <Text style={styles.value}>{points} pts</Text>
              ) : (
                <Text style={styles.value}> </Text>
              )}
            </Animated.View>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Section bonus</Text>
            <Animated.View style={{ transform: [{ translateX: slideAnims[2] }] }}>
              {revealIndex >= 3 ? (
                <Text
                  style={[
                    styles.value,
                    { color: sectionBonus > 0 ? goodColor : COLORS.textLight },
                  ]}
                >
                  {sectionBonus > 0 ? `+${sectionBonus}` : sectionBonus} pts
                </Text>
              ) : (
                <Text style={styles.value}> </Text>
              )}
            </Animated.View>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Time bonus</Text>
            <Animated.View style={{ transform: [{ translateX: slideAnims[3] }] }}>
              {revealIndex >= 4 ? (
                <Text
                  style={[
                    styles.value,
                    { color: bonus > 0 ? goodColor : bonus < 0 ? errColor : "#b9c0c7" },
                  ]}
                >
                  {bonus > 0 ? `+${bonus}` : bonus} pts
                </Text>
              ) : (
                <Text style={styles.value}> </Text>
              )}
            </Animated.View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={styles.totalLabel}>Total</Text>
            <Animated.View style={{ transform: [{ translateX: slideAnims[4] }] }}>
              {revealIndex >= 5 ? (
                <Text style={styles.totalValue}>{total} pts</Text>
              ) : (
                <Text style={styles.totalValue}> </Text>
              )}
            </Animated.View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleShare}
              disabled={busy}
              style={[styles.btnShare, busy && styles.btnDisabled]}
            >
              <FontAwesome5 name="share-alt" size={18} color={COLORS.success} />
              <Text style={styles.btnShareText}>SHARE</Text>
            </Pressable>

            <View style={styles.rightButtons}>
              <Pressable
                onPress={handleCancel}
                disabled={busy}
                style={[styles.btn, styles.btnGhost, busy && styles.btnDisabled]}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={busy}
                style={[styles.btn, { backgroundColor: okColor }, busy && styles.btnDisabled]}
              >
                {busy ? <ActivityIndicator color={COLORS.info} style={{ transform: [{ scale: 1.15 }], marginHorizontal: 6 }} /> : <Text style={styles.btnPrimaryText}>Save score</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Off-screen shareable image for ViewShot capture */}
      <View style={{ position: "absolute", top: -9999, left: -9999, opacity: 0 }} pointerEvents="none">
        <ViewShot ref={shareRef} options={{ format: "png", quality: 1.0 }}>
          <ShareableScoreImage
            playerName={playerName}
            totalPoints={total}
            duration={formatTime(elapsedSecs)}
            basicPoints={points}
            sectionBonus={sectionBonus}
            timeBonus={bonus}
          />
        </ViewShot>
      </View>

      <View style={{ height: bottomOffset + Math.max(bottomInset, 8) }} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...RNStyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayDark,
    justifyContent: "flex-end",
  },
  sheet: {
    marginHorizontal: 16,
    marginBottom: "65%",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 250,
  },
  sheetDark: { backgroundColor: "#12161a" },
  sheetLight: { backgroundColor: "#222831" },

  title: {
    fontFamily: TYPOGRAPHY.fontFamily.bangers,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    color: COLORS.textLight,
    textAlign: "center",
  },
  desc: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratLight,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
    textAlign: "center",
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratRegular,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textLight,
  },
  value: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.accent,
    marginVertical: 10,
  },
  totalLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textLight,
  },
  totalValue: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.textLight,
  },

  actions: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  rightButtons: {
    flexDirection: "row",
    gap: 6,
  },
  btn: {
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnShare: {
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  btnShareText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratSemiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.success,
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnGhostText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratSemiBold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textLight,
  },
  btnPrimaryText: {
    fontFamily: TYPOGRAPHY.fontFamily.montserratBold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textLight,
  },
  btnDisabled: { opacity: 0.6 },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
