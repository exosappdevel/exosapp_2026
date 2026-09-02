#!/bin/bash
set -e

# Cambia rapido el backend_server activo en AppContext.tsx (el mapa "servers"
# de AppProvider), sin tener que editar el archivo a mano cada vez que se
# prueba contra local/exos/exodos.
#
# Uso:
#   ./set_dest.sh <server>
#   ./set_dest.sh local
#   ./set_dest.sh -v   # solo muestra el backend_server actual, no modifica nada

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_CONTEXT="$SCRIPT_DIR/context/AppContext.tsx"

if [ ! -f "$APP_CONTEXT" ]; then
  echo "Error: no se encontro $APP_CONTEXT"
  exit 1
fi

if [ "$1" = "-v" ]; then
  grep -n "const backend_server" "$APP_CONTEXT"
  exit 0
fi

AVAILABLE_SERVERS=$(grep -oP '^\s*"\K[^"]+(?="\s*:\s*"http)' "$APP_CONTEXT")

if [ $# -ne 1 ]; then
  echo "Uso: $0 <server>"
  echo "Servidores disponibles:"
  echo "$AVAILABLE_SERVERS" | sed 's/^/  - /'
  exit 1
fi

SERVER="$1"

if ! grep -qxF "$SERVER" <<< "$AVAILABLE_SERVERS"; then
  echo "Error: \"$SERVER\" no esta en el mapa \"servers\" de AppContext.tsx"
  echo "Servidores disponibles:"
  echo "$AVAILABLE_SERVERS" | sed 's/^/  - /'
  exit 1
fi

OLD_SERVER=$(grep -oP 'const backend_server = "\K[^"]*' "$APP_CONTEXT")

sed -i "s/const backend_server = \"[^\"]*\";/const backend_server = \"$SERVER\";/" "$APP_CONTEXT"

echo "backend_server: \"$OLD_SERVER\" -> \"$SERVER\""
