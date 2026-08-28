import { useEffect, useState } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useApp } from '../../context/AppContext';
import { hexToRGBA } from './_Functions';

export interface _PinModalProps {
    visible: boolean;
    onSuccess: () => void;
    onCancel: () => void;
    title?: string;
    message?: string;
}

// Modal genérico para pedir el PIN del usuario logueado y validarlo contra
// user.pin (AppContext), usado para confirmar procesos sensibles. Ofrece
// FaceID/biométricos como atajo cuando el dispositivo lo soporta: un éxito
// biométrico se considera equivalente a acertar el PIN.
export const _PinModal = ({ visible, onSuccess, onCancel, title, message }: _PinModalProps) => {
    const { user, theme, t } = useApp();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [hasBiometrics, setHasBiometrics] = useState(false);
    const [checkingBiometrics, setCheckingBiometrics] = useState(false);

    useEffect(() => {
        if (visible) {
            setPin('');
            setError('');
            checkBiometrics();
        }
    }, [visible]);

    const checkBiometrics = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            setHasBiometrics(hasHardware && isEnrolled);
        } catch {
            setHasBiometrics(false);
        }
    };

    const handleValidate = () => {
        if (!user.pin) {
            setError('No tienes un PIN asignado. Contacta a soporte.');
            return;
        }
        if (pin === user.pin) {
            setPin('');
            setError('');
            onSuccess();
        } else {
            setError('PIN incorrecto');
            setPin('');
        }
    };

    const handleBiometricAuth = async () => {
        if (!user.pin) {
            setError('No tienes un PIN asignado. Contacta a soporte.');
            return;
        }
        setCheckingBiometrics(true);
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: t('login.faceid_title'),
                fallbackLabel: 'Usar PIN',
            });
            if (result.success) {
                setPin('');
                setError('');
                onSuccess();
            }
        } catch {
            setError(t('login.faceidError'));
        } finally {
            setCheckingBiometrics(false);
        }
    };

    const handleCancel = () => {
        setPin('');
        setError('');
        onCancel();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>{title || 'Confirma tu PIN'}</Text>
                        <TouchableOpacity onPress={handleCancel}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {!!message && (
                        <Text style={[styles.message, { color: theme.textSub }]}>{message}</Text>
                    )}

                    <TextInput
                        style={[styles.pinInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBg }]}
                        value={pin}
                        onChangeText={(v) => { setPin(v); setError(''); }}
                        keyboardType="number-pad"
                        secureTextEntry
                        placeholder="••••"
                        placeholderTextColor={theme.textSub}
                        autoFocus
                        onSubmitEditing={handleValidate}
                    />

                    {!!error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}

                    <TouchableOpacity
                        style={[styles.confirmButton, { backgroundColor: theme.accent }]}
                        onPress={handleValidate}
                        disabled={checkingBiometrics}
                    >
                        <Text style={styles.confirmButtonText}>Validar</Text>
                    </TouchableOpacity>

                    {hasBiometrics && (
                        <TouchableOpacity
                            style={[styles.biometricButton, { borderColor: theme.border }]}
                            onPress={handleBiometricAuth}
                            disabled={checkingBiometrics}
                        >
                            {checkingBiometrics ? (
                                <ActivityIndicator color={theme.accent} />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="face-recognition" size={20} color={theme.accent} />
                                    <Text style={[styles.biometricButtonText, { color: theme.accent }]}>{t('login.faceid_title')}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: hexToRGBA('#000000', 0.6),
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '85%',
        maxWidth: 340,
        borderRadius: 30,
        padding: 25,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    message: {
        fontSize: 13,
        marginBottom: 15,
    },
    pinInput: {
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 16,
        fontSize: 20,
        textAlign: 'center',
        letterSpacing: 8,
        marginTop: 5,
    },
    errorText: {
        color: '#f56565',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 8,
    },
    confirmButton: {
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 18,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    biometricButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 18,
        paddingVertical: 12,
        marginTop: 12,
    },
    biometricButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
});
