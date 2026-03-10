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
  setIsLoggedIn: (value: boolean) => void;
  logout: () => Promise<void>;
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
    accent: "#3182ce"
  },
  dark: {
    bg: "#121212",
    card: "#2d2d2d",
    text: "#ffffff",
    textSub: "#a0aec0",
    border: "#3d3d3d",
    inputBg: "rgba(255,255,255,0.1)",
    isDark: true,
    accent: "#63b3ed"
  },
  blue: {
    bg: "#e3f2fd",
    card: "#ffffff",
    text: "#1565c0",
    textSub: "#42a5f5",
    border: "#90caf9",
    inputBg: "#bbdefb",
    isDark: false,
    accent: "#1976d2"
  },
  pink: {
    bg: "#fce4ec",
    card: "#ffffff",
    text: "#c2185b",
    textSub: "#f06292",
    border: "#f8bbd9",
    inputBg: "#f8bbd9",
    isDark: false,
    accent: "#e91e63"
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
    tema: "light"
  });

  const [language, setLanguageState] = useState<Language>('es');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      tema: "light"
    });
    setIsLoggedIn(false);
    try {
      await AsyncStorage.removeItem('@exosapp_user');
    } catch (e) {
      console.log('Error removing user:', e);
    }
  };

  const activeTheme = themes[user.tema] || themes.light;

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
      logout
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