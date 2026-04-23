import {  useEffect, useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, Platform
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { PanResponder, Animated } from 'react-native';
import {hexToRGBA} from './_Functions'

interface FooterProps {
    Show_Almacen?: boolean;
    Main_action?: 'home' | 'back';
    children?: React.ReactNode;
}

export const _Footer = ({
    Show_Almacen = true,
    Main_action = 'home',
    children
}: FooterProps) => {
    const router = useRouter();
    const { theme, user } = useApp();

    // 1. Valor animado para la altura
    const baseHeight = Show_Almacen ? 55 : 75; // Si es false, sube a 100 para dar espacio a los botones
    const maxHeight = Show_Almacen ? 90 : 110; // El límite de estiramiento también aumenta
    const footerHeight = useState(new Animated.Value(baseHeight))[0];

    useEffect(() => {
        Animated.spring(footerHeight, {
            toValue: baseHeight,
            useNativeDriver: false,
        }).start();
    }, [Show_Almacen]);

    const handleNavigation = () => {
        // ... (tu lógica de navegación actual se mantiene igual)
        router.replace('/home' as any);
    };

    const footerPanResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            // Detectar movimiento vertical hacia arriba
            return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy < -10;
        },
        onPanResponderMove: (_, gestureState) => {
            if (gestureState.dy < 0) {
                // Calculamos la nueva altura: base + el arrastre (dy es negativo, por eso se resta)
                const newHeight = baseHeight - gestureState.dy;

                // Limitamos la altura máxima para el efecto visual
                if (newHeight <= maxHeight) {
                    footerHeight.setValue(newHeight);
                }
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            // 1. Gesto hacia ARRIBA -> Ir a Home
            if (gestureState.dy < -60) {
                router.replace('/home' as any);
            }
            // 2. Gesto hacia la IZQUIERDA -> Back (atrás)
            else if (gestureState.dx < -60) {
                router.back();
            }

            // Siempre regresamos a la altura original con una animación suave (efecto resorte)
            Animated.spring(footerHeight, {
                toValue: baseHeight,
                useNativeDriver: false, // La altura no es compatible con native driver
                friction: 5,
                tension: 40
            }).start();
        },
        onPanResponderTerminate: () => {
            // Regresar a base si el gesto se cancela
            Animated.spring(footerHeight, {
                toValue: baseHeight,
                useNativeDriver: false
            }).start();
        }
    });

    return (
        <Animated.View // 2. Convertir a Animated.View
            {...footerPanResponder.panHandlers}
            style={[
                styles.footerContainer,
                {
                    backgroundColor: hexToRGBA(theme.card, 0.5),
                    borderTopColor: hexToRGBA(theme.border, 0.3),
                    height: footerHeight, // 3. Vincular altura animada
                    paddingBottom: Platform.OS === 'ios' ? 15 : 0 // Mejorar espacio táctil                    
                }
            ]}
        >
            <TouchableOpacity
                style={styles.footerTab}
                activeOpacity={0.7}

            >
                <View style={[
                    styles.homeIndicator,
                    { backgroundColor: theme.text, opacity: 0.3 }
                ]} />

                {Show_Almacen ? (
                    <View style={styles.footerContentRow}>
                        <MaterialCommunityIcons
                            name="warehouse"
                            size={22}
                            color={hexToRGBA(theme.text, 0.8)}
                        />
                        <Text style={[styles.footerText, { color: theme.text }]}>
                            {user?.almacen_nombre || "Almacén"}
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.footerContentChildreen]}>
                        {children}
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    footerContainer: {
        borderTopWidth: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        ...({
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
        } as any),
    },
    footerTab: {
        alignItems: 'center',
        width: '100%',
        justifyContent: 'flex-start',
        paddingTop: 5,
    },
    homeIndicator: {
        width: 60,
        height: 6,
        borderRadius: 2,
        marginTop: 2,
        marginBottom: 2,
    },
    footerContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    footerText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    footerContentChildreen: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        height: 50
    },
});