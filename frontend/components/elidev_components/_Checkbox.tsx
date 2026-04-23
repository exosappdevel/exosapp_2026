import {  Dispatch, SetStateAction } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity,Switch
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import {hexToRGBA} from './_Functions'
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
const styles = StyleSheet.create({
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
});

