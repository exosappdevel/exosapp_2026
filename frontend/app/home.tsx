import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import CustomModal from '../components/CustomModal';

const menuItems = [
  { id: "1", title: "Almacén", titleKey: "home.almacen", icon: "warehouse", color: "#3182ce" },
  { id: "2", title: "Despachos", titleKey: "home.despachos", icon: "truck-delivery", color: "#0b4e27" },
  { id: "3", title: "Inventario", titleKey: "home.inventario", icon: "clipboard-list", color: "#ecc94b" },
  { id: "4", title: "Configuración", titleKey: "home.configuracion", icon: "cog", color: "#a0aec0" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, theme, t, logout } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    icon: 'information-outline',
    colorIcon: theme.accent
  });

  const handleMenuPress = (item: typeof menuItems[0]) => {
    if (item.id === "1") {
      router.push('/almacen');
    } else {
      setModal({
        visible: true,
        titulo: t('home.comingSoon'),
        mensaje: t('home.featureNotAvailable'),
        icon: 'clock-outline',
        colorIcon: theme.accent
      });
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);

    if (Platform.OS === 'web') {
      // En Web usamos el confirm nativo del navegador
      const confirmar = window.confirm(t("userMenu.confirm_logout"));
      if (confirmar) {
        await logout();
        router.replace('/login');
      }
    } else {
      // En Móvil usamos el Alert elegante de RN
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

  const renderMenuItem = ({ item }: { item: typeof menuItems[0] }) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => handleMenuPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <MaterialCommunityIcons name={item.icon as any} size={40} color={item.color} />
      </View>
      <Text style={[styles.menuTitle, { color: theme.text }]}>{t(item.titleKey)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>

        </View>
        <TouchableOpacity onPress={() => setShowUserMenu(true)}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="account-circle" size={40} color={theme.accent} />
            <Text style={[styles.userName, { color: theme.text }]}>{user.alias_usuario || 'Usuario'}</Text>
            <MaterialCommunityIcons name="menu" size={28} color={theme.text} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Menu Grid */}
      <FlatList
        data={menuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.menuGrid}
        columnWrapperStyle={styles.menuRow}
      />

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={styles.userMenuItem}
          onPress={() => {
            router.push('/profile');
          }}
        >
          <MaterialCommunityIcons name="warehouse" size={24} color={theme.accent} />
          <Text style={[styles.footerText, { color: theme.text }]}>
            {user.almacen_nombre || user.almacen_codigo || 'Sin almacén'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Menu Modal */}
      <Modal
        visible={showUserMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowUserMenu(false)}
        >
          <View style={[styles.userMenuContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
              style={styles.userMenuItem}
              onPress={() => {
                setShowUserMenu(false);
                router.push('/profile');
              }}
            >
              <MaterialCommunityIcons name="account-cog" size={24} color={theme.accent} />
              <Text style={[styles.userMenuText, { color: theme.text }]}>{t('userMenu.profile')}</Text>
            </TouchableOpacity>

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

      <CustomModal
        visible={modal.visible}
        titulo={modal.titulo}
        mensaje={modal.mensaje}
        icon={modal.icon}
        colorIcon={modal.colorIcon}
        onClose={() => setModal({ ...modal, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  menuGrid: {
    padding: 15,
    flexGrow: 1,
  },
  menuRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  menuItem: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 15,
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
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  userMenuText: {
    marginLeft: 12,
    fontSize: 16,
  },
  menuDivider: {
    height: 1,
    marginVertical: 5,
  },
});