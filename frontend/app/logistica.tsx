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
import { _Header, _Footer, _MenuGrid, _MenuSection } from '../components/elidev_components';
import { iMenuItem, AddMenuItem } from '@/context/AppmenuItems';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';



export default function LogisticaScreen() {
  const router = useRouter();
  const { user, theme, t } = useApp();
  const pageConfig = {
    name: t('screens.logistica'),
    icon: "truck-delivery",
    previous: "/home",
    show_user: true,
    show_menu: true
  };
  const [show_soon, setShow_soon] = useState(false);
  
  const menuItems:iMenuItem[] = [];
  const menuItemsCirugias:iMenuItem[] = [];
      //AddMenuItem(menuItems, "screens.cirugias", setShow_soon);
      AddMenuItem(menuItemsCirugias, "screens.cirugias_programar", setShow_soon);
      AddMenuItem(menuItemsCirugias, "screens.cirugias_buscar", setShow_soon);
      AddMenuItem(menuItemsCirugias, "screens.cirugias_calendario", setShow_soon);
      AddMenuItem(menuItems, "screens.activos", setShow_soon);
      AddMenuItem(menuItems, "screens.carpetas", setShow_soon);
      AddMenuItem(menuItems, "screens.socios", setShow_soon);



  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <_Header page_info={pageConfig} />
      
      <_MenuSection 
        title="Cirugías" 
        icon="stethoscope" 
        menuItems={menuItemsCirugias} 
    />


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