import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const ROUTINES_KEY = 'gymtracker_routines';
const SESSIONS_KEY = 'gymtracker_routine_sessions';
const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function getToken() {
  try { return await AsyncStorage.getItem('gymtracker_access_token'); } catch { return null; }
}

async function isLoggedIn() {
  try { return await authAPI.isLoggedIn(); } catch { return false; }
}

// Convierte el formato del servidor al formato local de la app
function convertServerRoutine(serverRoutine) {
  return {
    id:        serverRoutine.id,
    name:      serverRoutine.name,
    weeks:     serverRoutine.weeks,
    createdAt: serverRoutine.created_at,
    days: (serverRoutine.days || [])
      .filter(d => d && d.dayName)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      .map(d => ({
        dayName:   d.dayName,
        exercises: (d.exercises || [])
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
          .map(e => ({
            exerciseId:   e.exerciseId,
            targetSets:   e.targetSets || 3,
            targetReps:   e.targetReps || 10,
            exerciseName: e.exerciseName || '',
            muscleGroup:  e.muscleGroup  || '',
          })),
      })),
  };
}

// Sincroniza rutinas del servidor y las guarda localmente como cache
async function syncFromServer() {
  try {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) return null;

    const token = await getToken();
    if (!token) return null;

    const response = await fetch(`${BASE_URL}/api/routines`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const serverRoutines = await response.json();
    if (!serverRoutines || serverRoutines.length === 0) return null;

    const converted = serverRoutines.map(convertServerRoutine);
    await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(converted));
    return converted;
  } catch (error) {
    console.log('Sync rutinas fallido (offline?):', error.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllRoutines() {
  try {
    // Intentamos traer del servidor primero
    const serverData = await syncFromServer();
    if (serverData && serverData.length > 0) return serverData;

    // Fallback local
    const json = await AsyncStorage.getItem(ROUTINES_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function getRoutineById(id) {
  try {
    // Primero intentamos traerla del servidor directamente
    const loggedIn = await isLoggedIn();
    if (loggedIn) {
      const token = await getToken();
      if (token) {
        const response = await fetch(`${BASE_URL}/api/routines/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const serverRoutine = await response.json();
          return convertServerRoutine(serverRoutine);
        }
      }
    }

    // Fallback local
    const routines = await getAllRoutines();
    return routines.find(r => r.id === id) || null;
  } catch {
    // Fallback local
    const routines = await getAllRoutines();
    return routines.find(r => r.id === id) || null;
  }
}

export async function saveRoutine(routineData) {
  try {
    // Guardamos local primero
    const routines = await getAllRoutines();
    const newRoutine = {
      id: Date.now().toString(),
      ...routineData,
      createdAt: new Date().toISOString(),
    };
    routines.push(newRoutine);
    await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));

    // Sync al servidor en background
    const loggedIn = await isLoggedIn();
    if (loggedIn) {
      const token = await getToken();
      if (token) {
        const response = await fetch(`${BASE_URL}/api/routines`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(routineData),
        });
        if (response.ok) {
          const saved = await response.json();
          // Actualizamos el ID local con el del servidor
          const updated = routines.map(r => r.id === newRoutine.id ? { ...r, id: saved.id } : r);
          await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(updated));
          return { ...newRoutine, id: saved.id };
        }
      }
    }

    return newRoutine;
  } catch (error) {
    throw error;
  }
}

export async function updateRoutine(id, updates) {
  try {
    const routines = await getAllRoutines();
    const updated = routines.map(r => r.id === id ? { ...r, ...updates } : r);
    await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    throw error;
  }
}

export async function deleteRoutine(id) {
  try {
    const routines = await getAllRoutines();
    await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines.filter(r => r.id !== id)));
    const sessions = await getAllSessions();
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.filter(s => s.routineId !== id)));

    // Sync al servidor
    const loggedIn = await isLoggedIn();
    if (loggedIn) {
      const token = await getToken();
      if (token) {
        fetch(`${BASE_URL}/api/routines/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => {});
      }
    }
    return true;
  } catch (error) {
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SESIONES
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllSessions() {
  try {
    const json = await AsyncStorage.getItem(SESSIONS_KEY);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function getSessionsByRoutine(routineId) {
  try {
    const sessions = await getAllSessions();
    return sessions.filter(s => s.routineId === routineId);
  } catch { return []; }
}

export async function saveSession(sessionData) {
  try {
    const sessions = await getAllSessions();
    const existingIndex = sessions.findIndex(
      s => s.routineId === sessionData.routineId &&
           s.week === sessionData.week &&
           s.dayName === sessionData.dayName
    );
    const newSession = { id: Date.now().toString(), ...sessionData, date: new Date().toISOString() };
    if (existingIndex >= 0) sessions[existingIndex] = newSession;
    else sessions.push(newSession);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return newSession;
  } catch (error) { throw error; }
}

// ─────────────────────────────────────────────────────────────────────────────
// CÁLCULOS
// ─────────────────────────────────────────────────────────────────────────────

export function calculateRoutineProgress(routine, sessions) {
  const activeDays = (routine.days || []).filter(d => d.exercises && d.exercises.length > 0);
  const totalDays = routine.weeks * activeDays.length;
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const skippedSessions   = sessions.filter(s => s.status === 'skipped');
  const completedDays = completedSessions.length;
  const skippedDays   = skippedSessions.length;
  const registeredDays = completedDays + skippedDays;
  const completionPercent = registeredDays > 0 ? Math.round((completedDays / registeredDays) * 100) : 0;
  const currentWeek = completedSessions.length > 0
    ? Math.max(...completedSessions.map(s => s.week))
    : 1;

  const weekProgress = [];
  for (let w = 1; w <= routine.weeks; w++) {
    const weekSessions = sessions.filter(s => s.week === w);
    weekProgress.push({
      week: w,
      completed: weekSessions.filter(s => s.status === 'completed').length,
      skipped:   weekSessions.filter(s => s.status === 'skipped').length,
      total: activeDays.length,
    });
  }

  const allExerciseIds = [...new Set(activeDays.flatMap(d => d.exercises.map(e => e.exerciseId)))];
  const exerciseProgress = allExerciseIds.map(exerciseId => {
    const exerciseSessions = completedSessions
      .flatMap(s => s.exercises || [])
      .filter(e => e.exerciseId === exerciseId && e.status === 'completed');
    if (exerciseSessions.length === 0) {
      return { exerciseId, sessionsCompleted: 0, firstWeight: null, lastWeight: null, weightDiff: null };
    }
    const weightSessions = exerciseSessions.filter(e => e.series && e.series.length > 0);
    if (weightSessions.length > 0) {
      const maxWeights = weightSessions.map(e => {
        const weights = e.series.map(s => s.weight).filter(w => w > 0);
        return weights.length > 0 ? Math.max(...weights) : null;
      }).filter(w => w !== null);
      return {
        exerciseId,
        sessionsCompleted: exerciseSessions.length,
        firstWeight: maxWeights[0] || null,
        lastWeight:  maxWeights[maxWeights.length - 1] || null,
        weightDiff:  maxWeights.length >= 2 ? maxWeights[maxWeights.length - 1] - maxWeights[0] : null,
      };
    }
    return { exerciseId, sessionsCompleted: exerciseSessions.length, firstWeight: null, lastWeight: null, weightDiff: null };
  });

  return { completedDays, skippedDays, totalDays, completionPercent, currentWeek, weekProgress, exerciseProgress };
}

export function buildInitialExerciseState(dayExercises) {
  return dayExercises.map(ex => ({
    exerciseId: ex.exerciseId,
    status: 'pending',
    series: Array.from({ length: ex.targetSets || 3 }, (_, i) => ({
      serieNumber: i + 1,
      weight: '',
      reps: (ex.targetReps || 10).toString(),
    })),
    duration: '',
    distance: '',
  }));
}