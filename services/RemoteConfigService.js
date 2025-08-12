// services/RemoteConfigService.js
import { getApp } from '@react-native-firebase/app';
import {
  getRemoteConfig,
  setDefaults,
  setConfigSettings,
  fetchAndActivate,
  getValue,
} from '@react-native-firebase/remote-config';

export const fetchRemoteConfig = async () => {
  try {
    const rc = getRemoteConfig(getApp());

    // Devissä hae aina tuoreet
    await setConfigSettings(rc, {
      minimumFetchIntervalMillis: __DEV__ ? 0 : 60 * 60 * 1000,
    });

    // Oletukset (samat avaimet kuin appissa)
    await setDefaults(rc, {
      forceUpdate: false,
      minimum_supported_version: '1.0.0',
      update_message: 'Päivitys vaaditaan jatkaaksesi käyttöä.',
    });

    // Hae ja aktivoi
    await fetchAndActivate(rc);

    return {
      forceUpdate: getValue(rc, 'forceUpdate').asBoolean(),
      minimum_supported_version: getValue(rc, 'minimum_supported_version').asString(),
      update_message: getValue(rc, 'update_message').asString(),
    };
  } catch (e) {
    console.error('[RC] fetchRemoteConfig failed', e);
    return null;
  }
};

// Eksporaa myös defaultina -> toimii riippumatta import-tyylistä
export default fetchRemoteConfig;
