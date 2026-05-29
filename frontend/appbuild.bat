@echo off
set ACTION=%1

if "%ACTION%"=="" goto help
if "%ACTION%"=="dev" goto development
if "%ACTION%"=="prev" goto preview
if "%ACTION%"=="prod" goto production
goto help

:development
echo ====================================================
echo  Iniciando EAS Build: CLIENTE DE DESARROLLO (dev)
echo ====================================================
eas build --profile development --platform all
goto end

:preview
echo ====================================================
echo  Iniciando EAS Build: COMPILACION DE PRUEBA (preview)
echo ====================================================
eas build --profile preview --platform all
goto end

:production
echo ====================================================
echo  Iniciando EAS Build: VERSION FINAL (production)
echo ====================================================
eas build --profile production --platform all
goto end

:help
echo.
echo Error: Comando no valido o faltante.
echo.
echo Uso correcto:
echo   appbuild.bat [opcion]
echo.
echo Opciones disponibles:
echo   dev   -> Compila el entorno de desarrollo (development)[cite: 1]
echo   prev  -> Compila la version de prueba interna (preview)[cite: 1]
echo   prod  -> Compila la version final para las tiendas (production)[cite: 1]
echo.
goto end

:end