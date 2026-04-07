import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import CustomModal, { Soon_Modal } from '../components/CustomModal';
import { _Header, _Footer, _MenuGrid, _MenuSection } from '../components/elidev_components';
import { iMenuItem, AddMenuItem } from '@/context/AppmenuItems';
import { AppmenuItems } from '@/context/AppmenuItems';




export default function HomeScreen() {
  const router = useRouter();
  const { user, theme, t } = useApp();
  const pageConfig = {
    name: t("app.name"),
    icon: "home",
    previous: "",
    show_user: true,
    show_menu: true
  };
  const [show_soon, setShow_soon] = useState(false);
  const menuItems: iMenuItem[] = [];
  const menuItems_Almacen: iMenuItem[] = [];
  const menuItems_Cirugias: iMenuItem[] = [];
  const menuItems_Logistica: iMenuItem[] = [];
  const menuItems_Favorites: iMenuItem[] = [];

  // Almacen
  AddMenuItem(menuItems_Almacen, "screens.pickeo", setShow_soon);
  AddMenuItem(menuItems_Almacen, "screens.inventario", setShow_soon);
  AddMenuItem(menuItems_Almacen, "screens.recepcion", setShow_soon);
  AddMenuItem(menuItems_Almacen, "screens.entradas", setShow_soon);

  // --- Cirugias
  AddMenuItem(menuItems_Cirugias, "screens.cirugias_programar", setShow_soon);
  AddMenuItem(menuItems_Cirugias, "screens.cirugias_buscar", setShow_soon);
  AddMenuItem(menuItems_Cirugias, "screens.cirugias_calendario", setShow_soon);

  // --- Logistica
  AddMenuItem(menuItems_Logistica, "screens.activos", setShow_soon);
  AddMenuItem(menuItems_Logistica, "screens.carpetas", setShow_soon);
  AddMenuItem(menuItems_Logistica, "screens.socios", setShow_soon);

  // ---- Favoritos
  const favoriteItems = AppmenuItems.filter(item =>
    user.menu_favorites?.includes(item.id)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>

      <_Header page_info={pageConfig} />
      <ScrollView>

        {/* Solo mostramos la sección si hay favoritos */}
        {favoriteItems.length > 0 && (
          <_MenuSection
            title="Favoritos"
            icon="star"
            menuItems={favoriteItems}     
            defaultOpen={true}                   
          />
        )}

        <_MenuSection
          title='Almacen'
          icon='warehouse'
          menuItems={menuItems_Almacen}
        />
        <_MenuSection
          title='Cirugias'
          icon='stethoscope'
          menuItems={menuItems_Cirugias}
        />
        <_MenuSection
          title='Logística'
          icon='truck-delivery'
          menuItems={menuItems_Logistica}
        />
      </ScrollView>

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