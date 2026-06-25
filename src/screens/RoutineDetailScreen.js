import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getRoutineById, getSessionsByRoutine, calculateRoutineProgress, saveSession, deleteRoutine } from '../storage/routines';
import { useTheme } from '../theme/ThemeContext';

const DIAS_SHORT = {
  'Lunes':'LUN','Martes':'MAR','Miércoles':'MIÉ','Miercoles':'MIÉ',
  'Jueves':'JUE','Viernes':'VIE','Sábado':'SÁB','Sabado':'SÁB','Domingo':'DOM'
};

export default function RoutineDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { routineId } = route.params;
  const [routine, setRoutine]       = useState(null);
  const [sessions, setSessions]     = useState([]);
  const [progress, setProgress]     = useState(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setIsLoading(true);
    try {
      const r = await getRoutineById(routineId);
      if (!r) { setIsLoading(false); return; }
      const sess = await getSessionsByRoutine(routineId);
      const prog = calculateRoutineProgress(r, sess);
      setRoutine(r);
      setSessions(sess);
      setProgress(prog);
      setSelectedWeek(prog.currentWeek || 1);
      navigation.setOptions({ title: r.name });
    } catch (e) {
      console.error('Error cargando rutina:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSkipDay(dayName) {
    Alert.alert('Marcar como faltado', `¿Marcás ${dayName} semana ${selectedWeek} como faltado?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Marcar', style: 'destructive', onPress: async () => {
        const dayData = routine.days.find(d => d.dayName === dayName);
        await saveSession({
          routineId, week: selectedWeek, dayName, status: 'skipped',
          exercises: (dayData?.exercises || []).map(e => ({ exerciseId: e.exerciseId, status: 'skipped', series: [] }))
        });
        await load();
      }},
    ]);
  }

  async function handleDelete() {
    Alert.alert('Eliminar rutina', `¿Eliminás "${routine.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await deleteRoutine(routineId);
        navigation.goBack();
      }},
    ]);
  }

  const getSessionForDay = (dayName, week) =>
    sessions.find(s => s.dayName === dayName && s.week === week) || null;

  if (isLoading) return (
    <View style={s.centered}><ActivityIndicator color={colors.brand} size="large" /></View>
  );

  if (!routine) return (
    <View style={s.centered}>
      <Text style={{ fontSize: 40, marginBottom: 16 }}>📋</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Rutina no encontrada</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingHorizontal: 32, marginBottom: 24 }}>
        No se pudo cargar la rutina. Verificá tu conexión e intentá de nuevo.
      </Text>
      <TouchableOpacity style={[s.retryBtn, { backgroundColor: colors.brand }]} onPress={load}>
        <Text style={{ color: colors.textOnBrand, fontWeight: '800', fontSize: 15 }}>↺ Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const activeDays = routine.days.filter(d => d.exercises && d.exercises.length > 0);
  const pct = progress?.completionPercent ?? 0;
  const pctColor = pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.brand;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* Hero */}
      <View style={s.heroCard}>
        <View style={s.heroTop}>
          <View>
            <Text style={s.heroLabel}>PROGRESO TOTAL</Text>
            <Text style={[s.heroPct, { color: pctColor }]}>{pct}%</Text>
          </View>
          <View style={s.heroStats}>
            {[
              { label: '✅ Completos', value: progress?.completedDays ?? 0, color: colors.success },
              { label: '❌ Faltados',  value: progress?.skippedDays  ?? 0, color: colors.danger },
              { label: '📅 Total',     value: progress?.totalDays    ?? 0, color: colors.textSecondary },
            ].map((st, i) => (
              <View key={i} style={s.heroStat}>
                <Text style={[s.heroStatValue, { color: st.color }]}>{st.value}</Text>
                <Text style={s.heroStatLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[s.heroBar, { backgroundColor: colors.border }]}>
          <View style={[s.heroBarFill, { width: `${pct}%`, backgroundColor: pctColor }]} />
        </View>
        <Text style={s.heroMeta}>{routine.weeks} semanas · {activeDays.length} días/sem · Sem. actual: {progress?.currentWeek ?? 1}</Text>
      </View>

      {/* Selector de semana */}
      <Text style={s.sectionLabel}>SEMANA</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.weekScroll}>
        {Array.from({ length: routine.weeks }, (_, i) => i + 1).map(w => {
          const wp = progress?.weekProgress?.find(p => p.week === w);
          const isComplete = wp && wp.completed > 0 && wp.completed >= activeDays.length;
          return (
            <TouchableOpacity key={w}
              style={[s.weekChip,
                selectedWeek === w && { backgroundColor: colors.brand, borderColor: colors.brand },
                isComplete && selectedWeek !== w && { borderColor: colors.success },
              ]}
              onPress={() => setSelectedWeek(w)}
            >
              <Text style={[s.weekChipText,
                selectedWeek === w && { color: colors.textOnBrand, fontWeight: '800' },
                isComplete && selectedWeek !== w && { color: colors.success },
              ]}>Sem {w}</Text>
              {isComplete && <Text style={{ fontSize: 10 }}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Días */}
      <Text style={s.sectionLabel}>SEMANA {selectedWeek}</Text>
      {activeDays.map(day => {
        const session = getSessionForDay(day.dayName, selectedWeek);
        const isCompleted = session?.status === 'completed';
        const isSkipped   = session?.status === 'skipped';
        return (
          <View key={day.dayName} style={[
            s.dayCard,
            isCompleted && { borderColor: colors.success + '60' },
            isSkipped   && { borderColor: colors.danger  + '60', opacity: 0.7 },
          ]}>
            <View style={s.dayCardHeader}>
              <View style={[s.dayStatusBar, {
                backgroundColor: isCompleted ? colors.success : isSkipped ? colors.danger : colors.border
              }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.dayName}>{day.dayName}</Text>
                <Text style={s.dayExCount}>{day.exercises.length} ejercicio{day.exercises.length !== 1 ? 's' : ''}</Text>
              </View>
              {isCompleted && <Text style={[s.dayStatusText, { color: colors.success }]}>✅ Completado</Text>}
              {isSkipped   && <Text style={[s.dayStatusText, { color: colors.danger  }]}>❌ Faltado</Text>}
              {!session && (
                <View style={s.dayActions}>
                  <TouchableOpacity style={[s.skipBtn, { borderColor: colors.danger }]} onPress={() => handleSkipDay(day.dayName)}>
                    <Text style={[s.skipBtnText, { color: colors.danger }]}>Falté</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.startBtn, { backgroundColor: colors.brand }]}
                    onPress={() => navigation.navigate('ExecuteRoutine', {
                      routineId, routineName: routine.name,
                      week: selectedWeek, dayName: day.dayName,
                      dayExercises: day.exercises, existingSession: null,
                    })}
                  >
                    <Text style={[s.startBtnText, { color: colors.textOnBrand }]}>▶ Entrenar</Text>
                  </TouchableOpacity>
                </View>
              )}
              {session && (
                <TouchableOpacity style={[s.redoBtn, { borderColor: colors.border }]}
                  onPress={() => navigation.navigate('ExecuteRoutine', {
                    routineId, routineName: routine.name,
                    week: selectedWeek, dayName: day.dayName,
                    dayExercises: day.exercises, existingSession: session,
                  })}
                >
                  <Text style={[s.redoBtnText, { color: colors.textSecondary }]}>↩ Rehacer</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Ejercicios del día */}
            <View style={s.exList}>
              {day.exercises.map((ex, i) => (
                <View key={ex.exerciseId || i} style={s.exItem}>
                  <View style={[s.exItemDot, { backgroundColor: colors.brandLight }]}>
                    <Text style={[s.exItemDotText, { color: colors.brand }]}>
                      {ex.muscleGroup?.[0] || '?'}
                    </Text>
                  </View>
                  <Text style={s.exItemName} numberOfLines={1}>
                    {ex.exerciseName || ex.exerciseId}
                  </Text>
                  <Text style={s.exItemTarget}>{ex.targetSets}×{ex.targetReps}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* Acciones */}
      <View style={s.actions}>
        <TouchableOpacity style={[s.editBtn, { borderColor: colors.brand, backgroundColor: colors.brandLight }]}
          onPress={() => navigation.navigate('AddRoutine', { routine })}>
          <Text style={[s.editBtnText, { color: colors.brand }]}>✏️ Editar rutina</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.deleteBtn, { borderColor: colors.danger }]} onPress={handleDelete}>
          <Text style={[s.deleteBtnText, { color: colors.danger }]}>🗑 Eliminar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  retryBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },

  heroCard: { backgroundColor: colors.card, margin: 16, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.brand + '33' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroLabel: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 1.5, marginBottom: 4 },
  heroPct: { fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 56 },
  heroStats: { gap: 8, alignItems: 'flex-end' },
  heroStat: { alignItems: 'flex-end' },
  heroStatValue: { fontSize: 18, fontWeight: '800' },
  heroStatLabel: { fontSize: 10, color: colors.textSecondary },
  heroBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  heroBarFill: { height: '100%', borderRadius: 3 },
  heroMeta: { fontSize: 12, color: colors.textSecondary },

  sectionLabel: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 1.5, paddingHorizontal: 16, marginTop: 16, marginBottom: 10 },
  weekScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  weekChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 4 },
  weekChipText: { fontSize: 13, color: colors.textSecondary },

  dayCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  dayCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  dayStatusBar: { width: 4, height: 40, borderRadius: 2 },
  dayName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  dayExCount: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  dayStatusText: { fontSize: 13, fontWeight: '700' },
  dayActions: { flexDirection: 'row', gap: 6 },
  skipBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  skipBtnText: { fontSize: 12, fontWeight: '700' },
  startBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  startBtnText: { fontSize: 13, fontWeight: '800' },
  redoBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  redoBtnText: { fontSize: 12 },

  exList: { gap: 6 },
  exItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exItemDot: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  exItemDotText: { fontSize: 11, fontWeight: '800' },
  exItemName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  exItemTarget: { fontSize: 11, color: colors.textLight },

  actions: { flexDirection: 'row', gap: 10, margin: 16 },
  editBtn: { flex: 2, padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  editBtnText: { fontWeight: '700', fontSize: 14 },
  deleteBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  deleteBtnText: { fontWeight: '700', fontSize: 14 },
});