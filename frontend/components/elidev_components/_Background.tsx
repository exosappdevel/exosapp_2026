import { useState } from "react";
import { View, StyleSheet, Platform,ImageBackground } from "react-native";
import { useApp } from '../../context/AppContext';
import { hexToRGBA } from './_Functions';

const localBackgrounds: { [key: string]: any } = {
    'default': require('../../assets/images/background/almacen_background_default.png'),
    '1': require('../../assets/images/background/almacen_background_1.png'),
    '2': require('../../assets/images/background/almacen_background_2.png')
};

export const _Background = ({ children, id_almacen }: { children: any, id_almacen: string }) => {
    const { theme } = useApp();
    const source = Platform.OS === 'web'?localBackgrounds['default']: localBackgrounds[id_almacen] || localBackgrounds['default'];

    return (
        <View style={[styles.root,Platform.OS === 'web' && { height: '100vh' as any, minHeight: '100vh' as any }]}>
            {/* Fondo absoluto, ignora SafeArea, cubre TODO incluyendo notch y barra inferior */}
            <ImageBackground
                source={source}
                resizeMode={Platform.OS === 'web'?"stretch":"cover"}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.bg_mask }]} />

            {/* Contenido encima, normalmente envuelto por SafeAreaView en la pantalla que lo usa */}
            <View style={styles.content}>
                {children}
            </View>
            {/*<View style={[{position:'absolute', bottom: 0,   left: 0,   right: 0, height:16, width:'100%', backgroundColor:hexToRGBA(theme.iconColor_shadow,0.3)}]}>

            </View>*/}
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});