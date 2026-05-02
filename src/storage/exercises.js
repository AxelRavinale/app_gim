// exercises.js
// Este archivo maneja TODO lo relacionado con guardar y leer datos.
// Actúa como una "base de datos" local usando AsyncStorage.
//
// ¿Qué es AsyncStorage?
// Es como localStorage en el navegador web, pero para React Native.
// Guarda pares clave-valor en el teléfono de forma persistente.
// "Persistente" = los datos NO se borran si cerrás la app.
//
// ¿Qué es "async/await"?
// Guardar y leer del teléfono toma un pequeño tiempo.
// async/await es la forma moderna de esperar a que esa operación
// termine antes de continuar. Si no esperáramos, podríamos intentar
// mostrar datos que todavía no terminaron de cargarse.

import AsyncStorage from '@react-native-async-storage/async-storage';

// La clave bajo la cual guardamos todos los ejercicios.
// Es como el "nombre de archivo" en el storage del teléfono.
const STORAGE_KEY = 'gymtracker_exercises';

// =============================================================
// FUNCIONES DE LECTURA
// =============================================================

/**
 * Obtiene todos los ejercicios guardados.
 * Retorna un array de ejercicios, o [] si no hay nada guardado.
 *
 * Ejemplo de lo que retorna:
 * [
 *   {
 *     id: '1716000000000',
 *     name: 'Press de Banca',
 *     muscleGroup: 'Pecho',
 *     description: 'Bajar la barra controlado...',
 *     videoUrl: 'https://youtube.com/...',
 *     videoLocal: null,
 *     sets: [
 *       { id: '...', date: '2024-05-01', weight: 100, reps: 8, series: 3 },
 *       { id: '...', date: '2024-05-08', weight: 105, reps: 6, series: 3 },
 *     ]
 *   }
 * ]
 */
export async function getAllExercises() {
  try {
    // AsyncStorage.getItem() lee el valor guardado bajo esa clave.
    // Siempre devuelve un STRING (texto), nunca un objeto directamente.
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);

    // Si jsonValue es null, no hay nada guardado todavía → retornamos []
    // JSON.parse() convierte el string de vuelta a un objeto/array de JS
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error al leer ejercicios:', error);
    return [];
  }
}

/**
 * Busca y retorna un ejercicio por su ID.
 * Retorna el ejercicio encontrado, o null si no existe.
 *
 * @param {string} id - El ID del ejercicio a buscar
 */
export async function getExerciseById(id) {
  try {
    const exercises = await getAllExercises();
    // Array.find() recorre el array y retorna el primer elemento
    // que cumpla la condición (que su id sea igual al que buscamos)
    return exercises.find(ex => ex.id === id) || null;
  } catch (error) {
    console.error('Error al buscar ejercicio:', error);
    return null;
  }
}

// =============================================================
// FUNCIONES DE ESCRITURA
// =============================================================

/**
 * Guarda un ejercicio NUEVO.
 * Genera su ID automáticamente usando la fecha actual (timestamp).
 *
 * @param {object} exerciseData - Los datos del ejercicio sin ID
 * Ejemplo: { name: 'Sentadilla', muscleGroup: 'Piernas', description: '...', videoUrl: '', videoLocal: null }
 */
export async function saveExercise(exerciseData) {
  try {
    const exercises = await getAllExercises();

    // Creamos el objeto completo del ejercicio.
    // Date.now() genera un número único basado en el tiempo actual.
    // Lo usamos como ID porque es muy difícil que dos ejercicios
    // se creen en exactamente el mismo milisegundo.
    const newExercise = {
      id: Date.now().toString(),
      ...exerciseData,  // "spread operator": copia todas las propiedades de exerciseData
      sets: [],         // Arranca sin registros de series
      createdAt: new Date().toISOString(),
    };

    exercises.push(newExercise);

    // JSON.stringify() convierte el array a string para poder guardarlo.
    // AsyncStorage solo puede guardar strings.
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));

    return newExercise;
  } catch (error) {
    console.error('Error al guardar ejercicio:', error);
    throw error; // "throw" re-lanza el error para que la pantalla lo pueda manejar
  }
}

