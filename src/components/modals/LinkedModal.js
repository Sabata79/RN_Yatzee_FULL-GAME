/**
 * LinkedModal – Linkkaa anonyymin tilin sähköpostiin ja salasanaan.
 * UI ja tyylit linjassa WipeModalin kanssa. Käyttää CustomKeyboardia.
 *
 * Props:
 *  - visible: boolean
 *  - onClose: () => void
 *  - bottomInset?: number
 *  - bottomOffset?: number
 *  - dark?: boolean
 *
 * @module screens/SettingScreen
 * @author Sabata79
 * @since 2025-08-29
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleSheet as RNStyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import CustomKeyboard from "../CustomKeyboard";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";
import { signInAnon, dbGet, dbUpdate, dbRef, remove as dbRemove } from "../../services/Firebase";
import { useGame } from "../../constants/GameContext";

export default function LinkedModal({
  visible,
  onClose,
  bottomInset = 0,
  bottomOffset = 0,
  dark = true,
}) {
  const { playerId, setPlayerId, setIsLinked } = useGame();

  const [kbVisible, setKbVisible] = useState(false);
  const [focused, setFocused] = useState(null); // 'email' | 'password' | null
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) {
      setKbVisible(false);
      setFocused(null);
      setEmail("");
      setPassword("");
      setShowPw(false);
      setBusy(false);
      setError("");
    }
  }, [visible]);

  const canSubmit = useMemo(() => {
    const trimmed = email.trim();
    return trimmed.length > 3 && trimmed.includes("@") && trimmed.includes(".") && password.length >= 6;
  }, [email, password]);

  const insert = useCallback((ch) => {
    if (focused === "email") setEmail((v) => (v + ch).slice(0, 64));
    else if (focused === "password") setPassword((v) => (v + ch).slice(0, 64));
  }, [focused]);

  const backspace = useCallback(() => {
    if (focused === "email") setEmail((v) => v.slice(0, -1));
    else if (focused === "password") setPassword((v) => v.slice(0, -1));
  }, [focused]);

  const submitKb = useCallback(() => setKbVisible(false), []);

  const insertShortcut = useCallback((ch) => {
    if (!focused) return;
    insert(ch);
  }, [focused, insert]);

  const handleLinkAccount = useCallback(async () => {
    if (busy) return;
    if (!canSubmit) {
      setError("Please enter a valid email and password (min 6 chars).");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const trimmedEmail = email.trim();

      // ensure currentUser (anon fallback)
      if (!auth().currentUser) {
        const res = await signInAnon();
        if (!res?.user) throw new Error("Anonymous sign-in failed.");
      }

      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error("User is not signed in.");

      const cred = auth.EmailAuthProvider.credential(trimmedEmail, password);
      const linkRes = await currentUser.linkWithCredential(cred);
      const newUid = linkRes?.user?.uid || currentUser?.uid;

      // migrate data if uid changed (harvinaista linkityksessä)
      const oldUuid = playerId;
      if (oldUuid && oldUuid !== newUid) {
        const snap = await dbGet(`players/${oldUuid}`);
        const oldData = snap.val() || {};
        await dbUpdate(`players/${newUid}`, { ...oldData, isLinked: true });
        await dbRemove(dbRef(`players/${oldUuid}`));
      } else {
        await dbUpdate(`players/${newUid}`, { isLinked: true });
      }

      await SecureStore.setItemAsync("user_id", newUid);
      await AsyncStorage.setItem("@is_linked", "1");
      setPlayerId(newUid);
      setIsLinked(true);

      Alert.alert("Success", "Account linked successfully!", [
        { text: "OK", onPress: () => onClose?.() },
      ]);
    } catch (e) {
      console.log("[LinkedModal] link error:", e);
      let msg = e?.message ?? String(e);
      const code = e?.code;
      if (code === "auth/email-already-in-use") msg = "This email is already in use. Try recovering the account instead.";
      else if (code === "auth/invalid-email") msg = "Email address is invalid.";
      else if (code === "auth/weak-password") msg = "Password is too weak (min 6 characters).";
      else if (code === "auth/credential-already-in-use") msg = "These credentials are already linked to another account.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }, [busy, canSubmit, email, password, onClose, playerId, setIsLinked, setPlayerId]);

  return (
    <Modal visible={!!visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={RNStyleSheet.absoluteFill} onPress={busy ? undefined : onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Link your account</Text>
          <Text style={styles.desc}>Enter your email and password to link your account.</Text>

          {/* EMAIL */}
          <Pressable
            disabled={busy}
            onPress={() => { setFocused("email"); setKbVisible(true); }}
            style={[
              styles.input,
              focused === "email" ? styles.inputActive : null,
              dark ? styles.inputDark : styles.inputLight,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.inputText, email ? null : styles.placeholderText]}
            >
              {email || "Enter your email"}
            </Text>
          </Pressable>

          {/* PASSWORD + eye */}
          <View
            style={[
              styles.input,
              focused === "password" ? styles.inputActive : null,
              dark ? styles.inputDark : styles.inputLight,
              { flexDirection: "row", alignItems: "center" },
            ]}
          >
            <Pressable
              disabled={busy}
              onPress={() => { setFocused("password"); setKbVisible(true); }}
              style={{ flex: 1, justifyContent: "center" }}
            >
              <Text
                numberOfLines={1}
                style={[styles.inputText, password ? null : styles.placeholderText]}
              >
                {password
                  ? (showPw ? password : "•".repeat(Math.min(password.length, 32)))
                  : "Enter your password"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowPw((v) => !v)}
              hitSlop={8}
              disabled={busy}
              style={{ paddingHorizontal: 6, paddingVertical: 6 }}
            >
              <FontAwesome5 name={showPw ? "eye-slash" : "eye"} size={18} color="#b9c0c7" />
            </Pressable>
          </View>

          {/* Shortcut chips for email symbols */}
          <View style={styles.chipsRow}>
            {["@","",".","_","-"].map((s) => (
              <Pressable
                key={s || "dot"}
                onPress={() => insertShortcut(s)}
                disabled={!focused || busy}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text style={styles.chipText}>{s === "" ? "." : s}</Text>
              </Pressable>
            ))}
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.row}>
            <Pressable
              onPress={busy ? undefined : onClose}
              style={[styles.btn, styles.btnGhost, busy && styles.btnDisabled]}
              disabled={busy}
            >
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleLinkAccount}
              disabled={!canSubmit || busy}
              style={[
                styles.btn,
                styles.btnPrimary,
                (!canSubmit || busy) && styles.btnDisabled,
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={styles.btnPrimaryText}>Link Account</Text>
                  <FontAwesome5 name="link" size={16} color="#fff" />
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* CustomKeyboard (sama logiikka kuin WipeModalissa) */}
      <CustomKeyboard
        visible={kbVisible}
        bottomInset={bottomInset}
        bottomOffset={bottomOffset}
        dark={dark}
        onInsert={insert}
        onBackspace={backspace}
        onSubmit={() => setKbVisible(false)}
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
    marginBottom: 96,
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
    marginBottom: 10,
  },
  inputActive: {
    borderColor: "#4c9aff",
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
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#1a2025",
    borderWidth: 1,
    borderColor: "#2b3136",
    alignItems: "center",
    justifyContent: "center",
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  chipText: {
    color: "#e6eaee",
    fontWeight: "700",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 8,
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
  btnPrimary: {
    backgroundColor: "#2e7d32",
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  error: {
    color: "#ff6b6b",
    fontSize: 13,
    marginBottom: 4,
  },
});
