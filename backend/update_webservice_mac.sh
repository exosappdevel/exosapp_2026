#!/bin/bash
# Versión para la Mac de update_webservice.sh (la de Linux/devilbox no cambia).
# Copia backend/webservice/ al backend local instalado con MacPorts
# (Apache + PHP-FPM + MariaDB, http://localhost:8080/exorta/webservice).
#
# Uso:   ./update_webservice_mac.sh
# Variable opcional: WWW_DIR (default ~/code/www)
set -e

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/webservice" && pwd)/"
WWW_DIR="${WWW_DIR:-$HOME/code/www}"
DEST="$WWW_DIR/exorta/webservice/"

if [ ! -d "$SRC" ]; then
  echo "Error: no se encontró el origen $SRC"
  exit 1
fi

if [ ! -d "$DEST" ]; then
  echo "Error: no se encontró el destino $DEST (¿está instalado el backend local en $WWW_DIR?)"
  exit 1
fi

echo "===================================================="
echo " Copiando webservice -> backend local Mac (exorta)"
echo "===================================================="
echo "Origen:  $SRC"
echo "Destino: $DEST"
echo

# --delete NO se usa a propósito: solo copia y sobreescribe, nunca borra
# archivos que ya existan en destino (ej. pagos_cirugias/files subidos en pruebas).
rsync -av --exclude 'server.log*' "$SRC" "$DEST"

echo
echo "Listo."
