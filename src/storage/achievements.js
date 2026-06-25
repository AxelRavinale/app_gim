// achievements.js
// Sistema de logros de GymTracker.
// Define todos los logros posibles, como detectarlos y como guardarlos.
//
// Estructura de un logro desbloqueado:
// {
//   id: 'first_session',
//   unlockedAt: '2024-05-01T10:00:00.000Z',
//   data: { exerciseName: 'Press de Banca', value: 100 }  // datos extra opcionales
// }

import AsyncStorage from '@react-native-async-storage/async-storage';

const ACHIEVEMENTS_KEY = 'gymtracker_achievements';

// ─────────────────────────────────────────────────────────────────────────────
// CATALOGO COMPLETO DE LOGROS
// Cada logro tiene: id, titulo, descripcion, icono, categoria
// ─────────────────────────────────────────────────────────────────────────────
export const ACHIEVEMENTS_CATALOG = {
  // ── PRIMEROS PASOS ──────────────────────────────────────────────────────────
  first_session: {
    id: 'first_session',
    title: '¡Primer paso!',
    description: 'Registraste tu primera sesión de entrenamiento.',
    icon: '⭐',
    category: 'Primeros pasos',
    points: 10,
  },
  first_exercise: {
    id: 'first_exercise',
    title: 'Primer ejercicio',
    description: 'Creaste tu primer ejercicio en la app.',
    icon: '📝',
    category: 'Primeros pasos',
    points: 10,
  },
  first_routine: {
    id: 'first_routine',
    title: 'Primera rutina',
    description: 'Completaste tu primer día de rutina.',
    icon: '📋',
    category: 'Primeros pasos',
    points: 20,
  },
  first_record: {
    id: 'first_record',
    title: '¡Nuevo récord!',
    description: 'Superaste tu peso máximo en un ejercicio por primera vez.',
    icon: '🏆',
    category: 'Primeros pasos',
    points: 30,
  },

  // ── RECORDS PERSONALES ──────────────────────────────────────────────────────
  record_broken: {
    id: 'record_broken',
    title: 'Récord personal',
    description: 'Superaste tu peso máximo en {exerciseName}.',
    icon: '💪',
    category: 'Récords',
    points: 25,
    repeatable: true, // este logro se puede ganar multiples veces
  },
  weight_plus_10: {
    id: 'weight_plus_10',
    title: '+10 kg de progreso',
    description: 'Aumentaste 10 kg sobre tu peso inicial en {exerciseName}.',
    icon: '📈',
    category: 'Récords',
    points: 40,
  },
  weight_plus_20: {
    id: 'weight_plus_20',
    title: '+20 kg de progreso',
    description: 'Aumentaste 20 kg sobre tu peso inicial en {exerciseName}.',
    icon: '🚀',
    category: 'Récords',
    points: 60,
  },
  weight_plus_50: {
    id: 'weight_plus_50',
    title: '+50 kg de progreso',
    description: '¡Bestia! +50 kg en {exerciseName}.',
    icon: '🦁',
    category: 'Récords',
    points: 100,
  },

  // ── CONSTANCIA ──────────────────────────────────────────────────────────────
  sessions_10: {
    id: 'sessions_10',
    title: '10 sesiones',
    description: 'Completaste 10 sesiones de entrenamiento.',
    icon: '🎯',
    category: 'Constancia',
    points: 30,
  },
  sessions_25: {
    id: 'sessions_25',
    title: '25 sesiones',
    description: 'Completaste 25 sesiones. ¡El hábito se está formando!',
    icon: '🔥',
    category: 'Constancia',
    points: 50,
  },
  sessions_50: {
    id: 'sessions_50',
    title: '50 sesiones',
    description: '50 sesiones. ¡Sos constante de verdad!',
    icon: '💎',
    category: 'Constancia',
    points: 75,
  },
  sessions_100: {
    id: 'sessions_100',
    title: '100 sesiones',
    description: '¡100 sesiones! Leyenda del gimnasio.',
    icon: '👑',
    category: 'Constancia',
    points: 150,
  },
  streak_7: {
    id: 'streak_7',
    title: 'Racha de 7 días',
    description: 'Entrenaste 7 días seguidos.',
    icon: '📅',
    category: 'Constancia',
    points: 50,
  },
  streak_14: {
    id: 'streak_14',
    title: 'Racha de 14 días',
    description: '2 semanas sin parar. ¡Increíble!',
    icon: '🗓',
    category: 'Constancia',
    points: 80,
  },
  streak_30: {
    id: 'streak_30',
    title: 'Racha de 30 días',
    description: 'Un mes entero entrenando. ¡Sos una máquina!',
    icon: '🌟',
    category: 'Constancia',
    points: 200,
  },

  // ── RUTINAS ─────────────────────────────────────────────────────────────────
  perfect_week: {
    id: 'perfect_week',
    title: 'Semana perfecta',
    description: 'Completaste todos los días de una semana de rutina sin faltar.',
    icon: '🏅',
    category: 'Rutinas',
    points: 60,
  },
  routine_complete: {
    id: 'routine_complete',
    title: 'Rutina completada',
    description: 'Completaste una rutina al 100%.',
    icon: '🎖',
    category: 'Rutinas',
    points: 100,
  },

  // ── VARIEDAD ────────────────────────────────────────────────────────────────
  exercises_5: {
    id: 'exercises_5',
    title: '5 ejercicios',
    description: 'Registraste 5 ejercicios distintos.',
    icon: '🦾',
    category: 'Variedad',
    points: 20,
  },
  exercises_10: {
    id: 'exercises_10',
    title: '10 ejercicios',
    description: 'Registraste 10 ejercicios distintos.',
    icon: '💪',
    category: 'Variedad',
    points: 35,
  },
  all_muscle_groups: {
    id: 'all_muscle_groups',
    title: 'Cuerpo completo',
    description: 'Entrenaste todos los grupos musculares.',
    icon: '🏋️',
    category: 'Variedad',
    points: 50,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA Y ESCRITURA
// ─────────────────────────────────────────────────────────────────────────────

export async function getUnlockedAchievements() {
  try {
    const json = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function isAchievementUnlocked(id) {
  const unlocked = await getUnlockedAchievements();
  return unlocked.some(a => a.id === id);
}

// Desbloquea un logro y lo guarda. Retorna el logro si es nuevo, null si ya existia.
export async function unlockAchievement(id, extraData = {}) {
  try {
    const unlocked = await getUnlockedAchievements();
    const catalog = ACHIEVEMENTS_CATALOG[id];
    if (!catalog) return null;

    // Si no es repetible y ya esta desbloqueado, no hacemos nada
    if (!catalog.repeatable && unlocked.some(a => a.id === id)) return null;

    const newAchievement = {
      id,
      unlockedAt: new Date().toISOString(),
      data: extraData,
    };

    unlocked.push(newAchievement);
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));

    // Retornamos el logro completo con los datos del catalogo
    return { ...catalog, ...newAchievement };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES DE DETECCION
// Cada funcion recibe los datos necesarios y retorna un array de logros nuevos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detecta logros al guardar una sesion de un ejercicio.
 * Llamas a esta funcion despues de guardar una sesion nueva.
 *
 * @param {object} exercise - El ejercicio actualizado (con la nueva sesion incluida)
 * @param {number} newMaxWeight - El peso maximo de la sesion que se acaba de guardar
 * @param {Array} allExercises - Todos los ejercicios (para calcular totales)
 * @returns {Array} Array de logros nuevos desbloqueados
 */
export async function checkSessionAchievements(exercise, newMaxWeight, allExercises) {
  const newAchievements = [];

  // Total de sesiones de todos los ejercicios
  const totalSessions = allExercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  // ── Primera sesion de la app ──
  if (totalSessions === 1) {
    const a = await unlockAchievement('first_session');
    if (a) newAchievements.push(a);
  }

  // ── Milestones de sesiones totales ──
  for (const [count, id] of [[10,'sessions_10'],[25,'sessions_25'],[50,'sessions_50'],[100,'sessions_100']]) {
    if (totalSessions === count) {
      const a = await unlockAchievement(id);
      if (a) newAchievements.push(a);
    }
  }

  // ── Cantidad de ejercicios distintos con registros ──
  const exercisesWithSessions = allExercises.filter(ex => ex.sets.length > 0).length;
  for (const [count, id] of [[5,'exercises_5'],[10,'exercises_10']]) {
    if (exercisesWithSessions === count) {
      const a = await unlockAchievement(id);
      if (a) newAchievements.push(a);
    }
  }

  // ── Todos los grupos musculares entrenados ──
  const muscleGroups = ['Pecho','Espalda','Piernas','Hombros','Brazos','Core'];
  const trainedGroups = new Set(allExercises.filter(ex => ex.sets.length > 0).map(ex => ex.muscleGroup));
  if (muscleGroups.every(g => trainedGroups.has(g))) {
    const a = await unlockAchievement('all_muscle_groups');
    if (a) newAchievements.push(a);
  }

  // ── Logros de peso (solo para ejercicios de fuerza) ──
  if (newMaxWeight && exercise.trackingType === 'weight') {
    const allWeights = exercise.sets
      .map(s => s.maxWeightInSession)
      .filter(w => w != null && w > 0)
      .sort((a, b) => a - b);

    if (allWeights.length >= 2) {
      const firstWeight = allWeights[0];
      const previousMax = allWeights.length >= 2 ? allWeights[allWeights.length - 2] : firstWeight;
      const currentMax  = allWeights[allWeights.length - 1];

      // Nuevo record personal en este ejercicio
      if (currentMax > previousMax) {
        // Primer record global
        const isFirstRecord = await isAchievementUnlocked('first_record') === false;
        if (isFirstRecord) {
          const a = await unlockAchievement('first_record', { exerciseName: exercise.name, weight: currentMax });
          if (a) newAchievements.push(a);
        }
        // Record repetible (cada vez que rompes tu maximo)
        const a = await unlockAchievement('record_broken', { exerciseName: exercise.name, weight: currentMax });
        if (a) newAchievements.push(a);
      }

      // Progreso sobre el peso inicial
      const diff = currentMax - firstWeight;
      for (const [kg, id] of [[10,'weight_plus_10'],[20,'weight_plus_20'],[50,'weight_plus_50']]) {
        if (diff >= kg) {
          const a = await unlockAchievement(id, { exerciseName: exercise.name, diff });
          if (a) newAchievements.push(a);
        }
      }
    }

    // Primera sesion de este ejercicio especifico
    if (exercise.sets.length === 1) {
      const exercisesWithSessions = allExercises.filter(ex => ex.sets.length > 0).length;
      if (exercisesWithSessions === 1) {
        const a = await unlockAchievement('first_exercise', { exerciseName: exercise.name });
        if (a) newAchievements.push(a);
      }
    }
  }

  // ── Racha de dias consecutivos ──
  const streakDays = calculateStreak(allExercises);
  for (const [days, id] of [[7,'streak_7'],[14,'streak_14'],[30,'streak_30']]) {
    if (streakDays >= days) {
      const a = await unlockAchievement(id);
      if (a) newAchievements.push(a);
    }
  }

  return newAchievements;
}

/**
 * Detecta logros al finalizar un dia de rutina.
 *
 * @param {object} routine - La rutina completa
 * @param {Array} sessions - Todas las sesiones de esa rutina
 * @returns {Array} Array de logros nuevos
 */
export async function checkRoutineAchievements(routine, sessions) {
  const newAchievements = [];

  // ── Primera rutina completada ──
  const completedSessions = sessions.filter(s => s.status === 'completed');
  if (completedSessions.length === 1) {
    const a = await unlockAchievement('first_routine', { routineName: routine.name });
    if (a) newAchievements.push(a);
  }

  // ── Semana perfecta: todos los dias de una semana sin faltar ──
  const activeDays = routine.days.filter(d => d.exercises.length > 0);
  const weekNumbers = [...new Set(sessions.map(s => s.week))];

  for (const week of weekNumbers) {
    const weekSessions = sessions.filter(s => s.week === week);
    const allCompleted = activeDays.every(day =>
      weekSessions.some(s => s.dayName === day.dayName && s.status === 'completed')
    );
    if (allCompleted && activeDays.length > 0) {
      const a = await unlockAchievement('perfect_week', { routineName: routine.name, week });
      if (a) newAchievements.push(a);
      break; // solo una vez por chequeo
    }
  }

  // ── Rutina completa al 100% ──
  const totalDays = routine.weeks * activeDays.length;
  if (completedSessions.length >= totalDays && totalDays > 0) {
    const a = await unlockAchievement('routine_complete', { routineName: routine.name });
    if (a) newAchievements.push(a);
  }

  return newAchievements;
}

/**
 * Calcula la racha actual de dias consecutivos entrenando.
 * Cuenta hacia atras desde hoy.
 */
function calculateStreak(allExercises) {
  // Juntamos todas las fechas de sesiones
  const allDates = allExercises
    .flatMap(ex => ex.sets.map(s => s.date.slice(0, 10))) // 'YYYY-MM-DD'
    .filter((v, i, arr) => arr.indexOf(v) === i) // unicas
    .sort()
    .reverse(); // mas reciente primero

  if (allDates.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Si la ultima sesion no fue hoy ni ayer, no hay racha activa
  if (allDates[0] !== today && allDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < allDates.length - 1; i++) {
    const current = new Date(allDates[i]);
    const next    = new Date(allDates[i + 1]);
    const diffDays = Math.round((current - next) / 86400000);
    if (diffDays === 1) { streak++; } else { break; }
  }
  return streak;
}

/**
 * Calcula los puntos totales del usuario sumando los logros desbloqueados.
 */
export async function getTotalPoints() {
  const unlocked = await getUnlockedAchievements();
  return unlocked.reduce((acc, a) => {
    const catalog = ACHIEVEMENTS_CATALOG[a.id];
    return acc + (catalog?.points || 0);
  }, 0);
}

/**
 * Retorna las estadisticas de logros: total, desbloqueados, puntos.
 */
export async function getAchievementStats() {
  const unlocked = await getUnlockedAchievements();
  const totalPossible = Object.keys(ACHIEVEMENTS_CATALOG).length;
  const totalUnlocked = new Set(unlocked.map(a => a.id)).size;
  const points = unlocked.reduce((acc, a) => acc + (ACHIEVEMENTS_CATALOG[a.id]?.points || 0), 0);
  return { totalPossible, totalUnlocked, points };
}