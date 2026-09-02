import React, { createContext, useState, useContext, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import translations from '../languages.json';
import { hexToRGBA } from '@/components/elidev_components/_Functions';

type Language = 'es' | 'en';
type ThemeType = 'light' | 'dark' | 'blue' | 'pink';

export interface GlobalNav{
  last_home_path : string;
}

export interface OpenTab {
  path: string;
  name: string;
  icon: string;
}

export interface Menu_item {
  menu: string;
  items: string;
}
export interface Terminal_Data{
  selected : boolean;
  id:string;
  nombre:string;
}

interface User {
  id_usuario_app: string;
  id_usuario: string;
  id_tipo_usuario: string;
  tipo_usuario: string;
  id_almacen: string;
  almacen_nombre: string;
  almacen_codigo: string;
  alias_usuario: string;
  pin: string;
  tema: ThemeType;
  menu_favorites: string[];
  menu_items: Menu_item[];
  all_modulos : String[];
  modulos_por_almacen:string;
  chat_client_enabled : boolean;
  chat_client_coonnected: boolean;
  chat_client_appID: string;
  chat_client_appKey: string;
  chat_client_token: string;
  /* ****  Local session **** */ 
  local_terminal : Terminal_Data;
}

interface AppConfig {
  passtrough_mode: boolean;
  name: string;
  passkey: string;
  url: string;
  backend_server:string;
}

interface Theme {
  bg: string;
  bg_mask: string;
  card: string;
  text: string;
  text_shadow: string;
  textSub: string;
  textSub_shadow: string;
  border: string;
  inputBg: string;
  isDark: boolean;
  accent: string;
  iconColor: string;
  iconColor_shadow: string;
  iconTextColor: string;
  iconTextColor_shadow: string;
  markup_complete : string;
  markup_incomplete : string;
}

interface AppContextType {
  appConfig: AppConfig;
  lastGlobalNav: GlobalNav;
  setLastGlobalNav: React.Dispatch<React.SetStateAction<GlobalNav>>;
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  theme: Theme;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isUpdatePending: boolean;
  applyUpdateAndRestart: () => Promise<void>;
  otaStatus: 'idle' | 'disabled' | 'checking' | 'up_to_date' | 'update_downloaded' | 'error';
  otaLastCheckedAt: Date | null;
  otaLastError: string | null;
  checkForAppUpdate: () => Promise<void>;
  menuFav_str: () => string;
  menuFav_set: (value: any) => void;
  openTabs: OpenTab[];
  addOpenTab: (tab: OpenTab) => void;
  closeOpenTab: (path: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const themes: Record<ThemeType, Theme> = {
  light: {
    bg: "#f5f5f5",
    bg_mask: hexToRGBA('#ffffff', 0),
    card: "#ffffff",
    text: "#1a1a1a",
    textSub: "#666666",
    text_shadow: "#ffffff",
    textSub_shadow: "#ffffff",
    iconColor_shadow: "#444444",
    border: "#e2e8f0",
    inputBg: "#edf2f7",
    isDark: false,
    accent: "#3182ce",
    iconColor: "#3182ce",
    iconTextColor: "#ffffff",
    iconTextColor_shadow: "#444444",
    markup_complete: "#00ff00b2",
    markup_incomplete: "#ff0000b2"
  },
  dark: {
    bg: "#121212",
    bg_mask: hexToRGBA('#000000', 0.5),
    card: "#2d2d2d",
    text: "#ffffff",
    textSub: "#a0aec0",
    border: "#3d3d3d",
    inputBg: "rgba(255,255,255,0.1)",
    text_shadow: "#444444",
    textSub_shadow: "#444444",
    iconColor_shadow: "#fffffff",
    isDark: true,
    accent: "#63b3ed",
    iconColor: "#000000",
    iconTextColor: "#fbfbfb",
    iconTextColor_shadow: "#000000",
    markup_complete: "#00ff00b2",
    markup_incomplete: "#ff0000b2"
  },
  blue: {
    bg: "#e3f2fd",
    bg_mask: hexToRGBA('#154883', 0),
    card: "#ffffff",
    text: "#1565c0",
    textSub: "#42a5f5",
    text_shadow: "#444488",
    textSub_shadow: "#444444",
    iconColor_shadow: "#cfcfcf",
    border: "#90caf9",
    inputBg: "#bbdefb",
    isDark: false,
    accent: "#1976d2",
    iconColor: "#1976d2",
    iconTextColor: "#154883",
    iconTextColor_shadow: "#000000",
    markup_complete: "#00ff00b2",
    markup_incomplete: "#ff0000b2"
  },
  pink: {
    bg: "#fce4ec",
    bg_mask: hexToRGBA('#ffc0d5', 0.2),
    card: "#ffffff",
    text: "#c2185b",
    textSub: "#f06292",
    text_shadow: "#664444",
    textSub_shadow: "#664444",
    iconColor_shadow: "#f06292",
    border: "#f8bbd9",
    inputBg: "#f8bbd9",
    isDark: false,
    accent: "#e91e63",
    iconColor: "#f062915e",
    iconTextColor: "#b1427a",
    iconTextColor_shadow: "#000000",
    markup_complete: "#00ff00b2",
    markup_incomplete: "#ff0000b2"
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const servers = {
    "localip" : "http://192.168.100.59/exorta/webservice",
    "local" : "http://jonatan-kubuntu/exorta/webservice",
    "exos" : "https://exorta.exos.software/webservice",
    "exodos": "https://exodos.exos.software/webservice"
  };
  
  const backend_server = "local";
  
  const [appConfig] = useState<AppConfig>({
    passtrough_mode: false,
    name: "exosapp",
    passkey: "{PASSKEY}",
    url: servers[backend_server],
    backend_server: backend_server
  });

  const [lastGlobalNav, setLastGlobalNav] = useState<GlobalNav>({
    last_home_path : "/home"
  });

  const [user, setUser] = useState<User>({
    id_usuario_app: "",
    id_usuario: "",
    id_tipo_usuario: "",
    tipo_usuario: "",
    id_almacen: "",
    almacen_nombre: "",
    almacen_codigo: "",
    alias_usuario: "",
    tema: "light",
    menu_favorites: [],
    menu_items: [],
    all_modulos :[],
    modulos_por_almacen :'',
    chat_client_enabled : false,
    chat_client_coonnected: false,
    chat_client_appID: "",
    chat_client_appKey: "",
    chat_client_token: "",    
    pin: "",
    local_terminal:{selected:false, id:'',nombre:''}    
  });

  const setIsLoggedIn = async (value: boolean) => {
    setIsLoggedInState(value); // Actualiza el estado de la app inmediatamente
    try {
      if (value) {
        // Si el usuario inicia sesión, guardamos el momento exacto (timestamp)
        const now = Date.now().toString();
        await AsyncStorage.setItem('@exosapp_last_activity', now);
        await AsyncStorage.setItem('@exosapp_is_logged_in', 'true');
      } else {
        // Si cierra sesión, limpiamos los registros de actividad
        await AsyncStorage.removeItem('@exosapp_last_activity');
        await AsyncStorage.removeItem('@exosapp_is_logged_in');
      }
    } catch (e) {
      console.log('Error saving login state:', e);
    }
  };

  const [language, setLanguageState] = useState<Language>('es');
  const [isLoggedIn, setIsLoggedInState] = useState(false);
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const [otaStatus, setOtaStatus] = useState<'idle' | 'disabled' | 'checking' | 'up_to_date' | 'update_downloaded' | 'error'>('idle');
  const [otaLastCheckedAt, setOtaLastCheckedAt] = useState<Date | null>(null);
  const [otaLastError, setOtaLastError] = useState<string | null>(null);

  useEffect(() => {
    loadSavedLanguage();
    loadSavedUser();
    checkForAppUpdate();

    // La app puede quedarse abierta en foreground mucho rato sin volver a
    // mandarse a background, así que un solo chequeo al montar no basta para
    // detectar un OTA publicado mientras ya estaba abierta: se revisa de
    // nuevo al volver de background y cada 5 min mientras sigue en uso.
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkForAppUpdate();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    const updateCheckInterval = setInterval(checkForAppUpdate, 5 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(updateCheckInterval);
    };
  }, []);

  const checkForAppUpdate = async () => {
    // __DEV__ y !Updates.isEnabled significan que no hay build OTA que
    // consultar (Expo Go, dev client, o web): antes esto retornaba en
    // silencio, así que desde profile.tsx no había forma de saber si el
    // chequeo automático simplemente nunca corre en ese entorno.
    if (__DEV__ || !Updates.isEnabled) {
      setOtaStatus('disabled');
      return;
    }
    setOtaStatus('checking');
    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        const fetchResult = await Updates.fetchUpdateAsync();
        setIsUpdatePending(fetchResult.isNew);
        setOtaStatus(fetchResult.isNew ? 'update_downloaded' : 'up_to_date');
      } else {
        setOtaStatus('up_to_date');
      }
      setOtaLastError(null);
    } catch (e: any) {
      console.log('Error checking for app update:', e);
      setOtaStatus('error');
      setOtaLastError(e?.message || String(e));
    } finally {
      setOtaLastCheckedAt(new Date());
    }
  };

  const applyUpdateAndRestart = async () => {
    await Updates.reloadAsync();
  };

  const loadSavedLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('@exosapp_language');
      if (savedLang === 'es' || savedLang === 'en') {
        setLanguageState(savedLang);
      }
    } catch (e) {
      console.log('Error loading language:', e);
    }
  };

  const loadSavedUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('@exosapp_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser.id_usuario && parsedUser.id_usuario !== "" ) {
          if (parsedUser.pin) {
            setIsLoggedIn(true); // Solo se considera logueado si tiene pin
          } else {
            await logout(); // Sin pin: la sesión guardada ya no es válida
          }
        }
      }
    } catch (e) {
      console.log('Error loading user:', e);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('@exosapp_language', lang);
    } catch (e) {
      console.log('Error saving language:', e);
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = (translations as any)[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const logout = async () => {
    setUser({
      id_usuario_app: "",
      id_usuario: "",
      id_tipo_usuario: "",
      tipo_usuario: "",
      id_almacen: "",
      almacen_nombre: "",
      almacen_codigo: "",
      alias_usuario: "",
      tema: "light",
      menu_favorites: [],
      menu_items: [],
      all_modulos : [],
      modulos_por_almacen :'',
      chat_client_enabled : false,
      chat_client_coonnected: false,
      chat_client_appID: "",
      chat_client_appKey: "",
      chat_client_token: "" ,
      pin: "",
      local_terminal:{selected:false, id:'',nombre:''}
    });
    await setIsLoggedIn(false); // Añade el await aquí    
    try {
      await AsyncStorage.removeItem('@exosapp_user');
    } catch (e) {
      console.log('Error removing user:', e);
    }
  };

  const activeTheme = themes[user.tema] || themes.light;

  const menuFav_str = (): string => {
    if (!user.menu_favorites || user.menu_favorites.length === 0) {
      return "";
    }

    // .join(';') une los elementos: "1;2;9"
    return user.menu_favorites.join(';');
  };
  const menuFav_set = (value: any) => {
    if (!value) {
      setUser(prev => ({ ...prev, menu_favorites: [] }));
      return;
    }
    if (typeof value == "string") {
      if (value.trim() === "") {
        setUser(prev => ({ ...prev, menu_favorites: [] }));
        return;
      }
      const favoritesArray = value.split(';').filter(item => item !== "");
      setUser(prev => ({
        ...prev,
        menu_favorites: favoritesArray
      }));

    }
  };

  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);

  // Expo Router trata "/(tabs)/cirugias_buscar" y "/cirugias_buscar" como paths
  // distintos aunque sean la misma pantalla (los grupos de ruta entre paréntesis
  // no deberían afectar la URL, pero usePathname() a veces sí los conserva según
  // cómo se navegó). Se quitan aquí para que addOpenTab/closeOpenTab siempre
  // comparen y guarden la forma "limpia", sin depender de que cada pantalla evite
  // el prefijo por su cuenta.
  const normalizeTabPath = (path: string): string => {
    const cleaned = path
      .split('/')
      .filter(segment => !(segment.startsWith('(') && segment.endsWith(')')))
      .join('/');
    return cleaned || '/';
  };

  const addOpenTab = (tab: OpenTab) => {
  const normalizedTab = { ...tab, path: normalizeTabPath(tab.path) };
  setOpenTabs(prev => {
    const exists = prev.find(t => t.path === normalizedTab.path);
    if (exists) {
      // lo movemos al final (más reciente) sin duplicar
      return [...prev.filter(t => t.path !== normalizedTab.path), normalizedTab];
    }
    return [...prev, normalizedTab];
  });
};

const closeOpenTab = (path: string) => {
  const normalizedPath = normalizeTabPath(path);
  setOpenTabs(prev => prev.filter(t => t.path !== normalizedPath));
};

  return (
    <AppContext.Provider value={{
      appConfig,
      lastGlobalNav,
      setLastGlobalNav,
      user,
      setUser,
      theme: activeTheme,
      language,
      setLanguage,
      t,
      isLoggedIn,
      setIsLoggedIn,
      logout,
      isUpdatePending,
      applyUpdateAndRestart,
      otaStatus,
      otaLastCheckedAt,
      otaLastError,
      checkForAppUpdate,
      menuFav_str,
      menuFav_set,
      openTabs,
      addOpenTab,
      closeOpenTab
    }}>
      {children}
    </AppContext.Provider>
  );


};



export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};