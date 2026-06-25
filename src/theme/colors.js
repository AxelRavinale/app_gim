// colors.js - REDISEÑO COMPLETO
// Paleta premium dark-first inspirada en apps de fitness de alto nivel.
// Primary: Negro profundo + Dorado/Amarillo + Blanco
// El modo claro existe pero el dark es el look principal.

export const lightColors = {
  // Marca
  brand: '#E8B500',           // Dorado/amarillo — color de marca principal
  brandLight: '#FFF3CC',      // Dorado muy claro para fondos
  brandDark: '#C49A00',       // Dorado oscuro para texto sobre fondo claro

  // Primarios (usados para botones, acciones principales)
  primary: '#E8B500',
  primaryLight: '#FFF3CC',
  primaryDark: '#C49A00',

  // Fondos
  background: '#F2F2F2',
  card: '#FFFFFF',
  cardAlt: '#F8F8F8',         // Tarjeta alternativa ligeramente gris

  // Texto
  textPrimary: '#0A0A0A',
  textSecondary: '#555555',
  textLight: '#999999',
  textOnBrand: '#0A0A0A',     // Texto sobre fondo dorado (siempre negro)

  // Bordes
  border: '#E0E0E0',
  borderStrong: '#CCCCCC',

  // Estados
  success: '#22C55E',
  successLight: '#DCFCE7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Grupos musculares — ahora todos en variante del dorado/neutro
  muscleColors: {
    'Pecho':   { bg: '#FFF3CC', text: '#92600A' },
    'Espalda': { bg: '#F3F0FF', text: '#5B21B6' },
    'Piernas': { bg: '#DCFCE7', text: '#166534' },
    'Hombros': { bg: '#FEF3C7', text: '#92400E' },
    'Brazos':  { bg: '#DBEAFE', text: '#1E40AF' },
    'Core':    { bg: '#FFE4E6', text: '#BE123C' },
    'Cardio':  { bg: '#E0F2FE', text: '#0369A1' },
    'Otro':    { bg: '#F3F4F6', text: '#374151' },
  },
};

export const darkColors = {
  // Marca
  brand: '#E8B500',
  brandLight: '#2A2000',
  brandDark: '#FFD84D',

  // Primarios
  primary: '#E8B500',
  primaryLight: '#2A2000',
  primaryDark: '#FFD84D',

  // Fondos — negro profundo con capas
  background: '#0A0A0A',      // Fondo base — el negro más profundo
  card: '#111111',            // Tarjetas principales
  cardAlt: '#171717',         // Tarjetas secundarias / inputs

  // Texto
  textPrimary: '#F5F5F5',
  textSecondary: '#888888',
  textLight: '#444444',
  textOnBrand: '#0A0A0A',

  // Bordes — muy sutiles en dark
  border: '#1E1E1E',
  borderStrong: '#2A2A2A',

  // Estados
  success: '#22C55E',
  successLight: '#052E16',
  danger: '#EF4444',
  dangerLight: '#2D0707',
  warning: '#F59E0B',
  warningLight: '#1C1400',

  // Grupos musculares — versiones dark
  muscleColors: {
    'Pecho':   { bg: '#2A2000', text: '#FCD34D' },
    'Espalda': { bg: '#1E1030', text: '#C4B5FD' },
    'Piernas': { bg: '#052E16', text: '#6EE7B7' },
    'Hombros': { bg: '#1C1400', text: '#FCD34D' },
    'Brazos':  { bg: '#0C1F3F', text: '#93C5FD' },
    'Core':    { bg: '#2D0707', text: '#FDA4AF' },
    'Cardio':  { bg: '#0C2A3F', text: '#7DD3FC' },
    'Otro':    { bg: '#1A1A1A', text: '#9CA3AF' },
  },
};

// Default export: dark (el look principal de la app)
export default darkColors;