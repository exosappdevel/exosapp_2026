import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { iMenuItem } from "@/context/AppmenuItems";
import {hexToRGBA} from './_Functions'

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

const styles = StyleSheet.create({
    menuGridContainer: {
        flex: 1,
        width: '100%',
    },
    menuGridContent: {
        paddingTop: 10,
        paddingBottom: 120, // Espacio extra para el footer
    },
    menuListContainer: {
        flex: 1,
        width: '100%',
    },
    menuListContent: {
        paddingTop: 10,
        paddingBottom: 120,
    },
    menuItem: {
        width: '48%',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
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
     menuGrid: {
        padding: 15,
        flexGrow: 1,
    },
    menuRow: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
});

