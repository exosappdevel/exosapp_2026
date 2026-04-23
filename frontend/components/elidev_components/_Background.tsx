import {  useEffect, useState } from "react";
import {
    View,  StyleSheet,Platform,  ImageBackground
} from "react-native";

import { useApp } from '../../context/AppContext';
import * as FileSystem from 'expo-file-system';
import {hexToRGBA} from './_Functions'

interface BackgroundProps {
    id_almacen: string | undefined | null; // Acepta nulos del user context
    children: React.ReactNode;            // El contenido de la pantalla
}

export const _Background = ({ children, id_almacen }: { children: any, id_almacen: string }) => {
    const { theme, appConfig } = useApp();
    const baseUrl = appConfig.url.endsWith('/') ? appConfig.url : `${appConfig.url}/`;
    const SERVER_IMAGE_BASE = `${baseUrl}assets/images/${appConfig.name}/`;

    const defaultImg = require('../../assets/images/almacen_background_default.png');
    const [imageSource, setImageSource] = useState<any>(defaultImg);

    useEffect(() => {
        const resolveImage = async () => {
            if (!id_almacen) {
                setImageSource(defaultImg);
                return;
            }

            const fileName = `almacen_background_${id_almacen}.png`;
            const serverUrl = `${SERVER_IMAGE_BASE}${fileName}`;

            // --- LÓGICA PARA WEB ---
            if (Platform.OS === 'web') {
                try {
                    const response = await fetch(serverUrl, { method: 'HEAD' });
                    if (response.ok) {
                        setImageSource({ uri: serverUrl });
                    } else {
                        setImageSource(defaultImg);
                    }
                } catch {
                    setImageSource(defaultImg);
                }
                return;
            }

            // --- LÓGICA PARA MÓVIL (iOS/Android) ---
            const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
            const localUri = `${docDir}${fileName}`;

            try {
                const fileInfo = await FileSystem.getInfoAsync(localUri);

                if (fileInfo.exists) {
                    // OPCIONAL: Podrías verificar si el tamaño es muy pequeño (error 404)
                    setImageSource({ uri: localUri });
                } else {
                    const download = await FileSystem.downloadAsync(serverUrl, localUri);

                    if (download.status === 200) {
                        setImageSource({ uri: localUri });
                    } else {
                        // IMPORTANTE: Si falló la descarga (404), borramos el archivo basura creado
                        await FileSystem.deleteAsync(localUri, { idempotent: true });
                        setImageSource(defaultImg);
                    }
                }
            } catch (error) {
                console.log("Error cargando fondo:", error);
                setImageSource(defaultImg);
            }
        };

        resolveImage();
    }, [id_almacen]);

    return (
        <ImageBackground
            source={imageSource}
            resizeMode="cover"
            style={styles.backgroundImage}
        >
            <View style={[
                styles.backgroundOverlay,
                { backgroundColor: hexToRGBA(theme.bg, 0) }
            ]}>
                {children}
            </View>
        </ImageBackground>
    );
};
const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    backgroundOverlay: {
        flex: 1,        
    },
});