/**
 * CustomKeyboard – on-screen keyboard for secure and custom input.
 * Used in modals (RecoverModal, WipeModal, etc) for email, password, and PIN entry. Supports special characters and dark/light themes.
 *
 * Props:
 *  - visible: boolean
 *  - bottomInset?: number
 *  - bottomOffset?: number
 *  - dark?: boolean
 *  - enableSpecials?: boolean (show @ . _)
 *  - onInsert: (char: string) => void
 *  - onBackspace: () => void
 *  - onSubmit: () => void
 *  - onHide: () => void
 *
 * @module CustomKeyboard
 * @author Sabata79
 * @since 2025-09-18
 */
import React, { useMemo, useState, useCallback } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    StyleSheet as RNStyleSheet,
} from "react-native";

const isLetter = (ch) => /^[A-Za-zÅÄÖåäöØøŒœ]$/.test(ch);

const Key = React.memo(function Key({
    label,
    flex = 1,
    wide = false,
    onPress,
    dark = true,
}) {
    const handlePress = useCallback(() => onPress?.(label), [onPress, label]);
    return (
        <Pressable
            onPress={handlePress}
            android_disableSound
            hitSlop={6}
            pressRetentionOffset={8}
            delayPressIn={0}
            style={({ pressed }) => [
                styles.key,
                dark ? styles.keyDark : styles.keyLight,
                wide && styles.keyWide,
                { flex },
                pressed && styles.keyPressed,
            ]}
        >
            <Text
                allowFontScaling={false}
                style={dark ? styles.keyTextDark : styles.keyTextLight}
            >
                {label}
            </Text>
        </Pressable>
    );
});

