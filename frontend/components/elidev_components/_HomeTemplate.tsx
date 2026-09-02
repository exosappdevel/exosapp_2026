import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { PanResponder } from 'react-native';

import { _Header, _Footer, _MenuSection, _Background, _MenuLauncher } from '.';
import { Soon_Modal } from '../CustomModal';
import { Tabs_Allowed, Tabs_Allowed_almacen } from '@/context/AppmenuItems';
import { useRouter } from 'expo-router';
import { Href } from 'expo-router';

interface HomeTemplateProps {
  tab_name: string;
}

export const _HomeTemplate = ({ tab_name }: HomeTemplateProps) => {
  const { user, setLastGlobalNav } = useApp();

  const [activeSection, setActiveSection] = useState(tab_name);
  const modulos_por_almacen : boolean = false;

  const allSections = (modulos_por_almacen) ? Tabs_Allowed_almacen() : Tabs_Allowed();
  const currentSection = allSections.find(s => s.id === activeSection) || allSections[0];

  const pageConfig = {
    name: currentSection.title,
    icon: currentSection.icon,
    previous: "",
    show_user: true,
    show_menu: true,
    show_in_recent: false,
    path: '/home'
  };
  const [show_soon, setShow_soon] = useState(false);

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

  const router = useRouter();

  // Antes esto se llamaba directo en el cuerpo del render, con un objeto
  // nuevo en cada llamada: como setLastGlobalNav actualiza el estado del
  // AppProvider (un componente distinto), cada actualización re-renderizaba
  // a todos sus consumidores -incluido este mismo componente-, que volvía a
  // llamar setLastGlobalNav con OTRO objeto nuevo, ciclando indefinidamente.
  // Al moverlo a un efecto atado a tab_name, solo corre cuando el tab
  // realmente cambia.
  useEffect(() => {
    setLastGlobalNav({ last_home_path: "/" + (tab_name=="favorites" ? "home" : tab_name) });
  }, [tab_name]);

  return (
    <_Background id_almacen={user?.id_almacen}>
      <SafeAreaView style={[styles.container]}>

        <_Header page_info={pageConfig} />
        {/* Envolvemos el ScrollView con el PanResponder */}
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
          <ScrollView style={{ borderWidth:0 }} scrollEnabled={true}>

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
              onSelect={(id) => {
                  if (id === "favorites") {
                    router.push("/home" as Href);
                  }
                  else {                                 
                    router.push("/"+id as Href);                   
                  }
                //setActiveSection(id);
              }}
            />

          </View>

          
          
        </View>



        <Soon_Modal
          visible={show_soon}
          setVisible={setShow_soon}
        ></Soon_Modal>
      <_Footer/>
      </SafeAreaView>
    </_Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: Platform.OS === 'ios' ? -15 : -10
  },
  fixedLauncherContainer: {
    paddingBottom: 10,
    //borderTopWidth: 1,
    //borderTopColor: 'rgba(255,255,255,0.1)',
    // Opcional: añadir un ligero desenfoque de fondo al dock
    //backgroundColor: 'rgba(0,0,0,0.1)',
  }
});