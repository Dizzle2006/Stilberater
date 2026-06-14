#!/bin/bash
# deploy.sh — Baut die App lokal und pusht sie auf den gh-pages Branch.
# GitHub Pages muss auf "Deploy from branch: gh-pages" eingestellt sein.
# Einmalige Einrichtung: siehe README oder Schritt 2 unten.
set -e

# 1. Repo-Namen aus der Remote-URL ableiten
REMOTE_URL=$(git -C "$(dirname "$0")/.." remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE_URL" ]; then
  echo "Fehler: Kein git remote 'origin' gefunden."
  echo "Bitte zuerst mit 'git remote add origin <URL>' einrichten."
  exit 1
fi
REPO_NAME=$(basename -s .git "$REMOTE_URL")
BASE="/$REPO_NAME/"

echo "Deploying to gh-pages branch..."
echo "Base path: $BASE"

# 2. Service Worker Cache-Version automatisch erhöhen (erzwingt Update auf allen Geräten)
SW_FILE="$(dirname "$0")/public/sw.js"
CURRENT_VER=$(grep -o 'stilberater-v[0-9]*' "$SW_FILE" | grep -o '[0-9]*$')
NEW_VER=$((CURRENT_VER + 1))
sed -i '' "s/stilberater-v${CURRENT_VER}/stilberater-v${NEW_VER}/" "$SW_FILE"
echo "Service Worker Cache: v${CURRENT_VER} → v${NEW_VER}"

# 3. Build mit korrektem Base-Pfad
VITE_BASE_URL="$BASE" npm run build

# 3. dist-Ordner als gh-pages Branch pushen
cd dist
git init -b gh-pages
git add -A
git commit -m "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -f "$REMOTE_URL" gh-pages
cd ..

echo ""
echo "Erfolgreich deployt!"
echo ""
echo "Falls noch nicht geschehen:"
echo "1. Gehe zu GitHub → Dein Repo → Settings → Pages"
echo "2. Unter 'Source': 'Deploy from a branch' auswählen"
echo "3. Branch: 'gh-pages', Ordner: '/ (root)'"
echo "4. Speichern — die App ist in ~1 Min unter https://<user>.github.io/$REPO_NAME/ erreichbar"
