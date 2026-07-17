import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    LayoutAnimation,
    ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { hexToRGBA } from './_Functions';


interface AccordionProps {
    title: React.ReactNode;    
    children: React.ReactNode;
    isOpen: boolean;
    onPress: () => void;    
    scrollRef?: React.RefObject<ScrollView | null>; // Acepta null para evitar errores de tipo
    yoff?: number;
    visible?:boolean;
    backgroundColor?:string;
    HideTitleOnOpen?: boolean;
}

export const _AccordionSection = ({ 
    title, 
    children, 
    isOpen, 
    onPress, 
    scrollRef, 
    yoff,
    visible = true,
    backgroundColor,
    HideTitleOnOpen = false
}: AccordionProps) => {
    
    const { theme } = useApp();
    
    if (!visible) return null;

    const handlePress = () => {                
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onPress();        

        // Lógica de Scroll automático al abrir
        if (!isOpen && scrollRef?.current && yoff !== undefined) {
            setTimeout(() => {                
                scrollRef.current?.scrollTo({
                    y: yoff,
                    animated: true,
                });
            }, 0);
        }
    };

    const mostrarTitulo = !(HideTitleOnOpen && isOpen);

    return (
        <View style={[
            styles.accordionContainer, 
            { borderColor: theme.border, backgroundColor: hexToRGBA(theme.bg,0.8) }
        ]}>
            <TouchableOpacity
                style={[
                    styles.accordionHeader,
                    {                         
                        backgroundColor: backgroundColor? backgroundColor :  (isOpen ?  'rgba(255,255,255,0.3)' : 'transparent'),
                        // Si el título se oculta, justificamos al final para que el ícono se quede a la derecha
                        justifyContent: mostrarTitulo ? 'space-between' : 'flex-end'
                    }
                ]}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                {/* LÓGICA DE TÍTULO CUSTOM */}
                {mostrarTitulo ? (
                <View style={{ flex: 1 }}>
                    {typeof title === 'string' ? (
                        <Text style={[styles.accordionTitle, { color: theme.text }]}>
                            {title}
                        </Text>
                    ) : (
                        title // Si es un componente (View, Text custom, etc), se renderiza tal cual
                    )}
                </View>
                ) : (
                    /* Contenedor vacío con la misma altura mínima que el ícono (24px) 
                      para asegurar estabilidad dimensional en el layout de iOS y Android.
                    */
                    <View style={{ height: 24 }} />
                )}
                <MaterialCommunityIcons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={theme.text}
                />
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.accordionContent}>
                    {children}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    accordionContainer: {
        borderWidth: 1,
        borderRadius: 30,
        marginBottom: 12,
        overflow: 'hidden',        
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal:25,
        alignItems: 'center',
        minHeight: 54,
    },
    accordionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    accordionContent: {
        padding: 15,
    },
});