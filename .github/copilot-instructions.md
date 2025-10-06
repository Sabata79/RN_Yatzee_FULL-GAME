# AI Working Agreement — Yatzy (React Native / Expo)

> Tämä dokumentti ohjaa tekoälyavustajaa (Copilot/Chat) työskentelemään tämän repositorion kanssa johdonmukaisesti ja turvallisesti.

## 🔤 Kieli

* **Kaikki keskusteluvastaukset: suomeksi, aina.**
* **Kaikki koodi, tunnisteet, tiedostonimet, JSDoc ja inline-kommentit: englanniksi.**

## 🧭 Nopea orientaatio

Tämä on Expo‑pohjainen React Native ‑Android-sovellus (klassinen Yatzy).

* Pääkansiot: `src/components`, `src/screens`, `src/services`, `src/constants`, `src/styles`.
* **Assets** (kuvat/äänet) on tarkoituksella jätetty repositorion ulkopuolelle.
* Firebase Realtime Database käytössä. Expo SDK -ominaisuuksia (SecureStore, Audio, Navigation Bar) hyödynnetään.
* Moni läpileikkaava logiikka on pienissä helper-moduuleissa — **käytä niitä ensisijaisesti**.

### Arkkitehtuurin iso kuva

* **App entry:** `App.js` — lataa fontit, kokoaa providerit (`AudioProvider`, `ElapsedTimeProvider`, `GameProvider`) ja alustaa navigaation (stack + bottom tabs).
* **Globaali tila:** `src/constants/GameContext.js` — yksi `GameProvider`, jota käytetään `useGame()`-hookin kautta.
* **Audio:** `src/services/AudioManager.js` — `AudioProvider` + `useAudio()`; esilataa äänet, tallettaa asetukset `expo-secure-store`en.
* **Firebase-helperit:** `src/services/Firebase.js` — `dbGet`, `dbSet`, `dbOnValue`, `dbOff`. **Älä** tuo Firebase-APIa suoraan komponentteihin.
* **Energia/tokens:** `src/components/EnergyTokenSystem.js` — token‑regen, pysyväistallennus (AsyncStorage + Firebase), hyvät esimerkit timereista ja cross‑syncistä.

## 🧪 Työskentelyformaatti (aina sama)

1. **ANALYZE (suomeksi):** lyhyt kuvaus, mitä muokattava tiedosto tekee.
2. **PLAN (suomeksi):** 2–4 täsmäparannusta, miksi ne tehdään.
3. **PATCH (englanniksi koodi):** minimimuutos (diff/lohko) tai kokonainen funktio. **Ei** koko tiedostoa, ellei pyydetä.
4. **POST-CHECK (suomeksi):** tarkista importit/JSX/hook‑säännöt/RN‑yhteensopivuus.

## 🔒 Laajuus & rajaukset

* Tee **pieniä, paikallisia** muutoksia. Muokkaa vain välttämättömiä tiedostoja.
* **Älä** lisää riippuvuuksia tai native‑moduleita ilman nimenomaista pyyntöä.
* **Älä** koske `android/` Gradleen, allekirjoitukseen tai CI‑skripteihin, ellei tehtävä koske nimenomaan niitä.
* Assets puuttuvat: **älä** viittaa uusiin kuviin/ääniin ilman stubia/feature‑flägiä tai selkeää ohjetta lisäämiseksi.

## 📁 Tiedostokäytännöt

* Uudet tyylit `StyleSheet.create` — vältä inline‑tyylejä, ellei triviaalista.
* Käytä olemassa olevia helpereitä:

  * **Game state:** `useGame()` (`src/constants/GameContext.js`)
  * **Audio:** `useAudio()` (`src/services/AudioManager.js`)
  * **Firebase:** `dbGet`, `dbSet`, `dbOnValue`, `dbOff` (`src/services/Firebase.js`)
* **Kuuntelijat siivotaan:** tallenna `unsubscribe` ja palauta se `useEffect`-cleanupissa.
* **Platform guards:** säilytä `Platform.OS === 'android'` ‑haarat siellä missä niitä jo käytetään.

## 🎯 Sijoittaminen & uudelleenkäyttö (tärkeä)

* **Älä koskaan** liitä generoitua koodia sokkona tiedoston alkuun. Etsi ja kohdenna **tarkka sijoituspaikka**.
* **Noudata rakennetta:** imports → constants → hooks/effects → memoized callbacks → render/JSX → styles → exports.
* **Muokkaa olemassa olevaa** funktiota/lohkoa, jos mahdollista. **Uusi funktio** vain, jos mikään olemassa oleva ei loogisesti sovi.
* **Käytä aina olemassa olevia helper-/util‑funktioita** (Firebase, audio, tokenit). **Älä duplikoi** logiikkaa.
* Jos lisäfunktio on pakko tehdä: perustele se **PLAN‑kohdassa**, pidä funktio **pieni ja puhdas**, ja **sijoita lähelle käyttöä** (tiedoston sisään, ellei selvästi yleiskäyttöinen → silloin `src/services/` tai `src/utils/`).
* **Sijoitusprotokolla**

  1. **ANALYZE:** paikanna muokattava funktio/lohko ja kerro tarkka kohta (esim. *“ennen `return`‑lohkoa Gameboardissa”* tai *“styles‑objektiin, aakkosjärjestyksessä”*).
  2. **PLAN:** kuvaa **ankkuri** (*before/after* tietty rivi/funktio/avaimen paikka).
  3. **PATCH:** tee **kirurginen** muutos vain kyseiseen lohkoon (älä siirrä turhaan rivejä ympäriltä).
  4. **POST‑CHECK:** varmista, ettei importtien tai exporttien järjestys rikkoudu; ei uusia käyttämättömiä symboleja.
