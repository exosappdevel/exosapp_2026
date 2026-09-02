import React, { useRef, useEffect, useState } from 'react';
import { View, PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { UpdateRequired_Modal } from '../CustomModal';

interface ActivityWrapperProps {
  children: React.ReactNode;
}

const FIVE_MINUTES = 5 * 60 * 1000;
const IDLE_CHECK_INTERVAL = 30 * 1000;

export const _ActivityTrackerWrapper = ({ children }: ActivityWrapperProps) => {
  const router = useRouter();
  const { isLoggedIn, setIsLoggedIn, isUpdatePending, applyUpdateAndRestart } = useApp();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Función para actualizar el timestamp de forma silenciosa
  const refreshActivity = async () => {
    try {
      await AsyncStorage.setItem('@exosapp_last_activity', Date.now().toString());
    } catch {
      // Falla silenciosa
    }
  };

  // Antes el modal de "hay una actualización, reinicia" SOLO se activaba
  // dentro del chequeo de inactividad de 5 min (más abajo), así que en la
  // práctica nunca se mostraba mientras la app seguía en uso activo: el
  // usuario tenía que dejarla inactiva 5 minutos completos para enterarse.
  // Este efecto lo muestra apenas AppContext detecta y descarga el OTA.
  useEffect(() => {
    if (isLoggedIn && isUpdatePending) {
      setShowUpdateModal(true);
    }
  }, [isLoggedIn, isUpdatePending]);

  // Este wrapper envuelve toda la app (ver app/_layout.tsx), así que a
  // diferencia de un chequeo hecho solo en app/index.tsx, este corre sin
  // importar en qué pantalla esté el usuario ni cuánto tiempo lleve ahí.
  useEffect(() => {
    if (!isLoggedIn || showUpdateModal) return;

    const checkIdle = async () => {
      try {
        const lastActivity = await AsyncStorage.getItem('@exosapp_last_activity');
        if (!lastActivity) return;
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed <= FIVE_MINUTES) return;

        // Si hay un update pendiente el otro efecto ya puso showUpdateModal
        // en true, y por el guard de arriba este efecto ni siquiera llega a
        // correr; isUpdatePending queda solo como refuerzo por si acaso.
        if (isUpdatePending) return;

        console.log('Sesión expirada por inactividad de 5 minutos.');
        await AsyncStorage.removeItem('@exosapp_last_activity');
        await setIsLoggedIn(false);
        router.replace('/login');
      } catch (e) {
        console.error('Error revisando inactividad:', e);
      }
    };

    checkIdle();
    const interval = setInterval(checkIdle, IDLE_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [isLoggedIn, isUpdatePending, showUpdateModal]);

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
      <UpdateRequired_Modal visible={showUpdateModal} onRestart={applyUpdateAndRestart} />
    </View>
  );
};
