import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';

const SFX_KEY = 'sfx_settings';
const MUSIC_KEY = 'music_settings';


const SFX_PATH = require('../../assets/sounds/dice-sound.mp3');
const MUSIC_PATH = require('../../assets/sounds/ambientBG.mp3');
const SELECT_PATH = require('../../assets/sounds/select.mp3');
const DESELECT_PATH = require('../../assets/sounds/deselect.mp3');



class AudioManager {
  sfxSound = null;
  selectSound = null;
  deselectSound = null;
  musicSound = null;
  sfxVolume = 0.7;
  musicVolume = 0.05;
  sfxMuted = false;
  musicMuted = false;
  musicLoaded = false;
  sfxLoaded = false;
  selectLoaded = false;
  deselectLoaded = false;


  // --- INIT & SETTINGS ---
  async loadSettings() {
    try {
      const sfx = await SecureStore.getItemAsync(SFX_KEY);
      const music = await SecureStore.getItemAsync(MUSIC_KEY);
      if (sfx) {
        const { volume, muted } = JSON.parse(sfx);
        this.sfxVolume = volume;
        this.sfxMuted = muted;
      }
      if (music) {
        const { volume, muted } = JSON.parse(music);
        this.musicVolume = volume;
        this.musicMuted = muted;
      }
    } catch (e) {
      // Defaults if error
    }
    // Lataa SFX-äänet valmiiksi muistiin
    if (!this.sfxLoaded) {
      try {
        const { sound } = await Audio.Sound.createAsync(SFX_PATH, { volume: this.sfxVolume });
        this.sfxSound = sound;
        this.sfxLoaded = true;
      } catch (e) {
        this.sfxLoaded = false;
      }
    }
    if (!this.selectLoaded) {
      try {
        const { sound } = await Audio.Sound.createAsync(SELECT_PATH, { volume: this.sfxVolume });
        this.selectSound = sound;
        this.selectLoaded = true;
      } catch (e) {
        this.selectLoaded = false;
      }
    }
    if (!this.deselectLoaded) {
      try {
        const { sound } = await Audio.Sound.createAsync(DESELECT_PATH, { volume: this.sfxVolume });
        this.deselectSound = sound;
        this.deselectLoaded = true;
      } catch (e) {
        this.deselectLoaded = false;
      }
    }
  }
  async playSelect() {
    if (this.sfxMuted) return;
    try {
      if (!this.selectSound) {
        const { sound } = await Audio.Sound.createAsync(SELECT_PATH, { volume: this.sfxVolume });
        this.selectSound = sound;
        this.selectLoaded = true;
      }
      await this.selectSound.setStatusAsync({ volume: this.sfxVolume });
      await this.selectSound.replayAsync();
    } catch (e) {
      this.selectSound = null;
      this.selectLoaded = false;
    }
  }
  async playDeselect() {
    if (this.sfxMuted) return;
    try {
      if (!this.deselectSound) {
        const { sound } = await Audio.Sound.createAsync(DESELECT_PATH, { volume: this.sfxVolume });
        this.deselectSound = sound;
        this.deselectLoaded = true;
      }
      await this.deselectSound.setStatusAsync({ volume: this.sfxVolume });
      await this.deselectSound.replayAsync();
    } catch (e) {
      this.deselectSound = null;
      this.deselectLoaded = false;
    }
  }

  async saveSfxSettings() {
    await SecureStore.setItemAsync(SFX_KEY, JSON.stringify({ volume: this.sfxVolume, muted: this.sfxMuted }));
  }
  async saveMusicSettings() {
    await SecureStore.setItemAsync(MUSIC_KEY, JSON.stringify({ volume: this.musicVolume, muted: this.musicMuted }));
  }

  // --- SFX ---
  async playSfx() {
    if (this.sfxMuted) return;
    try {
      if (!this.sfxSound) {
        // Jos preload epäonnistui, ladataan tässä
        const { sound } = await Audio.Sound.createAsync(SFX_PATH, { volume: this.sfxVolume });
        this.sfxSound = sound;
        this.sfxLoaded = true;
      }
      await this.sfxSound.setStatusAsync({ volume: this.sfxVolume });
      await this.sfxSound.replayAsync();
    } catch (e) {
      // Jos jotain menee pieleen, yritetään ladata seuraavalla kerralla uudestaan
      this.sfxSound = null;
      this.sfxLoaded = false;
    }
  }
  setSfxVolume(volume) {
    this.sfxVolume = volume;
    if (this.sfxSound) this.sfxSound.setStatusAsync({ volume });
    this.saveSfxSettings();
  }
  setSfxMuted(muted) {
    this.sfxMuted = muted;
    this.saveSfxSettings();
  }

  // --- MUSIC ---
  async playMusic(fadeIn = false) {
    if (this.musicMuted) return;
    if (!this.musicSound) {
      const { sound } = await Audio.Sound.createAsync(MUSIC_PATH, { isLooping: true, volume: 0 });
      this.musicSound = sound;
      this.musicLoaded = true;
    }
    if (fadeIn) {
      await this.musicSound.setStatusAsync({ volume: 0 });
      await this.musicSound.playAsync();
      for (let v = 0; v <= this.musicVolume; v += 0.05) {
        await this.musicSound.setStatusAsync({ volume: v });
        await new Promise(res => setTimeout(res, 60));
      }
      await this.musicSound.setStatusAsync({ volume: this.musicVolume });
    } else {
      await this.musicSound.setStatusAsync({ volume: this.musicVolume });
      await this.musicSound.playAsync();
    }
  }
  async stopMusic() {
    if (this.musicSound) {
      await this.musicSound.stopAsync();
    }
  }
  setMusicVolume(volume) {
    this.musicVolume = volume;
    if (this.musicSound) this.musicSound.setStatusAsync({ volume });
    this.saveMusicSettings();
    // Älä toista musiikkia tässä, vain volume päivitys!
  }
  setMusicMuted(muted) {
    this.musicMuted = muted;
    if (this.musicSound) this.musicSound.setStatusAsync({ volume: muted ? 0 : this.musicVolume });
    this.saveMusicSettings();
  }
}

const audioManager = new AudioManager();
export default audioManager;
