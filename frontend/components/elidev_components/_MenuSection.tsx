import {
    View, Text, StyleSheet, TouchableOpacity 
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { Href } from 'expo-router';
import { iMenuItem } from "@/context/AppmenuItems";
import ApiService from "../../services/ApiServices";
import {hexToRGBA} from './_Functions'

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
                {/* 
                <MaterialCommunityIcons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={24}
                    color="white"
                    style={{
                        textShadowColor: 'rgba(0, 0, 0, 0.8)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                    }}
                />*/}
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

const styles = StyleSheet.create({
    sectionContainer: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sectionIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    sectionItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    sectionItemIcon: {
        marginRight: 15,
    },
    sectionItemText: {
        fontSize: 15,
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
});