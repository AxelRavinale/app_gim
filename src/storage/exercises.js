// src/storage/exercises.js
// FIX: normalizar campos snake_case del servidor a camelCase
// FIX: videoUrl se perdía porque servidor devuelve video_url

import AsyncStorage from '@react-native-async-storage/async-storage';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}


const EXERCISES_KEY = 'gymtracker_exercises';
const BASE_URL      = 'https://gimnasio-production-7475.up.railway.app';

export const MUSCLE_GROUPS   = ['Pecho','Espalda','Piernas','Hombros','Brazos','Core','Cardio','Otro'];
export const TRACKING_TYPES  = { WEIGHT: 'weight', TIME: 'time' };

async function getToken() {
  try { return await AsyncStorage.getItem('gymtracker_access_token'); } catch { return null; }
}

// Normaliza un ejercicio del servidor (snake_case) al formato local (camelCase)
function normalizeExercise(ex) {
  return {
    id:           ex.id,
    name:         ex.name,
    muscleGroup:  ex.muscle_group   || ex.muscleGroup   || 'Otro',
    trackingType: ex.tracking_type  || ex.trackingType  || 'weight',
    description:  ex.description    || '',
    videoUrl:     ex.video_url      || ex.videoUrl      || '',   // ← FIX
    videoLocal:   ex.video_local    || ex.videoLocal    || null,
    animationSvg: ex.animation_svg  || ex.animationSvg  || null,
    gymId:        ex.gym_id         || ex.gymId         || null,
    createdAt:    ex.created_at     || ex.createdAt     || new Date().toISOString(),
    sets: (ex.sets || []).map(s => ({
      id:                   s.id,
      date:                 s.date        || s.session_date,
      maxWeightInSession:   s.maxWeightInSession || s.max_weight_in_session || 0,
      duration:             s.duration    || null,
      distance:             s.distance    || null,
      series: (s.series || []).map(sr => ({
        serieNumber: sr.serieNumber || sr.serie_number || 0,
        weight:      sr.weight      || 0,
        reps:        sr.reps        || 0,
      })),
    })),
  };
}

export async function getAllExercises() {
  // Siempre cargar local primero para tener datos disponibles
  let localData = [];
  try {
    const json = await AsyncStorage.getItem(EXERCISES_KEY);
    localData = json ? JSON.parse(json) : [];
  } catch {}

  // Intentar sincronizar con servidor en background
  try {
    const token = await getToken();
    if (token) {
      const res = await fetch(`${BASE_URL}/api/exercises`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const serverData = await res.json();
        if (Array.isArray(serverData) && serverData.length > 0) {
          const normalized = serverData.map(normalizeExercise);
          // Merge: conservar videoLocal de los ejercicios locales
          const merged = normalized.map(serverEx => {
            const localEx = localData.find(l => l.id === serverEx.id);
            return { ...serverEx, videoLocal: localEx?.videoLocal || serverEx.videoLocal };
          });
          await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(merged));
          return merged;
        }
        // Si el servidor devuelve array vacío, usar local (pueden ser ejercicios sin sync)
        return localData;
      }
    }
  } catch (err) {
    console.log('Ejercicios: usando cache local:', err.message);
  }

  return localData;
}

export async function getExercisesByIds(ids) {
  const all = await getAllExercises();
  return ids.map(id => all.find(ex => ex.id === id)).filter(Boolean);
}

export async function saveExercise(data) {
  const exercise = {
    id:           uuidv4(),
    name:         data.name,
    muscleGroup:  data.muscleGroup  || 'Otro',
    trackingType: data.trackingType || 'weight',
    description:  data.description  || '',
    videoUrl:     data.videoUrl     || '',
    videoLocal:   data.videoLocal   || null,
    animationSvg: data.animationSvg || null,
    createdAt:    new Date().toISOString(),
    sets:         [],
  };

  // Guardar local primero
  const all = await getAllExercisesLocal();
  all.push(exercise);
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(all));

  // Sync con servidor en background
  syncExerciseToServer(exercise).catch(err =>
    console.log('Sync ejercicio falló (guardado local):', err.message)
  );

  return exercise;
}

async function getAllExercisesLocal() {
  try {
    const json = await AsyncStorage.getItem(EXERCISES_KEY);
    return json ? JSON.parse(json) : [];
  } catch { return []; }
}

async function syncExerciseToServer(exercise) {
  const token = await getToken();
  if (!token) return;

  const res = await fetch(`${BASE_URL}/api/exercises`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body:    JSON.stringify({
      name:         exercise.name,
      muscleGroup:  exercise.muscleGroup,
      trackingType: exercise.trackingType,
      description:  exercise.description,
      videoUrl:     exercise.videoUrl,
      animationSvg: exercise.animationSvg,
    }),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const serverEx = await res.json();
  // Actualizar ID local con el del servidor
  const local = await getAllExercisesLocal();
  const updated = local.map(ex => ex.id === exercise.id
    ? { ...ex, id: serverEx.id || ex.id, gymId: serverEx.gym_id }
    : ex
  );
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(updated));
}

