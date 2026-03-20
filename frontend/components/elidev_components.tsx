import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Platform, Alert } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useRouter } from 'expo-router';
import CustomModal from '../components/CustomModal';
import { Href } from 'expo-router';

// 1. Definición de la Interfaz (en JS es descriptiva, en TS es funcional)
// Si usas TypeScript, asegúrate de que el archivo termine en .tsx
interface iPage {
    name: string;
    icon: any;
    previous: any | null; // Para manejar el botón "atrás"
    show_user: boolean;
    show_menu: boolean;
}

// 2. Componente Header Reutilizable
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
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            {/* Lado Izquierdo: Título de la página o Botón Atrás */}
            <View style={styles.headerLeft}>
                {page_info.previous ? (
                    <TouchableOpacity style={styles.backButton} onPress={() => page_info?.previous==""? router.back():router.replace(page_info?.previous)}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
                    </TouchableOpacity>
                ) : null}

                <MaterialCommunityIcons name={page_info?.icon} size={24} color={theme.accent} style={[{paddingLeft:5, paddingRight:5}]} />
                <Text style={[styles.pageTitle, { color: theme.text }]}>{page_info.name}</Text>
            </View>

            {/* Lado Derecho: Menú de Usuario */}
            {page_info.show_user && (
                <TouchableOpacity onPress={() => setShowUserMenu(true)}>
                    <View style={styles.userInfo}>
                        <MaterialCommunityIcons name="account-circle" size={32} color={theme.accent} />
                        <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                            {user?.alias_usuario || 'Usuario'}
                        </Text>
                        <MaterialCommunityIcons name="menu" size={24} color={theme.text} />
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

export const _Footer = () => {
    const { theme, user, t, logout } = useApp(); // Obtenemos el contexto
    const router = useRouter();
    return (
        /* Footer */
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <TouchableOpacity
                style={styles.userMenuItem}
                onPress={() => {
                    router.push('/profile');
                }}
            >
                <MaterialCommunityIcons name="warehouse" size={24} color={theme.accent} />
                <Text style={[styles.footerText, { color: theme.text }]}>
                    {user.almacen_nombre || user.almacen_codigo || 'Sin almacén'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
export const _Footer_custom = ({ children }: { children: any })=> {
    const { theme, user, t, logout } = useApp(); // Obtenemos el contexto
    const router = useRouter();
    return (
        /* Footer */
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          {children}
        </View>
    );
}

export const _TouchableWithoutFeedback = ({ children }: { children: any }) => {
    /*onPress={Keyboard.dismiss}*/
    return <>
        {children}
    </>

};

interface MenuItem {
    id: string;
    titleKey: string;
    icon: string;
    color: string;
    href: any;
}
interface MenuGridProps {
    menuItems: MenuItem[];               // Lista de ítems
}
export const _MenuGrid = ({ menuItems }: MenuGridProps) => {
    const { theme, t } = useApp();
    const router = useRouter();

    const grid_item_press = (item: typeof menuItems[0]) => {
        if (typeof item.href == "function")
            item.href();
        else if (typeof item.href == "string")

            router.push(item.href as any);
    }
    const renderMenuItem = ({ item }: { item: typeof menuItems[0] }) => (
        <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => grid_item_press(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={40} color={item.color} />
            </View>
            <Text style={[styles.menuTitle, { color: theme.text }]}>{t(item.titleKey)}</Text>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={menuItems}
            numColumns={2}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.menuGrid}
            columnWrapperStyle={styles.menuRow}
            renderItem={renderMenuItem}
        />
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 45 : 15, // Ajustado para Notch de iOS
        paddingBottom: 15,
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
    backButton: {
        marginRight: 10,
        padding: 5, // Aumenta el área de toque
    },
    pageTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        marginHorizontal: 8,
        maxWidth: 120, // Evita que nombres largos rompan el diseño
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    menuDropdown: {
        marginTop: Platform.OS === 'ios' ? 90 : 60,
        marginRight: 15,
        padding: 10,
        borderRadius: 12,
        minWidth: 180,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    menuItem: {
        width: '48%',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 10,
    },
    userMenuText: {
        marginLeft: 12,
        fontSize: 16,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 80,
        paddingRight: 15,
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
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    menuDivider: {
        height: 1,
        marginVertical: 5,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        borderTopWidth: 1,
    },
    footerText: {
        marginLeft: 10,
        fontSize: 14,
        fontWeight: '500',
    },
    menuGrid: {
        padding: 15,
        flexGrow: 1,
    },
    menuRow: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});