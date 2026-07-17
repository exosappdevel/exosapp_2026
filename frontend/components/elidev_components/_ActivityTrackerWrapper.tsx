import React, { useRef } from 'react';
import { View, PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ActivityWrapperProps {
  children: React.ReactNode;
}

export const _ActivityTrackerWrapper = ({ children }: ActivityWrapperProps) => {
  
  // Función para actualizar el timestamp de forma silenciosa
  const refreshActivity = async () => {
    try {
      await AsyncStorage.setItem('@exosapp_last_activity', Date.now().toString());
    } catch {
      // Falla silenciosa
    }
  };

  // El PanResponder escuchará los toques en cualquier parte de la pantalla
  const panResponder = useRef(
    PanResponder.create({
      // "Capture" en false asegura que NO intercepte ni bloquee los eventos de tus botones, inputs o scrolls
      onStartShouldSetPanResponderCapture: () => {
        refreshActivity();
        return false; 
      },
      onMoveShouldSetPanResponderCapture: () => {
        refreshActivity();
        return false;
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};