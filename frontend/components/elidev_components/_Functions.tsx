import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

export const hexToRGBA = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const formatDate = (fecha: Date) => {
    const day = fecha.getDate().toString().padStart(2, '0');
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const year = fecha.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Ejecuta un sonido de éxito y una vibración ligera (haptic feedback)
 */
export const playSuccessSound = async () => {
    try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const player = createAudioPlayer(
            require('../../assets/sounds/success.mp3')
        );
        player.play();

        // Liberar memoria al terminar
        player.addListener('playbackStatusUpdate', (status) => {
            if (status.didJustFinish) {
                player.remove();
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        const player = createAudioPlayer(
            require('../../assets/sounds/error.mp3')
        );
        player.play();

        // Liberar memoria al terminar
        player.addListener('playbackStatusUpdate', (status) => {
            if (status.didJustFinish) {
                player.remove();
            }
        });
    } catch (error) {
        console.log('Error al reproducir sonido de error:', error);
    }
};
