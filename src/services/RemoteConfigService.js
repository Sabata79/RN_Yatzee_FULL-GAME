/**
 * RemoteConfigService - Utility for fetching and handling remote config values.
 *
 * JSDoc comments and inline code comments must always be in English.
 * This file provides functions for fetching and using remote config from Firebase.
 * @module RemoteConfigService
 * @author Sabata79
 * @since 2025-08-29
 */
import {
  rcSetSettings,
  rcSetDefaults,
  rcFetchAndActivate,
  rcGet,
  remoteConfig as getRemoteConfigHelper,
} from './Firebase';

/**
 * fetchRemoteConfig — use centralized Firebase helpers to fetch and activate remote config.
 * Uses project helpers in `src/services/Firebase.js` (rcSetSettings, rcSetDefaults, rcFetchAndActivate, rcGet)
 */
export const fetchRemoteConfig = async () => {
  try {
    // Prefer centralized helpers (they call the native API internally)
    // 1) settings (minimum fetch interval)
    try {
      await rcSetSettings({
        minimumFetchIntervalMillis: __DEV__ ? 0 : 6 * 60 * 60 * 1000, // 6 hours
      });
    } catch (e) {
      console.warn('[RC] rcSetSettings failed (non-fatal)', e?.message || e);
    }

    // 2) defaults
    try {
      await rcSetDefaults({
        forceUpdate: false,
        force_update: false,
        minimum_supported_version: '1.0.0',
        update_message: 'Päivitys vaaditaan jatkaaksesi käyttöä.',
      });
    } catch (e) {
      console.warn('[RC] rcSetDefaults failed (non-fatal)', e?.message || e);
    }

    // 3) fetch and activate
    try {
      await rcFetchAndActivate();
    } catch (e) {
      console.error('[RC] rcFetchAndActivate failed', e);
      // continue: we still attempt to read values (maybe defaults present)
    }

    // 4) read values (use helper rcGet that wraps getValue(getRemoteConfig(), key))
    let forceSnake = false;
    let forceCamel = false;
    let minimum_supported_version = '1.0.0';
    let update_message = 'Päivitys vaaditaan jatkaaksesi käyttöä.';
  let release_notes = '';

    try {
      const v1 = rcGet('force_update');
      if (v1 && typeof v1.asBoolean === 'function') forceSnake = v1.asBoolean();
    } catch (e) {
      console.warn('[RC] rcGet force_update failed', e?.message || e);
    }

    try {
      const v2 = rcGet('forceUpdate');
      if (v2 && typeof v2.asBoolean === 'function') forceCamel = v2.asBoolean();
    } catch (e) {
      console.warn('[RC] rcGet forceUpdate failed', e?.message || e);
    }

    try {
      const v3 = rcGet('minimum_supported_version');
      if (v3 && typeof v3.asString === 'function') minimum_supported_version = v3.asString();
    } catch (e) {
      console.warn('[RC] rcGet minimum_supported_version failed', e?.message || e);
    }

    try {
      const v4 = rcGet('update_message');
      if (v4 && typeof v4.asString === 'function') update_message = v4.asString();
    } catch (e) {
      console.warn('[RC] rcGet update_message failed', e?.message || e);
    }

    // release_notes (support snake or camel)
    try {
      const rn1 = rcGet('release_notes');
      if (rn1 && typeof rn1.asString === 'function') release_notes = rn1.asString();
    } catch (e) {
      console.warn('[RC] rcGet release_notes failed', e?.message || e);
    }
    try {
      const rn2 = rcGet('releaseNotes');
      if ((!release_notes || release_notes === '') && rn2 && typeof rn2.asString === 'function') release_notes = rn2.asString();
    } catch (e) {
      console.warn('[RC] rcGet releaseNotes failed', e?.message || e);
    }

    // (no update_url support - store link is fixed in app)

    const forceUpdate = !!forceSnake || !!forceCamel;

    // Debug log for visibility in device logs
    // console.log('[RC] values', { force_update: forceSnake, forceUpdate: forceCamel, minimum_supported_version, update_message });

    // Try to parse release_notes if it's a JSON array string
    let parsedReleaseNotes = release_notes;
    if (typeof release_notes === 'string') {
      const trimmed = release_notes.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) parsedReleaseNotes = parsed;
        } catch (e) {
          // ignore parse error, keep raw string
          console.warn('[RC] release_notes JSON parse failed', e?.message || e);
        }
      }
    }

  return { forceUpdate, minimum_supported_version, update_message, release_notes: parsedReleaseNotes };
  } catch (e) {
    console.error('[RC] fetchRemoteConfig failed (fatal)', e);
    return null;
  }
};

export default fetchRemoteConfig;
