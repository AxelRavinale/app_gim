// SetHistoryItem.js
// Componente que muestra una fila en el historial de registros de un ejercicio.
// Ejemplo visual:
//   [15 may. 2024]  100 kg · 3x8  [MAX]  [🗑]

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import colors from '../theme/colors';
import { formatDate } from '../storage/exercises';

// Props que recibe:
// - set: el objeto del registro { id, date, weight, reps, series }
// - isMax: boolean, ¿es el peso máximo?
// - isMin: boolean, ¿es el peso mínimo?
// - onDelete: función a llamar cuando el usuario confirma eliminar
export default function SetHistoryItem({ set, isMax, isMin, onDelete }) {

  // Cuando el usuario toca el ícono de eliminar, mostramos
  // una alerta de confirmación ANTES de borrar.
  // Siempre es buena práctica pedir confirmación antes de borrar datos.
  const handleDeletePress = () => {
    Alert.alert(
      'Eliminar registro',                          // Título
      '¿Estás seguro que querés eliminar este registro?', // Mensaje
      [
        {
          text: 'Cancelar',
          style: 'cancel',                          // Estilo del botón (gris)
        },
        {
          text: 'Eliminar',
          style: 'destructive',                     // Estilo rojo en iOS
          onPress: () => onDelete(set.id),          // Llamamos a la función del padre
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Columna izquierda: fecha */}
      <Text style={styles.date}>{formatDate(set.date)}</Text>

      {/* Columna central: datos del registro */}
      <View style={styles.dataRow}>
        <Text style={styles.weight}>{set.weight} kg</Text>
        <Text style={styles.detail}>
          {/* Mostramos: "3 series × 8 reps" */}
          {set.series} series × {set.reps} reps
        </Text>
      </View>

      {/* Badges de máximo/mínimo */}
      <View style={styles.badgesRow}>
        {isMax && (
          <View style={[styles.badge, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.badgeText, { color: colors.success }]}>MÁX</Text>
          </View>
        )}
        {isMin && (
          <View style={[styles.badge, { backgroundColor: colors.dangerLight }]}>
            <Text style={[styles.badgeText, { color: colors.danger }]}>MÍN</Text>
          </View>
        )}
      </View>

      {/* Botón eliminar */}
      <TouchableOpacity onPress={handleDeletePress} style={styles.deleteBtn} hitSlop={8}>
        {/* hitSlop agranda el área táctil sin cambiar el tamaño visual */}
        <Text style={styles.deleteIcon}>🗑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    gap: 8,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 80,                   // Ancho fijo para que todas las fechas queden alineadas
  },
  dataRow: {
    flex: 1,
  },
  weight: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  detail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 14,
  },
});