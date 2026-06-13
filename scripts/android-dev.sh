#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

find_adb() {
  local sdk_dir platform_tools
  local -a candidates=()

  [[ -n "${ANDROID_HOME:-}" ]] && candidates+=("$ANDROID_HOME")
  [[ -n "${ANDROID_SDK_ROOT:-}" ]] && candidates+=("$ANDROID_SDK_ROOT")
  candidates+=(
    "$HOME/Android/Sdk"
    "/usr/lib/android-sdk"
    "/opt/android-sdk"
    "/usr/local/android-sdk"
  )

  for sdk_dir in "${candidates[@]}"; do
    platform_tools="$sdk_dir/platform-tools/adb"
    if [[ -x "$platform_tools" ]]; then
      echo "$platform_tools"
      return 0
    fi
  done

  if command -v adb >/dev/null 2>&1; then
    command -v adb
    return 0
  fi

  return 1
}

if adb_path="$(find_adb)"; then
  sdk_root="$(cd "$(dirname "$adb_path")/.." && pwd)"
  export ANDROID_HOME="${ANDROID_HOME:-$sdk_root}"
  export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
  export PATH="$(dirname "$adb_path"):$PATH"
  exec npx expo start --android "$@"
fi

cat >&2 << 'MSG'

Android SDK / adb not found — skipping emulator launch.

  • Fastest:  npm start   then scan the QR code with Expo Go on your phone
  • Emulator: install Android Studio → SDK Manager → set ANDROID_HOME in .env
              (see .env.example), then run npm run android again

MSG

exec npx expo start "$@"
