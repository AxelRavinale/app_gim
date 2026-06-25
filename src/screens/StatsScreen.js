import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllExercises, TRACKING_TYPES } from '../storage/exercises';
import { getAllRoutines, getAllSessions, calculateRoutineProgress } from '../storage/routines';
import { LineProgressChart, AttendanceBarChart, prepareChartData } from '../components/ProgressChart';
import ExportModal from '../components/ExportModal';
import { useTheme } from '../theme/ThemeContext';

const GYM_NAME = 'GymTracker';
const FILTER_COUNT_OPTIONS  = [{ label: 'Últ. 10', value: '10' }, { label: 'Últ. 20', value: '20' }, { label: 'Todas', value: 'all' }];
const FILTER_PERIOD_OPTIONS = [{ label: '1 mes', value: '1m' }, { label: '3 meses', value: '3m' }, { label: 'Todo', value: 'all' }];

export default function StatsScreen() {
  const { colors, isDark } = useTheme();
  const s = makeStyles(colors);
  const [exercises, setExercises]   = useState([]);
  const [routines, setRoutines]     = useState([]);
  const [sessions, setSessions]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [filterCount,  setFilterCount]  = useState('10');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  async function loadAll() {
    setIsLoading(true);
    try {
      const [exs, ruts, sess] = await Promise.all([getAllExercises(), getAllRoutines(), getAllSessions()]);
      setExercises(exs); setRoutines(ruts); setSessions(sess);
      if (exs.length > 0 && !selectedExercise) setSelectedExercise(exs[0]);
      if (ruts.length > 0 && !selectedRoutine)  setSelectedRoutine(ruts[0]);
    } finally { setIsLoading(false); }
  }

  const totalSessions     = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const exercisesWithData = exercises.filter(ex => ex.sets.length >= 2);

  const top3Progress = exercises
    .filter(ex => ex.trackingType === TRACKING_TYPES.WEIGHT && ex.sets.length >= 2)
    .map(ex => {
      const sorted = [...ex.sets].sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = sorted[0]?.maxWeightInSession || 0;
      const last  = sorted[sorted.length-1]?.maxWeightInSession || 0;
      return { exercise: ex, diff: last - first, first, last };
    })
    .filter(item => item.diff !== 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3);

  const chartData = selectedExercise
    ? prepareChartData(selectedExercise.sets, selectedExercise.trackingType, filterCount, filterPeriod)
    : [];

  const routineSessions  = selectedRoutine ? sessions.filter(s => s.routineId === selectedRoutine.id) : [];
  const routineProgress  = selectedRoutine ? calculateRoutineProgress(selectedRoutine, routineSessions) : null;
  const attendanceWeeks  = routineProgress?.weekProgress?.filter(w => w.completed + w.skipped > 0) || [];
  const attendanceLabels = attendanceWeeks.map(w => `S${w.week}`);
  const attendanceCompleted = attendanceWeeks.map(w => w.completed);
  const attendanceSkipped   = attendanceWeeks.map(w => w.skipped);

  if (isLoading) return <View style={s.centered}><ActivityIndicator color={colors.brand} size="large" /></View>;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.gymName}>{GYM_NAME.toUpperCase()}</Text>
              <Text style={s.title}>Estadísticas</Text>
            </View>
            <TouchableOpacity style={s.exportBtn} onPress={() => setShowExportModal(true)}>
              <Text style={s.exportBtnText}>⬆️ Exportar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Resumen global */}
        <View style={s.summaryGrid}>
          {[
            { value: totalSessions,          label: 'Sesiones totales', icon: '🏋️', color: colors.brand },
            { value: exercises.length,       label: 'Ejercicios',       icon: '📋', color: colors.success },
            { value: routines.length,        label: 'Rutinas',          icon: '📅', color: '#A78BFA' },
            { value: exercisesWithData.length, label: 'Con progreso',   icon: '📈', color: colors.warning },
          ].map((item, i) => (
            <View key={i} style={s.summaryCard}>
              <Text style={s.summaryCardIcon}>{item.icon}</Text>
              <Text style={[s.summaryCardValue, { color: item.color }]}>{item.value}</Text>
              <Text style={s.summaryCardLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Top 3 progreso */}
        {top3Progress.length > 0 && (
          <>
            <SectionHeader title="TOP PROGRESO" icon="🏆" colors={colors} />
            {top3Progress.map((item, index) => {
              const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
              const rc = rankColors[index];
              const mc = colors.muscleColors[item.exercise.muscleGroup] || colors.muscleColors['Otro'];
              return (
                <View key={item.exercise.id} style={s.topCard}>
                  <View style={[s.rankBadge, { backgroundColor: rc + '25', borderColor: rc }]}>
                    <Text style={[s.rankText, { color: rc }]}>#{index+1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.topName}>{item.exercise.name}</Text>
                    <View style={[s.muscleBadge, { backgroundColor: mc.bg }]}>
                      <Text style={[s.muscleText, { color: mc.text }]}>{item.exercise.muscleGroup}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.topWeights}>{item.first} kg → {item.last} kg</Text>
                    <View style={[s.diffBadge, { backgroundColor: item.diff > 0 ? colors.brandLight : colors.dangerLight }]}>
                      <Text style={[s.diffText, { color: item.diff > 0 ? colors.brand : colors.danger }]}>
                        {item.diff > 0 ? '+' : ''}{item.diff} kg
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Gráfico por ejercicio */}
        {exercises.length > 0 && (
          <>
            <SectionHeader title="PROGRESO POR EJERCICIO" icon="📈" colors={colors} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipScrollContent} style={s.chipScroll}>
              {exercises.map(ex => {
                const isSel = selectedExercise?.id === ex.id;
                const mc = colors.muscleColors[ex.muscleGroup] || colors.muscleColors['Otro'];
                return (
                  <TouchableOpacity
                    key={ex.id}
                    style={[s.exChip, isSel && { backgroundColor: colors.brand, borderColor: colors.brand }]}
                    onPress={() => setSelectedExercise(ex)}
                  >
                    <Text style={[s.exChipText, isSel && { color: colors.textOnBrand, fontWeight: '700' }]}>{ex.name}</Text>
                    {ex.trackingType === TRACKING_TYPES.TIME && <Text style={{ fontSize: 10 }}>⏱</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedExercise && (
              <>
                <View style={s.filtersRow}>
                  <View style={s.filterGroup}>
                    <Text style={s.filterGroupLabel}>SESIONES</Text>
                    <View style={s.filterBtns}>
                      {FILTER_COUNT_OPTIONS.map(opt => (
                        <TouchableOpacity key={opt.value} style={[s.filterBtn, filterCount === opt.value && { backgroundColor: colors.brand, borderColor: colors.brand }]} onPress={() => setFilterCount(opt.value)}>
                          <Text style={[s.filterBtnText, filterCount === opt.value && { color: colors.textOnBrand }]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={s.filterGroup}>
                    <Text style={s.filterGroupLabel}>PERÍODO</Text>
                    <View style={s.filterBtns}>
                      {FILTER_PERIOD_OPTIONS.map(opt => (
                        <TouchableOpacity key={opt.value} style={[s.filterBtn, filterPeriod === opt.value && { backgroundColor: colors.brand, borderColor: colors.brand }]} onPress={() => setFilterPeriod(opt.value)}>
                          <Text style={[s.filterBtnText, filterPeriod === opt.value && { color: colors.textOnBrand }]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
                <View style={s.chartWrap}>
                  <LineProgressChart
                    data={chartData}
                    title={selectedExercise.name}
                    unit={selectedExercise.trackingType === TRACKING_TYPES.TIME ? 'min' : 'kg'}
                    color={colors.brand}
                  />
                </View>
              </>
            )}
          </>
        )}

        {/* Asistencia rutinas */}
        {routines.length > 0 && (
          <>
            <SectionHeader title="ASISTENCIA RUTINAS" icon="📅" colors={colors} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipScrollContent} style={s.chipScroll}>
              {routines.map(r => {
                const isSel = selectedRoutine?.id === r.id;
                return (
                  <TouchableOpacity key={r.id} style={[s.exChip, isSel && { backgroundColor: colors.brand, borderColor: colors.brand }]} onPress={() => setSelectedRoutine(r)}>
                    <Text style={[s.exChipText, isSel && { color: colors.textOnBrand, fontWeight: '700' }]}>{r.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedRoutine && routineProgress && (
              <View style={s.chartWrap}>
                <View style={s.routineCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={s.routineCardTitle}>{selectedRoutine.name}</Text>
                    <Text style={[s.routineCardPct, { color: colors.brand }]}>{routineProgress.completionPercent}%</Text>
                  </View>
                  <View style={[s.routineBar, { backgroundColor: colors.border }]}>
                    <View style={[s.routineBarFill, { width: `${routineProgress.completionPercent}%`, backgroundColor: routineProgress.completionPercent >= 80 ? colors.success : routineProgress.completionPercent >= 50 ? colors.warning : colors.brand }]} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
                    {[{ label: 'Completados', value: routineProgress.completedDays, color: colors.success },{ label: 'Faltados', value: routineProgress.skippedDays, color: colors.danger },{ label: 'Total días', value: routineProgress.totalDays, color: colors.textSecondary },{ label: 'Sem. actual', value: routineProgress.currentWeek, color: colors.brand }].map((stat, i) => (
                      <View key={i} style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: stat.color }}>{stat.value}</Text>
                        <Text style={{ fontSize: 10, color: colors.textSecondary }}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                {attendanceLabels.length >= 2 && (
                  <AttendanceBarChart completedData={attendanceCompleted} skippedData={attendanceSkipped} labels={attendanceLabels} title="Días completados por semana" />
                )}
              </View>
            )}
          </>
        )}

        {exercises.length === 0 && routines.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📊</Text>
            <Text style={s.emptyTitle}>Sin datos todavía</Text>
            <Text style={s.emptySub}>Empezá a registrar ejercicios y rutinas para ver tus estadísticas acá.</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} exercise={null} exercises={exercises} />
    </>
  );
}

function SectionHeader({ title, icon, colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 20, marginBottom: 10 }}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.brand, letterSpacing: 1.5 }}>{title}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { backgroundColor: colors.card, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  gymName: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.brandLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.brand + '44' },
  exportBtnText: { fontSize: 13, color: colors.brand, fontWeight: '700' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 10 },
  summaryCard: { width: '47%', backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  summaryCardIcon: { fontSize: 24, marginBottom: 6 },
  summaryCardValue: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  summaryCardLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },

  topCard: { backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 0.5, borderColor: colors.border },
  rankBadge: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 13, fontWeight: '800' },
  topName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  muscleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  muscleText: { fontSize: 10, fontWeight: '600' },
  topWeights: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  diffText: { fontSize: 13, fontWeight: '800' },

  chipScroll: { marginBottom: 4 },
  chipScrollContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  exChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 4 },
  exChipText: { fontSize: 13, color: colors.textSecondary },

  filtersRow: { paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', gap: 16 },
  filterGroup: { flex: 1 },
  filterGroupLabel: { fontSize: 9, fontWeight: '800', color: colors.textLight, letterSpacing: 1, marginBottom: 6 },
  filterBtns: { flexDirection: 'row', gap: 6 },
  filterBtn: { flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  filterBtnText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  chartWrap: { paddingHorizontal: 16 },
  routineCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: colors.border },
  routineCardTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  routineCardPct: { fontSize: 24, fontWeight: '900' },
  routineBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  routineBarFill: { height: '100%', borderRadius: 3 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});