// src/context/SessionContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => { checkSession(); }, []);

  async function checkSession() {
    try {
      const token = await AsyncStorage.getItem('gymtracker_access_token');
      const userData = await AsyncStorage.getItem('gymtracker_user');
      if (token && userData) setUser(JSON.parse(userData));
    } catch {}
    finally { setIsChecking(false); }
  }

  async function login(userData, accessToken, refreshToken) {
    await AsyncStorage.setItem('gymtracker_access_token', accessToken);
    await AsyncStorage.setItem('gymtracker_refresh_token', refreshToken);
    await AsyncStorage.setItem('gymtracker_user', JSON.stringify(userData));
    setUser(userData);
  }

  async function logout() {
    await AsyncStorage.multiRemove([
      'gymtracker_access_token',
      'gymtracker_refresh_token',
      'gymtracker_user',
    ]);
    setUser(null);
  }

  function updateUser(updates) {
    const updated = { ...user, ...updates };
    setUser(updated);
    AsyncStorage.setItem('gymtracker_user', JSON.stringify(updated));
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