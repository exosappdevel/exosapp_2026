import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRouter, usePathname } from 'expo-router';

interface UserMenuProps {
    visible: boolean;
    onClose: () => void;
}

export const _UserMenu = ({ visible, onClose }: UserMenuProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, t, logout, openTabs, closeOpenTab } = useApp();

    const handleLogout = async () => {
        onClose();

        if (Platform.OS === 'web') {
            const confirmar = window.confirm(t("userMenu.confirm_logout"));
            if (confirmar) {
                await logout();
                router.replace('/login');
            }
        } else {
            Alert.alert(
                t("userMenu.logout"),
                t("userMenu.confirm_logout"),
                [
                    { text: t("common.cancel"), style: "cancel" },
                    {
                        text: t("common.yes"), style: "destructive", onPress: async () => {
                            await logout();
                            router.replace('/login');
                        }
                    }
                ]
            );
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.menuOverlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={[styles.userMenuContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TouchableOpacity
                        style={styles.userMenuItem}
                        onPress={() => {
                            onClose();
                            router.push('/home');
                        }}
                    >
                        <MaterialCommunityIcons name="home" size={24} color={theme.accent} />
                        <Text style={[styles.userMenuText, { color: theme.text }]}>{t('screens.home')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.userMenuItem}
                        onPress={() => {
                            onClose();
                            router.push('/profile');
                        }}
                    >
                        <MaterialCommunityIcons name="account-cog" size={24} color={theme.accent} />
                        <Text style={[styles.userMenuText, { color: theme.text }]}>{t('screens.perfil')}</Text>
                    </TouchableOpacity>

                    {openTabs.length > 0 && (
                        <>
                            <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
                            <Text style={[styles.menuSectionLabel, { color: theme.textSub }]}>
                                {t('profile.openTabs')}
                            </Text>
                            {openTabs.map((tab) => (
                                <TouchableOpacity
                                    key={tab.path}
                                    style={styles.userMenuItem}
                                    onPress={() => {
                                        onClose();
                                        if (tab.path !== pathname) router.push(tab.path as any);
                                    }}
                                >
                                    <MaterialCommunityIcons name={tab.icon as any} size={22} color={theme.accent} />
                                    <Text style={[styles.userMenuText, { color: theme.text }]} numberOfLines={1}>
                                        {tab.name}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation?.();
                                            closeOpenTab(tab.path);
                                        }}
                                        style={{ marginLeft: 'auto', padding: 4 }}
                                    >
                                        <MaterialCommunityIcons name="close" size={16} color={theme.textSub} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}

                    <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
                    <TouchableOpacity
                        style={styles.userMenuItem}
                        onPress={handleLogout}
                    >
                        <MaterialCommunityIcons name="logout" size={24} color="#f56565" />
                        <Text style={[styles.userMenuText, { color: '#f56565' }]}>{t('userMenu.logout')}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 30,
        paddingRight: 5,
    },
    userMenuContainer: {
        borderRadius: 12,
        padding: 10,
        minWidth: 180,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    userMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 15,
    },
    menuDivider: {
        height: 1,
        marginVertical: 5,
    },
    userMenuText: {
        marginLeft: 12,
        fontSize: 16,
    },
    menuSectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        paddingHorizontal: 15,
        paddingTop: 8,
        paddingBottom: 4,
    },
});