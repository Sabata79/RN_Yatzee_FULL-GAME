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

    await setConfigSettings(rc, {
      // minimumFetchIntervalMillis: __DEV__ ? 0 : 60 * 60 * 1000, // 1 hour
      minimumFetchIntervalMillis: __DEV__ ? 0 : 6 * 60 * 60 * 1000, // 6 hours
    });

    // Anna oletus molemmille nimille
    await setDefaults(rc, {
      forceUpdate: false,
      force_update: false,
      minimum_supported_version: '1.0.0',
      update_message: 'Päivitys vaaditaan jatkaaksesi käyttöä.',
    });

    await fetchAndActivate(rc);

    // Lue molemmat, snake voittaa jos olemassa
    const forceSnake = getValue(rc, 'force_update').asBoolean();
    const forceCamel = getValue(rc, 'forceUpdate').asBoolean();
    const forceUpdate = forceSnake || forceCamel;

    const minimum_supported_version = getValue(rc, 'minimum_supported_version').asString();
    const update_message = getValue(rc, 'update_message').asString();

    // Debug-loki auttaa varmistamaan mitä avainta käytettiin
    console.log('[RC] raw', {
      force_update: forceSnake,
      forceUpdate: forceCamel,
      minimum_supported_version,
      update_message,
    });

    return { forceUpdate, minimum_supported_version, update_message };
  } catch (e) {
    console.error('[RC] fetchRemoteConfig failed', e);
    return null;
  }
};

export default fetchRemoteConfig;
