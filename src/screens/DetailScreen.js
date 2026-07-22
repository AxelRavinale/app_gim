import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Linking, Alert, Modal, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Video } from 'expo-av';
import {
  getExerciseById, addWeightSession, addTimeSession,
  deleteSet, deleteExercise, calculateStats,
  formatDate, formatDuration, TRACKING_TYPES,
} from '../storage/exercises';
import SetHistoryItem from '../components/SetHistoryItem';
import { LineProgressChart, prepareChartData } from '../components/ProgressChart';
import ExportModal from '../components/ExportModal';
import { useTheme } from '../theme/ThemeContext';

const FILTER_COUNT_OPTIONS  = [{ label: 'Últ. 10', value: '10' }, { label: 'Últ. 20', value: '20' }, { label: 'Todas', value: 'all' }];
const FILTER_PERIOD_OPTIONS = [{ label: '1 mes', value: '1m' }, { label: '3 meses', value: '3m' }, { label: 'Todo', value: 'all' }];

export default function DetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { exerciseId } = route.params;

  const [exercise, setExercise]               = useState(null);
  const [isLoading, setIsLoading]             = useState(true);
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [formDuration, setFormDuration]       = useState('');
  const [formDistance, setFormDistance]       = useState('');
  const [formSeries, setFormSeries]           = useState('3');
  const [seriesInputs, setSeriesInputs]       = useState([]);
  const [isSaving, setIsSaving]               = useState(false);
  const [filterCount,  setFilterCount]        = useState('10');
  const [filterPeriod, setFilterPeriod]       = useState('all');

  useFocusEffect(useCallback(() => { loadExercise(); }, []));

  async function loadExercise() {
    setIsLoading(true);
    try {
      const data = await getExerciseById(exerciseId);
      if (data) {
        setExercise(data);
        navigation.setOptions({
          title: data.name,
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowExportModal(true)} style={{ marginRight: 4, padding: 6 }}>
              <Text style={{ fontSize: 20 }}>⬆️</Text>
            </TouchableOpacity>
          ),
        });
      }
    } finally { setIsLoading(false); }
  }

  const isCardio = exercise?.trackingType === TRACKING_TYPES.TIME;

  function handleSeriesCountChange(val) {
    setFormSeries(val);
    const count = parseInt(val) || 0;
    setSeriesInputs(Array.from({ length: count }, (_, i) => seriesInputs[i] || { weight: '', reps: '' }));
  }

  function updateSerieInput(index, field, value) {
    setSeriesInputs(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  // ── FIX: isSaving siempre se resetea en el finally ──────────────────────────
  async function handleAddSession() {
    if (isCardio) {
      const duration = parseFloat(formDuration);
      if (isNaN(duration) || duration <= 0) {
        Alert.alert('Error', 'Ingresá una duración válida');
        return;
      }
      setIsSaving(true);
      try {
        await addTimeSession(exerciseId, { duration, distance: parseFloat(formDistance) || null });
        setFormDuration('');
        setFormDistance('');
        setShowAddModal(false);
        await loadExercise();
      } catch {
        Alert.alert('Error', 'No se pudo guardar la sesión');
      } finally {
        setIsSaving(false); // ← siempre se ejecuta
      }
    } else {
      if (seriesInputs.length === 0) {
        Alert.alert('Error', 'Seleccioná cuántas series hiciste');
        return; // isSaving nunca se puso en true acá
      }
      const validSeries = seriesInputs.map(s => ({
        weight: parseFloat(s.weight) || 0,
        reps:   parseInt(s.reps)    || 0,
      }));
      if (validSeries.every(s => s.weight === 0 && s.reps === 0)) {
        Alert.alert('Error', 'Ingresá al menos peso o reps en una serie');
        return; // isSaving nunca se puso en true acá
      }
      setIsSaving(true);
      try {
        await addWeightSession(exerciseId, validSeries);
        setFormSeries('3');
        setSeriesInputs([]);
        setShowAddModal(false);
        await loadExercise();
      } catch {
        Alert.alert('Error', 'No se pudo guardar la sesión');
      } finally {
        setIsSaving(false); // ← siempre se ejecuta
      }
    }
  }

  async function handleDeleteSet(setId) {
    try { await deleteSet(exerciseId, setId); await loadExercise(); }
    catch { Alert.alert('Error', 'No se pudo eliminar'); }
  }

  async function handleDeleteExercise() {
    Alert.alert('Eliminar ejercicio', `¿Eliminás "${exercise.name}" y todos sus registros?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteExercise(exerciseId); navigation.goBack(); } },
    ]);
  }

  if (isLoading) return <View style={s.centered}><ActivityIndicator color={colors.brand} size="large" /></View>;
  if (!exercise) return <View style={s.centered}><Text style={{ color: colors.textPrimary }}>No encontrado</Text></View>;

  const { maxWeight, minWeight, maxDuration, minDuration } = calculateStats(exercise.sets, exercise.trackingType);
  const sortedSets = [...exercise.sets].sort((a, b) => new Date(b.date) - new Date(a.date));
  const mc = colors.muscleColors[exercise.muscleGroup] || colors.muscleColors['Otro'];
  const chartData = prepareChartData(exercise.sets, exercise.trackingType, filterCount, filterPeriod);

  return (
    <>
      <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={[s.muscleBadge, { backgroundColor: mc.bg }]}>
              <Text style={[s.muscleText, { color: mc.text }]}>{exercise.muscleGroup}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AddExercise', { exercise })} style={s.editBtn}>
              <Text style={s.editBtnText}>✏️ Editar</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.exerciseName}>{exercise.name}</Text>
          <Text style={s.sessionCount}>
            {exercise.sets.length} sesión{exercise.sets.length !== 1 ? 'es' : ''} registrada{exercise.sets.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Botón Ejecutar ejercicio */}
        <TouchableOpacity
          style={s.executeBtn}
          onPress={() => navigation.navigate('ExecuteExercise', { exercise })}
          activeOpacity={0.8}
        >
          <Text style={s.executeBtnIcon}>▶</Text>
          <Text style={s.executeBtnText}>Ejecutar ejercicio</Text>
          <Text style={s.executeBtnSub}>{isCardio ? 'Timer + registro de tiempo' : 'Series · Peso · Timer de descanso'}</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={s.statsGrid}>
          {isCardio ? (
            <>
              <StatCard label="Máx duración" value={maxDuration ? formatDuration(maxDuration) : '—'} color={colors.success} bgColor={colors.successLight || '#0F2A1A'} icon="⏱️" />
              <StatCard label="Mín duración" value={minDuration ? formatDuration(minDuration) : '—'} color={colors.danger} bgColor={colors.dangerLight || '#2A0F0F'} icon="📉" />
            </>
          ) : (
            <>
              <StatCard label="Peso máximo" value={maxWeight !== null ? `${maxWeight} kg` : '—'} color={colors.success} bgColor={colors.successLight || '#0F2A1A'} icon="🏆" />
              <StatCard label="Peso mínimo" value={minWeight !== null ? `${minWeight} kg` : '—'} color={colors.danger} bgColor={colors.dangerLight || '#2A0F0F'} icon="📉" />
            </>
          )}
        </View>

        {/* Gráfico */}
        {exercise.sets.length >= 2 && (
          <SectionCard title="Gráfico de progreso" s={s} colors={colors}>
            <View style={s.filtersRow}>
              <View style={s.filterGroup}>
                <Text style={s.filterLabel}>Sesiones</Text>
                <View style={s.filterBtns}>
                  {FILTER_COUNT_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt.value} style={[s.filterBtn, filterCount === opt.value && s.filterBtnSelected]} onPress={() => setFilterCount(opt.value)}>
                      <Text style={[s.filterBtnText, filterCount === opt.value && { color: colors.brand }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={s.filterGroup}>
                <Text style={s.filterLabel}>Período</Text>
                <View style={s.filterBtns}>
                  {FILTER_PERIOD_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt.value} style={[s.filterBtn, filterPeriod === opt.value && s.filterBtnSelected]} onPress={() => setFilterPeriod(opt.value)}>
                      <Text style={[s.filterBtnText, filterPeriod === opt.value && { color: colors.brand }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <LineProgressChart data={chartData} title="" unit={isCardio ? 'min' : 'kg'} color={colors.brand} height={160} />
          </SectionCard>
        )}

        {/* Video */}
        {(exercise.videoUrl || exercise.videoLocal) && (
          <SectionCard title="Video del ejercicio" s={s} colors={colors}>
            {exercise.videoUrl && (
              <TouchableOpacity style={[s.videoButton, { backgroundColor: colors.brandLight }]} onPress={() => Linking.openURL(exercise.videoUrl)}>
                <Text style={s.videoIcon}>▶️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.videoButtonText, { color: colors.brand }]}>Ver en YouTube</Text>
                  <Text style={[s.videoUrl, { color: colors.textSecondary }]} numberOfLines={1}>{exercise.videoUrl}</Text>
                </View>
              </TouchableOpacity>
            )}
            {exercise.videoLocal && (
              <Video source={{ uri: exercise.videoLocal }} style={s.videoComponent} useNativeControls resizeMode="contain" shouldPlay={false} />
            )}
          </SectionCard>
        )}

        {/* Notas */}
        {exercise.description ? (
          <SectionCard title="Notas y técnica" s={s} colors={colors}>
            <Text style={[s.description, { color: colors.textSecondary }]}>{exercise.description}</Text>
          </SectionCard>
        ) : null}

        {/* Historial */}
        <SectionCard title="Historial completo" s={s} colors={colors}>
          {sortedSets.length === 0 ? (
            <Text style={[s.emptyHistory, { color: colors.textLight }]}>Todavía no hay registros.</Text>
          ) : (
            sortedSets.map(set => (
              <SetHistoryItem key={set.id} set={set}
                isMax={!isCardio && set.maxWeightInSession === maxWeight}
                isMin={!isCardio && set.maxWeightInSession === minWeight && maxWeight !== minWeight}
                onDelete={handleDeleteSet}
              />
            ))
          )}
        </SectionCard>

        {/* Exportar */}
        <TouchableOpacity style={s.exportBtn} onPress={() => setShowExportModal(true)}>
          <Text style={[s.exportBtnText, { color: colors.brand }]}>⬆️ Exportar historial</Text>
        </TouchableOpacity>

        {/* Eliminar */}
        <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteExercise}>
          <Text style={[s.deleteBtnText, { color: colors.danger }]}>🗑 Eliminar ejercicio</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB registrar sesión */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: colors.brand }]}
        onPress={() => { if (!isCardio) handleSeriesCountChange('3'); setShowAddModal(true); }}
        activeOpacity={0.8}
      >
        <Text style={[s.fabText, { color: colors.textOnBrand }]}>+ Registrar sesión</Text>
      </TouchableOpacity>

      {/* Modal agregar sesión */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setShowAddModal(false)} />
          <View style={[s.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[s.modalTitle, { color: colors.textPrimary }]}>Registrar sesión</Text>
            <Text style={[s.modalSubtitle, { color: colors.textSecondary }]}>{exercise.name}</Text>
            {isCardio ? (
              <View style={s.cardioRow}>
                <FormField label="Duración (min)" value={formDuration} onChangeText={setFormDuration} placeholder="30" colors={colors} />
                <FormField label="Distancia (km)" value={formDistance} onChangeText={setFormDistance} placeholder="5" colors={colors} />
              </View>
            ) : (
              <>
                <View style={s.seriesCountRow}>
                  <Text style={[s.seriesCountLabel, { color: colors.textSecondary }]}>¿Cuántas series?</Text>
                  {[1, 2, 3, 4, 5].map(n => (
                    <TouchableOpacity key={n}
                      style={[s.seriesCountBtn, { borderColor: colors.border, backgroundColor: colors.cardAlt },
                        formSeries === n.toString() && { borderColor: colors.brand, backgroundColor: colors.brandLight }]}
                      onPress={() => handleSeriesCountChange(n.toString())}
                    >
                      <Text style={[s.seriesCountBtnText, { color: colors.textSecondary },
                        formSeries === n.toString() && { color: colors.brand }]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {seriesInputs.map((serie, index) => (
                  <View key={index} style={s.serieRow}>
                    <View style={[s.serieNumBadge, { backgroundColor: colors.brandLight }]}>
                      <Text style={[s.serieNum, { color: colors.brand }]}>{index + 1}</Text>
                    </View>
                    <FormField label="Peso (kg)" value={serie.weight} onChangeText={v => updateSerieInput(index, 'weight', v)} placeholder="0" colors={colors} />
                    <FormField label="Reps" value={serie.reps} onChangeText={v => updateSerieInput(index, 'reps', v)} placeholder="0" colors={colors} />
                  </View>
                ))}
              </>
            )}
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: colors.brand }, isSaving && { opacity: 0.6 }]}
              onPress={handleAddSession}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator color={colors.textOnBrand} />
                : <Text style={[s.saveBtnText, { color: colors.textOnBrand }]}>Guardar sesión</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} exercise={exercise} />
    </>
  );
}

function StatCard({ label, value, color, bgColor, icon }) {
  return (
    <View style={[statStyles.card, { backgroundColor: bgColor }]}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}
const statStyles = StyleSheet.create({
  card:  { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  icon:  { fontSize: 22, marginBottom: 6 },
  value: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 12, color: '#888', marginTop: 2 },
});

function SectionCard({ title, children, s, colors }) {
  return (
    <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {title ? <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

function FormField({ label, value, onChangeText, placeholder, colors }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: '500' }}>{label}</Text>
      <TextInput
        style={{ backgroundColor: colors.cardAlt, borderRadius: 10, padding: 12, fontSize: 18,
          fontWeight: '600', color: colors.textPrimary, textAlign: 'center',
          borderWidth: 1, borderColor: colors.border }}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.textLight} keyboardType="numeric"
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:       { backgroundColor: colors.card, padding: 20, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  headerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  muscleBadge:  { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  muscleText:   { fontSize: 12, fontWeight: '600' },
  editBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  editBtnText:  { fontSize: 13, color: colors.textSecondary },
  exerciseName: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  sessionCount: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  executeBtn: {
    margin: 16, marginBottom: 8, backgroundColor: colors.brand,
    borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  executeBtnIcon: { fontSize: 22, color: colors.textOnBrand },
  executeBtnText: { fontSize: 17, fontWeight: '900', color: colors.textOnBrand, flex: 1 },
  executeBtnSub:  { fontSize: 11, color: colors.textOnBrand, opacity: 0.7 },

  statsGrid:          { flexDirection: 'row', padding: 16, gap: 12 },
  sectionCard:        { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 0.5 },
  sectionTitle:       { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  filtersRow:         { flexDirection: 'row', gap: 12, marginBottom: 12 },
  filterGroup:        { flex: 1 },
  filterLabel:        { fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
  filterBtns:         { flexDirection: 'row', gap: 4 },
  filterBtn:          { flex: 1, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardAlt, alignItems: 'center' },
  filterBtnSelected:  { borderColor: colors.brand, backgroundColor: colors.brandLight },
  filterBtnText:      { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  videoButton:        { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, gap: 12 },
  videoIcon:          { fontSize: 24 },
  videoButtonText:    { fontSize: 14, fontWeight: '700' },
  videoUrl:           { fontSize: 11, marginTop: 2 },
  videoComponent:     { width: '100%', height: 200, marginTop: 8 },
  description:        { fontSize: 14, lineHeight: 22 },
  emptyHistory:       { textAlign: 'center', fontSize: 14, paddingVertical: 16 },
  exportBtn:          { marginHorizontal: 16, marginTop: 4, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.brand, alignItems: 'center', backgroundColor: colors.brandLight },
  exportBtnText:      { fontWeight: '700', fontSize: 15 },
  deleteBtn:          { marginHorizontal: 16, marginTop: 4, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.danger, alignItems: 'center' },
  deleteBtnText:      { fontWeight: '700', fontSize: 15 },
  fab:                { position: 'absolute', bottom: 24, left: 20, right: 20, borderRadius: 14, padding: 16, alignItems: 'center', elevation: 6, shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabText:            { fontWeight: '800', fontSize: 16 },
  modalOverlay:       { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle:         { fontSize: 20, fontWeight: '800' },
  modalSubtitle:      { fontSize: 14, marginBottom: 20, marginTop: 2 },
  cardioRow:          { flexDirection: 'row', gap: 12, marginBottom: 20 },
  seriesCountRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  seriesCountLabel:   { fontSize: 13, marginRight: 4 },
  seriesCountBtn:     { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  seriesCountBtnText: { fontSize: 14, fontWeight: '600' },
  serieRow:           { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
  serieNumBadge:      { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  serieNum:           { fontSize: 13, fontWeight: '700' },
  saveBtn:            { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText:        { fontWeight: '800', fontSize: 16 },
});