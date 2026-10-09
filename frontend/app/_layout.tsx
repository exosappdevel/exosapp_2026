import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../context/AppContext';
import { _ActivityTrackerWrapper } from "../components/elidev_components/_ActivityTrackerWrapper"
import { LogBox, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';


export default function RootLayout() {
  // Silencia advertencias específicas que inundan la consola
  LogBox.ignoreLogs([
    '"textShadow*" style props are deprecated',
    '_getAccessibilityRole',
  ]);

  // La app va bloqueada a portrait por default (app.json ahora declara
  // "orientation": "default" a nivel nativo para permitir rotación en general,
  // pero se restringe aquí en runtime). cirugia_detalle_view desbloquea
  // rotación solo mientras se ve la pestaña de fotos, y vuelve a bloquear
  // portrait al salir de esa vista o de la pantalla.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, []);
  return (
    <AppProvider>
      <_ActivityTrackerWrapper>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" />          
          <Stack.Screen name="reporte_piezas_danadas_view"/>
          <Stack.Screen name="reporte_piezas_danadas"/>
          <Stack.Screen name="paqueteria_por_enviar"/>
          <Stack.Screen name="paqueteria_por_recibir"/>
          <Stack.Screen name="cirugia_detalle_view/[id_cirugia]"/>
        </Stack>
      </_ActivityTrackerWrapper>
    </AppProvider>
  );
}