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

// --- Persist keys
const SFX_KEY = 'sfx_settings';
const MUSIC_KEY = 'music_settings';

// --- Assets
const SFX_PATH = require('../../assets/sounds/dice-sound.mp3');
const MUSIC_PATH = require('../../assets/sounds/ambientBG.mp3');
const SELECT_PATH = require('../../assets/sounds/select.mp3');
const DESELECT_PATH = require('../../assets/sounds/deselect.mp3');

// --- Context
export const AudioContext = createContext(null);

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    // Turvalliset no-opit jos hookkia käytetään providerin ulkopuolella
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
    };
  }
  return ctx;
};

export function AudioProvider({ children }) {
  // --- State
  const [ready, setReady] = useState(false);

  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.05); // 0..1
  const [sfxVolume, setSfxVolume] = useState(0.5);      // 0..1

  // --- Refs for loaded sounds
  const musicSound = useRef(null);
  const sfxSound = useRef(null);
  const selectSound = useRef(null);
  const deselectSound = useRef(null);

  // --- Helpers to (lazy) load each sound
  const ensureMusic = useCallback(async () => {
    if (musicSound.current) return;
    const { sound } = await Audio.Sound.createAsync(
      MUSIC_PATH,
      { isLooping: true, volume: musicMuted ? 0 : musicVolume }
    );
    musicSound.current = sound;
    // console.log('[Audio] MUSIC loaded');
  }, [musicMuted, musicVolume]);

  const ensureSfx = useCallback(async () => {
    if (sfxSound.current) return;
    const { sound } = await Audio.Sound.createAsync(
      SFX_PATH, { volume: sfxMuted ? 0 : sfxVolume }
    );
    sfxSound.current = sound;
    // console.log('[Audio] SFX loaded');
  }, [sfxMuted, sfxVolume]);

  const ensureSelect = useCallback(async () => {
    if (selectSound.current) return;
    const { sound } = await Audio.Sound.createAsync(
      SELECT_PATH, { volume: sfxMuted ? 0 : sfxVolume }
    );
    selectSound.current = sound;
    // console.log('[Audio] SELECT loaded');
  }, [sfxMuted, sfxVolume]);

  const ensureDeselect = useCallback(async () => {
    if (deselectSound.current) return;
    const { sound } = await Audio.Sound.createAsync(
      DESELECT_PATH, { volume: sfxMuted ? 0 : sfxVolume }
    );
    deselectSound.current = sound;
    // console.log('[Audio] DESELECT loaded');
  }, [sfxMuted, sfxVolume]);

  const unloadAll = useCallback(() => {
    musicSound.current?.unloadAsync?.(); musicSound.current = null;
    sfxSound.current?.unloadAsync?.(); sfxSound.current = null;
    selectSound.current?.unloadAsync?.(); selectSound.current = null;
    deselectSound.current?.unloadAsync?.(); deselectSound.current = null;
  }, []);

  // --- Persisted settings → state
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
  }, []);

  // --- INIT: audio mode, persisted settings, preload (sisällä komponentin!)
useEffect(() => {
  let alive = true;
  (async () => {
    try {
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
          ? { interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false }
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
    } catch (e) {
      console.warn('[Audio] init failed (audio mode / preload)', e);
      if (alive) setReady(true);
    }
  })();

  return () => { alive = false; unloadAll(); };
  }, [ensureSfx, ensureSelect, ensureDeselect, ensureMusic, unloadAll, loadPersistedSettingsIntoState]);

  // --- Actions
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

  // AudioManager.js 
  const playSelect = useCallback(async () => {
    if (sfxMuted) return;
    await ensureSelect();
    const snd = selectSound.current;
    if (!snd) return;
    try {
      await snd.setStatusAsync({ volume: sfxMuted ? 0 : sfxVolume, positionMillis: 0 });
      await snd.stopAsync().catch(() => { });
      await Promise.resolve();
      await snd.replayAsync();
    } catch (e) {
    console.warn('[Audio] playSelect failed', e);
    }
  }, [sfxMuted, sfxVolume, ensureSelect]);

  const playSfx = useCallback(async () => {
    if (sfxMuted) return;
    await ensureSfx();
    const snd = sfxSound.current;
    try {
      await snd.stopAsync().catch(() => { });
      await snd.setStatusAsync({
        volume: sfxMuted ? 0 : sfxVolume,
        positionMillis: 0,
        shouldPlay: true,
      });
    } catch (e) {
      console.warn('[SFX] playSelect failed', e);
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

  const prewarmSfx = useCallback(async () => {
    await Promise.allSettled([ensureSfx(), ensureSelect(), ensureDeselect()]);
    try {
      const snd = selectSound.current;
      if (snd) {
        await snd.setStatusAsync({ volume: 0, positionMillis: 0, shouldPlay: true });
        await snd.stopAsync();
        await snd.setStatusAsync({ volume: sfxMuted ? 0 : sfxVolume });
      }
    } catch { }
  }, [ensureSfx, ensureSelect, ensureDeselect, sfxMuted, sfxVolume]);

  // --- Persist & apply volumes/mutes
  useEffect(() => {
    // MUSIC
    const v = musicMuted ? 0 : musicVolume;
    musicSound.current?.setStatusAsync?.({ volume: v });
    SecureStore.setItemAsync(MUSIC_KEY, JSON.stringify({ volume: musicVolume, muted: musicMuted })).catch(() => { });
    if (!musicMuted && ready) {
      musicSound.current?.getStatusAsync?.().then(st => {
        if (!st?.isPlaying) playMusic(false);
      }).catch(() => { });
    }
  }, [musicMuted, musicVolume, ready, playMusic]);

  useEffect(() => {
    // SFX
    const v = sfxMuted ? 0 : sfxVolume;
    sfxSound.current?.setStatusAsync?.({ volume: v });
    selectSound.current?.setStatusAsync?.({ volume: v });
    deselectSound.current?.setStatusAsync?.({ volume: v });
    SecureStore.setItemAsync(SFX_KEY, JSON.stringify({ volume: sfxVolume, muted: sfxMuted })).catch(() => { });
  }, [sfxMuted, sfxVolume]);

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
    prewarmSfx,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

//Optional: export if some old imports exist'
const legacy = {
  playSfx: async () => { }, playSelect: async () => { }, playDeselect: async () => { },
  playMusic: async () => { }, stopMusic: async () => { },
  setMusicMuted: () => { }, setSfxMuted: () => { },
};
export default legacy;
