import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import CustomModal, { Soon_Modal } from '../components/CustomModal';
import { _Header, _Footer, _MenuGrid } from '../components/elidev_components';
import { iMenuItem, AddMenuItem } from '@/context/AppmenuItems';




export default function HomeScreen() {
  const router = useRouter();
  const { user, theme, t } = useApp();
  const pageConfig = {
    name: t('screens.almacen'),
    icon: "warehouse",
    previous: "/home",
    show_user: true,
    show_menu: true
  };
  const [show_soon, setShow_soon] = useState(false);  
  const menuItems:iMenuItem[] = [];
    AddMenuItem(menuItems, "screens.pickeo", setShow_soon);
    AddMenuItem(menuItems, "screens.inventario", setShow_soon);
    AddMenuItem(menuItems, "screens.recepcion", setShow_soon);
    AddMenuItem(menuItems, "screens.entradas", setShow_soon);


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <_Header page_info={pageConfig} />
      {/* new grid */}
      <_MenuGrid
        menuItems={menuItems}
      />

      {/* Footer */}
      <_Footer></_Footer>

      <Soon_Modal
        visible={show_soon}
        setVisible={setShow_soon}
      ></Soon_Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});