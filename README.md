🚨CAUTION🚨ALERT🚨WIUWIEU🚨WIUWIEU🚨THIS APP WAS MADE WITH THE HELP OF AI🚨NOT INTO IT? JUST PASS BY🚨MADE APP FOR MYSELF; FEEL FREE TO USE🚨NO REGULAR UPDATES🚨

# MusicGrabber Mobile

Android companion app for [MusicGrabber](https://gitlab.com/g33kphr33k/musicgrabber) — search, download, and manage your queue on the go.

This project is **not** a standalone music downloader. It is a mobile client for a self-hosted MusicGrabber server you run yourself.

## Credits

MusicGrabber Mobile is built on top of the excellent self-hosted project:

- **[MusicGrabber](https://gitlab.com/g33kphr33k/musicgrabber)** by [g33kphr33k](https://gitlab.com/g33kphr33k) — the server that handles search, downloads, tagging, and library management.

Without MusicGrabber, this app would have nothing to talk to. Thank you to the main project and its contributors.

## Features

- **Dual URL** — prefers LAN (`http://192.168.x.x:38274`), falls back to remote HTTPS
- **Bearer auth** — multi-user support; no global API key in the app
- **Search** — track, artist, and album modes with cover art and quality badges
- **Soulseek merge** — optional results from your server's Soulseek integration
- **Queue** — auto-refresh, retry failed jobs, stream finished tracks
- **Push notifications** — alerts when downloads complete or fail (Android)
- **Share & deep links** — share text from other apps or open `musicgrabbermobile://` links to pre-fill search
- **Secure storage** — tokens and server URLs stored with `expo-secure-store`

## Server setup

### Create users

In MusicGrabber **Settings → Users**:

| User | Role | Purpose |
|------|------|---------|
| `admin` | admin | Full access, configuration |
| `mobile` | peon | Search, queue, and downloads only |

With two or more users, multi-user mode is active. The app uses **no** global API key.

### Secure your public URL

- Expose only your HTTPS reverse proxy / tunnel (e.g. `https://musicgrabber.example.com`)
- Enforce HTTPS (the app accepts remote URLs only with `https://`)
- Use a strong password for the peon/mobile user
- Do **not** enable `ALLOW_API_KEY_QUERY_PARAM`

Library integrations (Lidarr, Navidrome, etc.) are configured on the **MusicGrabber server**, not in this app.

## Development

### Expo Go (Play Store)

This project uses **Expo SDK 54** because the Play Store version of Expo Go currently supports SDK 54 only. Upgrading to SDK 55/56 will show *"Project is incompatible with this version of Expo Go"* even with the latest Play Store app.

**Without Android SDK** (fastest way to test):

```bash
npm install
npx expo start --clear
```

Install Expo Go from the Play Store, stay on the same network as your dev machine, and scan the QR code.

**Alternatives for newer SDKs:**

| Approach | When to use |
|----------|-------------|
| Play Store Expo Go + SDK 54 | Quick testing without a build (this project) |
| [expo.dev/go](https://expo.dev/go) sideload APK | SDK 56 on Android (not Play Store) |
| EAS Build / Dev Client | Production, native modules, SDK 55+ |

### With Android emulator

1. Install [Android Studio](https://developer.android.com/studio) and enable **Android SDK** + **Platform-Tools** in the SDK Manager.
2. Set the SDK path (typically `~/Android/Sdk`):

   ```bash
   cp .env.example .env
   # Set ANDROID_HOME in .env
   ```

3. Start an emulator (Device Manager in Android Studio), then:

   ```bash
   npm run android
   ```

`npm run android` checks for `adb`/SDK automatically. If they are missing, it starts only the Expo dev server (same as `npm start`) instead of failing silently.

For APKs without a local SDK, use EAS Build (below) or Expo Go from the Play Store (SDK 54).

## Build APK (EAS)

```bash
npm install -g eas-cli
eas login
npm run build:apk
# or: eas build -p android --profile preview
```

The `preview` profile produces a sideloadable APK.

Local build without EAS cloud:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

## App setup

1. **Server** — enter LAN and remote URLs on first launch
2. **Login** — use your peon or regular user account
3. **Search** — pick track / artist / album mode, preview optionally, start download
4. **Queue** — watch progress, retry failures, play completed tracks

## Share & deep links

Share plain text from another app (e.g. a track name copied from a browser) — MusicGrabber Mobile appears in the Android share sheet and opens search with the text pre-filled.

Custom URL scheme:

```
musicgrabbermobile://search?q=Artist+-+Title
musicgrabbermobile://search?artist=Artist&title=Title
```

## Push notifications

When logged in, the app polls your download queue and sends a local notification when a job moves to **completed** or **failed**. Grant notification permission on first use (Android 13+).

## Architecture

```
app/                 Expo Router screens
src/api/             MusicGrabber REST client
src/context/         Auth state
src/hooks/           Reachability, notifications, incoming search
src/services/        Notification channels and alerts
src/components/      Cover art, album browse, quality badges
src/utils/           Search metadata, deep-link parsing
```

## API endpoints used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/config` | Server health, version |
| `POST /api/auth/login` | Login |
| `GET /api/auth/me` | Session check |
| `POST /api/search` | Track search |
| `POST /api/search/slskd` | Soulseek search merge |
| `GET /api/preview/{id}` | Preview |
| `POST /api/download` | Queue download |
| `GET /api/jobs` | Queue status |
| `POST /api/jobs/{id}/retry` | Retry failed job |
| `GET /api/jobs/{id}/stream` | Play finished track |

## Server verification

```bash
./scripts/verify-server.sh
```

Point the script at your server URL to confirm the API is reachable and auth works.

## Security

- Token is cleared on logout (`POST /api/auth/logout` + SecureStore wipe)
- Queue polling: 3–8 s (under typical 200 req/min rate limits)
- Cleartext HTTP allowed only for LAN (`usesCleartextTraffic: true` in `app.json`)
- The APK ships with **no** credentials — you configure server URL and login on device

## License

See the repository license. MusicGrabber itself is a separate project — refer to [its repository](https://gitlab.com/g33kphr33k/musicgrabber) for licensing and documentation.