export default function CustomKeyboard({
    visible,
    onInsert,
    onBackspace,
    onSubmit,
    onHide,
    bottomInset = 0,
    dark = true,
    bottomOffset = 0,
    sheetStyle,
    okColor = "#2e7d32",
    enableSpecials = true,
}) {
    const [capsLock, setCapsLock] = useState(false);
    const [oneShotShift, setOneShotShift] = useState(false);

    const applyCase = useCallback(
        (ch) => {
            if (!isLetter(ch)) return ch;
            if (capsLock || oneShotShift) return ch.toUpperCase();
            return ch.toLowerCase();
        },
        [capsLock, oneShotShift]
    );

    const lettersRow2 = "qwertyuiopå".split("");
    const lettersRow3 = "asdfghjklöä".split("");
    const lettersRow4 = "zxcvbnmø".split("");

    const rows = useMemo(() => {
        const up = (arr) =>
            arr.map((c) => (capsLock || oneShotShift ? c.toUpperCase() : c.toLowerCase()));
        return [
            "1234567890".split(""),
            up(lettersRow2),
            up(lettersRow3),
            up(lettersRow4),
        ];
    }, [capsLock, oneShotShift]);

    const insert = useCallback(
        (c) => {
            const out = applyCase(c);
            onInsert?.(out);
            if (oneShotShift && isLetter(c)) setOneShotShift(false);
        },
        [applyCase, onInsert, oneShotShift]
    );

    const handleShiftPress = useCallback(() => {
        // Tap: toggle one-shot SHIFT on/off (if CAPS is not active)
        if (capsLock) return;            // CAPS state is handled by long press as before
        setOneShotShift((v) => !v);
    }, [capsLock]);

    const handleShiftLong = useCallback(() => {
        setCapsLock((v) => !v);               // caps on/off
        setOneShotShift(false);
    }, []);

    if (!visible) return null;

    return (
        <View pointerEvents="box-none" style={RNStyleSheet.absoluteFill}>
            <Pressable style={RNStyleSheet.absoluteFill} onPress={onHide} />

            <View
                style={[
                    styles.sheet,
                    { bottom: bottomOffset },
                    sheetStyle,
                    { paddingBottom: Math.max(bottomInset, 8) },
                ]}
            >
                {/* Row 1: 1234567890 */}
                <View style={styles.row}>
                    {rows[0].map((c, i) => (
                        <Key key={`r1-${i}-${c}`} label={c} onPress={insert} dark={dark} />
                    ))}
                </View>

                {/* Row 2: qwertyuiopå */}
                <View style={styles.row}>
                    {rows[1].map((c, i) => (
                        <Key key={`r2-${i}-${c}`} label={c} onPress={insert} dark={dark} />
                    ))}
                </View>

                {/* Row 3: asdfghjklöä */}
                <View style={styles.row}>
                    {rows[2].map((c, i) => (
                        <Key key={`r3-${i}-${c}`} label={c} onPress={insert} dark={dark} />
                    ))}
                </View>

                {/* Row 4: zxcvbnmø | backspace */}
                <View style={styles.row}>
                    <View style={[styles.row, { flex: 6, marginVertical: 0 }]}>
                        {rows[3].map((c, i) => (
                            <Key key={`r4-${i}-${c}`} label={c} onPress={insert} dark={dark} />
                        ))}
                    </View>
                    <Pressable
                        onPress={onBackspace}
                        hitSlop={6}
                        style={({ pressed }) => [
                            styles.key,
                            styles.keyDark,
                            styles.keyWide,
                            { flex: 1.8 },
                            pressed && styles.keyPressed,
                        ]}
                    >
                        <Text allowFontScaling={false} style={styles.keyTextDark}>⌫</Text>
                    </Pressable>
                </View>

                {/* Row 5: enableSpecials ? (Shift | @ | space | . | _ | OK) : (Shift | space | OK) */}
                <View style={styles.row}>
                    {/* Shift (tap=oneshot, long=CAPS toggle) */}
                    <Pressable
                        onPress={handleShiftPress}
                        onLongPress={handleShiftLong}
                        hitSlop={6}
                        style={({ pressed }) => [
                            styles.key,
                            styles.keyDark,
                            styles.keyWide,
                            {
                                flex: 1.6,
                                borderColor: capsLock
                                    ? "#4c9aff"
                                    : oneShotShift
                                        ? "#8ab4f8"
                                        : styles.keyDark.borderColor,
                            },
                            pressed && styles.keyPressed,
                        ]}
                    >
                        <Text allowFontScaling={false} style={styles.keyTextDark}>
                            {capsLock ? (
                                <Text allowFontScaling={false} style={styles.keyTextDark}>CAPS</Text>
                            ) : oneShotShift ? (
                                <MaterialCommunityIcons name="arrow-up-bold" size={20} color={dark ? "#f2f4f5" : "#1c2024"} />
                            ) : (
                                <MaterialCommunityIcons name="arrow-up-bold-outline" size={20} color={dark ? "#f2f4f5" : "#1c2024"} />
                            )}
                        </Text>
                    </Pressable>

                    {enableSpecials && <Key label="@" onPress={insert} dark={dark} />}

                    <Pressable
                        onPress={() => insert(" ")}
                        hitSlop={6}
                        style={({ pressed }) => [
                            styles.key,
                            styles.keyDark,
                            styles.keyWide,
                            { flex: enableSpecials ? 4 : 6 },
                            pressed && styles.keyPressed,
                        ]}
                    >
                        <Text allowFontScaling={false} style={styles.keyTextDark}>space</Text>
                    </Pressable>

                    {enableSpecials && <Key label="." onPress={insert} dark={dark} />}
                    {enableSpecials && <Key label="_" onPress={insert} dark={dark} />}

                    <Pressable
                        onPress={onSubmit}
                        hitSlop={6}
                        style={({ pressed }) => [
                            styles.key,
                            styles.keyWide,
                            { flex: 2.2, backgroundColor: okColor, borderColor: okColor },
                            pressed && styles.keyPressed,
                        ]}
                    >
                        <Text allowFontScaling={false} style={[styles.keyTextDark, { color: "#fff" }]}>
                            OK
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sheet: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        elevation: 1000,
        backgroundColor: "#101418",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingTop: 8,
        paddingHorizontal: 10,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginVertical: 4,
    },
    key: {
        height: 48,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    keyWide: {
        height: 48,
    },
    keyDark: {
        backgroundColor: "#2a2f34",
        borderWidth: 1,
        borderColor: "#3a4147",
    },
    keyLight: {
        backgroundColor: "#e8edf2",
        borderWidth: 1,
        borderColor: "#d7dde3",
    },
    keyPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.92,
    },
    keyTextDark: {
        color: "#f2f4f5",
        fontSize: 18,
        fontWeight: "600",
    },
    keyTextLight: {
        color: "#1c2024",
        fontSize: 18,
        fontWeight: "600",
    },
});
