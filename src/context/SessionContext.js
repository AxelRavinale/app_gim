// src/context/SessionContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SessionContext = createContext(null);

const KEYS = {
  ACCESS_TOKEN:  'gymtracker_access_token',
  REFRESH_TOKEN: 'gymtracker_refresh_token',
  USER:          'gymtracker_user',
};

export function SessionProvider({ children }) {
  const [user, setUser]             = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => { checkSession(); }, []);

  async function checkSession() {
    try {
      const token    = await AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
      const userData = await AsyncStorage.getItem(KEYS.USER);
      if (token && userData) {
        const parsed = JSON.parse(userData);
        // Normalizar roles al leer
        const normalized = {
          ...parsed,
          roles: Array.isArray(parsed.roles)
            ? parsed.roles
            : typeof parsed.roles === 'string'
              ? (() => { try { return JSON.parse(parsed.roles); } catch { return [parsed.role || 'member']; } })()
              : [parsed.role || 'member'],
          activeRole: parsed.activeRole || parsed.active_role || parsed.role || 'member',
        };
        setUser(normalized);
      }
    } catch (err) {
      console.log('checkSession error:', err.message);
    } finally {
      setIsChecking(false);
    }
  }

  // login: guarda tokens y usuario, actualiza estado
  async function login(userData, accessToken, refreshToken) {
    try {
      const normalized = {
        ...userData,
        roles: Array.isArray(userData.roles)
          ? userData.roles
          : typeof userData.roles === 'string'
            ? (() => { try { return JSON.parse(userData.roles); } catch { return [userData.role || 'member']; } })()
            : [userData.role || 'member'],
        activeRole: userData.activeRole || userData.active_role || userData.role || 'member',
      };

      // Guardar usuario normalizado
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(normalized));

      // Solo sobreescribir tokens si vienen con valor
      if (accessToken)  await AsyncStorage.setItem(KEYS.ACCESS_TOKEN,  accessToken);
      if (refreshToken) await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);

      setUser(normalized);
    } catch (err) {
      console.log('login error:', err.message);
    }
  }

  async function logout() {
    try {
      await AsyncStorage.multiRemove([
        KEYS.ACCESS_TOKEN,
        KEYS.REFRESH_TOKEN,
        KEYS.USER,
      ]);
    } catch {}
    setUser(null);
  }

  function updateUser(updates) {
    const updated = { ...user, ...updates };
    setUser(updated);
    AsyncStorage.setItem(KEYS.USER, JSON.stringify(updated)).catch(() => {});
  }

  return (
    <SessionContext.Provider value={{ user, isChecking, login, logout, updateUser }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}