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




export default function CirugiasScreen() {
  const router = useRouter();
  const { user, theme, t } = useApp();
  const pageConfig = {
    name: t('screens.cirugias'),
    icon: "stethoscope",
    previous: "/logistica",
    show_user: true,
    show_menu: true
  };
  const [show_soon, setShow_soon] = useState(false);

  const menuItems = [
  { id: "1", titleKey: "screens.cirugias_programar", icon: "calendar-check", color: "#3182ce", href: '/cirugias_programar' },
  { id: "2", titleKey: "screens.cirugias_buscar", icon: "file-search", color: "#ecc94b", href: () => { setShow_soon(true); }  },
  { id: "3", titleKey: "screens.cirugias_calendario", icon: "calendar", color: "#48bb78", href: () => { setShow_soon(true); }  }
];



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