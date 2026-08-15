import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, StatusBar, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllExercises, saveExercise, TRACKING_TYPES } from '../storage/exercises';
import { EXERCISE_LIBRARY, LIBRARY_GROUPS } from '../constants/exerciseLibrary';
import { useTheme } from '../theme/ThemeContext';

const GYM_NAME = 'GymTracker';

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [exercises, setExercises]       = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [isLoading, setIsLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [mainTab, setMainTab]           = useState('mis'); // 'mis' | 'biblioteca'
  const [addingId, setAddingId]         = useState(null);

  useFocusEffect(useCallback(() => { loadExercises(); }, []));

  async function loadExercises() {
    setIsLoading(true);
    try {
      const data = await getAllExercises();
      setExercises(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } finally { setIsLoading(false); }
  }

  // Verificar si un ejercicio de la biblioteca ya fue agregado
  function isAlreadyAdded(libEx) {
    return exercises.some(ex =>
      ex.name.toLowerCase() === libEx.name.toLowerCase() ||
      ex.libraryId === libEx.id
    );
  }

  async function handleAddFromLibrary(libEx) {
    if (isAlreadyAdded(libEx)) {
      Alert.alert('Ya existe', `"${libEx.name}" ya está en tus ejercicios.`);
      return;
    }
    setAddingId(libEx.id);
    try {
      await saveExercise({
        name:         libEx.name,
        muscleGroup:  libEx.muscleGroup,
        trackingType: libEx.trackingType,
        description:  libEx.description,
        libraryId:    libEx.id,
      });
      await loadExercises();
      Alert.alert('✅ Agregado', `"${libEx.name}" se agregó a tus ejercicios.`);
    } catch {
      Alert.alert('Error', 'No se pudo agregar el ejercicio.');
    } finally { setAddingId(null); }
  }

  const muscleGroups = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio'];

  // Filtros para Mis Ejercicios
  const filteredMine = exercises.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = activeFilter === 'Todos' || ex.muscleGroup === activeFilter;
    return matchSearch && matchFilter;
  });

  // Filtros para Biblioteca
  const filteredLib = EXERCISE_LIBRARY.filter(ex => {
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
            <Text style={s.headerTitle}>Ejercicios</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddExercise')} activeOpacity={0.8}>
            <Text style={s.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={s.headerStats}>
          <HeaderStat value={exercises.length} label="ejercicios" colors={colors} />
          <View style={s.headerStatDivider} />
          <HeaderStat value={totalSessions} label="sesiones" colors={colors} />
          <View style={s.headerStatDivider} />
          <HeaderStat value={withRecords} label="con registros" colors={colors} />
        </View>
      </View>

      {/* Tabs principales: Mis ejercicios / Biblioteca */}
      <View style={[s.mainTabs, { borderBottomColor: colors.border }]}>
        {[['mis', '🏋️ Mis ejercicios'], ['biblioteca', '📚 Biblioteca']].map(([id, label]) => (
          <TouchableOpacity key={id} onPress={() => { setMainTab(id); setSearchQuery(''); setActiveFilter('Todos'); }}
            style={[s.mainTab, mainTab === id && { borderBottomColor: colors.brand }]}>
            <Text style={[s.mainTabText, { color: mainTab === id ? colors.brand : colors.textSecondary }]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buscador */}
      <View style={s.searchContainer}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder={mainTab === 'mis' ? 'Buscar ejercicio...' : 'Buscar en biblioteca...'}
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

      {/* Filtros por músculo */}
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

      {/* ── MIS EJERCICIOS ───────────────────────────────────────────────── */}
      {mainTab === 'mis' && (
        isLoading ? (
          <ActivityIndicator style={s.loader} color={colors.brand} size="large" />
        ) : (
          <FlatList
            data={filteredMine}
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
                    : 'Tocá + para crear uno o usá la pestaña Biblioteca'}
                </Text>
              </View>
            }
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      {/* ── BIBLIOTECA ───────────────────────────────────────────────────── */}
      {mainTab === 'biblioteca' && (
        <FlatList
          data={filteredLib}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const added = isAlreadyAdded(item);
            const mc    = colors.muscleColors?.[item.muscleGroup] || { bg:'rgba(232,181,0,0.15)', text:'#E8B500' };
            return (
              <View style={[s.libCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.libAccent, { backgroundColor: mc.bg }]}>
                  <Text style={[s.libAccentText, { color: mc.text }]}>
                    {item.muscleGroup.slice(0,2).toUpperCase()}
                  </Text>
                </View>
                <View style={s.libContent}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:4 }}>
                    <Text style={[s.libName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <View style={[s.libTypeBadge, {
                      backgroundColor: item.trackingType === 'time' ? 'rgba(96,165,250,0.15)' : 'rgba(232,181,0,0.15)'
                    }]}>
                      <Text style={{ fontSize:9, fontWeight:'800',
                        color: item.trackingType === 'time' ? '#60A5FA' : colors.brand }}>
                        {item.trackingType === 'time' ? '⏱ Tiempo' : '⚖ Peso'}
                      </Text>
                    </View>
                  </View>
                  {item.description && (
                    <Text style={[s.libDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleAddFromLibrary(item)}
                  disabled={added || addingId === item.id}
                  style={[s.libAddBtn, {
                    backgroundColor: added ? 'rgba(34,197,94,0.1)' : colors.brand,
                    borderColor:     added ? '#22C55E' : colors.brand,
                  }]}
                >
                  <Text style={{ fontSize:13, fontWeight:'900',
                    color: added ? '#22C55E' : '#0A0A0A' }}>
                    {addingId === item.id ? '...' : added ? '✓' : '+'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📚</Text>
              <Text style={s.emptyTitle}>Sin resultados</Text>
              <Text style={s.emptySub}>Probá con otro filtro o búsqueda</Text>
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
  container:           { flex: 1, backgroundColor: colors.background },
  header:              { backgroundColor: colors.card, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerTop:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  gymName:             { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 4 },
  headerTitle:         { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  addBtn:              { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  addBtnText:          { fontSize: 24, fontWeight: '300', color: '#0A0A0A', lineHeight: 28 },
  headerStats:         { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  headerStatDivider:   { width: 0.5, height: 28, backgroundColor: colors.border },
  mainTabs:            { flexDirection: 'row', borderBottomWidth: 0.5 },
  mainTab:             { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  mainTabText:         { fontSize: 13, fontWeight: '700' },
  searchContainer:     { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardAlt, marginHorizontal: 16, marginVertical: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 0.5, borderColor: colors.border, gap: 8 },
  searchIcon:          { fontSize: 15 },
  searchInput:         { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  clearBtn:            { fontSize: 13, color: colors.textLight, paddingHorizontal: 4 },
  filtersScroll:       { maxHeight: 44 },
  filtersContent:      { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  filterChip:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  filterChipActive:    { backgroundColor: colors.brand, borderColor: colors.brand },
  filterChipText:      { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive:{ color: '#0A0A0A', fontWeight: '700' },
  listContent:         { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 30, flexGrow: 1 },
  loader:              { flex: 1 },
  empty:               { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon:           { fontSize: 48, marginBottom: 16 },
  emptyTitle:          { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptySub:            { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  // Biblioteca
  libCard:             { flexDirection: 'row', borderRadius: 14, marginBottom: 10, borderWidth: 0.5, overflow: 'hidden', alignItems: 'center' },
  libAccent:           { width: 36, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' },
  libAccentText:       { fontSize: 11, fontWeight: '900' },
  libContent:          { flex: 1, padding: 12 },
  libName:             { fontSize: 14, fontWeight: '800' },
  libTypeBadge:        { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  libDesc:             { fontSize: 11, lineHeight: 16, marginTop: 2 },
  libAddBtn:           { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1.5 },
});