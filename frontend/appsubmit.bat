@echo off
set ACTION=%1
set PLATFORM=%2
if "%PLATFORM%"=="" set PLATFORM=all

if "%ACTION%"=="" goto help
if "%ACTION%"=="prod" goto production
goto help

:production
echo ====================================================
echo  Iniciando EAS Submit: ENVIO A TIENDAS (production)
echo ====================================================
if "%PLATFORM%"=="all" goto production_all
eas submit --profile production --platform %PLATFORM%
goto end

:production_all
echo --- Enviando version de Android (Google Play) ---
eas submit --profile production --platform android
echo.
echo --- Enviando version de iOS (App Store) ---
eas submit --profile production --platform ios
goto end

:help
echo.
echo Error: Comando no valido o faltante.
echo.
echo Uso correcto:
echo   appsubmit.bat prod [plataforma]
echo.
echo Plataforma (opcional, default = all):
echo   android, ios, all
echo.
echo Ejemplos:
echo   appsubmit.bat prod
echo   appsubmit.bat prod android
echo.
goto end

:end