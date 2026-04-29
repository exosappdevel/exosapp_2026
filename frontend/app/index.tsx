import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import ApiService from '../services/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Asegúrate de importar esto

export default function Index() {
  const router = useRouter();
  const { appConfig, isLoggedIn, setIsLoggedIn } = useApp(); // Agregamos setIsLoggedIn para poder cerrar sesión

  useEffect(() => {
    // Initialize API Service
    ApiService.init(appConfig);
    
    const checkSessionAndNavigate = async () => {
      const FIVE_MINUTES = 5 * 60 * 1000; // 300,000 milisegundos
      const now = Date.now();      

      if (isLoggedIn) {
        try {
          const lastActivity = await AsyncStorage.getItem('@exosapp_last_activity');
          
          if (lastActivity) {
            const elapsed = now - parseInt(lastActivity);
            
            if (elapsed > FIVE_MINUTES) {
              // Si pasaron más de 5 min, expiramos la sesión
              await setIsLoggedIn(false);
              router.replace('/login');
              return;
            }
          }
        } catch (e) {
          console.error("Error verificando expiración", e);
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