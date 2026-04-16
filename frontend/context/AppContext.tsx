import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../languages.json';

type Language = 'es' | 'en';
type ThemeType = 'light' | 'dark' | 'blue' | 'pink';

interface User {
  id_usuario_app: string;
  id_usuario: string;
  id_almacen: string;
  almacen_nombre: string;
  almacen_codigo: string;
  alias_usuario: string;
  tema: ThemeType;
  menu_favorites: string[];
}

interface AppConfig {
  passtrough_mode: boolean;
  name: string;
  server: string;
  passkey: string;
  url: string;
}

interface Theme {
  bg: string;
  card: string;
  text: string;
  textSub: string;
  border: string;
  inputBg: string;
  isDark: boolean;
  accent: string;
  iconColor: string;
  iconTextColor: string;
}

interface AppContextType {
  appConfig: AppConfig;
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  theme: Theme;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => Promise<void>;
  logout: () => Promise<void>;
  menuFav_str: () => string;
  menuFav_set: (value: any) => void
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const themes: Record<ThemeType, Theme> = {
  light: {
    bg: "#f5f5f5",
    card: "#ffffff",
    text: "#1a1a1a",
    textSub: "#666666",
    border: "#e2e8f0",
    inputBg: "#edf2f7",
    isDark: false,
    accent: "#3182ce",
    iconColor: "#3182ce",
    iconTextColor:"#ffffff"
  },
  dark: {
    bg: "#121212",
    card: "#2d2d2d",
    text: "#ffffff",
    textSub: "#a0aec0",
    border: "#3d3d3d",
    inputBg: "rgba(255,255,255,0.1)",
    isDark: true,
    accent: "#63b3ed",
    iconColor: "#000000",
    iconTextColor:"#fbfbfb"
  },
  blue: {
    bg: "#e3f2fd",
    card: "#ffffff",
    text: "#1565c0",
    textSub: "#42a5f5",
    border: "#90caf9",
    inputBg: "#bbdefb",
    isDark: false,
    accent: "#1976d2",
    iconColor: "#1976d2",
    iconTextColor:"#154883"
  },
  pink: {
    bg: "#fce4ec",
    card: "#ffffff",
    text: "#c2185b",
    textSub: "#f06292",
    border: "#f8bbd9",
    inputBg: "#f8bbd9",
    isDark: false,
    accent: "#e91e63",
    iconColor: "#f062915e",
    iconTextColor:"#b1427a"
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appConfig] = useState<AppConfig>({
    passtrough_mode: false,
    name: "exosapp",
    server: "https://exorta.exos.software/",
    passkey: "{PASSKEY}",
    url: "https://exorta.exos.software/",
  });

  const [user, setUser] = useState<User>({
    id_usuario_app: "",
    id_usuario: "",
    id_almacen: "",
    almacen_nombre: "",
    almacen_codigo: "",
    alias_usuario: "",
    tema: "light",
    menu_favorites: []
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

  useEffect(() => {
    loadSavedLanguage();
    loadSavedUser();
  }, []);

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
        if (parsedUser.id_usuario) {
          setIsLoggedIn(true);
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
      id_almacen: "",
      almacen_nombre: "",
      almacen_codigo: "",
      alias_usuario: "",
      tema: "light",
      menu_favorites: []
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

  return (
    <AppContext.Provider value={{
      appConfig,
      user,
      setUser,
      theme: activeTheme,
      language,
      setLanguage,
      t,
      isLoggedIn,
      setIsLoggedIn,
      logout,
      menuFav_str,
      menuFav_set
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