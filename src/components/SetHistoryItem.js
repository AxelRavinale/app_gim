import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { formatDate } from '../storage/exercises';

export default function SetHistoryItem({ set, isMax, isMin, onDelete }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const isTimeSession = set.type === 'time';
  const series = set.series || [];

  const handleDeletePress = () => {
    Alert.alert('Eliminar registro', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(set.id) },
    ]);
  };

  return (
    <View style={s.container}>
      <Text style={s.date}>{formatDate(set.date)}</Text>
      <View style={s.dataRow}>
        {!isTimeSession && series.length > 0 && series.map((sr, i) => (
          <Text key={i} style={s.serieText}>S{sr.serieNumber}: {sr.weight}kg × {sr.reps} reps</Text>
        ))}
        {!isTimeSession && series.length === 0 && <Text style={s.serieText}>Sin datos</Text>}
        {isTimeSession && <Text style={s.weight}>{set.duration}min{set.distance ? ` · ${set.distance}km` : ''}</Text>}
      </View>
      <View style={s.badgesRow}>
        {isMax && <View style={[s.badge, { backgroundColor: colors.successLight }]}><Text style={[s.badgeText, { color: colors.success }]}>MÁX</Text></View>}
        {isMin && <View style={[s.badge, { backgroundColor: colors.dangerLight }]}><Text style={[s.badgeText, { color: colors.danger }]}>MÍN</Text></View>}
      </View>
      <TouchableOpacity onPress={handleDeletePress} hitSlop={8}><Text style={s.deleteIcon}>🗑</Text></TouchableOpacity>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.border, gap: 8 },
  date: { fontSize: 12, color: colors.textSecondary, width: 80 },
  dataRow: { flex: 1 },
  weight: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  serieText: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  badgesRow: { flexDirection: 'row', gap: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  deleteIcon: { fontSize: 14, padding: 4 },
});