// colors.js
// Este archivo centraliza todos los colores de la app.
// La ventaja: si querés cambiar el azul principal, lo cambiás acá
// y se actualiza en TODA la app automáticamente.

const colors = {
  // --- Colores principales ---
  primary: '#1A6FBF',       // Azul principal (botones, íconos activos)
  primaryLight: '#E8F1FB',  // Azul muy claro (fondos de badges, highlights)

  // --- Fondos ---
  background: '#F5F6FA',    // Fondo gris claro de las pantallas
  card: '#FFFFFF',          // Fondo blanco de las tarjetas

  // --- Texto ---
  textPrimary: '#1A1A2E',   // Texto principal (negro azulado)
  textSecondary: '#6B7280', // Texto secundario (gris, fechas, subtítulos)
  textLight: '#9CA3AF',     // Texto muy claro (placeholders, hints)

  // --- Bordes ---
  border: '#E5E7EB',        // Borde de tarjetas y separadores

  // --- Estados / Significado ---
  success: '#16A34A',       // Verde (peso máximo)
  successLight: '#DCFCE7',  // Verde claro (fondo del badge máximo)
  danger: '#DC2626',        // Rojo (peso mínimo)
  dangerLight: '#FEE2E2',   // Rojo claro (fondo del badge mínimo)
  warning: '#D97706',       // Naranja (advertencias)

  // --- Grupos musculares (para los badges de colores) ---
  muscleColors: {
    'Pecho':    { bg: '#EDE9FE', text: '#6D28D9' },
    'Espalda':  { bg: '#FCE7F3', text: '#9D174D' },
    'Piernas':  { bg: '#DCFCE7', text: '#166534' },
    'Hombros':  { bg: '#FEF3C7', text: '#92400E' },
    'Brazos':   { bg: '#DBEAFE', text: '#1E40AF' },
    'Core':     { bg: '#FFE4E6', text: '#BE123C' },
    'Otro':     { bg: '#F3F4F6', text: '#374151' },
  },
};

// "export default" significa que cuando otro archivo haga
// import colors from '../theme/colors'
// va a recibir este objeto completo
export default colors;