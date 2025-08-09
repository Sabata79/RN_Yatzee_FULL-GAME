import remoteConfig from '@react-native-firebase/remote-config';

export const initRemoteConfig = async () => {
  try {
    // Aseta oletusarvot
    await remoteConfig().setDefaults({
      forceUpdate: false,
      minVersion: '1.0.0',
      updateMessage: 'Päivitys vaaditaan jatkaaksesi käyttöä.',
    });

    // Hae ja aktivoi konfiguraatio Firebase-palvelimelta
    await remoteConfig().fetchAndActivate();

    // Palauta käytössä oleva konfiguraatio (valinnainen)
    const config = {
      forceUpdate: remoteConfig().getValue('forceUpdate').asBoolean(),
      minVersion: remoteConfig().getValue('minVersion').asString(),
      updateMessage: remoteConfig().getValue('updateMessage').asString(),
    };

    return config;
  } catch (error) {
    console.error('Remote Config lataus epäonnistui:', error);
    return null;
  }
};
