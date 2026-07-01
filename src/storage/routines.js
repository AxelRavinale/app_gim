// src/storage/routines.js
// FIX: saveRoutine guarda local SIEMPRE, sync con servidor es opcional
// Si el servidor falla, la rutina igual se guarda localmente

import AsyncStorage from '@react-native-async-storage/async-storage';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}


const ROUTINES_KEY  = 'gymtracker_routines';
const SESSIONS_KEY  = 'gymtracker_sessions';
const BASE_URL      = 'https://gimnasio-production-7475.up.railway.app';

export const DIAS_SEMANA = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

async function getToken() {
  try { return await AsyncStorage.getItem('gymtracker_access_token'); } catch { return null; }
}

// ── Rutinas ───────────────────────────────────────────────────────────────────

export async function getAllRoutines() {
  try {
    // Intentar traer del servidor primero
    const token = await getToken();
    if (token) {
      try {
        const res = await fetch(`${BASE_URL}/api/routines`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const serverRoutines = await res.json();
          if (serverRoutines?.length > 0) {
            const converted = serverRoutines.map(convertServerRoutine);
            await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(converted));
            return converted;
          }
        }
      } catch (serverErr) {
        console.log('No se pudo conectar al servidor, usando local:', serverErr.message);
      }
    }
  } catch {}

  // Fallback: local
  const json = await AsyncStorage.getItem(ROUTINES_KEY);
  return json ? JSON.parse(json) : [];
}

function convertServerRoutine(sr) {
  return {
    id:        sr.id,
    name:      sr.name,
    weeks:     sr.weeks,
    createdAt: sr.created_at || new Date().toISOString(),
    days: (sr.days || []).map(d => ({
      dayName:   d.day_name || d.dayName,
      exercises: (d.exercises || []).map(e => ({
        exerciseId:   e.exercise_id  || e.exerciseId,
        exerciseName: e.exercise_name || e.exerciseName || '',
        targetSets:   e.target_sets   || e.targetSets   || 3,
        targetReps:   e.target_reps   || e.targetReps   || 10,
        notes:        e.notes         || '',
        orderIndex:   e.order_index   || e.orderIndex   || 0,
      })),
    })),
  };
}


export async function getRoutineById(id) {
  const all = await getAllRoutinesLocal();
  return all.find(r => r.id === id) || null;
}

export async function saveRoutine(data) {
  // 1. Generar ID local
  const routine = {
    id:        uuidv4(),
    name:      data.name,
    weeks:     data.weeks,
    days:      data.days,
    createdAt: new Date().toISOString(),
  };

  // 2. Guardar local SIEMPRE (no esperamos al servidor)
  const existing = await getAllRoutinesLocal();
  existing.push(routine);
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(existing));

  // 3. Intentar sincronizar con servidor (en background, sin bloquear)
  syncRoutineToServer(routine).catch(err =>
    console.log('Sync con servidor falló (rutina guardada localmente):', err.message)
  );

  return routine;
}

async function getAllRoutinesLocal() {
  try {
    const json = await AsyncStorage.getItem(ROUTINES_KEY);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

async function syncRoutineToServer(routine) {
  const token = await getToken();
  if (!token) return;

  const payload = {
    name:  routine.name,
    weeks: routine.weeks,
    days:  routine.days.map(d => ({
      dayName:   d.dayName,
      exercises: (d.exercises || []).map((e, idx) => ({
        exerciseId:  e.exerciseId,
        targetSets:  e.targetSets,
        targetReps:  e.targetReps,
        notes:       e.notes || '',
        orderIndex:  idx,
      })),
    })),
  };

  const res = await fetch(`${BASE_URL}/api/routines`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  // Actualizar el ID local con el del servidor si la sync fue exitosa
  const serverRoutine = await res.json();
  const local = await getAllRoutinesLocal();
  const updated = local.map(r => r.id === routine.id
    ? { ...r, id: serverRoutine.id || r.id, serverId: serverRoutine.id }
    : r
  );
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(updated));
}

export async function updateRoutine(id, data) {
  const routines = await getAllRoutinesLocal();
  const idx = routines.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('Rutina no encontrada');

  routines[idx] = { ...routines[idx], ...data, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));

  // Sync en background
  const token = await getToken();
  if (token) {
    fetch(`${BASE_URL}/api/routines/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify(data),
    }).catch(err => console.log('Update sync falló:', err.message));
  }

  return routines[idx];
}

export async function deleteRoutine(id) {
  const routines = await getAllRoutinesLocal();
  const filtered = routines.filter(r => r.id !== id);
  await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(filtered));

  const token = await getToken();
  if (token) {
    fetch(`${BASE_URL}/api/routines/${id}`, {
      method:  'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    }).catch(() => {});
  }
}

// ── Sesiones ──────────────────────────────────────────────────────────────────

export async function getAllSessions() {
  try {
    const json = await AsyncStorage.getItem(SESSIONS_KEY);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

export async function saveSession(sessionData) {
  const session = {
    id:          uuidv4(),
    routineId:   sessionData.routineId,
    week:        sessionData.week,
    dayName:     sessionData.dayName,
    status:      sessionData.status,
    exercises:   sessionData.exercises,
    completedAt: new Date().toISOString(),
  };

  const sessions = await getAllSessions();
  sessions.push(session);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return session;
}


export async function getSessionsByRoutine(routineId) {
  const all = await getAllSessions();
  return all.filter(s => s.routineId === routineId);
}

export async function deleteSet(routineId, sessionId) {
  const sessions = await getAllSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
}

export function calculateRoutineProgress(routine, sessions) {
  const weeks     = routine.weeks || 1;
  const activeDays = (routine.days || []).filter(d => (d.exercises || []).length > 0);
  const totalDays = weeks * activeDays.length;
  const completedDays = sessions.filter(s => s.status === 'completed').length;
  const currentWeek = sessions.length > 0
    ? Math.max(...sessions.map(s => s.week || 1))
    : 1;
  return {
    totalDays,
    completedDays,
    currentWeek,
    completionPercent: totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0,
  };
}