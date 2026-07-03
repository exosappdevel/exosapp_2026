import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

interface DatePickerProps {
    label?: string;
    required?: boolean;
    value: string;               // formato DD/MM/YYYY
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minimumDate?: Date;
    maximumDate?: Date;
}

const parseDate = (str: string): Date => {
    if (!str) return new Date();
    const parts = str.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        const d = new Date(year, month - 1, day);
        if (!isNaN(d.getTime())) return d;
    }
    return new Date();
};

const formatDate = (date: Date): string => {
    const day   = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year  = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const _DatePicker = ({
    label,
    required = false,
    value,
    onChange,
    placeholder = 'DD/MM/YYYY',
    disabled = false,
    minimumDate,
    maximumDate,
}: DatePickerProps) => {
    const { theme } = useApp();
    const [showPicker, setShowPicker] = useState(false);
    const [tempDate, setTempDate]     = useState<Date>(new Date());

    const handleOpen = () => {
        if (disabled) return;
        setTempDate(parseDate(value));
        setShowPicker(true);
    };

    const handleConfirm = () => {
        onChange(formatDate(tempDate));
        setShowPicker(false);
    };

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, { color: theme.text }]}>
                    {label}
                    {required && <Text style={styles.required}> *</Text>}
                </Text>
            )}

            {Platform.OS === 'web' ? (
                /* ── WEB ── */
                <View style={[
                    styles.selector,
                    { backgroundColor: theme.inputBg, borderColor: theme.border, opacity: disabled ? 0.5 : 1 }
                ]}>
                    <input
                        type="date"
                        disabled={disabled}
                        value={(() => {
                            const parts = value?.split('/');
                            if (parts?.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                            return '';
                        })()}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                                const [year, month, day] = val.split('-').map(Number);
                                onChange(formatDate(new Date(year, month - 1, day)));
                            }
                        }}
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            color: value ? theme.text : theme.textSub,
                            fontSize: 16,
                            fontFamily: 'inherit',
                            cursor: disabled ? 'default' : 'pointer',
                        }}
                    />
                    <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
                </View>
            ) : (
                /* ── MÓVIL ── */
                <>
                    {/* Botón selector */}
                    <TouchableOpacity
                        style={[
                            styles.selector,
                            { backgroundColor: theme.inputBg, borderColor: theme.border, opacity: disabled ? 0.5 : 1 }
                        ]}
                        onPress={handleOpen}
                        disabled={disabled}
                    >
                        <Text style={[styles.selectorText, { color: value ? theme.text : theme.textSub }]}>
                            {value || placeholder}
                        </Text>
                        <MaterialCommunityIcons name="calendar-outline" size={20} color={theme.textSub} />
                    </TouchableOpacity>

                    {/* Android: picker inline (se cierra solo al confirmar) */}
                    {showPicker && Platform.OS === 'android' && (
                        <DateTimePicker
                            value={tempDate}
                            mode="date"
                            display="default"
                            minimumDate={minimumDate}
                            maximumDate={maximumDate}
                            onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                                setShowPicker(false);
                                if (event.type === 'set' && selectedDate) {
                                    onChange(formatDate(selectedDate));
                                }
                            }}
                        />
                    )}

                    {/* iOS: Modal centrado al fondo para que nunca quede tapado */}
                    {Platform.OS === 'ios' && (
                        <Modal visible={showPicker} transparent animationType="slide">
                            <View style={styles.modalOverlay}>
                                <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
                                    <DateTimePicker
                                        value={tempDate}
                                        mode="date"
                                        display="spinner"
                                        minimumDate={minimumDate}
                                        maximumDate={maximumDate}
                                        onChange={(_: DateTimePickerEvent, selectedDate?: Date) => {
                                            if (selectedDate) setTempDate(selectedDate);
                                        }}
                                        style={{ width: '100%' }}
                                        textColor={theme.text}
                                    />
                                    <View style={styles.iosButtons}>
                                        <TouchableOpacity
                                            onPress={() => setShowPicker(false)}
                                            style={[styles.btn, { borderColor: theme.border }]}
                                        >
                                            <Text style={{ color: theme.textSub }}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={handleConfirm}
                                            style={[styles.btn, { backgroundColor: theme.accent }]}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    required: {
        color: '#e53e3e',
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    selectorText: {
        fontSize: 14,
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalCard: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 34,
    },
    iosButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        paddingTop: 10,
    },
    btn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
});
