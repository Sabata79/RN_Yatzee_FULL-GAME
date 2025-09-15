/**
 * RecoverModal – account recovery & password reset.
 * Dark sheet UI matches WipeModal/LinkedModal. Uses CustomKeyboard (enableSpecials for email).
 *
 * Props:
 *  - visible: boolean
 *  - onClose: () => void
 *  - bottomInset?: number
 *  - bottomOffset?: number
 *  - dark?: boolean
  *
  * @module RecoverModal
  * @author Sabata79
  * @since 2025-09-10
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
import auth from "@react-native-firebase/auth";
import { dbGet, dbUpdate, dbRef, remove as dbRemove } from "../../services/Firebase";
import { useGame } from "../../constants/GameContext";
import * as Updates from "expo-updates";

export default function RecoverModal({
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
  const [resetMode, setResetMode] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  useEffect(() => {
    if (!visible) {
      setKbVisible(false);
      setFocused(null);
      setEmail("");
      setPassword("");
      setShowPw(false);
      setBusy(false);
      setError("");
      setResetMode(false);
      setResetMsg("");
    }
  }, [visible]);

  const canRecover = useMemo(() => {
    const trimmed = email.trim();
    return trimmed.includes("@") && trimmed.includes(".") && password.length >= 6;
  }, [email, password]);

  const canSendReset = useMemo(() => email.trim().length > 3 && email.includes("@"), [email]);

  // Keyboard handlers
  const insert = useCallback(
    (ch) => {
      if (focused === "email") setEmail((v) => (v + ch).slice(0, 64));
      else if (focused === "password") setPassword((v) => (v + ch).slice(0, 64));
    },
    [focused]
  );

  const backspace = useCallback(() => {
    if (focused === "email") setEmail((v) => v.slice(0, -1));
    else if (focused === "password") setPassword((v) => v.slice(0, -1));
  }, [focused]);

  const closeKb = useCallback(() => setKbVisible(false), []);

  // Recover with email/password
  const handleRecover = useCallback(async () => {
    if (busy) return;
    if (!canRecover) {
      setError("Enter a valid email and a password with at least 6 characters.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      // sign out any existing user (e.g., anonymous)
      if (auth().currentUser) {
        try { await auth().signOut(); } catch { }
      }

      const res = await auth().signInWithEmailAndPassword(email.trim(), password);
      const newUid = res?.user?.uid;
      const oldUid = playerId;

      if (!newUid) throw new Error("Authentication failed.");

      if (oldUid && oldUid !== newUid) {
        // migrate
        const snap = await dbGet(`players/${oldUid}`);
        const oldData = snap.val() || {};
        await dbUpdate(`players/${newUid}`, { ...oldData, isLinked: true });
        await dbRemove(dbRef(`players/${oldUid}`));
      } else {
        // mark as linked
        await dbUpdate(`players/${newUid}`, { isLinked: true });
      }

      await SecureStore.setItemAsync("user_id", newUid);
      setPlayerId(newUid);
      setIsLinked(true);

      Alert.alert("Success", "Account recovered successfully!", [
        {
          text: "OK",
          onPress: async () => {
            onClose?.();
            try { await Updates.reloadAsync(); } catch { }
          },
        },
      ]);
    } catch (e) {
      console.log("[RecoverModal] recover error:", e);
      setError(e?.message ?? "Failed to recover account. Check email and password.");
    } finally {
      setBusy(false);
    }
  }, [busy, canRecover, email, password, playerId, setIsLinked, setPlayerId, onClose]);

  // Password reset
  const handleReset = useCallback(async () => {
    if (busy) return;
    if (!canSendReset) {
      setResetMsg("Enter a valid email to receive a reset link.");
      return;
    }
    setResetMsg("");
    setBusy(true);
    try {
      await auth().sendPasswordResetEmail(email.trim());
      setResetMsg("Password reset link sent to your email.");
      setPassword("");
    } catch (e) {
      console.log("[RecoverModal] reset error:", e);
      setResetMsg(e?.message ?? "Failed to send reset email.");
    } finally {
      setBusy(false);
    }
  }, [busy, canSendReset, email]);

  return (
    <Modal visible={!!visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={RNStyleSheet.absoluteFill} onPress={busy ? undefined : onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>
            Recover <FontAwesome5 name="redo" size={16} color="#f2f4f5" />
          </Text>

          {resetMode ? (
            <>
              <Text style={styles.desc}>Enter your email to reset your password.</Text>

              {/* EMAIL (reset) */}
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

              {!!resetMsg && <Text style={styles.info}>{resetMsg}</Text>}

              <View style={styles.row}>
                <Pressable
                  onPress={() => setResetMode(false)}
                  style={[styles.btn, styles.btnGhost]}
                  disabled={busy}
                >
                  <Text style={styles.btnGhostText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={handleReset}
                  disabled={!canSendReset || busy}
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    (!canSendReset || busy) && styles.btnDisabled,
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Send</Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.desc}>Enter your email and password to recover your linked account.</Text>

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

              {!!error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.row}>
                <Pressable
                  onPress={onClose}
                  style={[styles.btn, styles.btnGhost]}
                  disabled={busy}
                >
                  <Text style={styles.btnGhostText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => setResetMode(true)}
                  style={[styles.btn, styles.btnGhost]}
                  disabled={busy}
                >
                  <Text style={styles.btnGhostText}>Forgot Password?</Text>
                </Pressable>
                <Pressable
                  onPress={handleRecover}
                  disabled={!canRecover || busy}
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    (!canRecover || busy) && styles.btnDisabled,
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={styles.btnPrimaryText}>Recover Account</Text>
                      <FontAwesome5 name="redo" size={16} color="#fff" />
                    </View>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>

      {/* CustomKeyboard:
          - email: specials on (@ . _)
          - password: specials off */}
      <CustomKeyboard
        visible={kbVisible}
        bottomInset={bottomInset}
        bottomOffset={bottomOffset}
        dark={dark}
        enableSpecials={focused === "email"}
        onInsert={insert}
        onBackspace={backspace}
        onSubmit={closeKb}
        onHide={closeKb}
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
    marginBottom: 300,
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
    marginBottom: 6
  },
  desc: {
    fontSize: 14,
    color: "#b9c0c7",
    marginBottom: 12
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
    borderWidth: 2
  },
  inputDark: {
    backgroundColor: "#0e1216",
    borderColor: "#2b3136"
  },
  inputLight: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0"
  },
  inputText: {
    fontSize: 16,
    color: "#e6eaee",
    fontWeight: "600"
  },
  placeholderText: {
    color: "#8b98a5",
    fontWeight: "500"
  },
  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    marginTop: 8,
    flexWrap: "wrap"
  },
  btn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhost: {
    backgroundColor: "transparent"
  },
  btnGhostText: {
    color: "#b9c0c7",
    fontWeight: "700"
  },
  btnPrimary: {
    backgroundColor: "#2e7d32"
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800"
  },
  btnDisabled: {
    opacity: 0.5
  },
  error: {
    color: "#ff6b6b",
    fontSize: 13,
    marginBottom: 4
  },
  info: {
    color: "#8ab4f8",
    fontSize: 13,
    marginBottom: 4
  },
});
