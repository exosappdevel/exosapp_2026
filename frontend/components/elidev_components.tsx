import { Dispatch, SetStateAction, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Platform, Alert, Switch, TouchableWithoutFeedback, Keyboard, Pressable } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useRouter } from 'expo-router';
import CustomModal from '../components/CustomModal';
import { Href } from 'expo-router';
import { iMenuItem } from "@/context/AppmenuItems";
import ApiService from "../services/ApiServices";

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
                    <TouchableOpacity style={styles.backButton} onPress={() => page_info?.previous == "" ? router.back() : router.replace({ pathname: page_info?.previous })}>
                        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.text} />
                    </TouchableOpacity>
                ) : null}

                <MaterialCommunityIcons name={page_info?.icon} size={20} color={theme.accent} style={[{ paddingLeft: 5, paddingRight: 5 }]} />
                <Text style={[styles.pageTitle, { color: theme.text }]}>{page_info.name}</Text>
            </View>

            {/* Lado Derecho: Menú de Usuario */}
            {page_info.show_user && (
                <TouchableOpacity onPress={() => setShowUserMenu(true)}>
                    <View style={styles.userInfo}>
                        <MaterialCommunityIcons name="account-circle" size={20} color={theme.accent} />
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
export const _Footer_custom = ({ children }: { children: any }) => {
    const { theme, user, t, logout } = useApp(); // Obtenemos el contexto
    const router = useRouter();
    return (
        /* Footer */
        <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            {children}
        </View>
    );
}


export const _TouchableWithoutFeedback = ({ children }: { children: React.ReactNode }) => {

    // Función para cerrar teclado en Mobile
    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Keyboard.dismiss();
        }
    };

    // React Native requiere que TouchableWithoutFeedback tenga UN solo hijo.
    // Envolvemos children en un View para garantizar que sea un único elemento.
    return (
        <TouchableWithoutFeedback onPress={handlePress} accessible={false}>
            <Pressable
                onPress={() => {
                    if (Platform.OS !== 'web') Keyboard.dismiss();
                }}
                style={{ flex: 1 }}
                // Esta propiedad es vital: permite que el scroll funcione aunque presiones aquí
                hitSlop={0}
            >
                <View pointerEvents="box-none" style={{ flex: 1 }}>
                    {children}
                </View>
            </Pressable>
        </TouchableWithoutFeedback>
    );
};

interface MenuGridProps {
    menuItems: iMenuItem[];               // Lista de ítems    
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
}

export const _MenuSection = ({ title, icon, menuItems, defaultOpen = false }: { title: string, icon: any, menuItems: any[], defaultOpen?: boolean }) => {
    const { theme } = useApp();
    const [isOpen, setIsOpen] = useState(defaultOpen); // Por defecto empieza abierto    

    return (
        <View style={[styles.iconGroup_Container, { borderColor: theme.border, backgroundColor: theme.card }]}>
            {/* Encabezado Cliqueable */}
            <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => setIsOpen(!isOpen)}
                activeOpacity={0.7}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <MaterialCommunityIcons
                        name={icon}
                        size={26}
                        color={theme.text}
                        style={{ marginRight: 10 }}
                    />
                    <Text style={[styles.iconGroup_Title, { color: theme.text }]}>
                        {title}
                    </Text>
                </View>

                {/* Icono indicador de estado */}
                <MaterialCommunityIcons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={theme.text}
                    style={{ opacity: 0.5 }}
                />
            </TouchableOpacity>

            {/* Contenido Condicional */}
            {isOpen && (
                <View style={styles.listWrapper}>
                    <_MenuList menuItems={menuItems} />
                </View>
            )}
        </View>
    );
};