* **Valinnainen ankkurikommentti** kehittäjälle: lisää tarvittaessa kommentti sijoituksen helpottamiseksi

  ```js
  // AI:INSERT_BELOW(Gameboard:footer-render)
  ```

## 🔁 Tokenit & pysyvyys

* Token‑logiikka: `src/components/EnergyTokenSystem.js`.

  * `REGEN_INTERVAL = 1.6 * 60 * 60 * 1000` (1.6 h) — **kunnioita arvoa**.
  * Noudata hydrataatiolippuja (`hydratedRef` / `dataLoaded`) kilpajuoksujen välttämiseksi.
  * Pidä arvot rajattuna ennen kirjoituksia ja peilaa Firebaseen olemassa olevan kontekstivirran kautta.
* `AsyncStorage`‑avaimet: `'tokens'`, `'nextTokenTime'`.
* `SecureStore`‑avaimet: `'sfx_settings'` (SFX), `'music_settings'` (MUSIC).

## ⚙️ Suorituskyky & UX

* Vältä turhaa funktioiden uudelleenluontia: `useCallback` / `useMemo`.
* Listat: oikeat `key`-arvot, tarvittaessa `memo`/`getItemLayout`.
* **Älä** tuki UI\:ta raskaalla synkronisella työllä — pilko efekteihin tai erävaiheisiin.
* Pidä näkymät responsiivisina: käytä olemassa olevia koko‑apureita ja prosenttia/flexiä.

## 🧯 Virheenkäsittely & logitus

* Fail‑safe: **älä kaadu** puuttuviin assetteihin/Remote Configiin — käytä guardattuja no‑oppeja ja fallbackeja.
* Konsolilogit lyhyitä ja toimintaan ohjaavia; poista meluisat debug‑printit patchin lopussa.

## 🔌 Firebase‑kuviot

* **Read:**

```js
useEffect(() => {
  const handler = (snap) => {
    // Handle snapshot safely; guard against null/undefined
  };
  const unsub = dbOnValue(`players/${playerId}/avatar`, handler);
  return () => unsub();
}, [playerId]);
```

--

### Database layout note (presence)

Some presence info in this project may appear in two places in the Realtime DB:

- Top-level presence index: `/players/{playerId}/presence` — recommended for lightweight presence mapping.

Canonical presence object shape used in code:

```json
{ "online": true, "lastSeen": 1695499740000 }
```

