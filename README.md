# MusicGrabber Mobile (Android)

Native Android-Client für [MusicGrabber](https://gitlab.com/g33kphr33k/musicgrabber) — suchen, downloaden und Queue unterwegs verwalten.

## Features

- Dual-URL: LAN bevorzugt (`http://192.168.x.x:38274`), Remote-Fallback (`https://musicgrabber.example.com`)
- Bearer-Login (Multi-User / Peon-Rolle empfohlen)
- Suche, Preview, Download
- Queue mit Auto-Refresh, Retry und Stream-Playback
- Sichere Speicherung von Token und URLs via `expo-secure-store`

## Server-Setup (einmalig)

### 1. Benutzer anlegen

In MusicGrabber **Settings → Users**:

| User | Rolle | Zweck |
|------|-------|-------|
| `admin` | admin | Vollzugriff, Konfiguration |
| `mobile` | peon | Nur Suche, Queue, Downloads |

Ab 2 Usern ist Multi-User-Modus aktiv. Die App nutzt **keinen** globalen API-Key.

### 2. Öffentliche URL absichern

- Reverse-Proxy/Tunnel nur für deine öffentliche HTTPS-URL (z. B. `https://musicgrabber.example.com`)
- HTTPS erzwingen (App akzeptiert Remote nur mit `https://`)
- Peon-User mit starkem Passwort
- `ALLOW_API_KEY_QUERY_PARAM` **nicht** aktivieren

### 3. Lidarr-Integration

In MusicGrabber **Settings → Integrations**:

- **Lidarr URL:** `http://192.168.x.x:8686` (oder deine interne Lidarr-URL)
- **Lidarr API Key:** aus Lidarr → Settings → General

MusicGrabber triggert nach jedem erfolgreichen Download einen **Library Rescan** in Lidarr. Das ist keine Indexer-Integration — Singles landen im Music-Ordner und werden von Lidarr beim Scan erkannt.

Optional parallel Navidrome konfigurieren für Streaming.

### 4. Lidarr Root Folder prüfen

Der MusicGrabber-Output (`/music/Singles/...` oder `Albums/...`) muss in einem von Lidarr überwachten Root Folder liegen.

## Entwicklung

### Expo Go (Play Store)

Dieses Projekt nutzt **Expo SDK 54**, weil die Play-Store-Version von Expo Go derzeit nur SDK 54 unterstützt. SDK 55/56 sind dort (Stand 2026) noch nicht verfügbar — ein Upgrade auf SDK 56 führt zur Meldung *„Project is incompatible with this version of Expo Go“*, selbst mit der neuesten Play-Store-App.

**Ohne Android SDK** (empfohlen für schnelles Testen):

```bash
npm install
npx expo start --clear
```

Expo Go aus dem Play Store installieren, im gleichen WLAN wie der Rechner sein, QR-Code scannen.

**Alternativen für neuere SDKs:**

| Weg | Wann |
|-----|------|
| Play Store Expo Go + SDK 54 | Schnelles Testen ohne Build (dieses Projekt) |
| [expo.dev/go](https://expo.dev/go) APK sideload | SDK 56 auf Android (nicht Play Store) |
| EAS Build / Dev Client | Produktion, native Module, SDK 55+ |

Mit Android-Emulator (Android Studio + SDK):

1. [Android Studio](https://developer.android.com/studio) installieren, im SDK Manager **Android SDK** und **Platform-Tools** installieren.
2. SDK-Pfad setzen (typisch `~/Android/Sdk`):

   ```bash
   cp .env.example .env
   # ANDROID_HOME in .env eintragen
   ```

3. Emulator starten (Device Manager in Android Studio), dann:

   ```bash
   npm run android
   ```

`npm run android` prüft automatisch, ob `adb`/SDK vorhanden sind. Fehlen sie, startet nur der Expo-Dev-Server (wie `npm start`) — kein blindes Scheitern mehr.

APK ohne lokalen SDK: EAS Build (siehe unten) oder Expo Go aus dem Play Store (SDK 54).

## APK bauen (EAS)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Die `preview`-Profile erzeugt eine sideload-fähige APK.

Für lokale Builds ohne EAS-Cloud:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

## App-Einrichtung

1. **Server einrichten:** LAN- und Remote-URL eingeben
2. **Anmelden:** Peon- oder User-Account
3. **Suche:** Artist - Titel eingeben, Preview optional, Download starten
4. **Queue:** Fortschritt verfolgen, bei Fehlern Retry

## Architektur

```
app/                 Expo Router Screens
src/api/             MusicGrabber REST Client
src/context/         Auth State
src/hooks/           Server Reachability
src/types/           API Types
```

## API-Endpunkte (genutzt)

| Endpoint | Zweck |
|----------|-------|
| `GET /api/config` | Server-Health, Version |
| `POST /api/auth/login` | Login |
| `GET /api/auth/me` | Session prüfen |
| `POST /api/search` | Track-Suche |
| `GET /api/preview/{id}` | Preview |
| `POST /api/download` | Download queueen |
| `GET /api/jobs` | Queue-Status |
| `POST /api/jobs/{id}/retry` | Fehlgeschlagenen Job wiederholen |
| `GET /api/jobs/{id}/stream` | Fertigen Track abspielen |

## Verifikation (Lidarr E2E)

Server-Checks:

```bash
./scripts/verify-server.sh
```

Nach einem Test-Download in der App:

1. Datei auf NAS unter `/music/Singles/...` prüfen
2. Lidarr → System → Tasks → „Refresh & Scan“ (oder automatisch via MusicGrabber)
3. Track in Lidarr-Bibliothek sichtbar
4. Optional: Navidrome-Bibliothek aktualisiert

## Sicherheit

- Token wird bei Logout gelöscht (`POST /api/auth/logout` + SecureStore clear)
- Queue-Polling: 3–8 s (unter Rate-Limit 200 req/min)
- Cleartext HTTP nur für LAN (`usesCleartextTraffic: true` in `app.json`)
