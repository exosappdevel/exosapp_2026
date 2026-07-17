#!/bin/bash
set -e

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/micrositios" && pwd)/"
DEST="/home/jonatan/devilbox/data/www/exorta/htdocs/micrositios/"

if [ ! -d "$SRC" ]; then
  echo "Error: no se encontró el origen $SRC"
  exit 1
fi

mkdir -p "$DEST"

echo "===================================================="
echo " Copiando micrositios -> devilbox (exorta)"
echo "===================================================="
echo "Origen:  $SRC"
echo "Destino: $DEST"
echo

# --delete NO se usa a propósito: solo copia y sobreescribe, nunca borra
# archivos que ya existan en destino.
rsync -av "$SRC" "$DEST"

echo
echo "Listo."
