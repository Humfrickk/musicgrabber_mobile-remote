#!/usr/bin/env bash
set -euo pipefail

LAN_URL="${LAN_URL:-http://127.0.0.1:38274}"
LIDARR_URL="${LIDARR_URL:-http://127.0.0.1:8686}"

echo "== MusicGrabber config =="
CONFIG=$(curl -fsS -m 5 "${LAN_URL}/api/config")
echo "$CONFIG" | python3 -m json.tool

USERS_EXIST=$(echo "$CONFIG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('users_exist', False))")
VERSION=$(echo "$CONFIG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version', 'unknown'))")

echo ""
echo "Version: $VERSION"
echo "Multi-User aktiv: $USERS_EXIST"

if [[ "$USERS_EXIST" != "True" ]]; then
  echo "WARN: users_exist=false — lege mindestens 2 User in MusicGrabber an (admin + peon)."
fi

echo ""
echo "== Auth-geschützte Endpunkte =="
SEARCH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 5 -X POST "${LAN_URL}/api/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"test","limit":1}')
echo "POST /api/search ohne Token: HTTP $SEARCH_CODE (erwartet: 401)"

echo ""
echo "== Lidarr erreichbar =="
if curl -fsS -m 5 "${LIDARR_URL}/api/v1/system/status" >/dev/null 2>&1; then
  echo "Lidarr erreichbar unter $LIDARR_URL"
else
  echo "Lidarr nicht direkt erreichbar (evtl. API-Key/Netzwerk nötig)."
fi

echo ""
echo "== E2E Checkliste (manuell in der App) =="
echo "1. Mit Peon-User in der App anmelden"
echo "2. Einen Track suchen und downloaden"
echo "3. Datei unter /music/Singles/... auf dem NAS prüfen"
echo "4. Lidarr Library Rescan (automatisch via MusicGrabber-Integration)"
echo "5. Optional: Track in Navidrome sichtbar"
