import { View, Text, StyleSheet, Platform,ImageBackground } from "react-native";
import { useApp } from '../../context/AppContext';

const localBackgrounds: { [key: string]: any } = {
    'default': require('../../assets/images/background/almacen_background_default.png'),
    '1': require('../../assets/images/background/almacen_background_1.png'),
    '2': require('../../assets/images/background/almacen_background_2.png')
};

export const _Background = ({ children, id_almacen }: { children: any, id_almacen: string }) => {
    const { theme, appConfig } = useApp();
    const source = Platform.OS === 'web'?localBackgrounds[id_almacen]: localBackgrounds[id_almacen] || localBackgrounds['default'];
    // "exos" es el servidor de producción: cualquier otro (local, localip,
    // exodos) muestra esta leyenda para no confundir datos de prueba con
    // datos reales al ver la app.
    const showServerLegend = !!appConfig?.backend_server && appConfig.backend_server !== 'exos';

    return (
        <View style={[styles.root,Platform.OS === 'web' && { height: '100vh' as any, minHeight: '100vh' as any }]}>
            {/* Fondo absoluto, ignora SafeArea, cubre TODO incluyendo notch y barra inferior */}
            <ImageBackground
                source={source}
                resizeMode={Platform.OS === 'web'?"stretch":"cover"}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.bg_mask }]} />

            {showServerLegend && (
                <View style={styles.serverLegendContainer} pointerEvents="none">
                    <Text style={styles.serverLegendText}>
                        Servidor: {appConfig.backend_server.toUpperCase()}
                    </Text>
                </View>
            )}

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
    serverLegendContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serverLegendText: {
        color: 'rgba(251, 255, 0, 0.42)',
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 120,
    },
});