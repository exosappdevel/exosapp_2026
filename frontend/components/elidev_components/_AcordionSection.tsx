import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    LayoutAnimation,
    Platform,
    UIManager,
    ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { hexToRGBA } from './_Functions';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionProps {
    title: React.ReactNode;    
    children: React.ReactNode;
    isOpen: boolean;
    onPress: () => void;    
    scrollRef?: React.RefObject<ScrollView | null>; // Acepta null para evitar errores de tipo
    yoff?: number;
    visible?:boolean;
    backgroundColor?:string;
}

export const _AccordionSection = ({ 
    title, 
    children, 
    isOpen, 
    onPress, 
    scrollRef, 
    yoff,
    visible = true,
    backgroundColor
}: AccordionProps) => {
    
    const { theme } = useApp();
    
    if (!visible) return null;
    const containerBg = backgroundColor || hexToRGBA(theme.card, 0.5);

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

    return (
        <View style={[
            styles.accordionContainer, 
            { borderColor: theme.border, backgroundColor: containerBg }
        ]}>
            <TouchableOpacity
                style={[
                    styles.accordionHeader,
                    { backgroundColor: isOpen ? theme.card + '10' : 'transparent' }
                ]}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                {/* LÓGICA DE TÍTULO CUSTOM */}
                <View style={{ flex: 1 }}>
                    {typeof title === 'string' ? (
                        <Text style={[styles.accordionTitle, { color: theme.text }]}>
                            {title}
                        </Text>
                    ) : (
                        title // Si es un componente (View, Text custom, etc), se renderiza tal cual
                    )}
                </View>
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
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        ...({
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
        } as any),
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        alignItems: 'center',
    },
    accordionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    accordionContent: {
        padding: 15,
    },
});