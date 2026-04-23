import {
    View, Text, StyleSheet, TouchableOpacity
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import {hexToRGBA} from './_Functions'

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

const styles = StyleSheet.create({    
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
        
});