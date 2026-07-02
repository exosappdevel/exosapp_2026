import { Children, Dispatch, SetStateAction, useEffect, useState } from "react";
import {
    View, ScrollView, Text, StyleSheet, TouchableOpacity, FlatList,
    Modal, Platform, Alert, Switch, TouchableWithoutFeedback,
    Keyboard, Pressable, ImageBackground,
    ViewStyle, useWindowDimensions
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import CustomModal from '../../components/CustomModal';
import { Href } from 'expo-router';
import { iMenuItem } from "@/context/AppmenuItems";
import ApiService from "../../services/ApiServices";
import { PanResponder, Animated } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { hexToRGBA } from './_Functions'
import { _ZoomableView } from "./_ZoomableView";
import { Background } from "@react-navigation/elements";

interface ReportProps {
    children: React.ReactNode;
}

export const _Report = ({ children }: { children: any }) => {
    const { theme } = useApp(); // Traemos el hook si se requiere aquí

    // AGREGADO: return explícito para que JSX lo reconozca como un componente válido
    return (
        <_ZoomableView showShare={true} shareButtonStyle={styles.shareButton}>
            <View style={[styles.detalleContainer, { backgroundColor: theme.card }]}>
                {children}
            </View>
        </_ZoomableView>
    );
}


export const _DetalleLinea = ({ label, value, label_style, value_style }: { label: string, value: any, label_style?: any, value_style?: any }) => {
    const { theme } = useApp();
    return (
        <View style={styles.rowDetalle}>
            <Text style={[styles.labelDetalle, { color: theme.textSub }, label_style]}>{label}:</Text>
            <Text style={[styles.valueDetalle, { color: theme.accent }, value_style]}>{value || '---'}</Text>
        </View>
    );
};

export const _DetalleMultiLinea = ({ label, value, label_style, value_style }: { label: string, value: any, label_style?: any, value_style?: any }) => {
    const { theme } = useApp();
    const lineas = value && typeof value === 'string'
        ? value.split('\n').filter(linea => linea.trim() !== '')
        : [];

    return (
        <View style={styles.rowDetalleMulti}>
            <Text style={[styles.labelDetalleMulti, { color: theme.textSub }, label_style]}>{label}:</Text>
            <View style={{ width: '100%', marginTop: 4 }}>
                {lineas.length > 0 ? (
                    lineas.map((linea, index) => (
                        <Text key={index} style={[styles.valueDetalleMulti, { color: theme.accent }, value_style]}>
                            {linea}
                        </Text>
                    ))
                ) : (
                    <Text style={[styles.valueDetalleMulti, { color: theme.accent }, value_style]}>
                        ---
                    </Text>
                )}
            </View>
        </View>
    );
};

export interface _Show_Cirugia_ReportProps {
    visible: boolean;
    titulo: string;
    icon?: string;
    colorIcon?: string;
    onClose: () => void;
    item?: any
}

export const _Show_Cirugia_Report = ({ visible, titulo, onClose, item }: _Show_Cirugia_ReportProps) => {
    const { theme, t } = useApp();
    const { height } = useWindowDimensions();
    {/*<Modal visible={visible} animationType="fade" transparent={true}>*/ }
    {<View style={{position: 'absolute', width: '100%', left: 0, top: 0}}></View>}
    return (
        <Modal visible={visible} animationType="fade" transparent={true}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" canCancelContentTouches={true} style={{ maxHeight: height }} >
                <View style={[styles.modalOverlay, { backgroundColor: hexToRGBA('#000000', 0.7), paddingVertical: 30 }]}>
                    <View style={[
                        styles.modalContent,
                        { backgroundColor: theme.card, borderColor: theme.border }
                    ]}>
                        <Text style={[styles.titulo, { fontWeight: 'bold', textAlign: 'center' }]}>{titulo}</Text>
                        {item ? (
                            <_Report>
                                <_DetalleLinea label="Codigo" value={item.codigo} />
                                <_DetalleLinea label="Estatus" value={item.estatus_text} />
                                <_DetalleLinea label="Vendedor" value={item.vendedor} />
                                <_DetalleLinea label="Técnico 1" value={item.tecnico} />
                                <_DetalleLinea label="Técnico 2" value={item.tecnico2} />
                                <_DetalleLinea label="Tiempo de Surtido" value={item.tiempo_surtido} />
                                <_DetalleLinea label="Tiempo de Entrega a Técnico" value={item.tiempo_entrega_tecnico} />
                                <_DetalleLinea label="Fecha de Programación" value={item.fecha_programacion} />
                                <_DetalleLinea label="Fecha de Reprogramación" value={item.fecha_reprogramacion} />
                                <_DetalleLinea label="Fecha de Cirugía" value={item.fecha_cirugia} />
                                <_DetalleLinea label="Subdistribuidor" value={item.subdistribuidor} />
                                <_DetalleLinea label="Médico" value={item.medico} />
                                <_DetalleLinea label="Hospital" value={item.hospital} />
                                <_DetalleLinea label="Municipio" value={`${item.municipio || ''}, ${item.estado || ''}`} />

                                <View style={styles.divisor} />

                                <_DetalleMultiLinea label="Material" value={item.minialmacen} />
                                <_DetalleMultiLinea label="Equipo Poder" value={item.ep} />
                                <_DetalleMultiLinea label="Adicionales" value={item.adicionales} />
                                <_DetalleMultiLinea label="Consumibles" value={item.consumibles} />
                                <_DetalleLinea label="Solicita Estéril" value={item.esteril} />

                                <View style={styles.divisor} />

                                <_DetalleMultiLinea label="Notas" value={item.notas} />
                                <_DetalleLinea label="Remisión" value={item.remision} />
                                <_DetalleLinea
                                    label="Última Modificación"
                                    value={`${item.last_update || ''} / ${item.last_updater || ''}`}
                                />
                            </_Report>
                        ) : ""}
                        <TouchableOpacity
                            style={[styles.btnCerrar, { backgroundColor: theme.card, borderColor: theme.border }]}
                            onPress={onClose}
                        >
                            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </Modal>        
    );
};

export interface _Show_Generic_ReportProps {
    visible: boolean;
    titulo: string;
    icon?: string;
    colorIcon?: string;
    onClose: () => void;
    item?: any;
    items_fields?: any
    children?: React.ReactNode
    style_content?: ViewStyle
}
export const _Show_Generic_Report = ({ visible, titulo, onClose, item, items_fields, children, style_content }: _Show_Generic_ReportProps) => {
    const { theme, t } = useApp();
    return (
        <Modal visible={visible} animationType="fade" transparent={true} >

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" canCancelContentTouches={true} >
                <View style={[styles.modalOverlay, style_content]}>
                    <View style={[
                        styles.modalContent,
                        { backgroundColor: theme.card, borderColor: theme.border }
                    ]}>
                        <Text style={[styles.titulo, { fontWeight: 'bold', textAlign: 'center' }]}>{titulo}</Text>
                        {item ? (
                            <_Report>
                                {items_fields?.map((field: any, index: number) => {
                                    return field.tipo_linea === "linea" ? (
                                        <_DetalleLinea
                                            key={index}
                                            label={field.label}
                                            value={field.value}
                                        />
                                    ) : (
                                        <_DetalleMultiLinea
                                            key={index}
                                            label={field.label}
                                            value={field.value}
                                        />
                                    );
                                })}
                                {children}
                            </_Report>

                        ) : ""}
                        <TouchableOpacity
                            style={[styles.btnCerrar, { backgroundColor: theme.accent }]}
                            onPress={onClose}
                        >
                            <MaterialCommunityIcons name="close" size={22} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    detalleContainer: {
        paddingVertical: 15,
        paddingHorizontal: 10,
        width: '100%',
        marginBottom: 30
    },
    rowDetalle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(100,100,100,0.05)',
        width: '100%',
    },
    labelDetalle: {
        fontSize: 12,
        fontWeight: '600',
        width: '45%',
    },
    valueDetalle: {
        fontSize: 12,
        width: '50%',
        textAlign: 'right',
    },
    rowDetalleMulti: {

        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(100,100,100,0.05)',
        width: '100%',
    },
    labelDetalleMulti: {
        fontSize: 12,
        fontWeight: '600',
        width: '45%',
    },
    valueDetalleMulti: {
        fontSize: 12,
        textAlign: 'left',
        width: '100%',
    },
    shareButton: {
        position: 'absolute',
        top: -35,
        right: 30,
    },
    divisor: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 8,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "100%",
        borderRadius: 30,
        padding: 5,
        alignItems: "center",
        borderWidth: 1,
    },
    titulo: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 15,
        textAlign: "center",
    },
    mensaje: {
        fontSize: 16,
        textAlign: "center",
        marginVertical: 15,
        lineHeight: 22,
    },
    btnCerrar: {
        padding: 15,
        alignItems: "center",
        marginTop: 10,
        position: 'absolute',
        top: 3,
        left: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
    },
    btnText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
});