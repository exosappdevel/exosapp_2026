import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../context/AppContext';
import { _ActivityTrackerWrapper } from "../components/elidev_components/_ActivityTrackerWrapper"
import { LogBox } from 'react-native';


export default function RootLayout() {
  // Silencia advertencias específicas que inundan la consola
  LogBox.ignoreLogs([
    '"textShadow*" style props are deprecated',
    '_getAccessibilityRole',
  ]);
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
        </Stack>
      </_ActivityTrackerWrapper>
    </AppProvider>
  );
}