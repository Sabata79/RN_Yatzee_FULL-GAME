---
mode: edit
---

# React Native Lite Rules (Revised)

## Language
- Kaikki vastaukset suomeksi.
- JSDoc- ja inline-kommentit aina englanniksi.

## Workflow
1) **ANALYZE** — Lue koko tiedosto läpi. Tiivistä mitä se tekee.
2) **PLAN** — Ehdota vain minimimuutokset, modulaarisesti.
3) **PATCH** — Tee muutokset (ei duplikaatteja, JSDoc englanniksi).
4) **POST-CHECK** — Varmista syntaksi: importit, JSX, hookit, RN-yhteensopivuus.

## Editing (Global)
- **NEVER** lisää mitään importtien yläpuolelle. Ei otsikoita, ei irrallisia kommentteja, ei tekstiä.
- Ei duplikaatti-importteja, -funktioita, -tyylejä tai -exportteja.
- Säilytä olemassa oleva JSX/return ellei nimenomaisesti pyydetä muuttamaan.
- Lopputuloksen on käännyttävä (ei puuttuvia importteja, ei sulkeita, ei virheellisiä exportteja).

## Style
- Uudet tyylit `StyleSheet.create` sisään. Vältä inline-tyylejä ellei pakko.
- Yhdistä toistuvat tyylit `commonStyles.js`:ään, jos järkevää.

## Stylesheets — HARD RULES
- Tämä lohko koskee tiedostoja, joiden nimi päättyy `*Styles.js` tai `*.styles.js`.
- **Import Order**: Tiedoston **ensimmäinen** rivi on aina `import`-lause. Ei mitään ennen sitä.
- **Required Imports**: Jos käytät `StyleSheet`, varmista `import { StyleSheet } from 'react-native'`.
- **One Export Policy**: Täsmälleen **yksi** `StyleSheet.create({...})` ja **yksi** `export default styles;`
- **Single Identifier**: `const styles = StyleSheet.create({...})` (älä käytä muita nimiä).
- **No Top Matter**: Ei ylimääräisiä stringejä, kommenttiblokkeja tai koodia ennen importteja.
- **No Extra Exports**: Ei nimettyjä exportteja tyylitiedostossa, vain `export default styles`.
- **No Duplicates**: Älä luo toista `StyleSheet.create`-lohkoa samaan tiedostoon.
- **Strict Object**: `StyleSheet.create` saa sisältää vain puhtaan objektin (ei funktioita tai kutsuja siellä sisällä).

## Stylesheet Template (must follow exactly)
```js
// JSDoc: Styles for <ComponentName>
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  /* add or modify styles here */
});

export default styles;
                                                                                                        