import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { calculateStats, formatDate, TRACKING_TYPES } from '../storage/exercises';

export default function ExerciseCard({ exercise, onPress }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { maxWeight, minWeight, maxDuration, minDuration, lastTen } = calculateStats(exercise.sets, exercise.trackingType);
  const muscleColor = colors.muscleColors[exercise.muscleGroup] || colors.muscleColors['Otro'];
  const lastSet = lastTen.length > 0 ? lastTen[0] : null;
  const isCardio = exercise.trackingType === TRACKING_TYPES.TIME;

  function getLastSessionSummary() {
    if (!lastSet) return null;
    if (isCardio) {
      let text = `${lastSet.duration}min`;
      if (lastSet.distance) text += ` · ${lastSet.distance}km`;
      return { label: 'Última sesión', text };
    }
    const series = lastSet.series || [];
    if (series.length === 0) return null;
    const allSameWeight = series.every(s => s.weight === series[0].weight);
    const allSameReps = series.every(s => s.reps === series[0].reps);
    if (allSameWeight && allSameReps) {
      return { label: 'Último registro', text: `${series.length} × ${series[0].weight}kg · ${series[0].reps} reps` };
    }
    return { label: 'Último registro', text: series.map(sr => `S${sr.serieNumber}: ${sr.weight}kg×${sr.reps}`).join('  ') };
  }

  const lastSummary = getLastSessionSummary();

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <View style={s.topRow}>
        <Text style={s.name} numberOfLines={1}>{exercise.name}</Text>
        <View style={[s.muscleBadge, { backgroundColor: muscleColor.bg }]}>
          <Text style={[s.muscleText, { color: muscleColor.text }]}>{exercise.muscleGroup}</Text>
        </View>
      </View>
      {lastSet && <Text style={s.lastDate}>Último: {formatDate(lastSet.date)}</Text>}
      {exercise.sets.length === 0 && <Text style={s.lastDate}>Sin registros aún</Text>}
      <View style={s.statsRow}>
        {isCardio ? (
          <>
            <View style={[s.chip, { backgroundColor: colors.successLight }]}><Text style={[s.chipValue, { color: colors.success }]}>{maxDuration ? `${maxDuration}min` : '—'}</Text><Text style={s.chipLabel}>Máx dur.</Text></View>
            <View style={[s.chip, { backgroundColor: colors.dangerLight }]}><Text style={[s.chipValue, { color: colors.danger }]}>{minDuration ? `${minDuration}min` : '—'}</Text><Text style={s.chipLabel}>Mín dur.</Text></View>
            <View style={[s.chip, { backgroundColor: colors.primaryLight }]}><Text style={[s.chipValue, { color: colors.primary }]}>{exercise.sets.length.toString()}</Text><Text style={s.chipLabel}>Sesiones</Text></View>
          </>
        ) : (
          <>
            <View style={[s.chip, { backgroundColor: colors.successLight }]}><Text style={[s.chipValue, { color: colors.success }]}>{maxWeight !== null ? `${maxWeight} kg` : '—'}</Text><Text style={s.chipLabel}>Máximo</Text></View>
            <View style={[s.chip, { backgroundColor: colors.dangerLight }]}><Text style={[s.chipValue, { color: colors.danger }]}>{minWeight !== null ? `${minWeight} kg` : '—'}</Text><Text style={s.chipLabel}>Mínimo</Text></View>
            <View style={[s.chip, { backgroundColor: colors.primaryLight }]}><Text style={[s.chipValue, { color: colors.primary }]}>{exercise.sets.length.toString()}</Text><Text style={s.chipLabel}>Sesiones</Text></View>
          </>
        )}
      </View>
      {lastSummary && (
        <View style={s.lastSessionBox}>
          <Text style={s.lastSessionLabel}>{lastSummary.label}</Text>
          <Text style={s.lastSessionText} numberOfLines={2}>{lastSummary.text}</Text>
        </View>
      )}
      {lastTen.length > 0 && !isCardio && (
        <View style={s.barsContainer}>
          {[...lastTen].reverse().map((set) => {
            const pct = maxWeight > 0 ? (set.maxWeightInSession || 0) / maxWeight : 0;
            const barH = Math.max(4, Math.round(pct * 28));
            return <View key={set.id} style={[s.bar, { height: barH, backgroundColor: set.maxWeightInSession === maxWeight ? colors.primary : colors.border }]} />;
          })}
        </View>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1, marginRight: 8 },
  muscleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  muscleText: { fontSize: 11, fontWeight: '600' },
  lastDate: { fontSize: 12, color: colors.textLight, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { flex: 1, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 4, alignItems: 'center' },
  chipValue: { fontSize: 14, fontWeight: '700' },
  chipLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  lastSessionBox: { backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: colors.primary },
  lastSessionLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  lastSessionText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 30, marginTop: 4 },
  bar: { flex: 1, borderRadius: 2 },
});