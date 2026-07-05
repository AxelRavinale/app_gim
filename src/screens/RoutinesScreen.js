import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, FlatList, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllRoutines, getArchivedRoutines, archiveRoutine, unarchiveRoutine, getAllSessions, calculateRoutineProgress } from '../storage/routines';
import { useTheme } from '../theme/ThemeContext';

const GYM_NAME   = 'GymTracker';
const DIAS_SHORT = { 'Lunes':'LUN','Martes':'MAR','Miércoles':'MIÉ','Jueves':'JUE','Viernes':'VIE','Sábado':'SÁB','Domingo':'DOM' };

export default function RoutinesScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [tab, setTab]               = useState('active');
  const [routines, setRoutines]     = useState([]);
  const [archived, setArchived]     = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [isLoading, setIsLoading]   = useState(true);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setIsLoading(true);
    try {
      const [allRoutines, archivedRoutines, allSessions] = await Promise.all([
        getAllRoutines(),
        getArchivedRoutines(),
        getAllSessions(),
      ]);

      const active = allRoutines.filter(r => !r.isArchived);
      const map = {};
      [...active, ...archivedRoutines].forEach(r => {
        map[r.id] = calculateRoutineProgress(r, allSessions.filter(s => s.routineId === r.id));
      });

      setRoutines(active.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setArchived(archivedRoutines.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt)));
      setProgressMap(map);
    } finally { setIsLoading(false); }
  }

  async function handleArchive(routine) {
    Alert.alert(
      'Archivar rutina',
      `"${routine.name}" se moverá al historial. Podés restaurarla cuando quieras.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Archivar', onPress: async () => {
          await archiveRoutine(routine.id);
          await load();
        }},
      ]
    );
  }

  async function handleUnarchive(routine) {
    await unarchiveRoutine(routine.id);
    await load();
  }

  const displayData = tab === 'active' ? routines : archived;

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
          {tab === 'active' && (
            <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddRoutine')} activeOpacity={0.8}>
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={[s.tabs, { borderBottomColor: colors.border }]}>
        {[
          { id: 'active',   label: `📋 Activas`,   count: routines.length },
          { id: 'archived', label: `📦 Historial`,  count: archived.length },
        ].map(t => (
          <TouchableOpacity key={t.id} onPress={() => setTab(t.id)}
            style={[s.tabBtn, tab === t.id && { borderBottomColor: colors.brand, borderBottomWidth: 2 }]}>
            <Text style={[s.tabText, { color: tab === t.id ? colors.brand : colors.textSecondary }]}>
              {t.label}
            </Text>
            {t.count > 0 && (
              <View style={[s.tabBadge, { backgroundColor: tab === t.id ? 'rgba(232,181,0,0.15)' : colors.background }]}>
                <Text style={[s.tabBadgeText, { color: tab === t.id ? colors.brand : colors.textSecondary }]}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={s.loader} color={colors.brand} size="large" />
      ) : displayData.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>{tab === 'active' ? '📋' : '📦'}</Text>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
            {tab === 'active' ? 'No tenés rutinas aún' : 'El historial está vacío'}
          </Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            {tab === 'active'
              ? 'Tocá + para crear tu primera rutina'
              : 'Las rutinas completadas aparecerán acá'}
          </Text>
          {tab === 'active' && (
            <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.brand }]}
              onPress={() => navigation.navigate('AddRoutine')}>
              <Text style={[s.emptyBtnText, { color: '#0A0A0A' }]}>Crear rutina</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <RoutineCard
              routine={item}
              progress={progressMap[item.id]}
              colors={colors}
              isArchived={tab === 'archived'}
              onPress={() => navigation.navigate('RoutineDetail', { routineId: item.id })}
              onArchive={() => handleArchive(item)}
              onUnarchive={() => handleUnarchive(item)}
            />
          )}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function RoutineCard({ routine, progress, colors, isArchived, onPress, onArchive, onUnarchive }) {
  const pct        = progress?.completionPercent ?? 0;
  const activeDays = routine.days.filter(d => d.exercises.length > 0);
  const pctColor   = pct >= 80 ? colors.success : pct >= 50 ? colors.warning : colors.brand;
  const totalEx    = activeDays.reduce((acc, d) => acc + d.exercises.length, 0);

  return (
    <TouchableOpacity
      style={[styles_card.container, {
        backgroundColor: colors.card,
        borderColor: isArchived ? colors.border : colors.border,
        opacity: isArchived ? 0.75 : 1,
      }]}
      onPress={onPress} activeOpacity={0.8}
    >
      {/* Barra superior de color */}
      <View style={{ height: 3, backgroundColor: isArchived ? colors.border : colors.brand, marginBottom: 14, borderRadius: 2 }} />

      {/* Top row */}
      <View style={styles_card.topRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={[styles_card.name, { color: colors.textPrimary }]} numberOfLines={1}>{routine.name}</Text>
            {isArchived && (
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, backgroundColor: 'rgba(136,136,136,0.15)' }}>
                <Text style={{ fontSize: 9, color: colors.textSecondary, fontWeight: '700' }}>ARCHIVADA</Text>
              </View>
            )}
          </View>
          <Text style={[styles_card.meta, { color: colors.textSecondary }]}>
            {routine.weeks} sem · {activeDays.length} días/sem · {totalEx} ejercicios
          </Text>
        </View>
        <View style={[styles_card.pctBadge, { backgroundColor: pct > 0 ? 'rgba(232,181,0,0.12)' : colors.background }]}>
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

      {/* Días */}
      <View style={styles_card.daysRow}>
        {Object.entries(DIAS_SHORT).map(([dia, short]) => {
          const active = activeDays.some(d => d.dayName === dia);
          return (
            <View key={dia} style={[styles_card.dayChip, {
              backgroundColor: active ? (isArchived ? colors.border : colors.brand) : colors.background,
              borderColor: active ? (isArchived ? colors.border : colors.brand) : 'transparent',
            }]}>
              <Text style={[styles_card.dayChipText, { color: active ? (isArchived ? colors.textSecondary : '#0A0A0A') : colors.textLight }]}>
                {short}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer con acciones */}
      <View style={[styles_card.footer, { borderTopColor: colors.border }]}>
        {isArchived ? (
          <TouchableOpacity onPress={onUnarchive} style={styles_card.footerBtn}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.brand }}>↩ Restaurar rutina</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TouchableOpacity onPress={onArchive}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>📦 Archivar</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.brand }}>Ver rutina →</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles_card = StyleSheet.create({
  container:        { borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 0.5, elevation: 1 },
  topRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name:             { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  meta:             { fontSize: 12 },
  pctBadge:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, minWidth: 52, alignItems: 'center' },
  pctText:          { fontSize: 16, fontWeight: '800' },
  progressBar:      { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
  progressFill:     { height: '100%', borderRadius: 2 },
  progressMeta:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressMetaText: { fontSize: 11 },
  daysRow:          { flexDirection: 'row', gap: 5, marginBottom: 12 },
  dayChip:          { flex: 1, paddingVertical: 5, borderRadius: 7, alignItems: 'center', borderWidth: 1 },
  dayChipText:      { fontSize: 9, fontWeight: '800' },
  footer:           { borderTopWidth: 0.5, paddingTop: 10 },
  footerBtn:        { alignItems: 'center' },
});

const makeStyles = (colors) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       { backgroundColor: colors.card, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gymName:      { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 4 },
  headerTitle:  { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  addBtn:       { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center' },
  addBtnText:   { fontSize: 24, fontWeight: '300', color: '#0A0A0A', lineHeight: 28 },
  tabs:         { flexDirection: 'row', borderBottomWidth: 0.5 },
  tabBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText:      { fontSize: 13, fontWeight: '700' },
  tabBadge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  tabBadgeText: { fontSize: 11, fontWeight: '800' },
  loader:       { flex: 1 },
  listContent:  { padding: 16, paddingBottom: 30 },
  empty:        { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon:    { fontSize: 56, marginBottom: 16 },
  emptyTitle:   { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  emptySub:     { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 21 },
  emptyBtn:     { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { fontWeight: '800', fontSize: 15 },
});