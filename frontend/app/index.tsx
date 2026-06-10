import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import ApiService from '../services/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Asegúrate de importar esto
import Constants from 'expo-constants';

export default function Index() {
  const router = useRouter();
  const { appConfig, isLoggedIn, setIsLoggedIn } = useApp(); // Agregamos setIsLoggedIn para poder cerrar sesión

  useEffect(() => {
    // Initialize API Service
    ApiService.init(appConfig);

    const checkSessionAndNavigate = async () => {
      const FIVE_MINUTES = 5 * 60 * 1000; // 300,000 milisegundos
      const now = Date.now();
      
      console.log("¿El usuario está logueado en el arranque?:", isLoggedIn);

      if (isLoggedIn) {
        try {
          // 1. 🌟 VALIDACIÓN DE VERSIÓN DE LA APP
          const savedVersion = await AsyncStorage.getItem('@exosapp_version');
          const currentVersion = Constants.expoConfig?.version || '1.0.0';
          
          console.log(`Versión match? (${savedVersion} -> ${currentVersion})`);
          if (savedVersion && savedVersion !== currentVersion) {
            console.log(`Cierre de sesión forzado: Cambio de versión detectado (${savedVersion} -> ${currentVersion})`);
            // Borramos credenciales locales inmediatamente
            await AsyncStorage.multiRemove(['@exosapp_user', '@exosapp_version', '@exosapp_last_activity']);
            await setIsLoggedIn(false);
            router.replace('/login');
            return;
          }

          // 2. 🌟 VALIDACIÓN DE EXPIRACIÓN POR INACTIVIDAD
          const lastActivity = await AsyncStorage.getItem('@exosapp_last_activity');

          if (lastActivity) {
            const elapsed = now - parseInt(lastActivity);

            if (elapsed > FIVE_MINUTES) {
              console.log("Sesión expirada por inactividad de 5 minutos.");
              await AsyncStorage.removeItem('@exosapp_last_activity'); // Limpiamos el token de tiempo
              await setIsLoggedIn(false);
              router.replace('/login');
              return;
            }
          }
          // Si pasa ambas validaciones, actualizamos el timestamp por la entrada a la app
          await AsyncStorage.setItem('@exosapp_last_activity', now.toString());
        } catch (e) {
          console.error("Error ejecutando auditoría de sesión en el arranque:", e);
        }
      }

      // Lógica original de navegación (con el delay que ya tenías)
      setTimeout(() => {
        if (isLoggedIn) {
          router.replace('/home');
        } else {
          router.replace('/login');
        }
      }, 1000);
    };

    checkSessionAndNavigate();
  }, [isLoggedIn]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3182ce" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
});