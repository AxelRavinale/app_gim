// src/storage/exercises.js - CON SINCRONIZACION AL BACKEND
// La app sigue funcionando offline con AsyncStorage.
// Cuando hay internet, sincroniza automaticamente con el servidor.
// Esto se llama "offline-first": local primero, servidor despues.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { exercisesAPI, authAPI } from '../services/api';

const EXERCISES_KEY = 'gymtracker_exercises';

export const MUSCLE_GROUPS = ['Pecho','Espalda','Piernas','Hombros','Brazos','Core','Cardio','Otro'];
export const TRACKING_TYPES = { WEIGHT: 'weight', TIME: 'time' };

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS LOCALES
// ─────────────────────────────────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDuration(minutes) {
  if (!minutes) return '0min';
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SINCRONIZACION
// Intenta sincronizar con el servidor. Si falla, continua offline.
// ─────────────────────────────────────────────────────────────────────────────

async function isLoggedIn() {
  try { return await authAPI.isLoggedIn(); } catch { return false; }
}

// Sincroniza los datos locales al servidor
async function syncToServer(localExercises) {
  try {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) return;
    await exercisesAPI.sync(localExercises);
  } catch (error) {
    // Si falla la sincronizacion, continuamos offline sin interrumpir al usuario
    console.log('Sync fallido (offline?):', error.message);
  }
}

// Descarga los ejercicios del servidor y los fusiona con los locales
async function syncFromServer() {
  try {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) return null;

    const serverExercises = await exercisesAPI.getAll();
    if (!serverExercises || serverExercises.length === 0) return null;

    // Convertimos el formato del servidor al formato local de la app
    const converted = serverExercises.map(ex => ({
      id:           ex.id,
      name:         ex.name,
      muscleGroup:  ex.muscle_group,
      trackingType: ex.tracking_type,
      description:  ex.description,
      videoUrl:     ex.video_url,
      createdAt:    ex.created_at,
      sets: (ex.sets || []).map(s => ({
        id:                   s.id,
        date:                 s.date,
        maxWeightInSession:   s.maxWeightInSession,
        duration:             s.duration,
        distance:             s.distance,
        type:                 s.duration != null ? 'time' : 'weight',
        series:               (s.series || []).map(sr => ({
          serieNumber: sr.serieNumber,
          weight:      sr.weight,
          reps:        sr.reps,
        })),
      })),
    }));

    return converted;
  } catch (error) {
    console.log('Sync from server fallido:', error.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD LOCAL + SINCRONIZACION
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllExercises() {
  try {
    // Intentamos traer datos del servidor
    const serverData = await syncFromServer();
    if (serverData && serverData.length > 0) {
      // Guardamos localmente como cache
      await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(serverData));
      return serverData;
    }
  } catch {}

  // Fallback: datos locales
  const json = await AsyncStorage.getItem(EXERCISES_KEY);
  return json ? JSON.parse(json) : [];
}

export async function getExerciseById(id) {
  const exercises = await getAllExercises();
  return exercises.find(ex => ex.id === id) || null;
}

export async function saveExercise(exerciseData) {
  const json = await AsyncStorage.getItem(EXERCISES_KEY);
  const exercises = json ? JSON.parse(json) : [];

  const newExercise = {
    id:           generateId(),
    name:         exerciseData.name,
    muscleGroup:  exerciseData.muscleGroup || 'Otro',
    trackingType: exerciseData.trackingType || TRACKING_TYPES.WEIGHT,
    description:  exerciseData.description || '',
    videoUrl:     exerciseData.videoUrl || '',
    videoLocal:   exerciseData.videoLocal || null,
    sets:         [],
    createdAt:    new Date().toISOString(),
  };

  exercises.push(newExercise);
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));

  // Sincronizamos con el servidor en segundo plano
  syncToServer(exercises).catch(() => {});

  return newExercise;
}

export async function updateExercise(id, exerciseData) {
  const json = await AsyncStorage.getItem(EXERCISES_KEY);
  const exercises = json ? JSON.parse(json) : [];

  const index = exercises.findIndex(ex => ex.id === id);
  if (index === -1) throw new Error('Ejercicio no encontrado');

  exercises[index] = { ...exercises[index], ...exerciseData, id };
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));

  // Sync en background
  try {
    const loggedIn = await isLoggedIn();
    if (loggedIn) await exercisesAPI.update(id, exerciseData);
  } catch {}

  return exercises[index];
}

