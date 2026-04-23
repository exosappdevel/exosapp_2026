import {
    View, Platform,  TouchableWithoutFeedback,
    Keyboard, Pressable
} from "react-native";


export const _TouchableWithoutFeedback = ({ children }: { children: React.ReactNode }) => {

    // Función para cerrar teclado en Mobile
    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Keyboard.dismiss();
        }
    };

    // React Native requiere que TouchableWithoutFeedback tenga UN solo hijo.
    // Envolvemos children en un View para garantizar que sea un único elemento.
    return (
        <TouchableWithoutFeedback onPress={handlePress} accessible={false}>
            <Pressable
                onPress={() => {
                    if (Platform.OS !== 'web') Keyboard.dismiss();
                }}
                style={{ flex: 1 }}
                // Esta propiedad es vital: permite que el scroll funcione aunque presiones aquí
                hitSlop={0}
            >
                <View pointerEvents="box-none" style={{ flex: 1 }}>
                    {children}
                </View>
            </Pressable>
        </TouchableWithoutFeedback>
    );
};
