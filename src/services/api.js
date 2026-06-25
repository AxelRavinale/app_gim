// src/services/api.js
// Capa de comunicacion entre la app mobile y el backend.
// Todos los requests al servidor pasan por este archivo.
//
// Conceptos nuevos:
// - fetch(): funcion nativa de JS para hacer requests HTTP
// - AsyncStorage: guardamos el token JWT para no pedir login cada vez
// - Authorization header: enviamos el token en cada request protegido

import AsyncStorage from '@react-native-async-storage/async-storage';

// URL base del backend en Railway
// En desarrollo podés cambiarla a http://TU-IP-LOCAL:3000
const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

const KEYS = {
  ACCESS_TOKEN:  'gymtracker_access_token',
  REFRESH_TOKEN: 'gymtracker_refresh_token',
  USER:          'gymtracker_user',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Guarda los tokens y el usuario en AsyncStorage
async function saveSession(accessToken, refreshToken, user) {
  await Promise.all([
    AsyncStorage.setItem(KEYS.ACCESS_TOKEN,  accessToken),
    AsyncStorage.setItem(KEYS.REFRESH_TOKEN, refreshToken),
    AsyncStorage.setItem(KEYS.USER,          JSON.stringify(user)),
  ]);
}

// Obtiene el access token guardado
async function getAccessToken() {
  return AsyncStorage.getItem(KEYS.ACCESS_TOKEN);
}

// Limpia la sesion (logout)
async function clearSession() {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.ACCESS_TOKEN),
    AsyncStorage.removeItem(KEYS.REFRESH_TOKEN),
    AsyncStorage.removeItem(KEYS.USER),
  ]);
}

// Obtiene el usuario guardado localmente
export async function getSavedUser() {
  const json = await AsyncStorage.getItem(KEYS.USER);
  return json ? JSON.parse(json) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST BASE
// Funcion central que maneja todos los requests HTTP.
// Si el access token expiro, intenta renovarlo automaticamente con el refresh token.
// ─────────────────────────────────────────────────────────────────────────────
async function request(method, path, body = null, retry = true) {
  const token = await getAccessToken();

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BASE_URL}${path}`, config);
    const data = await response.json();

    // Si el token expiro, intentamos renovarlo automaticamente
    if (response.status === 401 && data.code === 'TOKEN_EXPIRED' && retry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Reintentamos el request original con el nuevo token
        return request(method, path, body, false);
      } else {
        // El refresh token tambien expiro, hay que hacer login de nuevo
        await clearSession();
        throw new Error('SESSION_EXPIRED');
      }
    }

    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.message === 'SESSION_EXPIRED') throw error;
    if (error.name === 'TypeError') {
      throw new Error('Sin conexion al servidor. Verificá tu internet.');
    }
    throw error;
  }
}

// Intenta renovar el access token usando el refresh token
async function refreshAccessToken() {
  try {
    const refreshToken = await AsyncStorage.getItem(KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    await AsyncStorage.setItem(KEYS.ACCESS_TOKEN, data.accessToken);
    await AsyncStorage.setItem(KEYS.REFRESH_TOKEN, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {
  // Registra un usuario nuevo
  register: async (email, password, firstName, lastName) => {
    const data = await request('POST', '/api/auth/register', { email, password, firstName, lastName });
    await saveSession(data.accessToken, data.refreshToken, data.user);
    return data;
  },

  // Inicia sesion
  login: async (email, password) => {
    const data = await request('POST', '/api/auth/login', { email, password });
    await saveSession(data.accessToken, data.refreshToken, data.user);
    return data;
  },

  // Cierra sesion
  logout: async () => {
    try { await request('POST', '/api/auth/logout'); } catch {}
    await clearSession();
  },

  // Obtiene el perfil del usuario autenticado
  me: () => request('GET', '/api/auth/me'),

  // Verifica si hay una sesion activa guardada
  isLoggedIn: async () => {
    const token = await getAccessToken();
    return !!token;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISES
// Sincroniza los ejercicios locales con el servidor
// ─────────────────────────────────────────────────────────────────────────────
export const exercisesAPI = {
  // Obtiene todos los ejercicios del usuario desde el servidor
  getAll: () => request('GET', '/api/exercises'),

  // Crea un ejercicio en el servidor
  create: (exercise) => request('POST', '/api/exercises', {
    name:         exercise.name,
    muscleGroup:  exercise.muscleGroup,
    trackingType: exercise.trackingType,
    description:  exercise.description,
    videoUrl:     exercise.videoUrl,
  }),

  // Actualiza un ejercicio en el servidor
  update: (id, exercise) => request('PUT', `/api/exercises/${id}`, exercise),

  // Elimina un ejercicio del servidor
  delete: (id) => request('DELETE', `/api/exercises/${id}`),

  // Registra una sesion de entrenamiento
  addSession: (exerciseId, sessionData) =>
    request('POST', `/api/exercises/${exerciseId}/sessions`, sessionData),

  // Elimina una sesion
  deleteSession: (exerciseId, sessionId) =>
    request('DELETE', `/api/exercises/${exerciseId}/sessions/${sessionId}`),

  // Sincroniza todos los ejercicios locales con el servidor de una vez
  // Util para la primera vez que el usuario se loguea y ya tiene datos locales
  sync: (exercises) => request('POST', '/api/exercises/sync', { exercises }),
};

// ─────────────────────────────────────────────────────────────────────────────
// GYMS (para gym_owners y trainers)
// ─────────────────────────────────────────────────────────────────────────────
export const gymsAPI = {
  getMyGym:   (gymId) => request('GET',   `/api/gyms/${gymId}`),
  update:     (gymId, data) => request('PATCH', `/api/gyms/${gymId}`, data),
  getMembers: (gymId) => request('GET',   `/api/gyms/${gymId}/members`),
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN (solo superadmin)
// ─────────────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:       () => request('GET',  '/api/admin/stats'),
  getAllUsers:     () => request('GET',  '/api/admin/users'),
  getAllGyms:      () => request('GET',  '/api/gyms'),
  createGym:      (data) => request('POST',  '/api/gyms', data),
  toggleGym:      (gymId) => request('PATCH', `/api/gyms/${gymId}/toggle`),
  updateLicense:  (gymId, data) => request('POST', `/api/admin/gyms/${gymId}/license`, data),
  toggleUser:     (userId) => request('POST', `/api/admin/users/${userId}/toggle`),
};