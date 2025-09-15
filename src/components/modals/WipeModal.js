/**
 * WipeModal – Confirmation modal for wiping game data.
 * Uses a custom keyboard to avoid native keyboard pop-up.
 *
 * Usage:
 *   import WipeModal from '@/components/modals/WipeModal';
 *
 *   <WipeModal
 *     visible={wipeOpen}
 *     confirmWord="WIPE"
 *     bottomInset={insets.bottom}
 *     bottomOffset={0}
 *     onCancel={() => setWipeOpen(false)}
 *     onConfirm={() => { doWipe(); setWipeOpen(false); }}
 *   />
 *
 * @module WipeModal
 * @author Sabata79
 * @since 2025-09-09
 */
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleSheet as RNStyleSheet,
} from "react-native";
import CustomKeyboard from "../CustomKeyboard";

export default function WipeModal({
  visible,
  onCancel,
  onConfirm,
  confirmWord = "WIPE",
  title = "Confirm Wipe All Data?",
  description = "This will remove all local game data. This action cannot be undone.",
  bottomInset = 0,
  bottomOffset = 0,
  okLabel = "Wipe",
  cancelLabel = "Cancel",
  dark = true,
}) {
  const [kbVisible, setKbVisible] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!visible) {
      setKbVisible(false);
      setValue("");
    }
  }, [visible]);

  const match = useMemo(() => {
    return value.trim().toUpperCase() === String(confirmWord).toUpperCase();
  }, [value, confirmWord]);

  const handleBackspace = useCallback(() => {
    setValue((v) => v.slice(0, -1));
  }, []);

  const handleInsert = useCallback((ch) => {
    setValue((v) => (v + ch).slice(0, 24));
  }, []);

  const handleSubmit = useCallback(() => {
    setKbVisible(false);
    if (match) onConfirm?.();
  }, [match, onConfirm]);

  return (
    <Modal
      visible={!!visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={RNStyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>

          {/* “Input field” without native keyboard */}
          <Pressable
            onPress={() => setKbVisible(true)}
            style={[styles.input, dark ? styles.inputDark : styles.inputLight]}
          >
            <Text
              style={[styles.inputText, value ? null : styles.placeholderText]}
              numberOfLines={1}
            >
              {value || `Write: ${confirmWord}`}
            </Text>
          </Pressable>

          <View style={styles.row}>
            <Pressable onPress={onCancel} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={!match}
              style={[
                styles.btn,
                styles.btnDanger,
                !match && styles.btnDisabled,
              ]}
            >
              <Text style={styles.btnDangerText}>{okLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Custom keyboard always on top */}
      <CustomKeyboard
        visible={kbVisible}
        bottomInset={bottomInset}
        bottomOffset={bottomOffset}
        dark={dark}
        onInsert={handleInsert}
        onBackspace={handleBackspace}
        onSubmit={handleSubmit}
        onHide={() => setKbVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...RNStyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    marginHorizontal: 16,
    marginBottom: 400, // space for keyboard before bottomOffset
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#12161a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f2f4f5",
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    color: "#b9c0c7",
    marginBottom: 12,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
    marginBottom: 12,
  },
  inputDark: {
    backgroundColor: "#0e1216",
    borderColor: "#2b3136",
  },
  inputLight: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  },
  inputText: {
    fontSize: 16,
    color: "#e6eaee",
    fontWeight: "600",
  },
  placeholderText: {
    color: "#8b98a5",
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  btn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: {
    backgroundColor: "transparent",
  },
  btnGhostText: {
    color: "#b9c0c7",
    fontWeight: "700",
  },
  btnDanger: {
    backgroundColor: "#d32f2f",
  },
  btnDangerText: {
    color: "#fff",
    fontWeight: "800",
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
