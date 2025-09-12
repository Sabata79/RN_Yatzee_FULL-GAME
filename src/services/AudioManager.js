/**
 * AudioManager.js
 *
 * Modern audio manager for React Native using Expo AV.
 * - Provides context and hooks for audio playback
 * - Supports sound effects (SFX) and background music
 * - Manages audio settings (mute, volume) with SecureStore
 *
 * Usage:
 *   import { AudioProvider, useAudio } from './AudioManager';
 *   ...
 *   <AudioProvider>
 *     <YourComponent />
 *   </AudioProvider>
 *
 * @module services/AudioManager
 * @author Sabata79
 * @since 2025-09-06
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';

const loadLocks = {
  sfx: null,
  select: null,
  deselect: null,
  music: null,
};

// ---- SecureStore keys ----
const SFX_KEY = 'sfx_settings';
const MUSIC_KEY = 'music_settings';

// ---- Assets ----
const PATHS = {
  sfx: require('../../assets/sounds/dice-sound.mp3'),
  select: require('../../assets/sounds/select.mp3'),
  deselect: require('../../assets/sounds/deselect.mp3'),
  music: require('../../assets/sounds/ambientBG.mp3'),
};

// ---- Global singleton key for MUSIC ----
const MUSIC_SINGLETON_KEY = '__APP_MUSIC_SINGLETON__';

// ---- Context ----
export const AudioContext = createContext(undefined);

export function AudioProvider({ children }) {
  // Refs to Sound objects
  const sfxSound = useRef(null);
  const selectSound = useRef(null);
  const deselectSound = useRef(null);
  const musicSound = useRef(null);

  // Fade-in guard
  const playTokenRef = useRef(0);

  // State
  const [ready, setReady] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(0.5);   // 0..1
  const [musicVolume, setMusicVolume] = useState(0.05); // 0..1

  // -------- Loaders (hooks sisällä!) --------
  const ensureSfx = useCallback(async () => {
    if (sfxSound.current) return sfxSound.current;
    if (loadLocks.sfx) return loadLocks.sfx;
    loadLocks.sfx = Audio.Sound.createAsync(PATHS.sfx, { shouldPlay: false, volume: 0 })
      .then(({ sound }) => {
        sfxSound.current = sound;
        console.log('[Audio] SFX loaded');
        return sound;
      })
      .catch(e => { console.warn('[Audio] ensureSfx failed', e); return null; })
      .finally(() => { loadLocks.sfx = null; });
    return loadLocks.sfx;
  }, []);

  const ensureSelect = useCallback(async () => {
    if (selectSound.current) return selectSound.current;
    if (loadLocks.select) return loadLocks.select;
    loadLocks.select = Audio.Sound.createAsync(PATHS.select, { shouldPlay: false, volume: 0 })
      .then(({ sound }) => {
        selectSound.current = sound;
        console.log('[Audio] SELECT loaded');
        return sound;
      })
      .catch(e => { console.warn('[Audio] ensureSelect failed', e); return null; })
      .finally(() => { loadLocks.select = null; });
    return loadLocks.select;
  }, []);

  const ensureDeselect = useCallback(async () => {
    if (deselectSound.current) return deselectSound.current;
    if (loadLocks.deselect) return loadLocks.deselect;
    loadLocks.deselect = Audio.Sound.createAsync(PATHS.deselect, { shouldPlay: false, volume: 0 })
      .then(({ sound }) => {
        deselectSound.current = sound;
        console.log('[Audio] DESELECT loaded');
        return sound;
      })
      .catch(e => { console.warn('[Audio] ensureDeselect failed', e); return null; })
      .finally(() => { loadLocks.deselect = null; });
    return loadLocks.deselect;
  }, []);

  const ensureMusic = useCallback(async () => {
    // Jos meillä on jo paikallinen viite, käytä sitä
    if (musicSound.current) return musicSound.current;

    // Jos globaalissa singletonissa on jo soundi, ota se käyttöön
    const existing = globalThis[MUSIC_SINGLETON_KEY];
    if (existing && typeof existing.getStatusAsync === 'function') {
      musicSound.current = existing;
      return existing;
    }

    // Muuten lataa uusi ja rekisteröi se singletoniksi
    try {
      const { sound } = await Audio.Sound.createAsync(PATHS.music, {
        shouldPlay: false,
        isLooping: true,
        volume: 0,
      });
      musicSound.current = sound;
      globalThis[MUSIC_SINGLETON_KEY] = sound;
      console.log('[Audio] MUSIC loaded');
      return sound;
    } catch (e) {
      console.warn('[Audio] ensureMusic failed', e);
      return null;
    }
  }, []);

  // -------- INIT: audio-mode, settings, preload (kertaluontoinen) --------
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // Audio mode full → fallback
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
            interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
          console.log('[Audio] setAudioModeAsync (full) OK');
        } catch (e) {
          console.warn('[Audio] setAudioModeAsync(full) failed, fallback:', e?.message || e);
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
          console.log('[Audio] setAudioModeAsync (fallback) OK');
        }

        // Load saved settings
        try {
          const sfx = await SecureStore.getItemAsync(SFX_KEY);
          if (sfx) {
            const { volume, muted } = JSON.parse(sfx);
            if (typeof volume === 'number') setSfxVolume(volume);
            if (typeof muted === 'boolean') setSfxMuted(muted);
          }
        } catch (e) {
          console.warn('[Audio] load SFX settings failed', e);
        }
        try {
          const music = await SecureStore.getItemAsync(MUSIC_KEY);
          if (music) {
            const { volume, muted } = JSON.parse(music);
            if (typeof volume === 'number') setMusicVolume(Math.round(volume * 10) / 10);
            if (typeof muted === 'boolean') setMusicMuted(muted);
          }
        } catch (e) {
          console.warn('[Audio] load MUSIC settings failed', e);
        }

        // Preload all sounds (tolerant)
        const res = await Promise.allSettled([
          ensureSfx(), ensureSelect(), ensureDeselect(), ensureMusic(),
        ]);
        console.log('[Audio] preload results:', res.map(r => r.status));

        if (!active) return;
        setReady(true);
      } catch (e) {
        console.warn('[Audio] init failed', e);
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
      // Unload on provider unmount
      try { sfxSound.current?.unloadAsync?.(); } catch { }
      try { selectSound.current?.unloadAsync?.(); } catch { }
      try { deselectSound.current?.unloadAsync?.(); } catch { }
      try { musicSound.current?.unloadAsync?.(); } catch { }
      sfxSound.current = null;
      selectSound.current = null;
      deselectSound.current = null;
      musicSound.current = null;
      if (globalThis[MUSIC_SINGLETON_KEY]) {
        try { globalThis[MUSIC_SINGLETON_KEY]?.unloadAsync?.(); } catch { }
        globalThis[MUSIC_SINGLETON_KEY] = null;
      }
    };
  }, [ensureSfx, ensureSelect, ensureDeselect, ensureMusic]);

  // -------- Apply SFX volume/mute --------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s1, s2, s3] = await Promise.all([ensureSfx(), ensureSelect(), ensureDeselect()]);
      if (cancelled) return;
      const v = sfxMuted ? 0 : sfxVolume;
      try { await s1?.setStatusAsync?.({ volume: v }); } catch { }
      try { await s2?.setStatusAsync?.({ volume: v }); } catch { }
      try { await s3?.setStatusAsync?.({ volume: v }); } catch { }
      SecureStore.setItemAsync(SFX_KEY, JSON.stringify({ volume: sfxVolume, muted: sfxMuted })).catch(() => { });
    })();
    return () => { cancelled = true; };
  }, [sfxMuted, sfxVolume, ensureSfx, ensureSelect, ensureDeselect]);

  // -------- Apply MUSIC volume/mute (auto pause/resume) --------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const m = await ensureMusic();
      if (!m || cancelled) return;
      const v = musicMuted ? 0 : musicVolume;
      try { await m.setStatusAsync({ volume: v }); } catch { }
      try {
        const st = await m.getStatusAsync();
        if (musicMuted) {
          if (st.isPlaying) await m.pauseAsync();
        } else {
          if (!st.isPlaying) await m.playAsync(); // resume (ei aloita alusta)
        }
      } catch { }
      SecureStore.setItemAsync(MUSIC_KEY, JSON.stringify({ volume: musicVolume, muted: musicMuted })).catch(() => { });
    })();
    return () => { cancelled = true; };
  }, [musicMuted, musicVolume, ensureMusic]);

  // -------- Public API --------
  const playMusic = useCallback(async (fadeIn = false) => {
    if (musicMuted || !ready) {
      console.log('[Audio] playMusic skipped (muted/not ready)', { musicMuted, ready });
      return;
    }
    const m = await ensureMusic(); if (!m) return;

    const myToken = ++playTokenRef.current;
    if (fadeIn) {
      try { await m.setStatusAsync({ volume: 0 }); } catch { }
      try { await m.playAsync(); } catch { }
      const target = musicVolume;
      let v = 0;
      while (v < target && myToken === playTokenRef.current) {
        v = Math.min(target, +(v + 0.05).toFixed(2));
        try { await m.setStatusAsync({ volume: v }); } catch { }
        await new Promise(r => setTimeout(r, 60));
      }
      if (myToken !== playTokenRef.current) return;
    } else {
      try { await m.setStatusAsync({ volume: musicVolume }); } catch { }
      try { await m.playAsync(); } catch { }
    }
  }, [musicMuted, ready, musicVolume, ensureMusic]);

  const stopMusic = useCallback(async () => {
    const m = musicSound.current;
    if (!m) return;
    try { await m.stopAsync(); } catch { }
  }, []);

  const playOnce = useCallback(async (ensureFn) => {
    if (sfxMuted) return;
    const s = await ensureFn();
    if (!s) return;
    try {
      // resetoi ja soita varmasti
      await s.stopAsync().catch(() => { });
      await s.setPositionAsync(0).catch(() => { });
      await s.setStatusAsync({ volume: sfxVolume });
      await s.replayAsync(); // <— lyhyille SFX:ille kaikista varmin tapa
    } catch (e) {
      console.warn('[Audio] playOnce failed', e);
    }
  }, [sfxMuted, sfxVolume]);

  const playSfx = useCallback(async () => { await playOnce(ensureSfx); }, [playOnce, ensureSfx]);
  const playSelect = useCallback(async () => { await playOnce(ensureSelect); }, [playOnce, ensureSelect]);
  const playDeselect = useCallback(async () => { await playOnce(ensureDeselect); }, [playOnce, ensureDeselect]);

  // Prewarm: lataa SELECT-ääni ja "käynnistä-hiljaa-seis" → dekoodaus valmis
  const prewarmSfx = useCallback(async () => {
    const s = await ensureSelect();
    if (!s) return;
    try {
      await s.setStatusAsync({ volume: 0 });
      await s.replayAsync();             // käynnistyy äänettömänä
      await s.stopAsync().catch(() => { });
      await s.setStatusAsync({ volume: sfxVolume }); // palauta oikea vola
    } catch (e) {
      // ei haittaa jos epäonnistuu – yritetään vasta painalluksessa
    }
  }, [ensureSelect, sfxVolume]);

  const value = {
    // state
    ready,
    sfxMuted, setSfxMuted,
    musicMuted, setMusicMuted,
    sfxVolume, setSfxVolume,
    musicVolume, setMusicVolume,
    // actions
    playMusic,
    stopMusic,
    playSfx,
    playSelect,
    playDeselect,
    prewarmSfx,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

// ---- Hook (käytä vain komponentissa) ----
export function useAudio() {
  return useContext(AudioContext);
}

// ---- Legacy-safe default export: no-ops (ettei vanhat importit kaada appia) ----
const legacyAudioManager = {
  async playSfx() { },
  async playSelect() { },
  async playDeselect() { },
  async playMusic() { },
  async stopMusic() { },
  setMusicMuted() { },
  setSfxMuted() { },
  setSfxVolume() { },
  setMusicVolume() { },
};
export default legacyAudioManager;
