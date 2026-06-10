import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Soon_Modal } from '../components/CustomModal';
import { _Header, _Footer, _MenuGrid, _MenuSection, _Background, _MenuLauncher } from '../components/elidev_components';
import { iMenuItem, AddMenuItem } from '@/context/AppmenuItems';
import { AppmenuItems } from '@/context/AppmenuItems';
import { PanResponder, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function HomeScreen() {
  const router = useRouter();
  const { user, theme, t, isLoggedIn, appConfig } = useApp();
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
  const menuItems_Calidad: iMenuItem[] = [];

  const Show_soonModal = () => {
    setShow_soon(true);
  }
  // Función para verificar si un item está permitido en un menú específico
  const isAllowed = (menuName: string, itemName: string): boolean => {
    // Buscamos el menú en el arreglo de items del usuario
    const userMenu = user.menu_items?.find(m => m.menu === menuName) || false;
    if (!userMenu) return false;

    // Los items vienen separados por ; según tu lógica de login    
    const allowedItems = userMenu.items.split(';');
    return allowedItems.includes(itemName);
  };

  // --- Almacen ---
  if (isAllowed('menu_almacen', 'pickeo')) AddMenuItem(menuItems_Almacen, "screens.pickeo");
  if (isAllowed('menu_almacen', 'inventario')) AddMenuItem(menuItems_Almacen, "screens.inventario");
  if (isAllowed('menu_almacen', 'recepcion')) AddMenuItem(menuItems_Almacen, "screens.recepcion");
  if (isAllowed('menu_almacen', 'entradas')) AddMenuItem(menuItems_Almacen, "screens.entradas");

  // --- Cirugias ---
  if (isAllowed('menu_cirugias', 'cirugias_programar')) AddMenuItem(menuItems_Cirugias, "screens.cirugias_programar");
  if (isAllowed('menu_cirugias', 'cirugias_buscar')) AddMenuItem(menuItems_Cirugias, "screens.cirugias_buscar");
  if (isAllowed('menu_cirugias', 'cirugias_vista_diario')) AddMenuItem(menuItems_Cirugias, "screens.cirugias_vista_diario");

  // --- Logistica ---
  if (isAllowed('menu_logistica', 'activos')) AddMenuItem(menuItems_Logistica, "screens.activos");
  if (isAllowed('menu_logistica', 'carpetas')) AddMenuItem(menuItems_Logistica, "screens.carpetas");
  if (isAllowed('menu_logistica', 'socios')) AddMenuItem(menuItems_Logistica, "screens.socios");

  if (isAllowed('menu_calidad', 'reporte_piezas_danadas_view')) AddMenuItem(menuItems_Calidad, "screens.reporte_piezas_danadas_view");

  // 1. Estado para la sección activa (por defecto Favoritos)
  const [activeSection, setActiveSection] = useState('favorites');

  // 2. Definición de las secciones para el lanzador
  const favoriteItems = AppmenuItems.filter(item => user.menu_favorites?.includes(item.id));
  
  // Solo agregamos a la visualización las secciones que terminaron con al menos un item
  const allSections = [
    { id: 'favorites', title: t('home.menu_favorites'), icon: 'star', data: favoriteItems },
    { id: 'almacen', title: t('home.menu_almacen'), icon: 'warehouse', data: menuItems_Almacen },
    { id: 'cirugias', title: t('home.menu_cirugias'), icon: 'medical-bag', data: menuItems_Cirugias },
    { id: 'logistica', title: t('home.menu_logistica'), icon: 'truck-delivery', data: menuItems_Logistica },
    { id: 'calidad', title: t('home.menu_calidad'), icon: 'shield-star-outline', data: menuItems_Calidad },
  ].filter(section => (section.data.length > 0) || (section.id=='favorites')); // <-- FILTRO CRUCIAL

  // 4. Obtener la sección que se debe renderizar en el "Widget"
  const currentSection = allSections.find(s => s.id === activeSection) || allSections[0];
  // Lógica del PanResponder para detectar Swipe
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Solo activamos si el movimiento horizontal es mayor al vertical
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderRelease: (_, gestureState) => {
      const currentIndex = allSections.findIndex(s => s.id === activeSection);

      if (gestureState.dx > 50) {
        // Swipe a la Derecha -> Ir al anterior
        if (currentIndex > 0) {
          setActiveSection(allSections[currentIndex - 1].id);
        }
      } else if (gestureState.dx < -50) {
        // Swipe a la Izquierda -> Ir al siguiente
        if (currentIndex < allSections.length - 1) {
          setActiveSection(allSections[currentIndex + 1].id);
        }
      }
    },
  });

  return (
    <SafeAreaView style={[styles.container]}>
      <_Background id_almacen={user?.id_almacen}>

        <_Header page_info={pageConfig} />
        {/* Envolvemos el ScrollView con el PanResponder */}
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
          <ScrollView style={{ backgroundColor: 'transparent' }} scrollEnabled={true}>

            {/* AREA DE WIDGET (La sección expandida) */}
            {/* ÁREA DE WIDGET (Sección expandida arriba) */}
            <View style={{ marginTop: 10 }}>
              <_MenuSection
                title={currentSection.title}
                icon={currentSection.icon}
                menuItems={currentSection.data}
                isOpen={true} // Siempre abierto en este modo
                onToggle={() => { }} // Opcional: podrías hacer que regrese a favoritos
                onSoon={() => setShow_soon(true)}
              />
            </View>
          </ScrollView>


          {/* AREA DE ICONOS (El lanzador tipo iPhone) */}
          <View style={styles.fixedLauncherContainer}>
            <_MenuLauncher
              sections={allSections}
              activeId={activeSection}
              onSelect={(id) => setActiveSection(id)}
            />

          </View>

          <_Footer />
        </View>



        <Soon_Modal
          visible={show_soon}
          setVisible={setShow_soon}
        ></Soon_Modal>
      </_Background>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: Platform.OS === 'ios' ? -15 : -10
  },
  fixedLauncherContainer: {
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    // Opcional: añadir un ligero desenfoque de fondo al dock
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  launcherHeader: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  launcherHeaderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    opacity: 0.8,
    textShadowColor: '0, 1, 3, rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  }
});