import { Children, Dispatch, SetStateAction, useEffect, useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    Modal, Platform, Alert, Switch, TouchableWithoutFeedback,
    Keyboard, Pressable, ImageBackground
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp} from '../../context/AppContext';
import { useRouter } from 'expo-router';
import CustomModal from '../../components/CustomModal';
import { Href } from 'expo-router';
import { iMenuItem } from "@/context/AppmenuItems";
import ApiService from "../../services/ApiServices";
import { PanResponder, Animated } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { hexToRGBA } from './_Functions'
import { _ZoomableView } from "./_ZoomableView";

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
            <Text style={[styles.valueDetalle, { color: theme.text }, value_style]}>{value || '---'}</Text>
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
        <View style={{ width: '50%', marginTop: 4 }}>
          {lineas.length > 0 ? (
            lineas.map((linea, index) => (
              <Text key={index} style={[styles.valueDetalleMulti, { color: theme.text }, value_style]}>
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

const styles = StyleSheet.create({
    detalleContainer: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        width: '100%',
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
        flexDirection: 'row',
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
        textAlign: 'right',
        width: '100%',
    },
    shareButton: {
        position: 'absolute',
        top: -18,
        right: 5,
    }
});