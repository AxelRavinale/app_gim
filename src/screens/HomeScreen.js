import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, StatusBar, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllExercises, TRACKING_TYPES } from '../storage/exercises';
import { useTheme } from '../theme/ThemeContext';
import RoleSwitcher from '../components/RoleSwitcher';

const GYM_NAME = 'GymTracker';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [exercises, setExercises]       = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [isLoading, setIsLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState('Todos');

  useFocusEffect(useCallback(() => { loadExercises(); }, []));

  async function loadExercises() {
    setIsLoading(true);
    try {
      const data = await getAllExercises();
      setExercises(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } finally { setIsLoading(false); }
  }

  const muscleGroups = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio'];

  const filtered = exercises.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = activeFilter === 'Todos' || ex.muscleGroup === activeFilter;
    return matchSearch && matchFilter;
  });

  const totalSessions = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const withRecords   = exercises.filter(ex => ex.sets.length > 0).length;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.gymName}>{GYM_NAME.toUpperCase()}</Text>
            <Text style={s.headerTitle}>Mis Ejercicios</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <RoleSwitcher />
            <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddExercise')} activeOpacity={0.8}>
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.headerStats}>
          <HeaderStat value={exercises.length} label="ejercicios" colors={colors} />
          <View style={s.headerStatDivider} />
          <HeaderStat value={totalSessions} label="sesiones" colors={colors} />
          <View style={s.headerStatDivider} />
          <HeaderStat value={withRecords} label="con registros" colors={colors} />
        </View>
      </View>

      {/* Buscador */}
      <View style={s.searchContainer}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar ejercicio..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersContent} style={s.filtersScroll}>
        {muscleGroups.map(group => {
          const isActive = activeFilter === group;
          return (
            <TouchableOpacity key={group}
              style={[s.filterChip, isActive && s.filterChipActive]}
              onPress={() => setActiveFilter(group)}>
              <Text style={[s.filterChipText, isActive && s.filterChipTextActive]}>
                {String(group)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista */}
      {isLoading ? (
        <ActivityIndicator style={s.loader} color={colors.brand} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ExerciseRow exercise={item} colors={colors}
              onPress={() => navigation.navigate('Detail', { exerciseId: item.id })} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🏋️</Text>
              <Text style={s.emptyTitle}>
                {searchQuery || activeFilter !== 'Todos' ? 'Sin resultados' : 'No tenés ejercicios aún'}
              </Text>
              <Text style={s.emptySub}>
                {searchQuery || activeFilter !== 'Todos'
                  ? 'Probá con otro filtro'
                  : 'Tocá + para agregar tu primer ejercicio'}
              </Text>
            </View>
          }
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function ExerciseRow({ exercise, colors, onPress }) {
  const isCardio = exercise.trackingType === TRACKING_TYPES.TIME;
  const sets = exercise.sets || [];
  const mc = colors.muscleColors?.[exercise.muscleGroup] || { bg: 'rgba(232,181,0,0.15)', text: '#E8B500' };

  const validWeights   = sets.map(s => s.maxWeightInSession).filter(w => w != null && isFinite(w) && w > 0);
  const validDurations = sets.map(s => s.duration).filter(d => d != null && isFinite(d) && d > 0);
  const maxWeight   = validWeights.length   > 0 ? Math.max(...validWeights)   : null;
  const maxDuration = validDurations.length > 0 ? Math.max(...validDurations) : null;
  const lastSet = sets.length > 0 ? [...sets].sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;

  function getLastText() {
    if (!lastSet) return null;
    if (isCardio) return lastSet.duration ? `${lastSet.duration}min` : null;
    const series = (lastSet.series || []).filter(s => s.weight > 0);
    if (series.length === 0) return null;
    const allSame = series.every(s => s.weight === series[0].weight && s.reps === series[0].reps);
    if (allSame) return `${series.length} × ${series[0].weight}kg · ${series[0].reps} reps`;
    return series.map(s => `${s.weight}kg×${s.reps}`).join('  ');
  }

  const lastText   = getLastText();
  const recentSets = [...sets].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-8);
  const maxW = maxWeight || 1;
  const muscleInitial = exercise.muscleGroup ? exercise.muscleGroup[0].toUpperCase() : '?';

  return (
    <TouchableOpacity
      style={[styles_row.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress} activeOpacity={0.75}>
      <View style={[styles_row.leftAccent, { backgroundColor: mc.bg }]}>
        <Text style={[styles_row.leftAccentText, { color: mc.text }]}>{muscleInitial}</Text>
      </View>
      <View style={styles_row.content}>
        <View style={styles_row.topRow}>
          <Text style={[styles_row.name, { color: colors.textPrimary }]} numberOfLines={1}>{exercise.name}</Text>
          {sets.length === 0 && <Text style={[styles_row.noData, { color: colors.textLight }]}>Sin datos</Text>}
        </View>
        {sets.length > 0 && (
          <View style={styles_row.statsRow}>
            <StatPill
              label={isCardio ? 'Máx dur.' : 'Máx'}
              value={isCardio ? (maxDuration ? `${maxDuration}min` : '—') : (maxWeight ? `${maxWeight}kg` : '—')}
              color={colors.brand} colors={colors} />
            <StatPill label="Sesiones" value={sets.length.toString()} color={colors.textSecondary} colors={colors} />
          </View>
        )}
        {lastText && (
          <View style={[styles_row.lastRecord, { backgroundColor: colors.background, borderLeftColor: colors.brand }]}>
            <Text style={[styles_row.lastRecordText, { color: colors.brand }]} numberOfLines={1}>↑ {lastText}</Text>
          </View>
        )}
        {recentSets.length >= 2 && !isCardio && maxWeight && (
          <View style={styles_row.miniBars}>
            {recentSets.map((set, i) => {
              const w = set.maxWeightInSession || 0;
              const h = Math.max(3, Math.round((maxW > 0 ? w / maxW : 0) * 20));
              return <View key={i} style={[styles_row.miniBar, { height: h, backgroundColor: w === maxWeight ? colors.brand : colors.border }]} />;
            })}
          </View>
        )}
      </View>
      <Text style={[styles_row.arrow, { color: colors.textLight }]}>›</Text>
    </TouchableOpacity>
  );
}

function StatPill({ label, value, color, colors }) {
  return (
    <View style={[styles_row.pill, { backgroundColor: colors.background }]}>
      <Text style={[styles_row.pillValue, { color }]}>{value}</Text>
      <Text style={[styles_row.pillLabel, { color: colors.textLight }]}> {label}</Text>
    </View>
  );
}

function HeaderStat({ value, label, colors }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.brand }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

const styles_row = StyleSheet.create({
  card:           { flexDirection: 'row', borderRadius: 16, marginBottom: 10, borderWidth: 0.5, overflow: 'hidden', elevation: 1 },
  leftAccent:     { width: 32, justifyContent: 'center', alignItems: 'center', paddingVertical: 12 },
  leftAccentText: { fontSize: 13, fontWeight: '900', textAlign: 'center' },
  content:        { flex: 1, padding: 12 },
  topRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name:           { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  noData:         { fontSize: 11 },
  statsRow:       { flexDirection: 'row', gap: 6, marginBottom: 6 },
  pill:           { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center', flexDirection: 'row' },
  pillValue:      { fontSize: 13, fontWeight: '700' },
  pillLabel:      { fontSize: 10 },
  lastRecord:     { borderLeftWidth: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 6 },
  lastRecordText: { fontSize: 12, fontWeight: '600' },
  miniBars:       { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 22 },
  miniBar:        { flex: 1, borderRadius: 2 },
  arrow:          { fontSize: 22, alignSelf: 'center', paddingRight: 12 },
});

const makeStyles = (colors) => StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  header:             { backgroundColor: colors.card, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  gymName:            { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 4 },
  headerTitle:        { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  addBtn:             { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  addBtnText:         { fontSize: 24, fontWeight: '300', color: '#0A0A0A', lineHeight: 28 },
  headerStats:        { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  headerStatDivider:  { width: 0.5, height: 28, backgroundColor: colors.border },
  searchContainer:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardAlt, marginHorizontal: 16, marginVertical: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 0.5, borderColor: colors.border, gap: 8 },
  searchIcon:         { fontSize: 15 },
  searchInput:        { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  clearBtn:           { fontSize: 13, color: colors.textLight, paddingHorizontal: 4 },
  filtersScroll:      { maxHeight: 44 },
  filtersContent:     { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  filterChip:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  filterChipActive:   { backgroundColor: colors.brand, borderColor: colors.brand },
  filterChipText:     { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive:{ color: '#0A0A0A', fontWeight: '700' },
  listContent:        { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 30, flexGrow: 1 },
  loader:             { flex: 1 },
  empty:              { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon:          { fontSize: 48, marginBottom: 16 },
  emptyTitle:         { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptySub:           { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});