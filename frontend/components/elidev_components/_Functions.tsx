import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export const hexToRGBA = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};


/**
 * Ejecuta un sonido de éxito y una vibración ligera (haptic feedback)
 */
export const playSuccessSound = async () => {
    try {
        // Vibración tipo notificación de éxito
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/success.mp3') // Asegúrate de tener este archivo
        );
        await sound.playAsync();
        
        // Liberar memoria automáticamente al terminar
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    } catch (error) {
        console.log('Error al reproducir sonido de éxito:', error);
    }
};

/**
 * Ejecuta un sonido de error y una vibración de advertencia
 */
export const playErrorSound = async () => {
    try {
        // Vibración tipo notificación de error
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        const { sound } = await Audio.Sound.createAsync(
            require('../assets/sounds/error.mp3') // Asegúrate de tener este archivo
        );
        await sound.playAsync();

        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    } catch (error) {
        console.log('Error al reproducir sonido de error:', error);
    }
};