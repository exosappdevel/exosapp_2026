import { useState, useCallback } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity, Platform
} from "react-native";

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useRouter, usePathname, useFocusEffect } from 'expo-router';
import { _UserMenu } from './_UserMenu';
import { hexToRGBA } from './_Functions'

interface iPage {
    name: string;
    icon: any;
    previous: any | null;
    show_user: boolean;
    show_menu: boolean;
    show_in_recent: boolean;
}

export const _Header = ({ page_info, children }: { page_info: iPage, children?: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, user, addOpenTab } = useApp();
    const [showUserMenu, setShowUserMenu] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (pathname && pathname !== '/login' && pathname !== '/' && page_info.show_in_recent) {
                addOpenTab({ path: pathname, name: page_info.name, icon: page_info.icon });
            }
        }, [pathname, page_info.show_in_recent, page_info.name, page_info.icon])
    );

    return (
        <View style={[styles.header]}>
            <View style={styles.headerLeft}>
                {page_info.previous ? (
                    <TouchableOpacity style={styles.backButton} onPress={() => page_info?.previous == "" ? router.back() : router.replace({ pathname: page_info?.previous })}>
                        <MaterialCommunityIcons name="arrow-left" size={20} color={theme.iconTextColor} />
                    </TouchableOpacity>
                ) : null}

                <MaterialCommunityIcons name={page_info?.icon} size={20} color={theme.accent} style={{ paddingLeft: 5, paddingRight: 5 }} />
                <Text style={[styles.pageTitle, { color: theme.iconTextColor }]}>{page_info.name}</Text>
            </View>

            {page_info.show_user && (
                <TouchableOpacity onPress={() => setShowUserMenu(true)}>
                    <View style={styles.userInfo}>
                        <MaterialCommunityIcons name="account-circle" size={20} color={theme.accent} />
                        <Text style={[styles.userName, { color: theme.iconTextColor }]} numberOfLines={1}>
                            {user?.alias_usuario || 'Usuario'}
                        </Text>
                        <MaterialCommunityIcons name="menu" size={20} color={theme.iconTextColor} />
                    </View>
                </TouchableOpacity>
            )}

            {children && (
                <View style={styles.headerContentChildreen}>
                    {children}
                </View>
            )}

            <_UserMenu visible={showUserMenu} onClose={() => setShowUserMenu(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 5,
        paddingTop: Platform.OS === 'ios' ? 5 : 5,
        paddingBottom: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    pageTitle: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
    },
    userName: {
        fontSize: 12,
        fontWeight: '600',
        marginHorizontal: 8,
        maxWidth: 120,
    },
    backButton: {
        marginRight: 10,
        padding: 5,
    },
    headerContentChildreen: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        height: 50,
        paddingHorizontal: 5
    },
});