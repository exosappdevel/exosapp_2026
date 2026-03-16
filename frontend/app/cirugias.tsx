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
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import CustomModal from '../components/CustomModal';

const menuItems = [
  { id: "1", titleKey: "screens.cirugias_programar", icon: "schedule", color: "#3182ce" },
  { id: "2", titleKey: "screens.cirugias_buscar", icon: "file-search", color: "#ecc94b" },
  { id: "3", titleKey: "screens.cirugias_calendario", icon: "calendar", color: "#48bb78" },
  //{ id: "4", titleKey: "screens.cirugias_", icon: "account-multiple", color: "#e53e3e" },
];

export default function LogisticaScreen() {
  const router = useRouter();
  const { user, theme, t } = useApp();
  
  const [modal, setModal] = useState({
    visible: false,
    titulo: '',
    mensaje: '',
    icon: 'information-outline',
    colorIcon: theme.accent
  });

  const handleMenuPress = (item: typeof menuItems[0]) => {
    if (item.id === "1") {
      router.push('/cirugias_programar');
    } else {
      setModal({
        visible: true,
        titulo: t('common.comingSoon'),
        mensaje: t('common.featureNotAvailable'),
        icon: 'clock-outline',
        colorIcon: theme.accent
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
        <AntDesign name={item.icon as any} size={40} color={item.color} />
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('screens.cirugias')}</Text>
        
        <MaterialCommunityIcons name="doctor"  size={24} color={theme.accent} />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
});