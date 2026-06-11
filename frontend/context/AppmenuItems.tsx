import React, { createContext, useState, useContext, useEffect, SetStateAction, Dispatch } from 'react';
import translations from '../languages.json'
import { useApp } from '../context/AppContext';

export interface iMenuItem {
  id: string;
  titleKey: string;
  icon: string;
  color: string;
  href: string | (() => void) | null; // Puede ser una ruta o una función
}

export const AllTabs = [
    { id: 'favorites', title: '', icon: 'star', data: [] },
    { id: 'almacen', title: '', icon: 'warehouse', data: [] },
    { id: 'cirugias', title: '', icon: 'medical-bag', data: [] },
    { id: 'logistica', title: '', icon: 'truck-delivery', data: [] },
    { id: 'calidad', title: '', icon: 'shield-star-outline', data: [] },
  ]

export const AppmenuItems: iMenuItem[] = [
  { id: '1', titleKey: "screens.almacen", icon: "warehouse", color: "#3182ce", href: '/almacen' },
  { id: '2', titleKey: "screens.logistica", icon: "truck-delivery", color: "#0b4e27", href: '/logistica' },
  { id: '3', titleKey: "screens.cirugias", icon: "stethoscope", color: "#3182ce", href: '/cirugias' },
  { id: '4', titleKey: "screens.cirugias_programar", icon: "calendar-check", color: "#3182ce", href: '/cirugias_programar' },
  { id: '5', titleKey: "screens.recepcion", icon: "clipboard-list", color: "#48bb78", href: null },
  { id: '6', titleKey: "screens.carpetas", icon: "folder-account", color: "#beb535", href: null },
  { id: '7', titleKey: "screens.pickeo", icon: "hospital", color: "#3182ce", href: '/terminales' },
  { id: '8', titleKey: "screens.inventario", icon: "format-list-checks", color: "#ecc94b", href: null },
  { id: '9', titleKey: "screens.entradas", icon: "home-import-outline", color: "#48bb78", href: null },
  { id: '10', titleKey: "screens.salidas", icon: "home-export-outline", color: "#e53e3e", href: null },
  { id: '11', titleKey: "screens.activos", icon: "finance", color: "#ecc94b", href: null },
  { id: '12', titleKey: "screens.carpetas", icon: "folder-account", color: "#48bb78", href: null },
  { id: '13', titleKey: "screens.socios", icon: "account-multiple", color: "#e53e3e", href: null },
  { id: '14', titleKey: "screens.cirugias_buscar", icon: "file-search", color: "#ecc94b", href: "/cirugias_buscar" },
  { id: '15', titleKey: "screens.cirugias_calendario", icon: "calendar", color: "#48bb78", href: null },
  { id: '16', titleKey: "screens.cirugias_vista_diario", icon: "calendar", color: "#48bb78", href: null },
  { id: '17', titleKey: "screens.reporte_piezas_danadas_view", icon: "glass-fragile", color: "#48bb78", href: "/reporte_piezas_danadas_view" }
];


export const AddMenuItem = (menu: any, key: string/*, set_soon: Dispatch<SetStateAction<boolean>>*/) => {
  for (const item of AppmenuItems) {
    if (item.titleKey === key) {
      const new_item: iMenuItem = {
        id: item.id,
        titleKey: item.titleKey,
        icon: item.icon,
        color: item.color,
        href: item.href
      };

      menu.push(new_item);
      break;
    }
  }

};

export const Tabs_Allowed =() => {  
  const { user, theme, t, isLoggedIn, appConfig } = useApp();

  const isAllowed = (menuName: string, itemName: string): boolean => {
    // Buscamos el menú en el arreglo de items del usuario
    const userMenu = user.menu_items?.find(m => m.menu === menuName) || false;
    if (!userMenu) return false;

    // Los items vienen separados por ; según tu lógica de login    
    const allowedItems = userMenu.items.split(';');
    return allowedItems.includes(itemName);
  };

  const Add_Menu_Items = (menu: any, menu_name: string) => {
    // --- Almacen ---
    if (menu_name == 'menu_almacen') {
      if (isAllowed('menu_almacen', 'pickeo')) AddMenuItem(menu, "screens.pickeo");
      if (isAllowed('menu_almacen', 'inventario')) AddMenuItem(menu, "screens.inventario");
      if (isAllowed('menu_almacen', 'recepcion')) AddMenuItem(menu, "screens.recepcion");
      if (isAllowed('menu_almacen', 'entradas')) AddMenuItem(menu, "screens.entradas");
    }


    // --- Cirugias ---
    if (menu_name == 'menu_cirugias') {
      if (isAllowed('menu_cirugias', 'cirugias_programar')) AddMenuItem(menu, "screens.cirugias_programar");
      if (isAllowed('menu_cirugias', 'cirugias_buscar')) AddMenuItem(menu, "screens.cirugias_buscar");
      if (isAllowed('menu_cirugias', 'cirugias_vista_diario')) AddMenuItem(menu, "screens.cirugias_vista_diario");
    }

    // --- Logistica ---
    if (menu_name == 'menu_logistica') {
      if (isAllowed('menu_logistica', 'activos')) AddMenuItem(menu, "screens.activos");
      if (isAllowed('menu_logistica', 'carpetas')) AddMenuItem(menu, "screens.carpetas");
      if (isAllowed('menu_logistica', 'socios')) AddMenuItem(menu, "screens.socios");
    }

    // --- Calidad
    if (menu_name == 'menu_calidad') {
      if (isAllowed('menu_calidad', 'reporte_piezas_danadas_view')) AddMenuItem(menu, "screens.reporte_piezas_danadas_view");
    }
  };
  
    
  AllTabs.map((tab: any, index: number) => {   
    if (tab.id == 'favorites'){
      tab.title =  t('home.menu_' + tab.id);
      tab.data = AppmenuItems.filter(item => user.menu_favorites?.includes(item.id)).slice();
    }
    else{
      const menu_name = 'menu_' + tab.id;
      tab.title =  t('home.menu_' + tab.id);
      Add_Menu_Items(tab.data, menu_name);
    }    
  });

  
  return AllTabs.filter(section => (section.data.length > 0) || (section.id=='favorites'));  
  
}