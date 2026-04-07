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

  const Show_soonModal=() =>{    
    setShow_soon(true);    
  }


  // Almacen
  AddMenuItem(menuItems_Almacen, "screens.pickeo");
  AddMenuItem(menuItems_Almacen, "screens.inventario");
  AddMenuItem(menuItems_Almacen, "screens.recepcion");
  AddMenuItem(menuItems_Almacen, "screens.entradas");

  // --- Cirugias
  AddMenuItem(menuItems_Cirugias, "screens.cirugias_programar");
  AddMenuItem(menuItems_Cirugias, "screens.cirugias_buscar");
  AddMenuItem(menuItems_Cirugias, "screens.cirugias_calendario");

  // --- Logistica
  AddMenuItem(menuItems_Logistica, "screens.activos");
  AddMenuItem(menuItems_Logistica, "screens.carpetas");
  AddMenuItem(menuItems_Logistica, "screens.socios");

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
            onSoon={Show_soonModal}                 
          />
        )}

        <_MenuSection
          title='Almacen'
          icon='warehouse'
          menuItems={menuItems_Almacen}
          onSoon={Show_soonModal} 
        />
        <_MenuSection
          title='Cirugias'
          icon='stethoscope'
          menuItems={menuItems_Cirugias}
          onSoon={Show_soonModal} 
        />
        <_MenuSection
          title='Logística'
          icon='truck-delivery'
          menuItems={menuItems_Logistica}
          onSoon={Show_soonModal} 
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