export async function deleteExercise(id) {
  const json = await AsyncStorage.getItem(EXERCISES_KEY);
  const exercises = json ? JSON.parse(json) : [];
  const filtered = exercises.filter(ex => ex.id !== id);
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(filtered));

  // Sync en background
  try {
    const loggedIn = await isLoggedIn();
    if (loggedIn) await exercisesAPI.delete(id);
  } catch {}
}

export async function addWeightSession(exerciseId, series, routineSessionId = null) {
  const json = await AsyncStorage.getItem(EXERCISES_KEY);
  const exercises = json ? JSON.parse(json) : [];
  const exercise = exercises.find(ex => ex.id === exerciseId);
  if (!exercise) throw new Error('Ejercicio no encontrado');

  const validSeries = series.filter(s => s.weight > 0 || s.reps > 0);
  const maxWeight = validSeries.length > 0
    ? Math.max(...validSeries.map(s => parseFloat(s.weight) || 0).filter(w => isFinite(w) && w > 0))
    : 0;

  const newSet = {
    id:                   generateId(),
    date:                 new Date().toISOString(),
    maxWeightInSession:   maxWeight,
    type:                 'weight',
    series:               validSeries.map((s, i) => ({ serieNumber: i + 1, weight: parseFloat(s.weight) || 0, reps: parseInt(s.reps) || 0 })),
    routineSessionId,
  };

  exercise.sets.push(newSet);
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));

  // Sync con servidor en background
  try {
    const loggedIn = await isLoggedIn();
    if (loggedIn) {
      await exercisesAPI.addSession(exerciseId, {
        series: validSeries,
        sessionDate: new Date().toISOString(),
      });
    }
  } catch {}

  return newSet;
}

export async function addTimeSession(exerciseId, { duration, distance }, routineSessionId = null) {
  const json = await AsyncStorage.getItem(EXERCISES_KEY);
  const exercises = json ? JSON.parse(json) : [];
  const exercise = exercises.find(ex => ex.id === exerciseId);
  if (!exercise) throw new Error('Ejercicio no encontrado');

  const newSet = {
    id:               generateId(),
    date:             new Date().toISOString(),
    type:             'time',
    duration:         parseFloat(duration) || 0,
    distance:         distance ? parseFloat(distance) : null,
    routineSessionId,
  };

  exercise.sets.push(newSet);
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));

  // Sync con servidor
  try {
    const loggedIn = await isLoggedIn();
    if (loggedIn) {
      await exercisesAPI.addSession(exerciseId, {
        duration, distance,
        sessionDate: new Date().toISOString(),
      });
    }
  } catch {}

  return newSet;
}

export async function deleteSet(exerciseId, setId) {
  const json = await AsyncStorage.getItem(EXERCISES_KEY);
  const exercises = json ? JSON.parse(json) : [];
  const exercise = exercises.find(ex => ex.id === exerciseId);
  if (!exercise) throw new Error('Ejercicio no encontrado');

  exercise.sets = exercise.sets.filter(s => s.id !== setId);
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));

  // Sync en background
  try {
    const loggedIn = await isLoggedIn();
    if (loggedIn) await exercisesAPI.deleteSession(exerciseId, setId);
  } catch {}
}

export function calculateStats(sets, trackingType) {
  if (!sets || sets.length === 0) {
    return { maxWeight: null, minWeight: null, maxDuration: null, minDuration: null, lastTen: [] };
  }

  const sorted = [...sets].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastTen = sorted.slice(0, 10);

  if (trackingType === TRACKING_TYPES.TIME) {
    const durations = sets.map(s => s.duration).filter(d => d != null && isFinite(d) && d > 0);
    return {
      maxWeight: null, minWeight: null,
      maxDuration: durations.length > 0 ? Math.max(...durations) : null,
      minDuration: durations.length > 0 ? Math.min(...durations) : null,
      lastTen,
    };
  }

  const weights = sets.map(s => s.maxWeightInSession).filter(w => w != null && isFinite(w) && w > 0);
  return {
    maxWeight:   weights.length > 0 ? Math.max(...weights) : null,
    minWeight:   weights.length > 0 ? Math.min(...weights) : null,
    maxDuration: null, minDuration: null,
    lastTen,
  };
}