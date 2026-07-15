#!/bin/bash
set -e

ACTION=$1
PLATFORM=${2:-all}

case "$ACTION" in
  prod)
    echo "===================================================="
    echo " Iniciando EAS Submit: ENVIO A TIENDAS (production)"
    echo "===================================================="
    if [ "$PLATFORM" == "all" ]; then
      echo "--- Enviando version de Android (Google Play) ---"
      eas submit --profile production --platform android
      echo
      echo "--- Enviando version de iOS (App Store) ---"
      eas submit --profile production --platform ios
    else
      eas submit --profile production --platform "$PLATFORM"
    fi
    ;;
  *)
    echo
    echo "Error: Comando no valido o faltante."
    echo
    echo "Uso correcto:"
    echo "  ./appsubmit.sh prod [plataforma]"
    echo
    echo "Plataforma (opcional, default = all):"
    echo "  android, ios, all"
    echo
    echo "Ejemplos:"
    echo "  ./appsubmit.sh prod"
    echo "  ./appsubmit.sh prod android"
    echo
    exit 1
    ;;
esac
