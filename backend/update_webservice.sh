#!/bin/bash
set -e

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/webservice" && pwd)/"
DEST="/home/jonatan/devilbox/data/www/exorta/htdocs/webservice/"

if [ ! -d "$SRC" ]; then
  echo "Error: no se encontró el origen $SRC"
  exit 1
fi

if [ ! -d "$DEST" ]; then
  echo "Error: no se encontró el destino $DEST (¿está corriendo devilbox?)"
  exit 1
fi

echo "===================================================="
echo " Copiando webservice -> devilbox (exorta)"
echo "===================================================="
echo "Origen:  $SRC"
echo "Destino: $DEST"
echo

# --delete NO se usa a propósito: solo copia y sobreescribe, nunca borra
# archivos que ya existan en destino (ej. pagos_cirugias/files subidos en pruebas).
rsync -av "$SRC" "$DEST"

echo
echo "Listo."
