// exportUtils.js
// Funciones para exportar el historial de ejercicios en 3 formatos:
// 1. Texto plano (para compartir por WhatsApp/email)
// 2. CSV (para abrir en Excel)
// 3. PDF (reporte visual)
//
// Conceptos nuevos:
// - expo-file-system: permite crear y escribir archivos en el telefono
// - expo-sharing: abre el menu nativo de compartir del sistema operativo
// - FileSystem.documentDirectory: carpeta donde la app puede guardar archivos
// - Share (de React Native): para compartir texto plano sin crear archivo

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Share, Platform } from 'react-native';
import { TRACKING_TYPES, formatDate } from '../storage/exercises';

// =============================================================
// FORMATO 1: TEXTO PLANO
// Para compartir por WhatsApp, email, etc.
// No crea archivo, usa el Share nativo de React Native.
// =============================================================

/**
 * Genera y comparte el historial de UN ejercicio como texto.
 * @param {object} exercise - El objeto completo del ejercicio
 */
export async function shareExerciseAsText(exercise) {
  const lines = [];

  lines.push(`💪 *${exercise.name}*`);
  lines.push(`Grupo: ${exercise.muscleGroup}`);
  lines.push(`Tipo: ${exercise.trackingType === TRACKING_TYPES.TIME ? 'Cardio (tiempo)' : 'Fuerza (peso)'}`);
  lines.push(`Total de sesiones: ${exercise.sets.length}`);
  lines.push('');

  if (exercise.sets.length === 0) {
    lines.push('Sin registros todavía.');
  } else {
    // Ordenamos de mas reciente a mas viejo
    const sorted = [...exercise.sets].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (exercise.trackingType === TRACKING_TYPES.TIME) {
      // Estadísticas de cardio
      const durations = sorted.map(s => s.duration).filter(d => d > 0);
      if (durations.length > 0) {
        lines.push(`⏱ Max duración: ${Math.max(...durations)} min`);
        lines.push(`⏱ Min duración: ${Math.min(...durations)} min`);
        lines.push('');
      }

      lines.push('📋 *Historial:*');
      sorted.forEach(s => {
        let line = `• ${formatDate(s.date)}: ${s.duration}min`;
        if (s.distance) line += ` · ${s.distance}km`;
        lines.push(line);
      });
    } else {
      // Estadísticas de fuerza
      const maxWeights = sorted.map(s => s.maxWeightInSession).filter(w => w != null && w > 0);
      if (maxWeights.length > 0) {
        lines.push(`🏆 Peso máximo: ${Math.max(...maxWeights)} kg`);
        lines.push(`📉 Peso mínimo: ${Math.min(...maxWeights)} kg`);
        lines.push('');
      }

      lines.push('📋 *Historial:*');
      sorted.forEach(s => {
        const series = (s.series || []).filter(sr => sr.weight > 0 || sr.reps > 0);
        if (series.length === 0) return;

        // Si todas las series son iguales, mostramos resumido
        const allSame = series.every(sr => sr.weight === series[0].weight && sr.reps === series[0].reps);
        if (allSame) {
          lines.push(`• ${formatDate(s.date)}: ${series.length} × ${series[0].weight}kg · ${series[0].reps} reps`);
        } else {
          // Detalle por serie
          const detail = series.map(sr => `S${sr.serieNumber}:${sr.weight}kg×${sr.reps}`).join(' ');
          lines.push(`• ${formatDate(s.date)}: ${detail}`);
        }
      });
    }
  }

  lines.push('');
  lines.push('_Exportado desde GymTracker_ 💪');

  const message = lines.join('\n');

  // Share.share() abre el menu nativo del sistema operativo
  // (WhatsApp, Gmail, Telegram, Copiar, etc.)
  await Share.share({
    message,
    title: `Historial — ${exercise.name}`,
  });
}

/**
 * Genera y comparte el historial de TODOS los ejercicios como texto.
 * @param {Array} exercises - Array de todos los ejercicios
 */
