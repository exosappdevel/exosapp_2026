import React, { useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Platform,ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useApp } from '../../context/AppContext';

interface ZoomableProps {
  children: React.ReactNode;
  showShare?: boolean; // Propiedad añadida (false por defecto)
  shareButtonStyle?: ViewStyle;
}

export const _ZoomableView = ({ children, showShare = false,shareButtonStyle }: ZoomableProps) => {
  const { theme } = useApp();

  // Referencia para capturar la vista del ViewShot
  const viewShotRef = useRef<ViewShot>(null);

  // Valores compartidos de Reanimated para controlar la escala
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // Definición del gesto Pinch (pinza con dos dedos)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      // El Math.max evita que hagan el View infinitamente pequeño (mínimo 0.5x)
      // El Math.min evita que lo hagan gigante (máximo 4x)
      scale.value = Math.max(0.5, Math.min(savedScale.value * event.scale, 4));
    })
    .onEnd(() => {
      // Guardamos la escala actual para que el siguiente zoom empiece desde ahí
      savedScale.value = scale.value;
    });

  // Estilo animado que se aplica al contenedor
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Función para capturar y compartir el contenido en formato PNG
  const handleShare = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Compartir', 'La función de compartir captura no está soportada en entorno Web nativo.');
      return;
    }

    try {
      // Validamos si compartir está disponible en el dispositivo
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Compartir archivos no está disponible en este dispositivo.');
        return;
      }

      // Convertimos el ViewShot a una imagen PNG temporal en disco
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });

      // Abrimos el menú nativo del OS (WhatsApp, Guardar Imagen, Slack, AirDrop, etc)
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Compartir captura',
        mimeType: 'image/png',
      });

    } catch (error) {
      console.error('Error al compartir captura:', error);
      Alert.alert('Error', 'No se pudo generar o compartir la imagen de la vista.');
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={pinchGesture}>
        {/* ViewShot envuelve la caja de animación para capturar el contenido renderizado */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1.0 }}
          style={[styles.shotWrapper, { backgroundColor: theme.bg }]}
        >
          <Animated.View style={[styles.zoomBox, animatedStyle]}>
            {children}
          </Animated.View>
        </ViewShot>
      </GestureDetector>

      {/* Botón flotante superior derecho de compartir */}
      {showShare && (
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme.card, borderColor: theme.border },
            shareButtonStyle
          ]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="share-variant" size={22} color={theme.text} />
        </TouchableOpacity>
      )}
    </GestureHandlerRootView>
  );
};

// En el StyleSheet.create de _ZoomableView.tsx

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    width: '100%',            // Asegura ocupar todo el ancho del acordeón
  },
  shotWrapper: {
    width: '100%',
    // Eliminamos alignItems y justifyContent 'center' para que no comprima al hijo
  },
  zoomBox: {
    width: '100%',
    // Eliminamos alignItems y justifyContent 'center' para que el texto/detalles
    // puedan usar flex-direction: 'row' y estirarse de extremo a extremo
  },
  shareButton: {
    position: 'absolute',
    top: -18,                   // Reducido un poco para que no choque con los bordes del acordeón
    right: 5,
    width: 36,                // Un tamaño ligeramente más compacto
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});