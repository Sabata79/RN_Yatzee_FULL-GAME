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
import { Audio } from 'expo-av';
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

  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.05); // 0..1
  const [sfxVolume, setSfxVolume] = useState(0.5);      // 0..1

  // ---- Refs for loaded sounds
  const musicSound = useRef(null);
  const sfxSound = useRef(null);
  const selectSound = useRef(null);
  const deselectSound = useRef(null);
  const diceTouchSound = useRef(null);

  // ---- Helpers to (lazy) load each sound
  const ensureMusic = useCallback(async () => {
    if (musicSound.current) return;
    const { sound } = await Audio.Sound.createAsync(
      MUSIC_PATH,
      { isLooping: true, volume: musicMuted ? 0 : musicVolume }
    );
    musicSound.current = sound;
    console.log('[Audio] MUSIC loaded');
  }, [musicMuted, musicVolume]);

  const ensureSfx = useCallback(async () => {
    if (sfxSound.current) return;
    const { sound } = await Audio.Sound.createAsync(
      SFX_PATH,
      { volume: sfxMuted ? 0 : sfxVolume }
    );
    sfxSound.current = sound;
    console.log('[Audio] SFX loaded');
  }, [sfxMuted, sfxVolume]);

  const ensureSelect = useCallback(async () => {
    if (selectSound.current) return;
    const { sound } = await Audio.Sound.createAsync(
      SELECT_PATH,
      { volume: sfxMuted ? 0 : sfxVolume }
    );
    selectSound.current = sound;
    console.log('[Audio] SELECT loaded');
  }, [sfxMuted, sfxVolume]);

  const ensureDeselect = useCallback(async () => {
    if (deselectSound.current) return;
    const { sound } = await Audio.Sound.createAsync(
      DESELECT_PATH,
      { volume: sfxMuted ? 0 : sfxVolume }
    );
    deselectSound.current = sound;
    console.log('[Audio] DESELECT loaded');
  }, [sfxMuted, sfxVolume]);

  const ensureDiceTouch = useCallback(async () => {
    if (diceTouchSound.current) return;
    const { sound } = await Audio.Sound.createAsync(
      DICE_TOUCH_PATH,
      { volume: sfxMuted ? 0 : sfxVolume }
    );
    diceTouchSound.current = sound;
    console.log('[Audio] DICE_TOUCH loaded');
  }, [sfxMuted, sfxVolume]);

  const unloadAll = useCallback(() => {
    musicSound.current?.unloadAsync?.(); musicSound.current = null;
    sfxSound.current?.unloadAsync?.(); sfxSound.current = null;
    selectSound.current?.unloadAsync?.(); selectSound.current = null;
    deselectSound.current?.unloadAsync?.(); deselectSound.current = null;
    diceTouchSound.current?.unloadAsync?.(); diceTouchSound.current = null;
  }, []);

  // ---- Persisted settings → state
  const loadPersistedSettingsIntoState = useCallback(async () => {
    try {
      const sfx = await SecureStore.getItemAsync(SFX_KEY);
      if (sfx) {
        const { volume, muted } = JSON.parse(sfx);
        if (typeof volume === 'number') setSfxVolume(volume);
        if (typeof muted === 'boolean') setSfxMuted(muted);
      }
    } catch { }
    try {
      const music = await SecureStore.getItemAsync(MUSIC_KEY);
      if (music) {
        const { volume, muted } = JSON.parse(music);
        if (typeof volume === 'number') setMusicVolume(Math.round(volume * 10) / 10);
        if (typeof muted === 'boolean') setMusicMuted(muted);
      }
    } catch { }
    finally {
      setHydrated(true); // <— mark settings as loaded
    }
  }, []);

  // ---- INIT: audio mode, persisted settings, preload (run once)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Safe audio mode (fall back if constants not available)
        const hasIosConst =
          typeof Audio?.INTERRUPTION_MODE_IOS_DO_NOT_MIX === 'number' ||
          typeof Audio?.INTERRUPTION_MODE_IOS_DUCK_OTHERS === 'number';
        const hasAndroidConst =
          typeof Audio?.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX === 'number' ||
          typeof Audio?.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS === 'number';

        const fullMode = {
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          ...(Platform.OS === 'ios' && hasIosConst
            ? { interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX }
            : {}),
          ...(Platform.OS === 'android' && hasAndroidConst
            ? {
              interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
            }
            : {}),
        };

        try {
          await Audio.setAudioModeAsync(fullMode);
        } catch (e) {
          console.warn('[Audio] setAudioModeAsync(full) failed, fallback:', e?.message || e);
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
          });
          console.log('[Audio] setAudioModeAsync (fallback) OK');
        }

        // 1) Load persisted settings FIRST
        await loadPersistedSettingsIntoState();
        console.log('[Audio] loaded settings (hydrated)', {
          musicMutedAfterLoad: musicMuted,
          sfxMutedAfterLoad: sfxMuted,
          musicVolumeAfterLoad: musicVolume,
          sfxVolumeAfterLoad: sfxVolume,
        });

        // 2) Then preload sounds (don’t crash if one fails)
        await Promise.allSettled([
          ensureSfx(),
          ensureSelect(),
          ensureDeselect(),
          ensureMusic(),
        ]);
      } catch (e) {
        console.warn('[Audio] init failed (audio mode / preload)', e);
      } finally {
        // 3) Only now mark the audio system as ready
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
      unloadAll();
    };
    // Keep these deps so the effect sees the correct functions,
    // but it still runs only once at mount time.
  }, [ensureSfx, ensureSelect, ensureDeselect, ensureMusic, unloadAll, loadPersistedSettingsIntoState]);


  // ---- Actions
  const playMusic = useCallback(async (fadeIn = false) => {
    if (musicMuted || !ready) {
      console.log('[Audio] playMusic skipped (muted or not ready)', { musicMuted, ready });
      return;
    }
    await ensureMusic();
    const sound = musicSound.current;
    if (!sound) return;

    if (fadeIn) {
      await sound.setStatusAsync({ volume: 0, isLooping: true });
      await sound.playAsync();
      const target = musicVolume;
      let v = 0;
      while (v < target) {
        v = Math.min(target, v + 0.04);
        await sound.setStatusAsync({ volume: v });
        await new Promise(r => setTimeout(r, 60));
      }
    } else {
      await sound.setStatusAsync({ volume: musicVolume, isLooping: true });
      await sound.playAsync();
    }
  }, [musicMuted, ready, ensureMusic, musicVolume]);

  const stopMusic = useCallback(async () => {
    try { await musicSound.current?.stopAsync?.(); } catch { }
  }, []);

  const playSelect = useCallback(async () => {
    if (sfxMuted) return;
    await ensureSelect();
    const snd = selectSound.current;
    if (!snd) return;
    try {
      // Make sure it always starts from the beginning
      await snd.stopAsync().catch(() => { });
      await snd.setStatusAsync({
        volume: sfxMuted ? 0 : sfxVolume,
        positionMillis: 0,
        shouldPlay: true,
      });
    } catch (e) {
      console.warn('[Audio] playSelect failed', e);
    }
  }, [sfxMuted, sfxVolume, ensureSelect]);

  const playSfx = useCallback(async () => {
    if (sfxMuted) return;
    await ensureSfx();
    const snd = sfxSound.current;
    if (!snd) return;
    try {
      await snd.stopAsync().catch(() => { });
      await snd.setStatusAsync({
        volume: sfxMuted ? 0 : sfxVolume,
        positionMillis: 0,
        shouldPlay: true,
      });
    } catch (e) {
      console.warn('[Audio] playSfx failed', e);
    }
  }, [sfxMuted, sfxVolume, ensureSfx]);

  const playDeselect = useCallback(async () => {
    if (sfxMuted) return;
    await ensureDeselect();
    const sound = deselectSound.current;
    if (!sound) return;
    try {
      await sound.setStatusAsync({ volume: sfxVolume });
      await sound.replayAsync();
    } catch { }
  }, [ensureDeselect, sfxMuted, sfxVolume]);

  // Prewarm small samples so the first press is instant (Android sometimes needs this)
  const prewarmSfx = useCallback(async () => {
    await Promise.allSettled([
      ensureSfx(), ensureSelect(), ensureDeselect(), ensureDiceTouch()
    ]);
    try {
      const warm = async (snd) => {
        if (!snd) return;
        await snd.setStatusAsync({ volume: 0, positionMillis: 0, shouldPlay: true });
        await snd.stopAsync();
        await snd.setStatusAsync({ volume: sfxMuted ? 0 : sfxVolume });
      };
      await warm(selectSound.current);
      await warm(diceTouchSound.current);
    } catch { }
  }, [ensureSfx, ensureSelect, ensureDeselect, ensureDiceTouch, sfxMuted, sfxVolume]);

  // ---- Persist & apply volumes/mutes

  // MUSIC persist/apply
  useEffect(() => {
    if (!hydrated) return;             // <— guard
    const v = musicMuted ? 0 : musicVolume;
    musicSound.current?.setStatusAsync?.({ volume: v });
    SecureStore.setItemAsync(MUSIC_KEY, JSON.stringify({ volume: musicVolume, muted: musicMuted }))
      .catch(() => { });
    if (!musicMuted && ready) {
      musicSound.current?.getStatusAsync?.().then(st => {
        if (!st?.isPlaying) playMusic(false);
      }).catch(() => { });
    }
  }, [musicMuted, musicVolume, ready, playMusic, hydrated]);

  // SFX persist/apply
  useEffect(() => {
    if (!hydrated) return;             // <— guard
    const v = sfxMuted ? 0 : sfxVolume;
    sfxSound.current?.setStatusAsync?.({ volume: v });
    selectSound.current?.setStatusAsync?.({ volume: v });
    deselectSound.current?.setStatusAsync?.({ volume: v });
    SecureStore.setItemAsync(SFX_KEY, JSON.stringify({ volume: sfxVolume, muted: sfxMuted }))
      .catch(() => { });
  }, [sfxMuted, sfxVolume, hydrated]);

  const playDiceTouch = useCallback(async () => {
    if (sfxMuted) return;
    await ensureDiceTouch();
    const snd = diceTouchSound.current;
    if (!snd) return;
    try {
      // always restart from the beginning
      await snd.stopAsync().catch(() => { });
      await snd.setStatusAsync({
        volume: sfxMuted ? 0 : sfxVolume,
        positionMillis: 0,
        shouldPlay: true,
      });
    } catch { }
  }, [sfxMuted, sfxVolume, ensureDiceTouch]);

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