export async function shareAllAsText(exercises) {
  const lines = [];
  lines.push('💪 *GymTracker — Reporte completo*');
  lines.push(`Fecha: ${new Date().toLocaleDateString('es-AR')}`);
  lines.push(`Total ejercicios: ${exercises.length}`);
  lines.push(`Total sesiones: ${exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}`);
  lines.push('');

  exercises.forEach(ex => {
    if (ex.sets.length === 0) return;
    lines.push(`*${ex.name}* (${ex.muscleGroup})`);

    if (ex.trackingType === TRACKING_TYPES.TIME) {
      const durations = ex.sets.map(s => s.duration).filter(d => d > 0);
      if (durations.length > 0) {
        lines.push(`  Máx: ${Math.max(...durations)}min · Sesiones: ${ex.sets.length}`);
      }
    } else {
      const maxWeights = ex.sets.map(s => s.maxWeightInSession).filter(w => w != null && w > 0);
      if (maxWeights.length > 0) {
        lines.push(`  Máx: ${Math.max(...maxWeights)}kg · Sesiones: ${ex.sets.length}`);
      }
    }
    lines.push('');
  });

  lines.push('_Exportado desde GymTracker_ 💪');

  await Share.share({
    message: lines.join('\n'),
    title: 'GymTracker — Reporte completo',
  });
}

// =============================================================
// FORMATO 2: CSV
// Crea un archivo .csv que se puede abrir en Excel o Google Sheets.
// Cada fila es un registro de una serie.
// =============================================================

/**
 * Exporta el historial de UN ejercicio como CSV.
 * Columnas: Fecha, Ejercicio, Grupo, Tipo, Serie, Peso(kg), Reps, Duracion(min), Distancia(km)
 */
export async function exportExerciseAsCSV(exercise) {
  const rows = [];

  // Encabezado del CSV
  // Las columnas van separadas por comas, cada fila por salto de linea
  rows.push(['Fecha', 'Ejercicio', 'Grupo Muscular', 'Tipo', 'Serie', 'Peso (kg)', 'Reps', 'Duracion (min)', 'Distancia (km)'].join(','));

  const sorted = [...exercise.sets].sort((a, b) => new Date(a.date) - new Date(b.date));

  sorted.forEach(session => {
    const fecha = formatDate(session.date);
    const nombre = `"${exercise.name}"`; // Comillas por si tiene comas
    const grupo = exercise.muscleGroup;

    if (exercise.trackingType === TRACKING_TYPES.TIME) {
      rows.push([fecha, nombre, grupo, 'Cardio', '', '', '', session.duration || '', session.distance || ''].join(','));
    } else {
      const series = (session.series || []).filter(s => s.weight > 0 || s.reps > 0);
      if (series.length === 0) return;
      series.forEach(s => {
        rows.push([fecha, nombre, grupo, 'Fuerza', s.serieNumber, s.weight, s.reps, '', ''].join(','));
      });
    }
  });

  const csvContent = rows.join('\n');
  const fileName = `gymtracker_${exercise.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.csv`;

  await saveAndShare(csvContent, fileName, 'text/csv');
}

/**
 * Exporta el historial de TODOS los ejercicios como CSV.
 */
export async function exportAllAsCSV(exercises) {
  const rows = [];
  rows.push(['Fecha', 'Ejercicio', 'Grupo Muscular', 'Tipo', 'Serie', 'Peso (kg)', 'Reps', 'Duracion (min)', 'Distancia (km)'].join(','));

  exercises.forEach(exercise => {
    const sorted = [...exercise.sets].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach(session => {
      const fecha = formatDate(session.date);
      const nombre = `"${exercise.name}"`;
      const grupo = exercise.muscleGroup;

      if (exercise.trackingType === TRACKING_TYPES.TIME) {
        rows.push([fecha, nombre, grupo, 'Cardio', '', '', '', session.duration || '', session.distance || ''].join(','));
      } else {
        const series = (session.series || []).filter(s => s.weight > 0 || s.reps > 0);
        series.forEach(s => {
          rows.push([fecha, nombre, grupo, 'Fuerza', s.serieNumber, s.weight, s.reps, '', ''].join(','));
        });
      }
    });
  });

  const csvContent = rows.join('\n');
  const fileName = `gymtracker_completo_${Date.now()}.csv`;

  await saveAndShare(csvContent, fileName, 'text/csv');
}

// =============================================================
// FORMATO 3: PDF
// Crea un reporte en HTML y lo guarda como archivo para compartir.
//
// Nota: React Native no tiene soporte nativo para generar PDFs
// sin librerias nativas complejas. La solucion mas compatible
// con Expo es generar un HTML bien formateado y compartirlo
// como archivo .html que el telefono puede abrir en el navegador
// y desde ahi la persona puede imprimir/guardar como PDF.
// =============================================================

/**
 * Genera un reporte HTML del historial de UN ejercicio.
 */
