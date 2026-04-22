import { Children, Dispatch, SetStateAction, useEffect, useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Modal, Platform, Alert, Switch, TouchableWithoutFeedback,
    Keyboard, Pressable, ImageBackground
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useRouter } from 'expo-router';
import CustomModal from '../components/CustomModal';
import { Href } from 'expo-router';
import { iMenuItem } from "@/context/AppmenuItems";
import ApiService from "../services/ApiServices";
import { PanResponder, Animated } from 'react-native';
import * as FileSystem from 'expo-file-system';

export const hexToRGBA = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

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

// elidev_components.tsx


// elidev_components.tsx
// 1. Falta definir esta interfaz arriba de _Footer
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
    const baseHeight = Show_Almacen ? 55 : 70; // Si es false, sube a 100 para dar espacio a los botones
    const maxHeight = Show_Almacen ? 120 : 180; // El límite de estiramiento también aumenta
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
                    backgroundColor: hexToRGBA(theme.card, 0.6),
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


export const _Footer_custom = ({ children }: { children: any }) => {
    const { theme, user, t, logout } = useApp(); // Obtenemos el contexto
    const router = useRouter();
    return (
        /* Footer */
        <View
            style={[
                styles.footerContainer,
                {
                    // Restauramos la transparencia usando el color del tema con opacidad
                    backgroundColor: hexToRGBA(theme.card, 0.3),
                    borderTopColor: hexToRGBA(theme.border, 0.3)
                }
            ]}
        >
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
                <MaterialCommunityIcons name={item.icon as any} size={40} color={item.color}
                    style={{
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2
                    }} />
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

interface MenuSectionProps {
    title: string;
    icon: any;
    menuItems: iMenuItem[];
    isOpen: boolean;        // <-- Cambiamos defaultOpen por isOpen
    onToggle: () => void;   // <-- Agregamos la función de cambio
    onSoon: () => void;
}

// 2. Aplicamos los cambios al componente
export const _MenuSection = ({ title, icon, menuItems, isOpen, onToggle, onSoon }: MenuSectionProps) => {
    const { theme } = useApp();

    return (
        <View style={styles.iconGroup_Container}>
            <TouchableOpacity
                style={styles.groupHeader}
                onPress={onToggle} // Ahora llama a la función del padre
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name={icon} size={22} color={theme.iconTextColor} />
                    <Text style={[styles.iconGroup_Title, { color: theme.iconTextColor, marginLeft: 10 }]}>{title}</Text>
                </View>
                <MaterialCommunityIcons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="white"
                    style={{
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                    }}
                />
            </TouchableOpacity>

            {/* Solo mostramos el contenido si isOpen es true */}
            {isOpen && (
                <View style={styles.itemsWrapper}>
                    <View style={styles.listWrapper}>
                        {menuItems.map((item, index) => (
                            <_MenuListItem
                                key={index}
                                item={item}
                                onSoon={onSoon}
                            />
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
};

// Busca el componente _MenuListItem y reemplázalo por este:
const _MenuListItem = ({ item, onSoon }: { item: iMenuItem, onSoon: () => void }) => {
    const { theme, t, user, setUser, language } = useApp(); // Extraemos user y setUser
    const router = useRouter();

    // Verificamos si el ítem actual YA está en favoritos
    const isFavorite = user.menu_favorites?.includes(item.id);

    const handlePress = () => {
        // Nueva lógica: si NO es un string válido, ejecutamos la función del modal
        if (typeof item.href !== 'string' || item.href === "" || item.href === "soon") {
            onSoon();
        } else {
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
            <View style={[styles.listIconContainer, { backgroundColor: theme.iconColor + '80' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={theme.iconTextColor}
                    style={{
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                    }}
                />
            </View>

            <View style={styles.listTextContainer}>
                <Text style={[styles.listTitle, { color: theme.iconTextColor }]}>
                    {t(item.titleKey)}
                </Text>

                {/* Lógica de iconos dinámica */}
                {isFavorite ? (
                    // Icono para ELIMINAR (Estrella rellena)
                    <TouchableOpacity onPress={removeFavorite} style={{ padding: 10 }}>
                        <MaterialCommunityIcons name="star" size={22} color={theme.iconColor} style={{
                            textShadowColor: 'rgba(0, 0, 0, 0.8)',
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 2,
                        }} />
                    </TouchableOpacity>
                ) : (
                    // Icono para AGREGAR (Estrella vacía)
                    <TouchableOpacity onPress={addFavorite} style={{ padding: 10 }}>
                        <MaterialCommunityIcons name="star-outline" size={22} color={theme.textSub}
                            style={{
                                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                                textShadowOffset: { width: 1, height: 1 },
                                textShadowRadius: 2,
                            }} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

// Componente principal que recibe el array
export const _MenuList = ({ menuItems, onSoon }: { menuItems: iMenuItem[], onSoon: () => void }) => {
    return (
        <View style={styles.listWrapper}>
            {menuItems.map((item) => (
                <_MenuListItem key={item.id} item={item} onSoon={onSoon} />
            ))}
        </View>
    );
};

interface MenuLauncherProps {
    sections: { title: string; icon: string; id: string }[];
    activeId: string;
    onSelect: (id: string) => void;
}


export const _MenuLauncher = ({ sections, activeId, onSelect }: MenuLauncherProps) => {
    const { theme } = useApp();

    return (
        <View style={styles.launcherContainer}>
            {sections.map((section) => {
                const isActive = activeId === section.id;

                // Generamos los colores dinámicos basados en el tema
                const baseColor = hexToRGBA(theme.iconColor, 0.1); // 20% de opacidad del color de la carta
                const activeColor = hexToRGBA(theme.iconColor, 0.5); // 40% de opacidad del color de acento
                const borderColor = hexToRGBA(theme.border, 0.2); // Borde basado en el color del texto
                const baseIconColor = hexToRGBA(theme.iconTextColor, 0.5); // 40% de opacidad del color de acento
                const textColor = hexToRGBA(theme.iconTextColor, 0.7); // Borde basado en el color del texto

                return (
                    <TouchableOpacity
                        key={section.id}
                        style={styles.launcherItem}
                        onPress={() => onSelect(section.id)}
                    >
                        <View style={[
                            styles.launcherIconBox,
                            {
                                backgroundColor: baseColor,
                                borderColor: borderColor
                            },
                            isActive && {
                                backgroundColor: activeColor,
                                borderWidth: 2,
                                borderColor: theme.accent // Borde sólido del color de acento

                            }
                        ]}>
                            <MaterialCommunityIcons
                                name={section.icon as any}
                                size={32}
                                // El icono cambia según el tema o puedes dejarlo fijo
                                color={isActive ? theme.iconTextColor : baseIconColor}
                            />
                        </View>
                        <Text style={[styles.launcherText, { color: textColor }]}>
                            {section.title}
                        </Text>
                    </TouchableOpacity>
                );
            })}
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
interface BackgroundProps {
    id_almacen: string | undefined | null; // Acepta nulos del user context
    children: React.ReactNode;            // El contenido de la pantalla
}

export const _Background = ({ children, id_almacen }: { children: any, id_almacen: string }) => {
    const { theme, appConfig } = useApp();
    const baseUrl = appConfig.url.endsWith('/') ? appConfig.url : `${appConfig.url}/`;
    const SERVER_IMAGE_BASE = `${baseUrl}assets/images/${appConfig.name}/`;

    const defaultImg = require('../assets/images/almacen_background_default.png');
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
    backButton: {
        marginRight: 10,
        padding: 5, // Aumenta el área de toque
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
        paddingVertical: Platform.OS === 'ios' ? 2 : 2,


        marginBottom: (Platform.OS === 'ios') ? -28 : (Platform.OS === 'android') ? 3 : 0,
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

        // 1. Transparencia: Usamos un blanco muy tenue con 15% de opacidad
        // IMPORTANTE: Esto debe sobreescribir cualquier color sólido
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderColor: 'rgba(255, 255, 255, 0.2)',

        // 2. Sombras
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        overflow: 'hidden',

        // 3. Hack para Web sin errores de TypeScript
        // Al usar "as any", evitamos el error de "Property does not exist"
        ...({
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
        } as any),
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
        textShadowColor: 'rgba(0, 0, 0, 0.75)', // Sombra negra con 75% opacidad
        textShadowOffset: { width: 0, height: 1 }, // Desplazamiento mínimo hacia abajo
        textShadowRadius: 3, // Difuminado de la sombra
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
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,

    },
    // --- Estilos para el nuevo _Background
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    backgroundOverlay: {
        ...StyleSheet.absoluteFillObject, // Ocupa todo el ImageBackground
    },
    // ---- _Menu_launcher
    launcherContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start', // Alineado a la izquierda para que parezcan apps
        paddingHorizontal: '3%',
        marginTop: 15
    },
    launcherItem: {
        width: '25%', // 4 iconos por fila para que se vea más como iOS
        alignItems: 'center',
        marginBottom: 60,
    },
    launcherIconBox: {
        width: 62,
        height: 62,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
        ...({
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
        } as any),
    },
    launcherText: {
        fontSize: 14,
        marginTop: 6,
        textAlign: 'center',
        fontWeight: '700',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },

    //footer
    // Dentro de StyleSheet.create en elidev_components.tsx

    footerContainer: {
        // Elimina el height fijo de aquí, ya lo maneja la animación
        borderTopWidth: 1,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden', // Evita que el contenido se salga durante el estiramiento
        ...({
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
        } as any),
    },
    footerTab: {
        alignItems: 'center',
        width: '100%',
        // justifyContent: 'flex-start' para que los iconos se queden arriba mientras crece
        justifyContent: 'flex-start',
        paddingTop: 5,
    },
    homeIndicator: {
        width: 80,
        height: 3,
        borderRadius: 2,
        marginTop: 3,
        marginBottom: 3,
    },
    footerContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },
    footerContentChildreen: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        height: 50
    },
    footerText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 10,
        // Sombra para legibilidad sobre transparencias
        textShadowColor: 'rgba(255, 255, 255, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    footerIconShadow: {
        textShadowColor: 'rgba(255, 255, 255, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});