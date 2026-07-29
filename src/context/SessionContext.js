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
        setUser(parsed);
      }
    } catch (err) {
      console.log('checkSession error:', err.message);
    } finally {
      // Garantizar que isChecking siempre pasa a false
      setIsChecking(false);
    }
  }

  async function login(userData, accessToken, refreshToken) {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(userData));
      if (accessToken)  await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, accessToken);
      if (refreshToken) await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken);
      setUser(userData);
    } catch (err) {
      console.log('login error:', err.message);
      // Aunque falle el guardado, actualizar el estado igual
      setUser(userData);
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