/**
 * Actualiza los datos de un ejercicio existente (nombre, descripción, video, etc.)
 * NO modifica los registros de series (sets).
 *
 * @param {string} id - ID del ejercicio a actualizar
 * @param {object} updates - Objeto con los campos a cambiar
 */
export async function updateExercise(id, updates) {
  try {
    const exercises = await getAllExercises();

    // Array.map() recorre el array y transforma cada elemento.
    // Si el elemento es el que queremos editar, lo mezclamos con los updates.
    // Si no, lo dejamos igual.
    const updated = exercises.map(ex =>
      ex.id === id ? { ...ex, ...updates } : ex
    );

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error al actualizar ejercicio:', error);
    throw error;
  }
}

/**
 * Elimina un ejercicio y todos sus registros.
 *
 * @param {string} id - ID del ejercicio a eliminar
 */
export async function deleteExercise(id) {
  try {
    const exercises = await getAllExercises();

    // Array.filter() retorna un nuevo array con solo los elementos
    // que cumplan la condición. Los que NO cumplan quedan afuera.
    // Acá: quedamos con todos EXCEPTO el que tiene ese id.
    const filtered = exercises.filter(ex => ex.id !== id);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error al eliminar ejercicio:', error);
    throw error;
  }
}

// =============================================================
// FUNCIONES DE SERIES (SETS)
// =============================================================

/**
 * Agrega un nuevo registro de entrenamiento a un ejercicio.
 * Cada registro contiene: peso, repeticiones, series y fecha.
 *
 * @param {string} exerciseId - ID del ejercicio
 * @param {object} setData - { weight: number, reps: number, series: number }
 */
export async function addSet(exerciseId, setData) {
  try {
    const exercises = await getAllExercises();

    const updated = exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;

      const newSet = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        weight: setData.weight,
        reps: setData.reps,
        series: setData.series,
      };

      return {
        ...ex,
        sets: [...ex.sets, newSet], // Agregamos el nuevo set al final del array
      };
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error al agregar set:', error);
    throw error;
  }
}

/**
 * Elimina un registro de entrenamiento específico.
 *
 * @param {string} exerciseId - ID del ejercicio
 * @param {string} setId - ID del registro a eliminar
 */
export async function deleteSet(exerciseId, setId) {
  try {
    const exercises = await getAllExercises();

    const updated = exercises.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.filter(s => s.id !== setId),
      };
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error al eliminar set:', error);
    throw error;
  }
}

// =============================================================
// FUNCIONES DE CÁLCULO / ESTADÍSTICAS
// =============================================================

/**
 * Calcula estadísticas de un ejercicio a partir de sus sets.
 * Retorna: peso máximo, peso mínimo, los últimos 10 registros.
 *
 * @param {Array} sets - Array de sets del ejercicio
 */
export function calculateStats(sets) {
  // Si no hay registros, retornamos valores vacíos
  if (!sets || sets.length === 0) {
    return { maxWeight: null, minWeight: null, lastTen: [] };
  }

  // Extraemos solo los pesos para calcular max y min
  const weights = sets.map(s => s.weight);

  // Math.max(...weights) encuentra el número más grande del array.
  // El "..." (spread) separa el array en argumentos individuales.
  // Math.max(100, 90, 120) → 120
  const maxWeight = Math.max(...weights);
  const minWeight = Math.min(...weights);

  // Los últimos 10: tomamos los sets, los ordenamos por fecha de más nuevo a más viejo,
  // y nos quedamos con los primeros 10.
  const lastTen = [...sets]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  return { maxWeight, minWeight, lastTen };
}

/**
 * Formatea una fecha ISO a texto legible en español.
 * Ejemplo: "2024-05-15T10:30:00.000Z" → "15 may. 2024"
 *
 * @param {string} isoDate - Fecha en formato ISO
 */
export function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}