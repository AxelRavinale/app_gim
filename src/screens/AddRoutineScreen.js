import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Modal, FlatList, Platform,
} from 'react-native';
import { saveRoutine, updateRoutine, DIAS_SEMANA } from '../storage/routines';
import { getAllExercises } from '../storage/exercises';
import { useTheme } from '../theme/ThemeContext';

const DIAS_SHORT = {
  'Lunes':'L','Martes':'M','Miércoles':'X',
  'Jueves':'J','Viernes':'V','Sábado':'S','Domingo':'D'
};

export default function AddRoutineScreen({ route, navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const editingRoutine = route.params?.routine || null;
  const isEditing = editingRoutine !== null;

  const [name, setName]       = useState(editingRoutine?.name || '');
  const [weeks, setWeeks]     = useState(editingRoutine?.weeks?.toString() || '4');
  const [days, setDays]       = useState(editingRoutine?.days || []);
  const [allExercises, setAllExercises] = useState([]);
  const [isSaving, setIsSaving]         = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDayName, setSelectedDayName] = useState(null);
  const [search, setSearch]   = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar rutina' : 'Nueva rutina' });
  }, [isEditing]);

  useEffect(() => { getAllExercises().then(setAllExercises); }, []);

  const isDayActive = (d) => days.some(x => x.dayName === d);

  function toggleDay(dayName) {
    if (isDayActive(dayName)) {
      const day = days.find(d => d.dayName === dayName);
      if (day?.exercises?.length > 0) {
        Alert.alert('Quitar día', `¿Quitás ${dayName}? Se perderán los ejercicios.`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Quitar', style: 'destructive', onPress: () => setDays(p => p.filter(d => d.dayName !== dayName)) },
        ]);
      } else setDays(p => p.filter(d => d.dayName !== dayName));
    } else {
      setDays(p => [...p, { dayName, exercises: [] }]);
    }
  }

  function isExInDay(exerciseId) {
    return days.find(d => d.dayName === selectedDayName)?.exercises?.some(e => e.exerciseId === exerciseId) || false;
  }

  function toggleExInDay(exercise) {
    setDays(p => p.map(d => {
      if (d.dayName !== selectedDayName) return d;
      const exists = d.exercises.some(e => e.exerciseId === exercise.id);
      if (exists) return { ...d, exercises: d.exercises.filter(e => e.exerciseId !== exercise.id) };
      return {
        ...d,
        exercises: [...d.exercises, {
          exerciseId:   exercise.id,
          exerciseName: exercise.name,      // ← FIX: guardar nombre
          muscleGroup:  exercise.muscleGroup, // ← FIX: guardar grupo
          targetSets:   3,
          targetReps:   10,
        }],
      };
    }));
  }

  function updateTarget(dayName, exerciseId, field, value) {
    setDays(p => p.map(d => d.dayName !== dayName ? d : {
      ...d,
      exercises: d.exercises.map(e =>
        e.exerciseId !== exerciseId ? e : { ...e, [field]: parseInt(value) || 0 }
      ),
    }));
  }

  function removeEx(dayName, exerciseId) {
    setDays(p => p.map(d =>
      d.dayName !== dayName ? d : { ...d, exercises: d.exercises.filter(e => e.exerciseId !== exerciseId) }
    ));
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    const weeksNum = parseInt(weeks);
    if (isNaN(weeksNum) || weeksNum < 1 || weeksNum > 52) {
      Alert.alert('Error', 'Las semanas deben ser entre 1 y 52'); return;
    }
    if (days.length === 0) { Alert.alert('Error', 'Agregá al menos un día'); return; }
    if (!days.some(d => d.exercises.length > 0)) {
      Alert.alert('Error', 'Agregá al menos un ejercicio'); return;
    }
    setIsSaving(true);
    try {
      const data = { name: name.trim(), weeks: weeksNum, days };
      if (isEditing) await updateRoutine(editingRoutine.id, data);
      else           await saveRoutine(data);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar: ' + (err.message || 'error desconocido'));
    } finally {
      setIsSaving(false);
    }
  }

  const filteredEx = allExercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase()) ||
    (ex.muscleGroup || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Nombre */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>NOMBRE DE LA RUTINA *</Text>
          <TextInput
            style={s.input} value={name} onChangeText={setName}
            placeholder="Ej: Push Pull Legs, Fuerza A/B..."
            placeholderTextColor={colors.textLight} maxLength={50}
          />
        </View>

        {/* Semanas */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>DURACIÓN</Text>
          <View style={s.weeksRow}>
            {[4,6,8,12,16].map(w => (
              <TouchableOpacity
                key={w}
                style={[s.weekChip, weeks === w.toString() && { backgroundColor: colors.brand, borderColor: colors.brand }]}
                onPress={() => setWeeks(w.toString())}
              >
                <Text style={[s.weekChipText, weeks === w.toString() && { color: colors.textOnBrand, fontWeight: '700' }]}>
                  {w} sem
                </Text>
              </TouchableOpacity>
            ))}
            <TextInput
              style={[s.weeksCustom, !([4,6,8,12,16].includes(parseInt(weeks))) && { borderColor: colors.brand, color: colors.brand }]}
              value={weeks} onChangeText={setWeeks}
              keyboardType="numeric" maxLength={2}
              placeholder="?" placeholderTextColor={colors.textLight}
            />
          </View>
          <Text style={s.hint}>
            La rutina durará {parseInt(weeks) || 0} semana{parseInt(weeks) !== 1 ? 's' : ''} en total.
          </Text>
        </View>

        {/* Días */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>DÍAS DE ENTRENAMIENTO</Text>
          <Text style={s.hint2}>Tocá un día para activarlo</Text>
          <View style={s.daysRow}>
            {DIAS_SEMANA.map(day => {
              const active  = isDayActive(day);
              const exCount = days.find(d => d.dayName === day)?.exercises?.length || 0;
              return (
                <TouchableOpacity
                  key={day}
                  style={[s.dayCircle, active && { backgroundColor: colors.brand, borderColor: colors.brand }]}
                  onPress={() => toggleDay(day)}
                >
                  <Text style={[s.dayCircleText, active && { color: colors.textOnBrand, fontWeight: '800' }]}>
                    {DIAS_SHORT[day]}
                  </Text>
                  {active && exCount > 0 && (
                    <View style={[s.dayCount, { backgroundColor: colors.card }]}>
                      <Text style={[s.dayCountText, { color: colors.brand }]}>{exCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Ejercicios por día */}
        {days.length > 0 && (
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>EJERCICIOS POR DÍA</Text>
            {DIAS_SEMANA.filter(d => isDayActive(d)).map(dayName => {
              const dayData = days.find(d => d.dayName === dayName);
              return (
                <View key={dayName} style={s.dayCard}>
                  <View style={s.dayCardHeader}>
                    <View style={[s.dayCardDot, { backgroundColor: colors.brand }]} />
                    <Text style={s.dayCardTitle}>{dayName}</Text>
                    <TouchableOpacity
                      style={s.addExBtn}
                      onPress={() => { setSelectedDayName(dayName); setSearch(''); setModalVisible(true); }}
                    >
                      <Text style={s.addExBtnText}>+ Agregar</Text>
                    </TouchableOpacity>
                  </View>

                  {(dayData?.exercises || []).length === 0 ? (
                    <Text style={s.dayEmpty}>Sin ejercicios. Tocá + Agregar.</Text>
                  ) : (
                    (dayData?.exercises || []).map(ex => {
                      // Buscar datos del ejercicio para mostrar nombre y color
                      const exData = allExercises.find(e => e.id === ex.exerciseId);
                      const name   = ex.exerciseName || exData?.name || ex.exerciseId.slice(0,8);
                      const group  = ex.muscleGroup  || exData?.muscleGroup || 'Otro';
                      const mc     = colors.muscleColors?.[group] || colors.muscleColors?.['Otro'] || { bg:'#1A1A00', text:'#E8B500' };

                      return (
                        <View key={ex.exerciseId} style={[s.exRow, { borderTopColor: colors.border }]}>
                          <View style={[s.exRowBadge, { backgroundColor: mc.bg }]}>
                            <Text style={[s.exRowBadgeText, { color: mc.text }]}>
                              {group.slice(0,2).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={s.exRowName} numberOfLines={1}>{name}</Text>
                          <View style={s.exTargets}>
                            <View style={s.targetField}>
                              <Text style={s.targetLabel}>S</Text>
                              <TextInput
                                style={s.targetInput}
                                value={ex.targetSets?.toString()}
                                onChangeText={v => updateTarget(dayName, ex.exerciseId, 'targetSets', v)}
                                keyboardType="numeric" maxLength={2}
                              />
                            </View>
                            <Text style={s.targetX}>×</Text>
                            <View style={s.targetField}>
                              <Text style={s.targetLabel}>R</Text>
                              <TextInput
                                style={s.targetInput}
                                value={ex.targetReps?.toString()}
                                onChangeText={v => updateTarget(dayName, ex.exerciseId, 'targetReps', v)}
                                keyboardType="numeric" maxLength={3}
                              />
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => removeEx(dayName, ex.exerciseId)} hitSlop={10}>
                            <Text style={[s.exRemove, { color: colors.danger }]}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, isSaving && { opacity: 0.6 }]} onPress={handleSave} disabled={isSaving}>
          {isSaving
            ? <ActivityIndicator color={colors.textOnBrand} />
            : <Text style={s.saveBtnText}>{isEditing ? '✓ Guardar cambios' : '✓ Crear rutina'}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Modal selector de ejercicios */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={[s.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[s.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View>
              <Text style={s.modalTitle}>Agregar ejercicios</Text>
              <Text style={s.modalSubtitle}>{selectedDayName}</Text>
            </View>
            <TouchableOpacity
              style={[s.modalDoneBtn, { backgroundColor: colors.brand }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[s.modalDoneBtnText, { color: colors.textOnBrand }]}>Listo</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.modalSearch, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text>🔍</Text>
            <TextInput
              style={[s.modalSearchInput, { color: colors.textPrimary }]}
              value={search} onChangeText={setSearch}
              placeholder="Buscar ejercicio..."
              placeholderTextColor={colors.textLight}
            />
          </View>

          {filteredEx.length === 0 ? (
            <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                No hay ejercicios. Creá uno primero desde la pantalla de Ejercicios.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredEx}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const inDay = isExInDay(item.id);
                const mc    = colors.muscleColors?.[item.muscleGroup] || colors.muscleColors?.['Otro'] || { bg:'#1A1A00', text:'#E8B500' };
                return (
                  <TouchableOpacity
                    style={[
                      s.exPickerItem,
                      { backgroundColor: colors.card, borderColor: inDay ? colors.brand : 'transparent' },
                      inDay && { backgroundColor: colors.brandLight },
                    ]}
                    onPress={() => toggleExInDay(item)}
                  >
                    <View style={[s.exPickerBadge, { backgroundColor: mc.bg }]}>
                      <Text style={[s.exPickerBadgeText, { color: mc.text }]}>{item.muscleGroup}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.exPickerName, { color: colors.textPrimary }]}>{item.name}</Text>
                    </View>
                    <View style={[s.checkbox, { borderColor: inDay ? colors.brand : colors.border }, inDay && { backgroundColor: colors.brand }]}>
                      {inDay && <Text style={{ color: colors.textOnBrand, fontSize: 12, fontWeight: '800' }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ padding: 16, gap: 8 }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 20 },
  fieldGroup: { marginBottom: 24 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 1.5, marginBottom: 10 },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  hint2: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.textPrimary },
  weeksRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  weekChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  weekChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  weeksCustom: { width: 48, height: 38, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  daysRow: { flexDirection: 'row', gap: 8 },
  dayCircle: { flex: 1, aspectRatio: 1, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  dayCircleText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  dayCount: { position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: colors.background },
  dayCountText: { fontSize: 9, fontWeight: '800' },
  dayCard: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: colors.border },
  dayCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dayCardDot: { width: 8, height: 8, borderRadius: 4 },
  dayCardTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  addExBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.brandLight },
  addExBtnText: { fontSize: 13, color: colors.brand, fontWeight: '700' },
  dayEmpty: { fontSize: 13, color: colors.textLight, textAlign: 'center', paddingVertical: 10 },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 0.5 },
  exRowBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  exRowBadgeText: { fontSize: 9, fontWeight: '800' },
  exRowName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  exTargets: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  targetField: { alignItems: 'center' },
  targetLabel: { fontSize: 9, color: colors.textLight, marginBottom: 2, fontWeight: '600' },
  targetInput: { width: 38, height: 34, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  targetX: { fontSize: 14, color: colors.textSecondary, marginTop: 10 },
  exRemove: { fontSize: 16, paddingHorizontal: 4 },
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.brand, borderRadius: 14, padding: 17, alignItems: 'center', shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnText: { color: colors.textOnBrand, fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 0.5 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  modalDoneBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12 },
  modalDoneBtnText: { fontWeight: '800', fontSize: 14 },
  modalSearch: { flexDirection: 'row', alignItems: 'center', margin: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  modalSearchInput: { flex: 1, fontSize: 14 },
  exPickerItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1.5, gap: 12 },
  exPickerBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  exPickerBadgeText: { fontSize: 10, fontWeight: '700' },
  exPickerName: { fontSize: 14, fontWeight: '700' },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
});