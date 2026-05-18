import React, { useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Platform, ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useApp } from '../../context/AppContext';

interface ZoomableProps {
  children: React.ReactNode;
  showShare?: boolean;
  shareButtonStyle?: ViewStyle;
}

export const _ZoomableView = ({ children, showShare = false, shareButtonStyle }: ZoomableProps) => {
  const { theme } = useApp();
  const viewShotRef = useRef<ViewShot>(null);

  // Estados compartidos para el Zoom (Escala)
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // Estados compartidos para el Movimiento (Traslación X / Y)
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // 1. GESTO DE PINCH (ZOOM)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      // Limitamos el zoom mínimo estrictamente a 1 (tamaño actual) y máximo a 4
      scale.value = Math.max(1, Math.min(savedScale.value * event.scale, 4));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // 2. GESTO DE PAN (ARRASTRE / MOVIMIENTO)
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Solo permitimos mover el contenido si el usuario ha hecho zoom (escala > 1)
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      if (scale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        // Si el usuario regresa al tamaño 1, reseteamos la posición suavemente
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // Gesto Doble Tap para restaurar rápidamente el estado original (Opcional y muy útil)
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      savedScale.value = 1;
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  // Combinamos los gestos para que se ejecuten de manera simultánea
  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  // Estilos de animación aplicando tanto la escala como el desplazamiento X, Y
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const handleShare = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Compartir', 'La función de compartir captura no está soportada en entorno Web nativo.');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Compartir archivos no está disponible en este dispositivo.');
        return;
      }

      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });

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
      <GestureDetector gesture={composedGesture}>
        {/* El ViewShot mantiene overflow: 'hidden' para recortar el contenido en los bordes de la tarjeta */}
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

      {showShare && (
        <TouchableOpacity
          style={[
            styles.shareButton,
            { backgroundColor: theme.card, borderColor: theme.border },
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    width: '100%'    
  },
  shotWrapper: {
    width: '100%',
    overflow: 'hidden', // Crucial: Mantiene el contenido ampliado dentro de los límites del componente
  },
  zoomBox: {
    width: '100%',
  },
  shareButton: {
    position: 'absolute',
    top: -18,
    right: 5,
    width: 36,
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