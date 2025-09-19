
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
} from "react-native";
import COLORS from "../../constants/colors";
import TYPOGRAPHY from "../../constants/typography";
import SPACING from "../../constants/spacing";
import { useGame } from "../../constants/GameContext";

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
  bottomInset = 0,
  bottomOffset = 0,
  dark = true,
  fastThreshold = 150,
  slowThreshold = 300,
  fastBonus = 10,
  slowBonus = -10,
  okColor = COLORS.success,
  warnColor = COLORS.warning,
  errColor = COLORS.error,
  goodColor = COLORS.secondaryDark,
}) {
  const [busy, setBusy] = useState(false);
  const { setIsGameSaved } = useGame();

  useEffect(() => {
    if (!visible) setBusy(false);
  }, [visible]);

  const { bonus, dotColor } = useMemo(() => {
    if (elapsedSecs > slowThreshold) return { bonus: slowBonus, dotColor: errColor };
    if (elapsedSecs > fastThreshold) return { bonus: 0, dotColor: warnColor };
    return { bonus: fastBonus, dotColor: goodColor };
  }, [elapsedSecs, fastThreshold, slowThreshold, fastBonus, slowBonus, errColor, warnColor, goodColor]);

  const total = useMemo(() => points + bonus + sectionBonus, [points, bonus, sectionBonus]);

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
    if (busy) return;

    if (typeof onSave !== "function") {
      onClose?.();
      return;
    }

    setBusy(true);
    try {
      const result = await onSave({ baseScore: points, bonus, total, elapsedSecs });

      if (result !== false) {
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
    if (typeof onCancel === "function") {
      onCancel();
      return;
    }
    // fallback
    onClose?.();
    setIsGameSaved?.(true);
  }, [busy, onCancel, onClose, setIsGameSaved]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.backdrop}>
        <Pressable style={RNStyleSheet.absoluteFill} onPress={handleCancel} />

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
                <Text style={styles.value}>{sectionBonus > 0 ? `+${sectionBonus}` : sectionBonus} pts</Text>
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
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Save score</Text>}
            </Pressable>
          </View>
        </View>
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
    gap: SPACING.sm,
    justifyContent: "flex-end",
    marginTop: 12,
  },
  btn: {
    height: 40,
    paddingHorizontal: SPACING.md,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
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
