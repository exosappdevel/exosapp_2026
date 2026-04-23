import { useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity,
    Modal, Platform, Alert
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { hexToRGBA } from './_Functions'

interface iPage {
    name: string;
    icon: any;
    previous: any | null; // Para manejar el botón "atrás"
    show_user: boolean;
    show_menu: boolean;
}


export const _Header = ({ page_info }: { page_info: iPage }) => {
    const router = useRouter();
    const { theme, user, t, logout } = useApp(); // Obtenemos el contexto
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = async () => {
        setShowUserMenu(false);

        if (Platform.OS === 'web') {
            // En Web usamos el confirm nativo del navegador
            const confirmar = window.confirm(t("userMenu.confirm_logout"));
            if (confirmar) {
                await logout();
                router.replace('/login');
            }
        } else {
            // En Móvil usamos el Alert elegante de RN
            Alert.alert(
                t("userMenu.logout"),
                t("userMenu.confirm_logout"),
                [
                    { text: t("common.cancel"), style: "cancel" },
                    {
                        text: t("common.yes"), style: "destructive", onPress: async () => {
                            await logout();
                            router.replace('/login');
                        }
                    }
                ]
            );
        }
    };
    return (
        <View style={[styles.header, { backgroundColor: hexToRGBA(theme.card, 0.5), borderBottomColor: hexToRGBA(theme.border, 0.5) }]}>
            {/* Lado Izquierdo: Título de la página o Botón Atrás */}
            <View style={styles.headerLeft}>
                {page_info.previous ? (
                    <TouchableOpacity style={styles.backButton} onPress={() => page_info?.previous == "" ? router.back() : router.replace({ pathname: page_info?.previous })}>
                        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.text} />
                    </TouchableOpacity>
                ) : null}

                <MaterialCommunityIcons name={page_info?.icon} size={20} color={theme.accent} style={[{
                    paddingLeft: 5, paddingRight: 5, textShadowColor: 'rgba(255,255,255, 0.2)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2,
                }]} />
                <Text style={[styles.pageTitle, { color: theme.text }]}>{page_info.name}</Text>
            </View>

            {/* Lado Derecho: Menú de Usuario */}
            {page_info.show_user && (
                <TouchableOpacity onPress={() => setShowUserMenu(true)}>
                    <View style={styles.userInfo}>
                        <MaterialCommunityIcons name="account-circle" size={20} color={theme.accent} style={{
                            textShadowColor: 'rgba(255, 255, 255, 0.3)',
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 2,
                        }} />
                        <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                            {user?.alias_usuario || 'Usuario'}
                        </Text>
                        <MaterialCommunityIcons name="menu" size={20} color={theme.text} />
                    </View>
                </TouchableOpacity>
            )}


            {/* User Menu Modal */}
            <Modal
                visible={showUserMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowUserMenu(false)}
            >
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setShowUserMenu(false)}
                >
                    <View style={[styles.userMenuContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <TouchableOpacity
                            style={styles.userMenuItem}
                            onPress={() => {
                                setShowUserMenu(false);
                                router.push('/home');
                            }}
                        >
                            <MaterialCommunityIcons name="home" size={24} color={theme.accent} />
                            <Text style={[styles.userMenuText, { color: theme.text }]}>{t('screens.home')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.userMenuItem}
                            onPress={() => {
                                setShowUserMenu(false);
                                router.push('/profile');
                            }}
                        >
                            <MaterialCommunityIcons name="account-cog" size={24} color={theme.accent} />
                            <Text style={[styles.userMenuText, { color: theme.text }]}>{t('screens.perfil')}</Text>
                        </TouchableOpacity>

                        <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

                        <TouchableOpacity
                            style={styles.userMenuItem}
                            onPress={handleLogout}
                        >
                            <MaterialCommunityIcons name="logout" size={24} color="#f56565" />
                            <Text style={[styles.userMenuText, { color: '#f56565' }]}>{t('userMenu.logout')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};


const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 10 : 5, // Ajustado para Notch de iOS
        paddingBottom: 3,
        borderBottomWidth: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, // Permite que el título ocupe el espacio disponible
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Estilos del Menú Modal de Usuario
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 30,
        paddingRight: 5,
    },
    userMenuContainer: {
        borderRadius: 12,
        padding: 10,
        minWidth: 180,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    userMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 15,
    },
    menuDivider: {
        height: 1,
        marginVertical: 5,
    },
    menuContent: {
        marginTop: 80,
        marginRight: 20,
        width: 220,
        borderRadius: 15,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
    },
    
    menuItemText: {
        fontSize: 16,
        marginLeft: 10,
    },
    userMenuText: {
        marginLeft: 12,
        fontSize: 16,
    },
    
    pageTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 255, 255, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
    },
    userName: {
        fontSize: 12,
        fontWeight: '600',
        marginHorizontal: 8,
        maxWidth: 120, // Evita que nombres largos rompan el diseño
        textShadowColor: 'rgba(255, 255, 255, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
     backButton: {
        marginRight: 10,
        padding: 5, // Aumenta el área de toque
    },
});