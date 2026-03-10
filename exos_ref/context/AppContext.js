import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [appConfig] = useState({
    passtrough_mode: false,
    name: "exosapp",
    server: "https://exorta.exos.software/",
    passkey: "{PASSKEY}",
    url: "https://exorta.exos.software/",
  });

  const [user, setUser] = useState({ 
    id_usuario_app: "", 
    id_usuario:"",
    id_almacen:"", 
    almacen_nombre:"", 
    almacen_codigo:"", 
    nombre: "", 
    tema: "light" 
  });

  // Definición de colores por tema
  const themes = {
    light: {
      bg: "#f5f5f5",
      card: "#ffffff",
      text: "#1a1a1a",
      textSub: "#666666",
      border: "#e2e8f0",
      inputBg: "#edf2f7",
      isDark: false
    },
    dark: {
      bg: "#121212",
      card: "#3a3a3a",
      text: "#ffffff",
      textSub: "#a0aec0",
      border: "#2d3748",
      inputBg: "rgba(255,255,255,0.1)",
      isDark: true
    }
  };

  const activeTheme = themes[user.tema] || themes.light;

  return (
    <AppContext.Provider value={{ appConfig, user, setUser, theme: activeTheme }}>
      {children}
    </AppContext.Provider>
  );
};