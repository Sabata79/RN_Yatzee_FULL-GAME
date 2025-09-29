/**
 * PlayerCardBGSelector — small selector UI for choosing a player card background
 * Allows players to override the automatic level-based background with any
 * background up to their achieved level. Writes choice to players/{playerId}/preferredCardBg
 * @module src/components/PlayerCardBGSelector
 * @author Sabata79
 * @since 2025-09-28
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import SPACING from '../constants/spacing';
import { useGame } from '../constants/GameContext';
import { PlayercardBg } from '../constants/PlayercardBg';
import { dbGet, dbUpdate } from '../services/Firebase';

const LEVEL_ORDER = ['beginner', 'basic', 'advanced', 'elite', 'legendary'];

// --- Shared stub/default image (keeps UI stable during load/errors) ---
const STUB_IMG = require('../../assets/playerCardBg/BeginnerBG.webp');

export default function PlayerCardBGSelector() {
    const { playerId, playerLevel } = useGame();
    const { width: windowWidth } = useWindowDimensions();
    const [preferred, setPreferred] = useState(null); // null = no override, string = levelKey
    const [loading, setLoading] = useState(true);
    const preferredSourceRef = useRef(''); // 'db' | 'local'
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let mounted = true;
        console.log('[PlayerCardBGSelector] mounted for playerId=', playerId);
        const load = async () => {
            if (!playerId) {
                setLoading(false);
                return;
            }
            try {
                const snap = await dbGet(`players/${playerId}/preferredCardBg`);
                    let val = snap && typeof snap.val === 'function' ? snap.val() : snap;
                    if (!mounted) return;
                    preferredSourceRef.current = 'db';
                    // Normalize incoming values: accept null or a proper level key.
                    if (val == null) {
                        setPreferred(null);
                    } else {
                        const s = String(val).trim().toLowerCase();
                        if (s === 'null' || s === 'undefined' || s === '') setPreferred(null);
                        else setPreferred(s);
                    }
            } catch (e) {
                console.warn('[PlayerCardBGSelector] failed to load preferredCardBg', e);
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; preferredSourceRef.current = ''; };
    }, [playerId]);

    const canUseLevel = (candidateLevel) => {
        try {
            const playerIdx = LEVEL_ORDER.indexOf(String(playerLevel || '').toLowerCase());
            const candIdx = LEVEL_ORDER.indexOf(String(candidateLevel || '').toLowerCase());
            if (playerIdx === -1) return false; // unknown player level -> conservative
            return candIdx !== -1 && candIdx <= playerIdx;
        } catch (e) {
            return false;
        }
    };

    const applyPreferred = async (level) => {
        if (!playerId) return;
        const key = level ? String(level).trim().toLowerCase() : null;
        setSaving(true);
        try {
            await dbUpdate(`players/${playerId}`, { preferredCardBg: key });
            preferredSourceRef.current = 'local';
            setPreferred(key);
        } catch (e) {
            console.error('[PlayerCardBGSelector] save failed', e);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (!preferred || !playerLevel) return;
        if (preferredSourceRef.current !== 'db') return;
        try {
            const prefIdx = LEVEL_ORDER.indexOf(String(preferred).toLowerCase());
            const playerIdx = LEVEL_ORDER.indexOf(String(playerLevel).toLowerCase());
            // If the saved preference is above the player's current level it's invalid
            // (e.g., db contains 'legendary' but player is 'advanced') — in that
            // case clear the preference. Do NOT clear when prefIdx < playerIdx
            // because choosing a lower-level background is allowed.
            if (prefIdx !== -1 && playerIdx !== -1 && prefIdx > playerIdx) {
                setPreferred(null);
            }
        } catch (e) { /* noop */ }
    }, [preferred, playerLevel]);

    const canRender = Boolean(playerId);
    const usedLevelKey = preferred ? String(preferred).toLowerCase() : String(playerLevel || '').toLowerCase();

    const bgList = [...PlayercardBg];
    if (!bgList.find(b => String(b.level || '').toLowerCase() === 'legendary')) {
        bgList.push({ level: 'Legendary', display: null });
    }

    /**
     * computeFanGeometry — small helper to centralize all fan geometry
     * Returns clearly named values so the render block stays readable.
     * Keep tuning points (MIN_AVAILABLE, MIN_ITEM, MAX_ITEM, OVERLAP_FACTOR) here.
     */
    const computeFanGeometry = (count, winWidth) => {
        // SIDE_PADDING may be negative to nudge the fan outward horizontally.
        // Use a separate non-negative gutter value for available-width calculations
        // so negative padding doesn't erroneously increase available space.
        const SIDE_PADDING = -12; // px, container horizontal padding (may be negative)
        const GUTTER = Math.max(0, SIDE_PADDING);
        const MIN_AVAILABLE = 280; // minimum available width to fall back to
        const MAX_VISIBLE = Math.min(5, count); // how many items we aim to show comfortably

        const available = Math.max(MIN_AVAILABLE, winWidth - GUTTER * 2);
        const approxPer = Math.floor(available / (MAX_VISIBLE + 0.8));

        const MIN_ITEM = 90;
        const MAX_ITEM = 140;
        const ITEM_WIDTH = Math.max(MIN_ITEM, Math.min(MAX_ITEM, approxPer));
        const OVERLAP_FACTOR = 0.28; // fraction of itemWidth that overlaps the next card
        const OVERLAP = Math.round(ITEM_WIDTH * OVERLAP_FACTOR);

        const centerIndex = (count - 1) / 2;

        // total width occupied by the fan (items minus overlaps)
        const totalWidth = Math.max(0, count * ITEM_WIDTH - Math.max(0, (count - 1)) * OVERLAP);
        // Use the actual fan total width as the container width (with a small minimum)
        const containerWidth = Math.max(totalWidth, MIN_AVAILABLE);

        const pressableH = Math.round(ITEM_WIDTH * 1.35);
        return {
            SIDE_PADDING,
            MAX_VISIBLE,
            ITEM_WIDTH,
            OVERLAP,
            centerIndex,
            containerWidth,
            totalWidth,
            pressableHeight: pressableH,
            imageWidth: ITEM_WIDTH,
            imageHeight: pressableH,
        };
    };

    const {
        ITEM_WIDTH: itemWidth,
        OVERLAP: overlap,
        SIDE_PADDING,
        centerIndex,
        containerWidth: fanContainerWidth,
        totalWidth,
        pressableHeight,
        imageWidth,
        imageHeight,
    } = computeFanGeometry(bgList.length, windowWidth);

    // Use marginHorizontal so negative SIDE_PADDING shifts the fan outward.
    const fanContainerStyle = [styles.fanContainer, { marginHorizontal: SIDE_PADDING }];

    // centralized sizing objects (change overlap or itemWidth to affect spacing)
    const itemWrapBaseStyle = { width: itemWidth, marginRight: -overlap };
    const pressableSize = { width: itemWidth, height: pressableHeight };
    const imageSize = { width: imageWidth, height: imageHeight };

    if (!canRender) return null;
    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Player card background</Text>
                <Text style={styles.hint}>Loading…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.hint}>Default follows your level. You can override it here.</Text>

            <Text style={styles.usingText}>
                Using: <Text style={styles.usingLevel}>
                    {usedLevelKey ? usedLevelKey.charAt(0).toUpperCase() + usedLevelKey.slice(1) : '—'}
                </Text>{preferred ? ' (override)' : ' (default)'}
            </Text>

            <View style={styles.fanOuter}>
                <View style={fanContainerStyle}>
                    {bgList.map((bg, idx) => {
                        const levelKey = String(bg.level || '').toLowerCase();
                        const selectable = canUseLevel(levelKey);
                        const isSelected = String(preferred || '').toLowerCase() === levelKey;
                        const isUsed = !preferred && levelKey === String(playerLevel || '').toLowerCase();

                        // compute delta from center and clamp to -3..3 for selecting rot/z classes
                        const signed = idx - centerIndex;
                        const rawDelta = signed === 0 ? 0 : Math.sign(signed) * Math.ceil(Math.abs(signed));
                        const delta = Math.max(-3, Math.min(3, rawDelta));

                        const rotMap = {
                            '-3': 'rot_m12', '-2': 'rot_m8', '-1': 'rot_m4', '0': 'rot_0', '1': 'rot_4', '2': 'rot_8', '3': 'rot_12'
                        };
                        const rotClass = rotMap[String(delta)];

                        // z-class: selected item should always be topmost
                        let zClass;
                        if (isSelected) {
                            zClass = 'zTop';
                        } else {
                            const zLevel = Math.max(1, 4 - Math.abs(delta)); // 1..4
                            zClass = `z${zLevel}`;
                        }

                        // Use a robust key so React doesn't get confused if list changes
                        const itemKey = `${idx}-${levelKey}`;
                        const showImage = selectable && !!bg.display;
                        const showSelectedOverlay = selectable && (isSelected || isUsed);
                        const itemOpacity = selectable ? 1 : 0.36;

                        return (
                            <View key={itemKey} style={[styles.fanItemWrap, itemWrapBaseStyle, styles[zClass]]}>
                                <Pressable
                                    onPress={() => selectable && !saving ? applyPreferred(levelKey) : null}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    disabled={!selectable || saving}
                                    style={[styles.fanItem, showSelectedOverlay && styles.selected, styles[rotClass], pressableSize, { opacity: itemOpacity }]}
                                >
                                    {/* Background fills the holder; label is rendered as an overlay so it doesn't push layout */}
                                    <View style={[styles.imageWrapper, imageSize]}>
                                        {showImage ? (
                                            <Image
                                                source={bg.display}
                                                defaultSource={STUB_IMG}
                                                style={styles.fanThumb}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            // If the level is not yet unlocked we show a neutral placeholder
                                            <View style={styles.fanThumbPlaceholder} />
                                        )}
                                        {showSelectedOverlay && <View style={styles.selectedOverlay} pointerEvents="none" />}
                                        {selectable && <Text style={styles.labelOverlay}>{bg.level}</Text>}
                                    </View>
                                </Pressable>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Reset option below the fan */}
            <View style={styles.resetRow}>
                <Pressable onPress={() => applyPreferred(null)} style={styles.resetBtn}>
                    <Text style={styles.resetText}>Reset to level default</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 2,
        paddingBottom: 12,
    },
    // Title 
    title: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 6,
        textAlign: 'center',
    },
    // Default follows your level. You can override it here....
    hint: {
        color: '#bbb',
        fontSize: 12,
        marginBottom: 8,
        textAlign: 'center',
    },
    fanContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingVertical: 4,
        paddingRight: 0,
        justifyContent: 'center',
        alignSelf: 'stretch',
        width: '100%',
        paddingHorizontal: 0,
    },
    fanItemWrap: {
        width: 90,
        alignItems: 'center',
    },
    fanItem: {
        width: 90,
        height: 120,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#1f1f1fe3',
        alignItems: 'center',
        padding: 0,
        justifyContent: 'flex-start',
        elevation: 6,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    fanThumb: {
        width: '100%',
        height: '100%',
        borderRadius: 2,
        marginBottom: 0,
        resizeMode: 'cover',
        backgroundColor: 'transparent',
    },
    fanOuter: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    fanThumbPlaceholder: {
        borderRadius: 6,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(202, 36, 36, 0.03)',
        width: '100%',
        height: '100%',
        backgroundColor: '#363434',
    },
    imageWrapper: {
        borderRadius: 6,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    labelOverlay: {
        position: 'absolute',
        top: 2,
        left: 3,
        right: 3,
        color: '#fff',
        fontSize: 9,
        fontWeight: '700',
        backgroundColor: 'rgba(0, 0, 0, 0.418)',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 4,
        textAlign: 'center',
    },
    labelOverlayDisabled: {
        color: '#ccc',
        backgroundColor: 'rgba(0,0,0,0.18)'
    },
    label: {
        color: '#fff',
        fontSize: 12,
        textAlign: 'center',
    },

    //   locked: {
    //     /* legacy, kept for reference */
    //   },

    selected: {
        shadowColor: '#FFD600',
        shadowOpacity: 0.32,
        shadowRadius: 12,
        elevation: 10,
    },
    selectedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: '#FFD600',
        pointerEvents: 'none',
    },
    resetRow: {
        marginTop: 8,
        alignItems: 'center',
    },
    resetBtn: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        backgroundColor: '#212121',
        borderRadius: 10,
    },
    resetText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    resetSub: {
        color: '#bbb',
        fontSize: 12,
        marginTop: 6,
    },
    usingText: {
        color: '#ddd',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 12,
    },
    usingLevel: {
        color: '#FFD600',
        fontWeight: '700',
    },
    // --- static fan rotation classes (avoid inline transforms) ---
    rot_m12: { transform: [{ rotate: '-12deg' }], },
    rot_m8: { transform: [{ rotate: '-8deg' }], },
    rot_m4: { transform: [{ rotate: '-4deg' }], },
    rot_0: { transform: [{ rotate: '0deg' }], },
    rot_4: { transform: [{ rotate: '4deg' }], },
    rot_8: { transform: [{ rotate: '8deg' }], },
    rot_12: { transform: [{ rotate: '12deg' }], },

    // z levels
    z1: { zIndex: 1, elevation: 1 },
    z2: { zIndex: 2, elevation: 2 },
    z3: { zIndex: 3, elevation: 3 },
    z4: { zIndex: 4, elevation: 4 },
    zTop: { zIndex: 999, elevation: 20 },
});
