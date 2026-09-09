#!/bin/bash
set -e

# Automatiza "eas update" para producción y/o preview: antes de publicar,
# cambia el backend_server activo (via set_dest.sh) al que corresponde a
# ese canal, para que el build resultante apunte al servidor correcto.
#
# Uso:
#   ./ota_update.sh -c=prod -m="mensaje del update"
#   ./ota_update.sh -c=prev -m="mensaje del update"
#   ./ota_update.sh -c=all  -m="mensaje del update"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CHANNEL=""
MESSAGE=""

for arg in "$@"; do
  case "$arg" in
    -c=*) CHANNEL="${arg#-c=}" ;;
    -m=*) MESSAGE="${arg#-m=}" ;;
    *)
      echo "Argumento no reconocido: $arg"
      echo "Uso: $0 -c=<prod|prev|all> -m=<mensaje>"
      exit 1
      ;;
  esac
done

if [ -z "$CHANNEL" ] || [ -z "$MESSAGE" ]; then
  echo "Uso: $0 -c=<prod|prev|all> -m=<mensaje>"
  exit 1
fi

if [ "$CHANNEL" != "prod" ] && [ "$CHANNEL" != "prev" ] && [ "$CHANNEL" != "all" ]; then
  echo "Error: -c debe ser \"prod\", \"prev\" o \"all\" (recibido: \"$CHANNEL\")"
  exit 1
fi

run_prod() {
  echo "===================================================="
  echo " Canal: production"
  echo "===================================================="
  "$SCRIPT_DIR/set_dest.sh" exos
  eas update --branch production --message "$MESSAGE"
}

run_prev() {
  echo "===================================================="
  echo " Canal: preview"
  echo "===================================================="
  "$SCRIPT_DIR/set_dest.sh" exodos
  eas update --branch preview --message "$MESSAGE"
}

case "$CHANNEL" in
  prod) run_prod ;;
  prev) run_prev ;;
  all)  run_prod; run_prev ;;
esac

# Deja el entorno local apuntando de nuevo a "local" para no quedar
# publicando por accidente contra exos/exodos en la siguiente prueba.
"$SCRIPT_DIR/set_dest.sh" local

echo "Listo."
