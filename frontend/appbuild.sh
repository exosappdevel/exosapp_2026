#!/bin/bash
set -e

ACTION=$1
PLATFORM=${2:-all}

case "$ACTION" in
  dev)
    echo "===================================================="
    echo " Iniciando EAS Build: CLIENTE DE DESARROLLO (dev)"
    echo "===================================================="
    eas build --profile development --platform "$PLATFORM"
    ;;
  prev)
    echo "===================================================="
    echo " Iniciando EAS Build: COMPILACION DE PRUEBA (preview)"
    echo "===================================================="
    eas build --profile preview --platform "$PLATFORM"
    ;;
  prod)
    echo "===================================================="
    echo " Iniciando EAS Build: VERSION FINAL (production)"
    echo "===================================================="
    eas build --profile production --platform "$PLATFORM"
    ;;
  *)
    echo
    echo "Error: Comando no valido o faltante."
    echo
    echo "Uso correcto:"
    echo "  ./appbuild.sh [opcion] [plataforma]"
    echo
    echo "Opciones disponibles:"
    echo "  dev   -> Compila el entorno de desarrollo (development)"
    echo "  prev  -> Compila la version de prueba interna (preview)"
    echo "  prod  -> Compila la version final para las tiendas (production)"
    echo
    echo "Plataforma (opcional, default = all):"
    echo "  android, ios, all"
    echo
    echo "Ejemplos:"
    echo "  ./appbuild.sh prev"
    echo "  ./appbuild.sh prod android"
    echo
    exit 1
    ;;
esac
