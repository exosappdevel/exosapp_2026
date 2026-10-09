import { useApp } from '../context/AppContext';

export interface iMenuItem {
  id: string;
  tab: string;
  titleKey: string;
  icon: string;
  color: string;
  href: string | (() => void) | null; // Puede ser una ruta o una función
}

export const AllTabs = [
  { id: 'favorites', title: '', icon: 'star', data: [] },
  { id: 'almacen', title: '', icon: 'warehouse', data: [] },
  { id: 'cirugias', title: '', icon: 'medical-bag', data: [] },
  { id: 'calidad', title: '', icon: 'shield-star-outline', data: [] },
  { id: 'paqueteria', title: '', icon: 'truck', data: [] },
]

export const AppmenuItems: iMenuItem[] = [
  { id: '7', tab: 'almacen', titleKey: "screens.pickeo", icon: "hospital", color: "#3182ce", href: '/pickeo' },
  { id: '4', tab: 'cirugias', titleKey: "screens.cirugias_programar", icon: "calendar-check", color: "#3182ce", href: '/cirugias_programar' },
  { id: '14', tab: 'cirugias', titleKey: "screens.cirugias_buscar", icon: "file-search", color: "#ecc94b", href: "/cirugias_buscar" },
  { id: '10', tab: 'calidad', titleKey: "screens.reporte_piezas_danadas", icon: "alert-decagram-outline", color: "#e53e3e", href: "/reporte_piezas_danadas" },
  { id: '11', tab: 'calidad', titleKey: "screens.reporte_piezas_danadas_view", icon: "glass-fragile", color: "#48bb78", href: "/reporte_piezas_danadas_view" },
  { id: '20', tab: 'paqueteria', titleKey: "screens.paqueteria_por_enviar", icon: "truck-delivery", color: "#48bb78", href: "/paqueteria_por_enviar" },
  { id: '21', tab: 'paqueteria', titleKey: "screens.paqueteria_por_recibir", icon: "package-variant-closed", color: "#48bb78", href: "/paqueteria_por_recibir" }
];


export const AddMenuItem = (menu: any, key: string/*, set_soon: Dispatch<SetStateAction<boolean>>*/) => {
  for (const item of AppmenuItems) {
    if (item.titleKey === key) {
      const new_item: iMenuItem = {
        id: item.id,
        tab: item.tab,
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
const AppmenuItems_poralmacen = () => {
  const { user, t } = useApp();
  let ret = "";
  for (const item of AppmenuItems) {
    if (user.modulos_por_almacen.includes(";" + item.id + ";")) {
      ret = ret + item.titleKey.replace("screen.", "") + ";";
    }
  }
  return ret;
}

export const Tabs_Allowed_almacen = () => {
  const { user, t } = useApp();

  // 1. Filtrar los items del menú a los que el usuario tiene acceso
  const itemsPermitidos = AppmenuItems.filter((item) =>
    user.modulos_por_almacen.includes(`;${item.id};`)
  );
  const itemsFavoritos = AppmenuItems.filter((item) => {
    const fav_str = ";" + user.menu_favorites + ";";
    return fav_str.includes(`;${item.id};`)
  }
  );

  // 2. Agrupar o estructurar los datos según AllTabs sin mutar la variable original
  const resultado = AllTabs.map((tabGroup: any) => {
    // Buscar los items permitidos que corresponden a este tab
    const itemsDelTab = (tabGroup.id == "favorites")
      ? itemsFavoritos
      : itemsPermitidos.filter((item) => item.tab === tabGroup.id);
    tabGroup.title = t('home.menu_' + tabGroup.id);
    return {
      ...tabGroup,
      data: [...(tabGroup.data || []), ...itemsDelTab]
    };
  });

  // 3. Retornar el resultado
  return resultado;
};

export const Tabs_Allowed = () => {
  const { user, t } = useApp();

  const isAllowed = (menuName: string, itemName: string): boolean => {
    // Buscamos el menú en el arreglo de items del usuario
    const userMenu = user.menu_items?.find(m => m.menu === menuName) || false;
    if (!userMenu) return false;
    // Los items vienen separados por ; según tu lógica de login    
    const allowedItems = userMenu.items.split(';');
    return allowedItems.includes(itemName);
  };



  const Add_Menu_Items = (menu: any, menu_name: string): any => {
    if (Array.isArray(menu))
      menu.length = 0;
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
    /*
    if (menu_name == 'menu_logistica') {
      if (isAllowed('menu_logistica', 'activos')) AddMenuItem(menu, "screens.activos");
      if (isAllowed('menu_logistica', 'carpetas')) AddMenuItem(menu, "screens.carpetas");
      if (isAllowed('menu_logistica', 'socios')) AddMenuItem(menu, "screens.socios");
    }*/

    // --- Calidad
    if (menu_name == 'menu_calidad') {
      if (isAllowed('menu_calidad', 'reporte_piezas_danadas')) AddMenuItem(menu, "screens.reporte_piezas_danadas");
      if (isAllowed('menu_calidad', 'reporte_piezas_danadas_view')) AddMenuItem(menu, "screens.reporte_piezas_danadas_view");
    }
    // --- Paqueteria
    if (menu_name == 'menu_paqueteria') {
      if (isAllowed('menu_paqueteria', 'paqueteria_por_enviar')) AddMenuItem(menu, "screens.paqueteria_por_enviar");
      if (isAllowed('menu_paqueteria', 'paqueteria_por_recibir')) AddMenuItem(menu, "screens.paqueteria_por_recibir");
    }
    if (Array.isArray(menu))
      return menu.length;
    else
      return 0;
  };



  if (Array.isArray(AllTabs)) {
    AllTabs.map((tab: any, index: number) => {
      if (tab.id == 'favorites') {
        tab.title = t('home.menu_' + tab.id);
        tab.data = AppmenuItems.filter(item => user.menu_favorites?.includes(item.id)).slice();
      }
      else {
        const menu_name = 'menu_' + tab.id;
        tab.title = t('home.menu_' + tab.id);
        Add_Menu_Items(tab.data, menu_name);

      }
    });


    return AllTabs.filter(section => (section.data.length > 0) || (section.id == 'favorites'));
  }
  else
    return [];

}

export const perfil_modulos_poralmacen = (id_almacen: string, all_modulos: Record<string, any>) => {
  return all_modulos ?
    (("id_almacen_" + id_almacen in all_modulos)
      ? all_modulos["id_almacen_" + id_almacen]
      : "")
    : "";
}

