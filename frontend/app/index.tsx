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
      console.log("¿El usuario está logueado en el arranque?:", isLoggedIn);

      if (isLoggedIn) {
        try {
          // 🌟 VALIDACIÓN DE VERSIÓN DE LA APP
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

          // La expiración por inactividad (y el modal de "hay un update
          // pendiente, reinicia para aplicarlo") la revisa _ActivityTrackerWrapper
          // de forma global, sin importar en qué pantalla esté el usuario.
          // Aquí solo refrescamos el timestamp por la entrada a la app.
          await AsyncStorage.setItem('@exosapp_last_activity', Date.now().toString());
        } catch (e) {
          console.error("Error ejecutando auditoría de sesión en el arranque:", e);
        }
      }

      // Lógica original de navegación (con el delay que ya tenías)
      setTimeout(() => {
        if (isLoggedIn) {
          router.replace('/(tabs)/home');
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