export async function exportExerciseAsPDF(exercise) {
  const sorted = [...exercise.sets].sort((a, b) => new Date(b.date) - new Date(a.date));
  const isCardio = exercise.trackingType === TRACKING_TYPES.TIME;

  const maxWeights = isCardio ? [] : sorted.map(s => s.maxWeightInSession).filter(w => w != null && w > 0);
  const durations  = isCardio ? sorted.map(s => s.duration).filter(d => d > 0) : [];

  const maxVal = isCardio
    ? (durations.length > 0 ? Math.max(...durations) : null)
    : (maxWeights.length > 0 ? Math.max(...maxWeights) : null);

  const minVal = isCardio
    ? (durations.length > 0 ? Math.min(...durations) : null)
    : (maxWeights.length > 0 ? Math.min(...maxWeights) : null);

  const historialRows = sorted.map(session => {
    if (isCardio) {
      return `<tr>
        <td>${formatDate(session.date)}</td>
        <td colspan="2">${session.duration || '—'} min${session.distance ? ` · ${session.distance} km` : ''}</td>
      </tr>`;
    }
    const series = (session.series || []).filter(s => s.weight > 0 || s.reps > 0);
    if (series.length === 0) return '';
    const seriesText = series.map(s => `S${s.serieNumber}: ${s.weight}kg × ${s.reps}`).join('<br>');
    const maxW = Math.max(...series.map(s => s.weight));
    return `<tr>
      <td>${formatDate(session.date)}</td>
      <td>${seriesText}</td>
      <td><strong>${maxW} kg</strong></td>
    </tr>`;
  }).join('');

  const html = generateHTMLReport({
    title: exercise.name,
    subtitle: `${exercise.muscleGroup} · ${isCardio ? 'Cardio' : 'Fuerza'}`,
    totalSessions: exercise.sets.length,
    maxVal: maxVal ? `${maxVal} ${isCardio ? 'min' : 'kg'}` : '—',
    minVal: minVal ? `${minVal} ${isCardio ? 'min' : 'kg'}` : '—',
    maxLabel: isCardio ? 'Máx duración' : 'Peso máximo',
    minLabel: isCardio ? 'Mín duración' : 'Peso mínimo',
    tableHeaders: isCardio
      ? ['Fecha', 'Duración / Distancia', '']
      : ['Fecha', 'Series', 'Máx peso'],
    tableRows: historialRows,
  });

  const fileName = `gymtracker_${exercise.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.html`;
  await saveAndShare(html, fileName, 'text/html');
}

/**
 * Genera un reporte HTML de TODOS los ejercicios.
 */
