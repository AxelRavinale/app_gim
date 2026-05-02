// ExerciseCard.js
// Componente reutilizable que muestra la tarjeta de un ejercicio en la lista principal.
//
// ¿Qué es un "componente"?
// Es como una pieza de LEGO. Lo diseñás una vez y lo podés usar
// en cualquier parte de la app pasándole diferentes datos (props).
//
// ¿Qué son "props"?
// Son los parámetros del componente. Como los parámetros de una función,
// pero para componentes visuales. Le dicen qué datos mostrar.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import { calculateStats, formatDate } from '../storage/exercises';

// El componente recibe estas props:
// - exercise: el objeto completo del ejercicio
// - onPress: función que se ejecuta cuando el usuario toca la tarjeta
export default function ExerciseCard({ exercise, onPress }) {
  // Calculamos las estadísticas a partir de los sets del ejercicio
  const { maxWeight, minWeight, lastTen } = calculateStats(exercise.sets);

  // Buscamos el color del badge según el grupo muscular.
  // Si no está en la lista, usamos el color de 'Otro'.
  const muscleColor = colors.muscleColors[exercise.muscleGroup] || colors.muscleColors['Otro'];

  // Obtenemos el set más reciente para mostrar "Último registro"
  const lastSet = lastTen.length > 0 ? lastTen[0] : null;

  return (
    // TouchableOpacity es un componente que puede detectar toques.
    // Cuando el usuario toca, llama a la función onPress que le pasamos.
    // "activeOpacity" controla cuánto se oscurece al tocar (0=transparente, 1=sin cambio)
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>

      {/* Fila superior: nombre del ejercicio + badge del grupo muscular */}
      <View style={styles.topRow}>
        <Text style={styles.name} numberOfLines={1}>{exercise.name}</Text>
        <View style={[styles.muscleBadge, { backgroundColor: muscleColor.bg }]}>
          <Text style={[styles.muscleText, { color: muscleColor.text }]}>
            {exercise.muscleGroup}
          </Text>
        </View>
      </View>

      {/* Última sesión */}
      {lastSet && (
        <Text style={styles.lastDate}>
          Último registro: {formatDate(lastSet.date)}
        </Text>
      )}

      {exercise.sets.length === 0 && (
        <Text style={styles.lastDate}>Sin registros aún</Text>
      )}

      {/* Fila de estadísticas: Máx / Mín / Último peso */}
      <View style={styles.statsRow}>
        <StatChip
          label="Máximo"
          value={maxWeight !== null ? `${maxWeight} kg` : '—'}
          color={colors.success}
          bgColor={colors.successLight}
        />
        <StatChip
          label="Mínimo"
          value={minWeight !== null ? `${minWeight} kg` : '—'}
          color={colors.danger}
          bgColor={colors.dangerLight}
        />
        <StatChip
          label="Último"
          value={lastSet ? `${lastSet.weight} kg` : '—'}
          color={colors.primary}
          bgColor={colors.primaryLight}
        />
      </View>

      {/* Mini gráfico de barras con los últimos 10 pesos */}
      {lastTen.length > 0 && <MiniBarChart sets={lastTen} maxW={maxWeight} />}
    </TouchableOpacity>
  );
}

// -------------------------------------------------------
// Sub-componente: StatChip
// Muestra un cuadrito con un label y un valor.
// Lo definimos acá mismo porque solo se usa dentro de ExerciseCard.
// -------------------------------------------------------
function StatChip({ label, value, color, bgColor }) {
  return (
    <View style={[styles.chip, { backgroundColor: bgColor }]}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

// -------------------------------------------------------
// Sub-componente: MiniBarChart
// Dibuja un pequeño gráfico de barras con los últimos pesos.
// -------------------------------------------------------
function MiniBarChart({ sets, maxW }) {
  // Mostramos los sets de más viejo a más nuevo (izquierda → derecha)
  const ordered = [...sets].reverse();

  return (
    <View style={styles.barsContainer}>
      {ordered.map((set, index) => {
        // Calculamos qué porcentaje del máximo representa este peso
        // para determinar la altura de la barra
        const percentage = maxW > 0 ? set.weight / maxW : 0;
        const barHeight = Math.max(4, Math.round(percentage * 28)); // mínimo 4px de alto

        const isMax = set.weight === maxW;

        return (
          <View
            key={set.id}
            style={[
              styles.bar,
              {
                height: barHeight,
                backgroundColor: isMax ? colors.primary : colors.border,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// -------------------------------------------------------
// StyleSheet
// En React Native los estilos se definen con StyleSheet.create()
// en lugar de CSS. La sintaxis es parecida pero usa camelCase
// (backgroundColor en vez de background-color) y los números
// son dp (density-independent pixels) no px.
// -------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    // Sombra en iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    // Sombra en Android (elevation)
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',        // Pone los hijos en fila horizontal
    justifyContent: 'space-between', // Espacia los hijos al máximo
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,                     // Ocupa todo el espacio disponible
    marginRight: 8,
  },
  muscleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  muscleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lastDate: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,                      // Espacio entre los chips
    marginBottom: 10,
  },
  chip: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  chipValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  chipLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',      // Las barras se alinean desde abajo
    gap: 3,
    height: 30,
    marginTop: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
  },
});