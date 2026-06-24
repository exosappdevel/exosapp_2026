@echo off
set ACTION=%1
set PLATFORM=%2
if "%PLATFORM%"=="" set PLATFORM=all

if "%ACTION%"=="" goto help
if "%ACTION%"=="dev" goto development
if "%ACTION%"=="prev" goto preview
if "%ACTION%"=="prod" goto production
goto help

:development
echo ====================================================
echo  Iniciando EAS Build: CLIENTE DE DESARROLLO (dev)
echo ====================================================
eas build --profile development --platform %PLATFORM%
goto end

:preview
echo ====================================================
echo  Iniciando EAS Build: COMPILACION DE PRUEBA (preview)
echo ====================================================
eas build --profile preview --platform %PLATFORM%
goto end

:production
echo ====================================================
echo  Iniciando EAS Build: VERSION FINAL (production)
echo ====================================================
eas build --profile production --platform %PLATFORM%
goto end

:help
echo.
echo Error: Comando no valido o faltante.
echo.
echo Uso correcto:
echo   appbuild.bat [opcion] [plataforma]
echo.
echo Opciones disponibles:
echo   dev   -> Compila el entorno de desarrollo (development)
echo   prev  -> Compila la version de prueba interna (preview)
echo   prod  -> Compila la version final para las tiendas (production)
echo.
echo Plataforma (opcional, default = all):
echo   android, ios, all
echo.
echo Ejemplos:
echo   appbuild.bat prev
echo   appbuild.bat prod android
echo.
goto end

:end