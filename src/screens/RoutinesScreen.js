import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, ScrollView, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllRoutines, getAllSessions, calculateRoutineProgress } from '../storage/routines';
import { useTheme } from '../theme/ThemeContext';

const GYM_NAME = 'GymTracker';
const DIAS_SHORT = { 'Lunes':'LUN','Martes':'MAR','Miércoles':'MIÉ','Jueves':'JUE','Viernes':'VIE','Sábado':'SÁB','Domingo':'DOM' };

export default function RoutinesScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const s = makeStyles(colors);
  const [routines, setRoutines]       = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [isLoading, setIsLoading]     = useState(true);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setIsLoading(true);
    try {
      const [allRoutines, allSessions] = await Promise.all([getAllRoutines(), getAllSessions()]);
      const map = {};
      allRoutines.forEach(r => { map[r.id] = calculateRoutineProgress(r, allSessions.filter(s => s.routineId === r.id)); });
      setRoutines(allRoutines.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setProgressMap(map);
    } finally { setIsLoading(false); }
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.gymName}>{GYM_NAME.toUpperCase()}</Text>
            <Text style={s.headerTitle}>Mis Rutinas</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddRoutine')} activeOpacity={0.8}>
            <Text style={s.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.headerSub}>{routines.length} rutina{routines.length !== 1 ? 's' : ''} creada{routines.length !== 1 ? 's' : ''}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={s.loader} color={colors.brand} size="large" />
      ) : routines.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyTitle}>No tenés rutinas aún</Text>
          <Text style={s.emptySub}>Tocá + para crear tu primera rutina</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('AddRoutine')}>
            <Text style={s.emptyBtnText}>Crear rutina</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <RoutineCard
              routine={item}
              progress={progressMap[item.id]}
              colors={colors}
              onPress={() => navigation.navigate('RoutineDetail', { routineId: item.id })}
            />
          )}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function RoutineCard({ routine, progress, colors, onPress }) {
  const pct = progress?.completionPercent ?? 0;
  const activeDays = routine.days.filter(d => d.exercises.length > 0);
  const pctColor = pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.brand;
  const totalExercises = activeDays.reduce((acc, d) => acc + d.exercises.length, 0);

  return (
    <TouchableOpacity
      style={[styles_card.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Top row: nombre + porcentaje */}
      <View style={styles_card.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles_card.name, { color: colors.textPrimary }]} numberOfLines={1}>{routine.name}</Text>
          <View style={styles_card.metaRow}>
            <Text style={[styles_card.meta, { color: colors.textSecondary }]}>
              {routine.weeks} sem  ·  {activeDays.length} días/sem  ·  {totalExercises} ejercicios
            </Text>
          </View>
        </View>
        <View style={[styles_card.pctBadge, { backgroundColor: pct > 0 ? colors.brandLight : colors.cardAlt }]}>
          <Text style={[styles_card.pctText, { color: pct > 0 ? colors.brand : colors.textSecondary }]}>{pct}%</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={[styles_card.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles_card.progressFill, { width: `${pct}%`, backgroundColor: pctColor }]} />
      </View>
      <View style={styles_card.progressMeta}>
        <Text style={[styles_card.progressMetaText, { color: colors.textLight }]}>
          {progress?.completedDays ?? 0} / {progress?.totalDays ?? 0} días completados
        </Text>
        <Text style={[styles_card.progressMetaText, { color: colors.textLight }]}>
          Semana {progress?.currentWeek ?? 1}
        </Text>
      </View>

      {/* Chips de días */}
      <View style={styles_card.daysRow}>
        {Object.entries(DIAS_SHORT).map(([dia, short]) => {
          const isActive = activeDays.some(d => d.dayName === dia);
          return (
            <View
              key={dia}
              style={[
                styles_card.dayChip,
                {
                  backgroundColor: isActive ? colors.brand : colors.border,
                  borderColor: isActive ? colors.brand : 'transparent',
                }
              ]}
            >
              <Text style={[styles_card.dayChipText, { color: isActive ? colors.textOnBrand : colors.textLight }]}>
                {short}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Boton */}
      <View style={styles_card.footer}>
        <Text style={[styles_card.footerBtn, { color: colors.brand }]}>Ver rutina  →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles_card = StyleSheet.create({
  container: { borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 0.5, elevation: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  name: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 8 },
  meta: { fontSize: 12 },
  pctBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, minWidth: 52, alignItems: 'center' },
  pctText: { fontSize: 16, fontWeight: '800' },
  progressBar: { height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  progressMetaText: { fontSize: 11 },
  daysRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  dayChip: { flex: 1, paddingVertical: 6, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  dayChipText: { fontSize: 9, fontWeight: '800' },
  footer: { borderTopWidth: 0.5, paddingTop: 12 },
  footerBtn: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
});

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.card, paddingHorizontal: 20,
    paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 0.5, borderBottomColor: colors.border,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  gymName: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: colors.textSecondary },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { fontSize: 24, fontWeight: '300', color: colors.textOnBrand, lineHeight: 28 },
  loader: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 30 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: colors.brand, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { color: colors.textOnBrand, fontWeight: '800', fontSize: 15 },
});