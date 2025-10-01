/**
 *
 * Manages audio playback and settings for the application.
 *
 * @module services/AudioManager
 * @author Sabata79
 * @since 2025-09-06
 */

import React, {
  createContext, useContext,
  useRef, useState, useEffect, useCallback
} from 'react';
import {
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ---- Persist keys
const SFX_KEY = 'sfx_settings';
const MUSIC_KEY = 'music_settings';

// ---- Assets
const SFX_PATH = require('../../assets/sounds/dice-sound.mp3');
const MUSIC_PATH = require('../../assets/sounds/ambientBG.mp3');
const SELECT_PATH = require('../../assets/sounds/select.mp3');
const DESELECT_PATH = require('../../assets/sounds/deselect.mp3');
const DICE_TOUCH_PATH = require('../../assets/sounds/dicetouch.mp3');

// Per-sound multipliers
const DICE_TOUCH_FACTOR = 0.4; // reduce dice touch to 40% of global sfxVolume

// ---- Context
export const AudioContext = createContext(null);

// Safe hook for consumers (returns no-ops if used outside provider)
export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    const noop = async () => { };
    const setNoop = () => { };
    return {
      ready: false,
      musicMuted: true,
      sfxMuted: true,
      musicVolume: 0.05,
      sfxVolume: 0.5,
      setMusicMuted: setNoop,
      setSfxMuted: setNoop,
      setMusicVolume: setNoop,
      setSfxVolume: setNoop,
      playMusic: noop,
      stopMusic: noop,
      playSfx: noop,
      playSelect: noop,
      playDeselect: noop,
      prewarmSfx: noop,
      playDiceTouch: noop,
    };
  }
  return ctx;
};

