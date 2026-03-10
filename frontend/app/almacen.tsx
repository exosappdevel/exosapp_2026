import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import CustomModal from '../components/CustomModal';

const menuItems = [
  { id: "1", title: "Pickeo", titleKey: "almacen.pickeo", icon: "cart-arrow-right", color: "#3182ce" },
  { id: "2", title: "Inventario", titleKey: "almacen.inventario", icon: "format-list-checks", color: "#ecc94b" },
  { id: "4", title: "Entradas", titleKey: "almacen.entradas", icon: "home-import-outline", color: "#48bb78" },
  { id: "5", title: "Salidas", titleKey: "almacen.salidas", icon: "home-export-outline", color: "#e53e3e" },
];

export default function AlmacenScreen() {
  const router = useRouter();
  const { user, theme, t } = useApp();
  
  const [modal, setModal] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    icon: 'information-outline',
    colorIcon: '#3182ce'
  });

  const handleMenuPress = (item: typeof menuItems[0]) => {
    if (item.id === "1") {
      router.push('/terminales');
    } else {
      setModal({
        visible: true,
        titulo: t('home.comingSoon'),
        mensaje: t('home.featureNotAvailable'),
        icon: 'clock-outline',
        colorIcon: '#ecc94b'
      });
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
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('almacen.title')}</Text>
        <View style={{ width: 28 }} />
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
        <MaterialCommunityIcons name="warehouse" size={24} color={theme.accent} />
        <Text style={[styles.footerText, { color: theme.text }]}>
          {user.almacen_nombre || user.almacen_codigo || 'Sin almacén'}
        </Text>
      </View>

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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
});