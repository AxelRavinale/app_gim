// src/utils/audioHelper.js
// Audio para el timer de cardio y rutinas

import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

// ── Configuración de voz ────────────────────────────────────────────────────
const VOZ_CONFIG = {
  language: 'es-AR',   // español argentino
  pitch:    1.0,        // tono normal
  rate:     0.95,       // velocidad normal
};

// ── Frases por fase ──────────────────────────────────────────────────────────
const FRASES_AUDIO = {
  work: [
    '¡A trabajar!',
    '¡Dale, vamos!',
    '¡Ahora!',
    '¡Fuerza!',
  ],
  rest: [
    'Descansá',
    'Respirá profundo',
    'Buen trabajo, descansá',
    'Recuperate',
  ],
  global_rest: [
    'Cambio de ejercicio',
    'Preparate para el siguiente',
    'Descansá, ya viene el próximo',
  ],
  ultima_serie: [
    '¡Última serie, dalo todo!',
    '¡Esta es la que más importa!',
    '¡Terminá fuerte!',
  ],
  ejercicio_completo: [
    '¡Ejercicio completado!',
    '¡Excelente, al siguiente!',
    '¡Bien hecho!',
  ],
  circuito_completo: [
    '¡Circuito completo, felicitaciones!',
    '¡Lo lograste, sos una máquina!',
    '¡Increíble, terminaste el circuito!',
  ],
  dia_completo: [
    '¡Día de entrenamiento completado, excelente trabajo!',
    '¡Lo lograste, así se hace!',
    '¡Felicitaciones, entrenamiento finalizado!',
  ],
  cuenta_regresiva: {
    3: 'Tres',
    2: 'Dos',
    1: 'Uno',
    0: '¡Ya!',
  },
};

function getFraseAleatoria(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// ── Hablar ────────────────────────────────────────────────────────────────────
export async function hablar(texto, config = {}) {
  try {
    // Cancelar cualquier speech anterior
    await Speech.stop();
    
    Speech.speak(texto, {
      ...VOZ_CONFIG,
      ...config,
    });
  } catch (err) {
    console.log('Speech error:', err.message);
  }
}

// ── Funciones específicas ─────────────────────────────────────────────────────
export function hablarFase(fase, esUltimaSerie = false) {
  if (fase === 'work') {
    if (esUltimaSerie) {
      hablar(getFraseAleatoria(FRASES_AUDIO.ultima_serie));
    } else {
      hablar(getFraseAleatoria(FRASES_AUDIO.work));
    }
  } else if (fase === 'rest') {
    hablar(getFraseAleatoria(FRASES_AUDIO.rest));
  } else if (fase === 'global_rest') {
    hablar(getFraseAleatoria(FRASES_AUDIO.global_rest));
  }
}

export function hablarCuentaRegresiva(segundos) {
  const frase = FRASES_AUDIO.cuenta_regresiva[segundos];
  if (frase) hablar(frase, { rate: 1.1 });
}

export function hablarEjercicioCompleto() {
  hablar(getFraseAleatoria(FRASES_AUDIO.ejercicio_completo));
}

export function hablarCircuitoCompleto() {
  hablar(getFraseAleatoria(FRASES_AUDIO.circuito_completo));
}

export function hablarDiaCompleto() {
  hablar(getFraseAleatoria(FRASES_AUDIO.dia_completo));
}

export function hablarFraseMotivadora() {
  const { FRASES_DESCANSO } = require('../constants/motivational');
  const frase = getFraseAleatoria(FRASES_DESCANSO)
    .replace(/[💪🔥⚡🏆💥🚀😤🎯💫🔑⏱🌟]/gu, ''); // sacar emojis para la voz
  hablar(frase.trim());
}

export async function detenerAudio() {
  try { await Speech.stop(); } catch {}
}