export async function updateExercise(id, data) {
  const all = await getAllExercisesLocal();
  const idx = all.findIndex(ex => ex.id === id);
  if (idx === -1) throw new Error('Ejercicio no encontrado');

  all[idx] = {
    ...all[idx],
    name:         data.name         ?? all[idx].name,
    muscleGroup:  data.muscleGroup   ?? all[idx].muscleGroup,
    trackingType: data.trackingType  ?? all[idx].trackingType,
    description:  data.description   ?? all[idx].description,
    videoUrl:     data.videoUrl      ?? all[idx].videoUrl,      // ← FIX
    videoLocal:   data.videoLocal    ?? all[idx].videoLocal,
    animationSvg: data.animationSvg  ?? all[idx].animationSvg,
    updatedAt:    new Date().toISOString(),
  };
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(all));

  // Sync en background
  const token = await getToken();
  if (token) {
    fetch(`${BASE_URL}/api/exercises/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify({
        name:         all[idx].name,
        muscleGroup:  all[idx].muscleGroup,
        trackingType: all[idx].trackingType,
        description:  all[idx].description,
        videoUrl:     all[idx].videoUrl,
        animationSvg: all[idx].animationSvg,
      }),
    }).catch(err => console.log('Update ejercicio falló:', err.message));
  }

  return all[idx];
}

export async function deleteExercise(id) {
  const all = await getAllExercisesLocal();
  const filtered = all.filter(ex => ex.id !== id);
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(filtered));

  const token = await getToken();
  if (token) {
    fetch(`${BASE_URL}/api/exercises/${id}`, {
      method:  'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    }).catch(() => {});
  }
}


export async function getExerciseById(id) {
  const all = await getAllExercises();
  return all.find(ex => ex.id === id) || null;
}

export async function deleteSet(exerciseId, setId) {
  const all = await getAllExercisesLocal();
  const idx = all.findIndex(ex => ex.id === exerciseId);
  if (idx === -1) return;
  all[idx].sets = (all[idx].sets || []).filter(s => s.id !== setId);
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(all));
}

export async function addWeightSession(exerciseId, series, sessionId) {
  const all = await getAllExercisesLocal();
  const idx = all.findIndex(ex => ex.id === exerciseId);
  if (idx === -1) return;

  const maxWeight = Math.max(...series.map(s => parseFloat(s.weight) || 0));
  const newSet = {
    id:                 sessionId || uuidv4(),
    date:               new Date().toISOString(),
    maxWeightInSession: maxWeight,
    series:             series.map((s, i) => ({
      serieNumber: i + 1,
      weight:      parseFloat(s.weight) || 0,
      reps:        parseInt(s.reps)     || 0,
      comment:     s.comment            || '',  // ← comentario por serie
    })),
  };

  all[idx].sets = [newSet, ...(all[idx].sets || [])];
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(all));
}

export async function addTimeSession(exerciseId, { duration, distance }, sessionId) {
  const all = await getAllExercisesLocal();
  const idx = all.findIndex(ex => ex.id === exerciseId);
  if (idx === -1) return;

  const newSet = {
    id:       sessionId || uuidv4(),
    date:     new Date().toISOString(),
    duration: parseFloat(duration) || 0,
    distance: parseFloat(distance) || null,
    series:   [],
  };

  all[idx].sets = [newSet, ...(all[idx].sets || [])];
  await AsyncStorage.setItem(EXERCISES_KEY, JSON.stringify(all));
}

export function calculateStats(sets = [], trackingType = 'weight') {
  if (!sets || sets.length === 0) return {};

  if (trackingType === 'time') {
    const durations = sets.map(s => s.duration).filter(Boolean);
    return {
      totalSessions: sets.length,
      maxDuration:   durations.length > 0 ? Math.max(...durations) : null,
      minDuration:   durations.length > 0 ? Math.min(...durations) : null,
      avgDuration:   durations.length > 0 ? durations.reduce((a,b) => a+b, 0) / durations.length : null,
    };
  }

  const weights = sets.flatMap(s => (s.series || []).map(sr => parseFloat(sr.weight) || 0)).filter(w => w > 0);
  return {
    totalSessions: sets.length,
    maxWeight:     weights.length > 0 ? Math.max(...weights) : null,
    avgWeight:     weights.length > 0 ? weights.reduce((a,b) => a+b, 0) / weights.length : null,
  };
}

export function formatDuration(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}