Code should be prepared to read either location or to merge both (there's a small helper `src/services/Presence.js` to assist with this).


* **Write:** käytä helperiä atomisiin päivityksiin; **älä** kovakoodaa uusia polkuja.
* Älä vuoda avaimia/sekretejä. Ei admin‑rajapintoja clientistä.

## 🎨 Fontit, audio ja navigaatio

* Fontit ladataan `App.js`:ssä. Jos lisäät fontteja, päivitä juuri tämä lataaja.
* Audion tila asetetaan `AudioManagerissa` — **älä** initialisoi audiotilaa muualla.
* Säilytä navigaation perusrakenne (root stack + bottom tabs).

## 🧰 Kehittäjän työnkulut & komennot

* **Paikallisdev (Expo Metro):** `npm start` → `npx expo start --localhost --android`
* **Emulaattori/laite:** `npm run android` → `npx expo run:android`
* **Release APK (Windows):** `npm run build:android` — ajaa Gradlen `android/`‑hakemistossa ja kopioi APK\:n `release/Yatzee.apk`:iin (vaatii Android SDK\:n ja Java/Gradle‑ympäristön).
* **Engines:** Node `>= 20.19.4`, npm `>= 10.8.2` (ks. `package.json.engines`).

### AI commit- ja testauskäytännöt (pakollinen)

* AI MUST NOT run git add/commit/push or otherwise modify VCS state. The human reviewer will perform commits and pushes after they have inspected the proposed changes.
* After every substantive code edit the AI produces, it must run (locally) a short verification suite and report the results before asking the user to commit. The minimal verification steps are:
  1. Build/start sanity (fast smoke): start Metro or run a quick platform build (e.g. `npm start` or `npm run android` if available and fast).
  2. Lint / static checks: run eslint (or report that eslint is not configured) and fix obvious lint/type errors if trivial.
  3. Unit tests: run `jest` (if present) and report pass/fail output.
  4. Small runtime smoke: where feasible, verify that the edited screen/function mounts without throwing (e.g. unit/smoke run or a short manual emulator check).
* If any of these checks fail, AI must attempt up to 3 targeted fixes (only small, low-risk changes). If still failing, AI reports the exact failing output and a short remediation plan.
* The AI should include the exact commands it ran and the trimmed outputs in its reply so the human can reproduce them locally.

* Huom: Jos kehitystyö tapahtuu suoraan VSCode‑ympäristössä ja kehittäjä erikseen pyytää, AI ei välttämättä aja paikallisesti `eslint`- tai `jest`-komentoja, koska VSCode tarjoaa reaaliaikaisen syntaksin ja perusvirheiden tarkistuksen. Tämä on optio — CI, koodin omistaja tai review‑prosessi voi silti vaatia erillisen lintin/testien ajon ennen commitointia tai julkaisua.

## 📎 Pienet, konkreettiset palat

**Safe token update**

```js
setTokens((t) => Math.max(0, Math.min(MAX_TOKENS, t + 1)));
```

**Guarded provider usage**

```js
const { state, setState } = useGame(); // returns no-op defaults outside provider
const { playSelect } = useAudio();     // guard against undefined
```

**Styles**

```js
const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

## 🚫 Mitä EI pidä tehdä

* Älä oleta verkon/assettien saatavuutta.
* Älä tee laajaa arkkitehtuurirefaktorointia ilman pyyntöä.
* Älä lisää kirjastoja, natiivia koodia tai muokkaa Gradle/CI\:tä omatoimisesti.
* Älä jätä kuuntelijoita tai timereita eloon unmountissa.

---

## 🔧 copilot.instructions.md päivityskäytäntö

* **AI saa muokata tätä tiedostoa vain käyttäjän nimenomaisesta pyynnöstä.**
* Kun pyydät päivitystä, käytä selkeää komentoa, esim.:

  * *“Päivitä copilot.instructions.md: lisää ohje sijoitusankkureista.”*
  * *“Päivitä copilot.instructions.md: korjaa @module‑polku käyttämään src/‑juurta.”*
* **Muutosrajat:** pidä lisäys **lyhyenä ja kohdennettuna**, älä paisuta dokumenttia turhilla esimerkeillä.
* **Versiointi:** älä muuta aiempaa sisältöä, ellei se ole virhe. Lisää/korjaa minimaalinen lohko.
* **Merkinnät:** päivitä tämän tiedoston yläosassa vain `@updated`‑päivä (jos sellainen lisätään myöhemmin headeriin) ja lisää tarvittaessa lyhyt *Changelog*‑piste viimeisimmästä muutoksesta.
* **Vahvistus:** AI tiivistää aina chattiin *mitä muutettiin* (1–3 bulletia) ja *miksi*.

### Esimerkkikomennot (voit kopioida)

* “**Päivitä AI\_RULES.md**: lisää kohta että AI ei saa koskaan liittää koodia ilman tarkkaa sijoitusankkuria.”
* “**Päivitä AI\_RULES.md**: lyhennä snippet‑osio ja merkitse se valinnaiseksi.”

---

### Lisäykset pyynnöstä

Jos tarvitset esimerkkejä (esim. navigaatiotransitiot, Remote Config ‑käyttö, audiovolyymin pysyvyys), kerro mihin osaan haluat laajennusta — täydennän tähän dokumenttiin erillisen alaluvun.

## 🧾 Unified file header (JSDoc) — required in all source files

Alla on yhtenäinen tiedosto-otsikko, joka lisätään **kaikkiin** lähdekooditiedostoihin (components, screens, services, constants, styles, hooks, context). **Kommentti on aina englanniksi** (projektisääntö), mutta muu dokumentaatio voi olla suomeksi.

### Säännöt

* Pidä ensimmäinen rivi 1–2 lauseen ytimekkäänä kuvauksena.
* `@module` käyttää polkua ilman päätteitä **sisältäen `src/`‑juuren** (esim. `src/components/Gameboard`).
* **Älä** poista alkuperäistä `@since`-päivää — **päivitä aina** `@updated` viimeisimmän muutoksen päivämäärällä (ISO, YYYY‑MM‑DD).
* Sijoita otsikko **tiedoston ensimmäiseksi**.

### Yleinen pohja

```js
/**
 * ${FileName} — ${One-line purpose}
 * ${Optional short detail on responsibilities/constraints}
 * @module ${ModulePath}
 * @author Sabata79
 * @since ${YYYY-MM-DD}
 * @updated ${YYYY-MM-DD}
 */
```

### Esimerkki (App.js)

```js
/**
 * App.js — Main entry point for the Yatzy app.
 * Sets up navigation, context providers, and global styles.
 * @module App
 * @author Sabata79
 * @since 2025-08-30
 * @updated 2025-09-23
 */
```

### Lyhyt ohje muihin tiedostotyyppeihin

Käytä samaa rakennetta ja nimeämistä kaikissa tiedostoissa. `@module` polku alkaa aina `src/`‑juuresta ja heijastelee kansiorakennetta (esim. `src/services/AudioManager`, `src/constants/GameContext`, `src/styles/AboutMeScreenStyles`). Päivitä `@updated` aina kun tiedosto muuttuu.

