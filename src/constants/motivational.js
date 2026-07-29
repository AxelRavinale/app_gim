// src/constants/motivational.js

export const FRASES_DESCANSO = [
  '💪 ¡Buen trabajo! Descansá bien',
  '🔥 ¡Esa fue una gran serie!',
  '⚡ Seguís firme, ya casi',
  '🏆 ¡Excelente ejecución!',
  '💥 ¡Así se hace! Recuperate',
  '🚀 Cada serie te hace más fuerte',
  '😤 ¡No aflojés! Ya falta poco',
  '🎯 Enfocate en la próxima serie',
  '💫 ¡Increíble! Seguí así',
  '🔑 El descanso también es entreno',
  '⏱ Respirá profundo, ya volvés',
  '🌟 ¡Estás rompiendo tus límites!',
];

export const FRASES_ULTIMA_SERIE = [
  '🔥 ¡ÚLTIMA SERIE! Dalo todo',
  '💪 ¡Esta es la que más importa!',
  '🏆 ¡Terminá fuerte!',
  '⚡ ¡Última oportunidad, máximo esfuerzo!',
  '🎯 ¡A romperla en la final!',
];

export const FRASES_EJERCICIO_COMPLETO = [
  '✅ ¡Ejercicio completado!',
  '🏆 ¡Un ejercicio menos, vos ganás!',
  '💪 ¡Perfecto! Al siguiente',
  '🔥 ¡Bien hecho! Seguís en racha',
  '⚡ ¡Destruiste ese ejercicio!',
];

export const FRASES_DIA_COMPLETO = [
  '¡Lo lograste! 🎉',
  '¡Sos una máquina! 💪',
  '¡Día completado! 🏆',
  '¡Nada te detiene! 🔥',
  '¡Orgullo total! ⚡',
];

export const MENSAJES_DIA_COMPLETO = [
  'Cada entrenamiento te acerca más a tu mejor versión.',
  'El esfuerzo de hoy es el resultado de mañana.',
  'No fue fácil, pero vos pudiste. Eso dice todo.',
  'Mientras otros descansaban, vos entrenaste. Esa es la diferencia.',
  'Tu cuerpo puede más de lo que tu mente cree.',
];

export function getFraseAleatoria(array) {
  return array[Math.floor(Math.random() * array.length)];
}