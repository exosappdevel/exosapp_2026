import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import ApiService from '../services/ApiServices';

export default function Index() {
  const router = useRouter();
  const { appConfig, isLoggedIn } = useApp();

  useEffect(() => {
    // Initialize API Service
    ApiService.init(appConfig);
    
    // Small delay to ensure context is ready
    const timer = setTimeout(() => {
      if (isLoggedIn) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    }, 500);

    return () => clearTimeout(timer);
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