export function AudioProvider({ children }) {
  // ---- One-time init guard (MUST be inside component)
  const didInitRef = useRef(false);

  // ---- State
  const [ready, setReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [musicMuted, setMusicMutedState] = useState(false);
  const [sfxMuted, setSfxMutedState] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.05); // 0..1
  const [sfxVolume, setSfxVolume] = useState(0.5);      // 0..1

  // ---- Refs for loaded players
  /** @type {React.MutableRefObject<import('expo-audio').AudioPlayer|null>} */
  const musicSound = useRef(null);
  const sfxSound = useRef(null);
  const selectSound = useRef(null);
  const deselectSound = useRef(null);
  const diceTouchSound = useRef(null);

  // ---- Helpers to (lazy) create each player
  const ensureMusic = useCallback(async () => {
    if (musicSound.current) return;
    const player = createAudioPlayer(MUSIC_PATH);
    player.loop = true;
    player.volume = musicMuted ? 0 : musicVolume;
    player.muted = musicMuted;
    musicSound.current = player;
    // console.log('[Audio] MUSIC loaded');
  }, [musicMuted, musicVolume]);

  const ensureSfx = useCallback(async () => {
    if (sfxSound.current) return;
    const player = createAudioPlayer(SFX_PATH);
    player.volume = sfxMuted ? 0 : sfxVolume;
    player.muted = sfxMuted;
    sfxSound.current = player;
    // console.log('[Audio] SFX loaded');
  }, [sfxMuted, sfxVolume]);

  const ensureSelect = useCallback(async () => {
    if (selectSound.current) return;
    const player = createAudioPlayer(SELECT_PATH);
    player.volume = sfxMuted ? 0 : sfxVolume;
    player.muted = sfxMuted;
    selectSound.current = player;
    // console.log('[Audio] SELECT loaded');
  }, [sfxMuted, sfxVolume]);

  const ensureDeselect = useCallback(async () => {
    if (deselectSound.current) return;
    const player = createAudioPlayer(DESELECT_PATH);
    player.volume = sfxMuted ? 0 : sfxVolume;
    player.muted = sfxMuted;
    deselectSound.current = player;
    // console.log('[Audio] DESELECT loaded');
  }, [sfxMuted, sfxVolume]);

  const ensureDiceTouch = useCallback(async () => {
    if (diceTouchSound.current) return;
    const player = createAudioPlayer(DICE_TOUCH_PATH);
    player.volume = sfxMuted ? 0 : (sfxVolume * DICE_TOUCH_FACTOR);
    player.muted = sfxMuted;
    diceTouchSound.current = player;
    // console.log('[Audio] DICE_TOUCH loaded');
  }, [sfxMuted, sfxVolume]);

  const unloadAll = useCallback(() => {
    try { musicSound.current?.remove?.(); } catch {}
    try { sfxSound.current?.remove?.(); } catch {}
    try { selectSound.current?.remove?.(); } catch {}
    try { deselectSound.current?.remove?.(); } catch {}
    try { diceTouchSound.current?.remove?.(); } catch {}
    musicSound.current = null;
    sfxSound.current = null;
    selectSound.current = null;
    deselectSound.current = null;
    diceTouchSound.current = null;
  }, []);

  // ---- Persisted settings → state
  const loadPersistedSettingsIntoState = useCallback(async () => {
    try {
      const sfx = await SecureStore.getItemAsync(SFX_KEY);
      if (sfx) {
        const { volume, muted } = JSON.parse(sfx);
        if (typeof volume === 'number') setSfxVolume(volume);
        if (typeof muted === 'boolean') setSfxMutedState(muted);
      }
    } catch { }
    try {
      const music = await SecureStore.getItemAsync(MUSIC_KEY);
      if (music) {
        const { volume, muted } = JSON.parse(music);
        if (typeof volume === 'number') setMusicVolume(Math.round(volume * 10) / 10);
        if (typeof muted === 'boolean') setMusicMutedState(muted);
      }
    } catch { }
    finally {
      setHydrated(true); // <— mark settings as loaded
    }
  }, []);

  // ---- INIT: audio mode, persisted settings, preload (run once)
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    let alive = true;

    (async () => {
      try {
        // expo-audio: käytä nimettyä setAudioModeAsync (avaimet stringeinä)
        const mode = {
          allowsRecording: false,
          playsInSilentMode: true,
          ...(Platform.OS === 'android'
            ? { interruptionModeAndroid: 'duckOthers' }
            : { interruptionMode: 'doNotMix' }),
        };

        try {
          await setAudioModeAsync(mode);
        } catch (e) {
          console.warn('[Audio] setAudioModeAsync failed, fallback:', e?.message || e);
          await setAudioModeAsync({ playsInSilentMode: true });
          console.log('[Audio] setAudioModeAsync (fallback) OK');
        }

        // 1) Load persisted settings FIRST
        await loadPersistedSettingsIntoState();
        // console.log('[Audio] loaded settings (hydrated)', {
        //   musicMutedAfterLoad: musicMuted,
        //   sfxMutedAfterLoad: sfxMuted,
        //   musicVolumeAfterLoad: musicVolume,
        //   sfxVolumeAfterLoad: sfxVolume,
        // });

        // 2) Then preload players (don’t crash if one fails)
        await Promise.allSettled([
          ensureSfx(),
          ensureSelect(),
          ensureDeselect(),
          ensureMusic(),
        ]);
      } catch (e) {
        console.warn('[Audio] init failed (audio mode / preload)', e);
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
      unloadAll();
    };
  }, [ensureSfx, ensureSelect, ensureDeselect, ensureMusic, unloadAll, loadPersistedSettingsIntoState, musicMuted, sfxMuted, musicVolume, sfxVolume]);

  // ---- Autostart heti kun ready → true
  useEffect(() => {
    if (!ready) return;
    (async () => {
      await ensureMusic();
      if (!musicMuted) {
        musicSound.current?.play?.();
      }
    })();
  }, [ready, ensureMusic, musicMuted]);

  // ---- Actions
  const playMusic = useCallback(async (fadeIn = false) => {
    if (musicMuted || !ready) {
      // console.log('[Audio] playMusic skipped (muted or not ready)', { musicMuted, ready });
      return;
    }
    await ensureMusic();
    const player = musicSound.current;
    if (!player) return;

    if (fadeIn) {
      player.volume = 0;
      player.loop = true;
      player.muted = false;
      player.play();
      const target = musicVolume;
      let v = 0;
      const step = 0.04;
      while (v < target) {
        v = Math.min(target, v + step);
        player.volume = v;
        await new Promise(r => setTimeout(r, 60));
      }
    } else {
      player.volume = musicVolume;
      player.loop = true;
      player.muted = false;
      player.play();
    }
  }, [musicMuted, ready, ensureMusic, musicVolume]);

  // Wrapper that sets state AND immediately applies the change to any loaded player.
  const setMusicMuted = useCallback((muted) => {
    setMusicMutedState(muted);
    (async () => {
      try {
        // console.log('[Audio] setMusicMuted called', { muted });
        // Ensure player exists before applying
        await ensureMusic();
        const p = musicSound.current;
        if (p) {
          // Try a silent warmup to prime the native audio pipeline so pause/play/muted take effect
          try {
            // temporarily ensure it's muted and volume 0 while we attempt a short play
            const prevMuted = p.muted ?? false;
            const prevVol = p.volume ?? 0;
            try { p.muted = true; } catch {}
            try { p.volume = 0; } catch {}
            try { await p.seekTo?.(0); } catch {}
            try { const r = p.play?.(); if (r && typeof r.then === 'function') await r; } catch {}
            // short delay to allow native init
            await new Promise(r => setTimeout(r, 60));
            try { p.pause?.(); } catch {}
            // restore previous values (we'll apply final muted below)
            try { p.volume = prevVol; } catch {}
            try { p.muted = prevMuted; } catch {}
          } catch (e) {
            /* best effort */
          }
          // Apply change and retry multiple times in case native init is still settling.
          // Some devices/app states only accept pause/play after the native bridge finishes setup,
          // so we attempt the change several times with small backoff.
          const applyOnce = async () => {
            try {
              p.muted = muted;
              p.volume = muted ? 0 : musicVolume;
              if (muted) await p.pause?.(); else await p.play?.();
            } catch (e) { /* best effort */ }
          };

          // immediate
          await applyOnce();
          // schedule several retries to robustly catch late native readiness
          const retries = [120, 300, 600, 1000];
          for (const d of retries) {
            setTimeout(() => { applyOnce(); }, d);
          }
        }
      } catch (e) {
        console.warn('[Audio] setMusicMuted apply failed', e);
      }
    })();
  }, [musicVolume]);

  const stopMusic = useCallback(async () => {
    try { musicSound.current?.pause?.(); } catch { }
  }, []);

  const playSelect = useCallback(async () => {
    if (sfxMuted) return;
    await ensureSelect();
    const p = selectSound.current;
    if (!p) return;
    try {
      await safePlay(p, { muted: sfxMuted, volume: sfxVolume });
    } catch (e) {
      console.warn('[Audio] playSelect failed', e);
    }
  }, [sfxMuted, sfxVolume, ensureSelect]);

  const playSfx = useCallback(async () => {
    if (sfxMuted) return;
    await ensureSfx();
    const p = sfxSound.current;
    if (!p) return;
    try {
      await safePlay(p, { muted: sfxMuted, volume: sfxVolume });
    } catch (e) {
      console.warn('[Audio] playSfx failed', e);
    }
  }, [sfxMuted, sfxVolume, ensureSfx]);

  const setSfxMuted = useCallback((muted) => {
    setSfxMutedState(muted);
    (async () => {
      try {
        // console.log('[Audio] setSfxMuted called', { muted });
        await ensureSfx();
        const v = muted ? 0 : sfxVolume;
        for (const p of [sfxSound.current, selectSound.current, deselectSound.current, diceTouchSound.current]) {
          if (p) {
            const applyOnce = () => {
              try { p.muted = muted; p.volume = v; } catch (e) { /* best effort */ }
            };
            // immediate
            applyOnce();
            // multiple retries to handle delayed native init
            const retries = [120, 300, 600];
            for (const d of retries) setTimeout(applyOnce, d);
          }
        }
      } catch (e) {
        console.warn('[Audio] setSfxMuted apply failed', e);
      }
    })();
  }, [sfxVolume]);

  const playDeselect = useCallback(async () => {
    if (sfxMuted) return;
    await ensureDeselect();
    const p = deselectSound.current;
    if (!p) return;
    try {
      await safePlay(p, { muted: sfxMuted, volume: sfxVolume });
    } catch { }
  }, [ensureDeselect, sfxMuted, sfxVolume]);

  // Prewarm small samples so the first press is instant (Android sometimes needs this)
  const prewarmSfx = useCallback(async () => {
    await Promise.allSettled([
      ensureSfx(), ensureSelect(), ensureDeselect(), ensureDiceTouch()
    ]);
    try {
      const warm = async (p) => {
        if (!p) return;
        const prevVol = p.volume ?? 1;
        const prevMuted = p.muted ?? false;
        // Make sure warming is silent for the user: mute and set volume to 0 while playing briefly
        try { p.muted = true; } catch {}
        try { p.volume = 0; } catch {}
        await p.seekTo(0);
  // Try to warm buffer without audible playback: just seek to start while muted.
  try { await p.seekTo?.(0); } catch {}
  // small delay to allow any native decode to start
  await new Promise(r => setTimeout(r, 40));
        // restore previous state (respect current global sfxMuted)
        try {
          if (p === diceTouchSound.current) {
            p.volume = sfxMuted ? 0 : (sfxVolume * DICE_TOUCH_FACTOR ?? prevVol);
          } else {
            p.volume = sfxMuted ? 0 : (sfxVolume ?? prevVol);
          }
        } catch {}
        try { p.muted = sfxMuted ? true : prevMuted; } catch {}
      };
      await warm(selectSound.current);
      await warm(diceTouchSound.current);
    } catch { }
  }, [ensureSfx, ensureSelect, ensureDeselect, ensureDiceTouch, sfxMuted, sfxVolume]);

  // ---- Persist & apply volumes/mutes

  // MUSIC persist/apply
  useEffect(() => {
    if (!hydrated) return;
    const v = musicMuted ? 0 : musicVolume;

    if (musicSound.current) {
      musicSound.current.volume = v;
      musicSound.current.muted = musicMuted;

      if (musicMuted) {
        musicSound.current.pause?.();
      } else {
        musicSound.current.play?.();
      }
    }

    // console.log('[Audio] MUSIC persist/apply effect run', { musicMuted, musicVolume, ready, hydrated });

    SecureStore.setItemAsync(
      MUSIC_KEY,
      JSON.stringify({ volume: musicVolume, muted: musicMuted })
    ).catch(() => {});

  }, [musicMuted, musicVolume, ready, hydrated]);

  // SFX persist/apply
  useEffect(() => {
    if (!hydrated) return;
    const v = sfxMuted ? 0 : sfxVolume;

    for (const p of [sfxSound.current, selectSound.current, deselectSound.current, diceTouchSound.current]) {
      if (p) {
        // Apply per-sound multiplier for dice touch
        if (p === diceTouchSound.current) p.volume = sfxMuted ? 0 : (sfxVolume * DICE_TOUCH_FACTOR);
        else p.volume = v;
        p.muted = sfxMuted;
      }
    }

    SecureStore.setItemAsync(
      SFX_KEY,
      JSON.stringify({ volume: sfxVolume, muted: sfxMuted })
    ).catch(() => {});

  }, [sfxMuted, sfxVolume, hydrated]);

  const playDiceTouch = useCallback(async () => {
    if (sfxMuted) return;
    await ensureDiceTouch();
    const p = diceTouchSound.current;
    if (!p) return;
    try {
      await safePlay(p, { muted: sfxMuted, volume: sfxVolume });
    } catch { }
  }, [sfxMuted, sfxVolume, ensureDiceTouch]);

  // Helper: try to play a player with small retries to handle races where player isn't immediately ready
  const safePlay = useCallback(async (player, { muted = false, volume = 1 } = {}) => {
    const maxAttempts = 4;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    let lastErr = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        try { player.muted = muted; } catch {}
        try { player.volume = muted ? 0 : volume; } catch {}
        try { await player.seekTo?.(0); } catch {}
        // play may be sync or promise-based
        const res = player.play?.();
        if (res && typeof res.then === 'function') await res;
        return;
      } catch (e) {
        lastErr = e;
        // small backoff
        await delay(40 + attempt * 20);
        // attempt to re-init player if possible
        try { await ensureSfx(); } catch {}
      }
    }
    throw lastErr;
  }, [ensureSfx]);

  const value = {
    // state
    ready,
    musicMuted, setMusicMuted,
    sfxMuted, setSfxMuted,
    musicVolume, setMusicVolume,
    sfxVolume, setSfxVolume,
    // actions
    playMusic, stopMusic,
    playSfx, playSelect, playDeselect,
    prewarmSfx, playDiceTouch,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

// ---- Legacy default export (no-ops). Prefer: const {playSelect} = useAudio()
const legacy = {
  playSfx: async () => { }, playSelect: async () => { }, playDeselect: async () => { },
  playMusic: async () => { }, stopMusic: async () => { },
  setMusicMuted: () => { }, setSfxMuted: () => { },
};
export default legacy;
