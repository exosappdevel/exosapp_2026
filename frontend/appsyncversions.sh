#!/bin/bash
set -e

# Sincroniza la version de Android (build.gradle) con la version "fuente
# de verdad" declarada en app.config.js (expo.version).
#
# - versionName  <- se copia literal desde app.config.js (expo.version)
# - versionCode  <- se deriva quitando los puntos (ej. "26.07.17" -> 260717)
#   Se le quitan ceros a la izquierda porque Groovy interpreta un literal
#   numerico con "0" al inicio (ej. 017) como octal, no como decimal.
#
# Nota: el versionCode real que llega a Play Store en los builds de
# produccion lo gestiona EAS de forma remota (ver eas.json:
# "appVersionSource": "remote" + production.autoIncrement). Este script
# solo mantiene consistente el build.gradle local, usado por builds
# locales/dev (expo run:android, gradle directo).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_CONFIG="$SCRIPT_DIR/app.config.js"
BUILD_GRADLE="$SCRIPT_DIR/android/app/build.gradle"

if [ ! -f "$APP_CONFIG" ]; then
  echo "Error: no se encontro $APP_CONFIG"
  exit 1
fi

if [ ! -f "$BUILD_GRADLE" ]; then
  echo "Error: no se encontro $BUILD_GRADLE"
  exit 1
fi

APP_VERSION=$(node -pe "require('$APP_CONFIG').expo.version")

if [ -z "$APP_VERSION" ] || [ "$APP_VERSION" = "undefined" ]; then
  echo "Error: no se pudo leer expo.version desde app.config.js"
  exit 1
fi

VERSION_CODE=$(echo "$APP_VERSION" | tr -d '.' | sed 's/^0*//')
if [ -z "$VERSION_CODE" ]; then
  VERSION_CODE=0
fi

OLD_VERSION_NAME=$(grep -oP 'versionName\s+"\K[^"]*' "$BUILD_GRADLE")
OLD_VERSION_CODE=$(grep -oP 'versionCode\s+\K[0-9]+' "$BUILD_GRADLE")

echo "===================================================="
echo " Sincronizando version de Android con app.config.js"
echo "===================================================="
echo " app.config.js version : $APP_VERSION"
echo " versionName       : $OLD_VERSION_NAME -> $APP_VERSION"
echo " versionCode       : $OLD_VERSION_CODE -> $VERSION_CODE"
echo "===================================================="

sed -i "s/versionCode [0-9]\+/versionCode $VERSION_CODE/" "$BUILD_GRADLE"
sed -i "s/versionName \"[^\"]*\"/versionName \"$APP_VERSION\"/" "$BUILD_GRADLE"

echo "Listo: android/app/build.gradle actualizado."
