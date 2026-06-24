import { useEffect, useState, useRef } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, Platform
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { PanResponder, Animated } from 'react-native';
import { hexToRGBA } from './_Functions'
import { _UserMenu } from './_UserMenu';

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
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [anchorPos, setAnchorPos] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const triggerRef = useRef<View>(null);

    const baseHeight = Show_Almacen ? 65 : 100;
    const maxHeight = Show_Almacen ? 90 : 110;
    const footerHeight = useState(new Animated.Value(baseHeight))[0];

    useEffect(() => {
        Animated.spring(footerHeight, {
            toValue: baseHeight,
            useNativeDriver: false,
        }).start();
    }, [Show_Almacen]);

    const openUserMenu = () => {
        if (triggerRef.current) {
            triggerRef.current.measureInWindow((x, y, width, height) => {
                setAnchorPos({ x, y, width, height });
                setShowUserMenu(true);
            });
        } else {
            setShowUserMenu(true);
        }
    };

    const footerPanResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && gestureState.dy < -10;
        },
        onPanResponderMove: (_, gestureState) => {
            if (gestureState.dy < 0) {
                const newHeight = baseHeight - gestureState.dy;
                if (newHeight <= maxHeight) {
                    footerHeight.setValue(newHeight);
                }
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dy < -60) {
                router.replace('/home' as any);
            }
            else if (gestureState.dx < -60) {
                router.back();
            }
            Animated.spring(footerHeight, {
                toValue: baseHeight,
                useNativeDriver: false,
                friction: 5,
                tension: 40
            }).start();
        },
        onPanResponderTerminate: () => {
            Animated.spring(footerHeight, {
                toValue: baseHeight,
                useNativeDriver: false
            }).start();
        }
    });

    return (
        <>
            <Animated.View
                {...footerPanResponder.panHandlers}
                style={[
                    styles.footerContainer,
                    {
                        height: footerHeight,
                        paddingBottom: Platform.OS === 'ios' ? 15 : 0
                    }
                ]}
            >
                <TouchableOpacity
                    style={[styles.footerTab, { borderTopColor: hexToRGBA(theme.iconTextColor, 0.2), borderTopWidth: 1 }]}
                    activeOpacity={0.7}
                >
                    <View style={[
                        styles.homeIndicator,
                        { backgroundColor: theme.iconTextColor, opacity: 0.8 }
                    ]} />

                    <TouchableOpacity
                        ref={triggerRef}
                        style={styles.userMenuTrigger}
                        onPress={openUserMenu}
                    >
                        <MaterialCommunityIcons
                            name="menu"
                            size={22}
                            color={hexToRGBA(theme.iconTextColor, 0.9)}
                        />
                    </TouchableOpacity>

                    {Show_Almacen ? (
                        <View style={styles.footerContentRow}>
                            <MaterialCommunityIcons
                                name="warehouse"
                                size={22}
                                color={hexToRGBA(theme.iconTextColor, 0.8)}
                            />
                            <Text style={[styles.footerText, { color: theme.iconTextColor }]}>
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

            <_UserMenu
                visible={showUserMenu}
                onClose={() => setShowUserMenu(false)}
                anchorPosition={anchorPos}
                direction="up"
            />
        </>
    );
};

const styles = StyleSheet.create({
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
    },
    footerTab: {
        alignItems: 'center',
        width: '100%',
        justifyContent: 'flex-start',
        paddingTop: 5,
    },
    homeIndicator: {
        width: '40%',
        height: 6,
        borderRadius: 2,
        marginTop: 2,
        marginBottom: 2,
    },
    userMenuTrigger: {
        position: 'absolute',
        left: 12,
        top: 8,
        padding: 4,
        zIndex: 10,
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
        height: 50,
        paddingHorizontal: 5
    },
});