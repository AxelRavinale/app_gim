import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, FlatList, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllExercises, MUSCLE_GROUPS } from '../storage/exercises';
import { useTheme } from '../theme/ThemeContext';
import RoleSwitcher from '../components/RoleSwitcher';
import { getSavedUser } from '../services/api';

const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

const MUSCLE_COLORS = {
  'Pecho':'#E8B500','Espalda':'#A78BFA','Piernas':'#22C55E','Hombros':'#F59E0B',
  'Brazos':'#60A5FA','Core':'#EF4444','Cardio':'#06B6D4','Otro':'#888',
};

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [tab, setTab]                     = useState('mine');
  const [myExercises, setMyExercises]     = useState([]);
  const [memberExercises, setMemberExercises] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filterGroup, setFilterGroup]     = useState('Todos');
  const [userRole, setUserRole]           = useState(null);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      // Mis ejercicios del storage local
      const local = await getAllExercises();
      setMyExercises(local);

      // Obtener rol del usuario
      const user = await getSavedUser();
      setUserRole(user?.role);

      // Si es trainer o gym_owner, traer también ejercicios de alumnos del servidor
      if (user?.role === 'trainer' || user?.role === 'gym_owner') {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const token = await AsyncStorage.getItem('gymtracker_access_token');
          const res = await fetch(`${BASE_URL}/api/exercises/members`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setMemberExercises(data);
          }
        } catch {}
      }
    } finally { setLoading(false); }
  }

  const isTrainer = userRole === 'trainer' || userRole === 'gym_owner';
  const currentList = tab === 'mine' ? myExercises : memberExercises;

  const filtered = currentList.filter(ex => {
    const name = ex.name || '';
    const muscle = ex.muscleGroup || ex.muscle_group || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchGroup  = filterGroup === 'Todos' || muscle === filterGroup;
    return matchSearch && matchGroup;
  });

  const groups = ['Todos', ...(MUSCLE_GROUPS || [
    'Pecho','Espalda','Piernas','Hombros','Brazos','Core','Cardio','Otro'
  ])];

  function renderItem({ item }) {
    const muscleGroup = item.muscleGroup || item.muscle_group || 'Otro';
    const mc = MUSCLE_COLORS[muscleGroup] || '#888';
    const sets = item.sets || [];
    const maxWeight = sets.length > 0
      ? Math.max(...sets.map(s => s.maxWeightInSession || 0).filter(w => w > 0))
      : null;
    const lastSet = sets.length > 0
      ? [...sets].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      : null;
    const createdBy = item.created_by_name;

    return (
      <TouchableOpacity
        style={[s.exCard, { borderLeftColor: mc }]}
        onPress={() => navigation.navigate('Detail', { exerciseId: item.id })}
        activeOpacity={0.75}
      >
        {/* Nombre y grupo */}
        <View style={s.exCardTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.exName} numberOfLines={1}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <View style={[s.musclePill, { backgroundColor: mc + '20' }]}>
                <Text style={[s.musclePillText, { color: mc }]}>{muscleGroup}</Text>
              </View>
              {item.trackingType === 'time' || item.tracking_type === 'time' ? (
                <Text style={s.typeBadge}>⏱ Cardio</Text>
              ) : (
                <Text style={s.typeBadge}>🏋️ Fuerza</Text>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={s.exStats}>
            {maxWeight !== null && maxWeight > 0 ? (
              <View style={s.exStat}>
                <Text style={[s.exStatVal, { color: colors.brand }]}>{maxWeight}kg</Text>
                <Text style={s.exStatLbl}>máx</Text>
              </View>
            ) : null}
            {lastSet && lastSet.series?.length > 0 ? (
              <View style={s.exStat}>
                <Text style={[s.exStatVal, { color: colors.textSecondary }]}>
                  {lastSet.series[0]?.weight}×{lastSet.series[0]?.reps}
                </Text>
                <Text style={s.exStatLbl}>último</Text>
              </View>
            ) : null}
            <Text style={s.exCardSets}>{sets.length} ses.</Text>
          </View>
        </View>

        {/* Alumno si es vista de alumnos */}
        {createdBy && (
          <View style={s.createdByRow}>
            <Text style={s.createdByText}>👤 {createdBy}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={{ flex:1 }}>
            <Text style={s.gymLabel}>GYMTRACKER</Text>
            <Text style={s.headerTitle}>Ejercicios</Text>
          </View>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
            <RoleSwitcher />
            {tab === 'mine' && (
              <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddExercise')} activeOpacity={0.8}>
                <Text style={s.addBtnText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={s.headerSub}>
          {tab === 'mine'
            ? `${myExercises.length} ejercicio${myExercises.length !== 1 ? 's' : ''} propios`
            : `${memberExercises.length} ejercicio${memberExercises.length !== 1 ? 's' : ''} de alumnos`
          }
        </Text>
      </View>

      {/* Tabs — solo para trainers y gym_owners */}
      {isTrainer && (
        <View style={s.tabBar}>
          {[
            { id: 'mine',    label: '👤 Mis ejercicios',   count: myExercises.length },
            { id: 'members', label: '🎓 De alumnos',       count: memberExercises.length },
          ].map(t => (
            <TouchableOpacity key={t.id}
              style={[s.tabBtn, tab === t.id && { borderBottomColor: colors.brand }]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[s.tabBtnText, tab === t.id && { color: colors.brand, fontWeight: '800' }]}>
                {t.label}
              </Text>
              <View style={[s.tabCount, { backgroundColor: tab === t.id ? colors.brandLight : colors.cardAlt }]}>
                <Text style={[s.tabCountText, { color: tab === t.id ? colors.brand : colors.textSecondary }]}>
                  {t.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Buscador */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar ejercicio..."
            placeholderTextColor={colors.textLight}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: colors.textLight, fontSize: 16, paddingHorizontal: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de grupo muscular */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={groups}
        keyExtractor={g => g}
        contentContainerStyle={s.filterScroll}
        style={{ maxHeight: 44 }}
        renderItem={({ item: g }) => {
          const isSel = filterGroup === g;
          const color = MUSCLE_COLORS[g] || colors.brand;
          return (
            <TouchableOpacity
              style={[s.filterChip, {
                backgroundColor: isSel ? color + '22' : colors.card,
                borderColor: isSel ? color : colors.border,
              }]}
              onPress={() => setFilterGroup(g)}
            >
              <Text style={[s.filterChipText, { color: isSel ? color : colors.textSecondary }]}>{g}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Lista */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>{tab === 'members' ? '👥' : '🏋️'}</Text>
          <Text style={s.emptyTitle}>
            {search || filterGroup !== 'Todos'
              ? 'Sin resultados'
              : tab === 'members'
                ? 'Tus alumnos no crearon ejercicios'
                : 'No tenés ejercicios todavía'}
          </Text>
          <Text style={s.emptySub}>
            {search || filterGroup !== 'Todos'
              ? 'Probá con otro filtro'
              : tab === 'members'
                ? 'Cuando tus alumnos creen ejercicios desde la app, aparecen acá'
                : 'Tocá + para agregar tu primer ejercicio'}
          </Text>
          {!search && filterGroup === 'Todos' && tab === 'mine' && (
            <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.brand }]}
              onPress={() => navigation.navigate('AddExercise')}>
              <Text style={[s.emptyBtnText, { color: colors.textOnBrand }]}>+ Crear ejercicio</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { backgroundColor: colors.card, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  gymLabel: { fontSize: 9, fontWeight: '800', color: colors.brand, letterSpacing: 2.5, marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: colors.textSecondary },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { fontSize: 24, fontWeight: '300', color: colors.textOnBrand, lineHeight: 28 },

  tabBar: { flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 13, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabCount: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  tabCountText: { fontSize: 11, fontWeight: '800' },

  searchRow: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 12, borderWidth: 0.5, borderColor: colors.border },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: colors.textPrimary },

  filterScroll: { paddingHorizontal: 14, paddingBottom: 10, gap: 7 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 4 },
  filterChipText: { fontSize: 12, fontWeight: '600' },

  listContent: { padding: 14, paddingBottom: 30 },
  exCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: colors.border, borderLeftWidth: 3 },
  exCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.2, marginBottom: 2 },
  musclePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  musclePillText: { fontSize: 10, fontWeight: '700' },
  typeBadge: { fontSize: 11, color: colors.textSecondary },
  exStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exStat: { alignItems: 'flex-end' },
  exStatVal: { fontSize: 13, fontWeight: '800' },
  exStatLbl: { fontSize: 9, color: colors.textLight, marginTop: 1 },
  exCardSets: { fontSize: 11, color: colors.textLight },
  createdByRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: colors.border },
  createdByText: { fontSize: 12, color: colors.textSecondary },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 22, lineHeight: 19 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 13 },
  emptyBtnText: { fontWeight: '800', fontSize: 14 },
});