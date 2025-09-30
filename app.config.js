/**
 * app.config.js — inject eas.json android.versionCode into runtime config
 * This ensures versionCode is available via Constants.expoConfig.extra.buildVersionCode
 * in both EAS builds and locally when eas.json is present.
 */
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  let buildVersionCode = '';
  try {
    const easPath = path.resolve(__dirname, 'eas.json');
    if (fs.existsSync(easPath)) {
      const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
      buildVersionCode = eas?.build?.production?.android?.versionCode ?? '';
    }
  } catch (e) {
    // ignore
  }

  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      buildVersionCode: buildVersionCode ? String(buildVersionCode) : (config.extra && config.extra.buildVersionCode ? config.extra.buildVersionCode : ''),
    },
    android: {
      ...(config.android || {}),
      versionCode: buildVersionCode ? Number(buildVersionCode) : (config.android ? config.android.versionCode : undefined),
    },
  };
};