export async function exportAllAsPDF(exercises) {
  const exercisesWithData = exercises.filter(ex => ex.sets.length > 0);

  const exerciseSections = exercisesWithData.map(exercise => {
    const isCardio = exercise.trackingType === TRACKING_TYPES.TIME;
    const sorted = [...exercise.sets].sort((a, b) => new Date(b.date) - new Date(a.date));
    const maxWeights = isCardio ? [] : sorted.map(s => s.maxWeightInSession).filter(w => w != null && w > 0);
    const maxVal = maxWeights.length > 0 ? Math.max(...maxWeights) : null;

    const rows = sorted.slice(0, 10).map(session => {
      if (isCardio) return `<tr><td>${formatDate(session.date)}</td><td>${session.duration || '—'} min</td><td>—</td></tr>`;
      const series = (session.series || []).filter(s => s.weight > 0);
      if (series.length === 0) return '';
      const maxW = Math.max(...series.map(s => s.weight));
      const seriesText = series.map(s => `S${s.serieNumber}:${s.weight}kg×${s.reps}`).join(' ');
      return `<tr><td>${formatDate(session.date)}</td><td>${seriesText}</td><td>${maxW} kg</td></tr>`;
    }).join('');

    return `
      <div class="exercise-section">
        <h2>${exercise.name} <span class="badge">${exercise.muscleGroup}</span></h2>
        <div class="stats-row">
          <div class="stat"><span class="stat-val">${exercise.sets.length}</span><span class="stat-label">sesiones</span></div>
          ${maxVal ? `<div class="stat"><span class="stat-val">${maxVal} kg</span><span class="stat-label">máximo</span></div>` : ''}
        </div>
        <table>
          <thead><tr><th>Fecha</th><th>Series</th><th>Máx peso</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }).join('');

  const totalSessions = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GymTracker — Reporte completo</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1A1A2E; background: #F5F6FA; }
  .header { background: #1A6FBF; color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
  .header h1 { margin: 0 0 4px 0; font-size: 24px; }
  .header p { margin: 0; opacity: 0.8; font-size: 14px; }
  .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
  .summary-card { background: white; border-radius: 10px; padding: 16px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .summary-card .val { font-size: 28px; font-weight: 800; color: #1A6FBF; }
  .summary-card .lbl { font-size: 12px; color: #6B7280; }
  .exercise-section { background: white; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .exercise-section h2 { margin: 0 0 12px 0; font-size: 18px; display: flex; align-items: center; gap: 8px; }
  .badge { background: #E8F1FB; color: #1A6FBF; font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 500; }
  .stats-row { display: flex; gap: 16px; margin-bottom: 12px; }
  .stat { text-align: center; }
  .stat-val { font-size: 20px; font-weight: 700; color: #1A6FBF; display: block; }
  .stat-label { font-size: 11px; color: #6B7280; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #F5F6FA; padding: 8px 10px; text-align: left; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.4px; }
  td { padding: 8px 10px; border-bottom: 1px solid #E5E7EB; }
  tr:last-child td { border-bottom: none; }
  .footer { text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 24px; }
</style>
</head>
<body>
  <div class="header">
    <h1>💪 GymTracker</h1>
    <p>Reporte completo · ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
  <div class="summary">
    <div class="summary-card"><div class="val">${exercises.length}</div><div class="lbl">Ejercicios</div></div>
    <div class="summary-card"><div class="val">${totalSessions}</div><div class="lbl">Sesiones totales</div></div>
    <div class="summary-card"><div class="val">${exercisesWithData.length}</div><div class="lbl">Con registros</div></div>
  </div>
  ${exerciseSections}
  <div class="footer">Generado con GymTracker</div>
</body>
</html>`;

  const fileName = `gymtracker_reporte_completo_${Date.now()}.html`;
  await saveAndShare(html, fileName, 'text/html');
}

// =============================================================
// HELPER: Guarda el contenido en un archivo temporal y abre
// el menu de compartir del sistema operativo.
// =============================================================
async function saveAndShare(content, fileName, mimeType) {
  // FileSystem.documentDirectory es la carpeta de documentos de la app
  // Es persistente y accesible desde el administrador de archivos del telefono
  const fileUri = FileSystem.documentDirectory + fileName;

  // Escribimos el contenido en el archivo
  // 'utf8' es la codificacion de caracteres (soporta acentos, ñ, etc.)
  await FileSystem.writeAsStringAsync(fileUri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Verificamos que el sistema soporta compartir archivos
  // (en simuladores puede no estar disponible)
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartir no está disponible en este dispositivo');
  }

  // Abrimos el menu nativo de compartir con el archivo
  await Sharing.shareAsync(fileUri, {
    mimeType,
    dialogTitle: 'Exportar historial GymTracker',
    UTI: mimeType === 'text/csv' ? 'public.comma-separated-values-text' : 'public.html',
  });
}

// =============================================================
// HELPER: Genera el HTML base para reportes de un solo ejercicio
// =============================================================
function generateHTMLReport({ title, subtitle, totalSessions, maxVal, minVal, maxLabel, minLabel, tableHeaders, tableRows }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — GymTracker</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1A1A2E; background: #F5F6FA; }
  .header { background: #1A6FBF; color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; }
  .header h1 { margin: 0 0 4px 0; font-size: 22px; }
  .header p { margin: 0; opacity: 0.8; font-size: 13px; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .stat-card { background: white; border-radius: 10px; padding: 14px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .stat-val { font-size: 22px; font-weight: 800; color: #1A6FBF; display: block; }
  .stat-lbl { font-size: 11px; color: #6B7280; }
  .table-wrap { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #F5F6FA; padding: 8px 10px; text-align: left; font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.4px; }
  td { padding: 8px 10px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .footer { text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 20px; }
</style>
</head>
<body>
  <div class="header">
    <h1>💪 ${title}</h1>
    <p>${subtitle} · ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
  <div class="stats">
    <div class="stat-card"><span class="stat-val">${totalSessions}</span><span class="stat-lbl">Sesiones</span></div>
    <div class="stat-card"><span class="stat-val">${maxVal}</span><span class="stat-lbl">${maxLabel}</span></div>
    <div class="stat-card"><span class="stat-val">${minVal}</span><span class="stat-lbl">${minLabel}</span></div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>
  <div class="footer">Generado con GymTracker 💪</div>
</body>
</html>`;
}