// Busca el componente _MenuListItem y reemplázalo por este:
const _MenuListItem = ({ item }: { item: iMenuItem }) => {
    const { theme, t, user, setUser, language } = useApp(); // Extraemos user y setUser
    const router = useRouter();

    // Verificamos si el ítem actual YA está en favoritos
    const isFavorite = user.menu_favorites?.includes(item.id);    

    const handlePress = () => {        
        if (typeof item.href === 'function') {
            item.href();
        } else if (item.href) {
            router.push(item.href as Href);
        }
    };

    // Función para AGREGAR
    const addFavorite = async () => {
        if (!isFavorite) {
            const newFavoritesArray = [...(user.menu_favorites || []), item.id];
            updateFavorites(newFavoritesArray);
        }
    };

    // Función para ELIMINAR
    const removeFavorite = async () => {
        if (isFavorite) {
            const newFavoritesArray = user.menu_favorites.filter((id: string) => id !== item.id);
            updateFavorites(newFavoritesArray);
        }
    };

    // Lógica común de guardado (usa ApiService.request como en save_profile)
    const updateFavorites = async (newArray: string[]) => {
        // 1. Actualización local inmediata
        setUser((prev: any) => ({
            ...prev,
            menu_favorites: newArray
        }));

        // 2. Formateo a string separado por ;
        const favString = newArray.join(';');

        try {
            // 3. Sincronización con servidor usando la misma lógica de ApiService
            // Se envía el objeto usuario con el string de favoritos actualizado
            await ApiService.request('save_profile', {
                ...user,
                menu_favorites: favString
            });
        } catch (error) {
            console.error("Error al sincronizar favoritos:", error);
        }
    };



    return (
        <TouchableOpacity
            style={[styles.listItemContainer, { borderBottomColor: theme.border }]}
            onPress={handlePress}
        >
            <View style={[styles.listIconContainer, { backgroundColor: item.color + '20' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
            </View>

            <View style={styles.listTextContainer}>
                <Text style={[styles.listTitle, { color: theme.text }]}>
                    {t(item.titleKey)}
                </Text>

                {/* Lógica de iconos dinámica */}
                {isFavorite ? (
                    // Icono para ELIMINAR (Estrella rellena)
                    <TouchableOpacity onPress={removeFavorite} style={{ padding: 10 }}>
                        <MaterialCommunityIcons name="star" size={22} color="#ecc94b" />
                    </TouchableOpacity>
                ) : (
                    // Icono para AGREGAR (Estrella vacía)
                    <TouchableOpacity onPress={addFavorite} style={{ padding: 10 }}>
                        <MaterialCommunityIcons name="star-outline" size={22} color={theme.textSub} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

// Componente principal que recibe el array
export const _MenuList = ({ menuItems }: { menuItems: iMenuItem[]}) => {
    return (
        <View style={styles.listWrapper}>
            {menuItems.map((item) => (
                <_MenuListItem key={item.id} item={item}/>
            ))}
        </View>
    );
};

interface checkBoxOptions {
    key_id: string;
    text: string;
    use_switch: boolean;
    value: boolean;
    setValue: Dispatch<SetStateAction<boolean>>;
};

export const _checkBox = ({ key_id, text, use_switch, value, setValue }: checkBoxOptions) => {
    const { theme, user, t, logout } = useApp(); // Obtenemos el contexto    
    if (use_switch) {
        return (
            <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 }}>
                <Text
                    selectable={false}
                    pointerEvents="none"
                    style={{ color: theme.text, fontSize: 12, flex: 1, marginRight: 5, textAlign: "right" }}
                    ellipsizeMode="tail"
                >{text}</Text>
                <Switch
                    key={key_id}
                    value={value}
                    onValueChange={setValue}
                    trackColor={{ false: theme.textSub, true: theme.text }}
                />
            </View>
        );
    }
    else {
        return <TouchableOpacity
            onPress={() => setValue(!value)}
            activeOpacity={0.6}
            style={styles.checkboxContainer}
        >
            <MaterialCommunityIcons
                name={value ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={24}
                color={value ? theme.text : theme.textSub}
            />
            <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                {text}
            </Text>
        </TouchableOpacity>
    }
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 15 : 15, // Ajustado para Notch de iOS
        paddingBottom: 5,
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
        fontSize: 16,
        fontWeight: 'bold',
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
        paddingVertical: 5,
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
        paddingVertical: Platform.OS === 'ios' ? 5 : 5,
        borderTopWidth: 1,
        color: "green",
        marginBottom: (Platform.OS === 'ios') ? -28 : (Platform.OS === 'android') ? 15 : 0,
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
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    checkLabel: { marginLeft: 10, fontSize: 15 },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12, // Espacio suficiente para el touch
        paddingHorizontal: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    checkboxLabel: {
        marginLeft: 12,
        fontSize: 15,
        flex: 1,
    },
    iconGroup_Container: {
        width: '94%',
        alignSelf: 'center',
        borderRadius: 20,
        marginVertical: 12,
        padding: 15,
        borderWidth: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden', // Importante para que el contenido no sobresalga al cerrar
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Para mandar el chevron a la derecha
        paddingVertical: 5,
    },
    iconGroup_Title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemsWrapper: {
        paddingTop: 5,
    },
    listWrapper: {
        width: '100%',
    },
    listItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 5,
    },
    listIconContainer: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    listTextContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
});