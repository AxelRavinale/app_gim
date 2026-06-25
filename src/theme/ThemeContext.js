// ThemeContext.js
// El sistema de temas de la app. Permite que cualquier componente
// sepa si el tema es claro u oscuro y pueda cambiar los colores.
//
// Conceptos nuevos:
// - Context API: sistema de React para compartir datos entre componentes
//   sin tener que pasar props de padre a hijo a nieto... etc.
//   Es como una variable global pero integrada con el ciclo de vida de React.
//
// - createContext(): crea el "canal" de comunicacion
// - Provider: el componente que "provee" los datos a todos sus hijos
// - useContext(): hook para "consumir" los datos desde cualquier hijo
//
// - useColorScheme(): hook de React Native que detecta si el telefono
//   esta en modo oscuro o claro segun la configuracion del sistema.
//
// - AsyncStorage: lo usamos para guardar la preferencia manual del usuario
//   asi la proxima vez que abra la app recuerda su eleccion.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './colors';

// Clave para guardar la preferencia en el storage
const THEME_KEY = 'gymtracker_theme_preference';
// Valores posibles: 'system' | 'light' | 'dark'

// 1. Creamos el contexto con valores por defecto
//    (solo se usan si alguien llama useTheme() fuera del Provider)
const ThemeContext = createContext({
  colors: lightColors,
  isDark: false,
  themePreference: 'system',
  toggleTheme: () => {},
  setThemePreference: () => {},
});

// 2. El Provider: envuelve toda la app y provee el tema a todos los componentes
export function ThemeProvider({ children }) {
  // Detecta el tema del sistema operativo del telefono ('light' | 'dark' | null)
  const systemColorScheme = useColorScheme();

  // Preferencia guardada por el usuario: 'system' | 'light' | 'dark'
  const [themePreference, setThemePreferenceState] = useState('system');

  // Cargamos la preferencia guardada cuando la app abre
  useEffect(() => {
    loadThemePreference();
  }, []);

  async function loadThemePreference() {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved) setThemePreferenceState(saved);
    } catch (error) {
      console.error('Error cargando preferencia de tema:', error);
    }
  }

  // Guarda la nueva preferencia en storage y actualiza el estado
  async function setThemePreference(preference) {
    try {
      await AsyncStorage.setItem(THEME_KEY, preference);
      setThemePreferenceState(preference);
    } catch (error) {
      console.error('Error guardando preferencia de tema:', error);
    }
  }

  // Calcula si el tema activo es oscuro segun la preferencia:
  // - 'system': sigue la configuracion del telefono
  // - 'dark': siempre oscuro
  // - 'light': siempre claro
  const isDark =
    themePreference === 'dark' ? true :
    themePreference === 'light' ? false :
    systemColorScheme === 'dark';  // 'system': sigue el telefono

  // Los colores activos segun el tema
  const colors = isDark ? darkColors : lightColors;

  // toggleTheme: alterna entre claro y oscuro
  // Si estaba en 'system', pasa al opuesto del sistema
  function toggleTheme() {
    if (themePreference === 'system') {
      // Si el sistema es oscuro, forzamos claro y viceversa
      setThemePreference(systemColorScheme === 'dark' ? 'light' : 'dark');
    } else if (themePreference === 'dark') {
      setThemePreference('light');
    } else {
      setThemePreference('dark');
    }
  }

  // El valor que se va a compartir con todos los componentes hijos
  const contextValue = {
    colors,
    isDark,
    themePreference,
    toggleTheme,
    setThemePreference,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Hook personalizado para consumir el contexto facilmente.
//    En vez de escribir useContext(ThemeContext) en cada componente,
//    simplemente escribis useTheme() y listo.
//
//    Uso en cualquier componente:
//    const { colors, isDark, toggleTheme } = useTheme();
export function useTheme() {
  return useContext(ThemeContext);
}