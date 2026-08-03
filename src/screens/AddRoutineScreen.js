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

function makeDefaultSeries(sets, reps) {
  return Array.from({ length: sets }, (_, i) => ({ id: i+1, reps }));
}

// ── Componente: editor de series personalizadas ───────────────────────────────
function SeriesEditor({ ex, dayName, onUpdate, colors }) {
  const uniform    = ex.uniform !== false;
  const sets       = ex.targetSets || 3;
  const defaultReps= ex.targetReps || 10;
  const series     = ex.series || makeDefaultSeries(sets, defaultReps);

  function setUniform(val) {
    if (val) {
      onUpdate(dayName, ex.exerciseId, {
        uniform: true,
        series: makeDefaultSeries(sets, defaultReps),
      });
    } else {
      onUpdate(dayName, ex.exerciseId, {
        uniform: false,
        series: makeDefaultSeries(sets, defaultReps),
      });
    }
  }

  function updateSerieReps(serieId, reps) {
    const updated = series.map(s => s.id === serieId ? { ...s, reps: parseInt(reps) || 0 } : s);
    onUpdate(dayName, ex.exerciseId, { series: updated });
  }

  function updateSetsCount(newSets) {
    const count = Math.max(1, Math.min(10, newSets));
    const updated = Array.from({ length: count }, (_, i) => series[i] || { id: i+1, reps: defaultReps });
    onUpdate(dayName, ex.exerciseId, { targetSets: count, series: updated });
  }

  return (
    <View style={{ marginTop:8 }}>
      {/* Toggle uniforme / personalizar */}
      <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8, gap:10 }}>
        <Text style={{ fontSize:11, color: colors.textSecondary, flex:1 }}>Repeticiones</Text>
        <View style={{ flexDirection:'row', borderRadius:8, overflow:'hidden', borderWidth:1, borderColor: colors.border }}>
          {[true, false].map(val => (
            <TouchableOpacity key={String(val)} onPress={() => setUniform(val)}
              style={{ paddingHorizontal:12, paddingVertical:5, backgroundColor: uniform===val ? colors.brand : colors.card }}>
              <Text style={{ fontSize:11, fontWeight:'800', color: uniform===val ? '#0A0A0A' : colors.textSecondary }}>
                {val ? 'Iguales' : 'Custom'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {uniform ? (
        /* Modo uniforme: sets × reps */
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          {/* Sets */}
          <View style={{ alignItems:'center' }}>
            <Text style={{ fontSize:9, color: colors.brand, fontWeight:'800', letterSpacing:1, marginBottom:4 }}>SERIES</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <TouchableOpacity
                onPress={() => updateSetsCount(sets - 1)}
                style={[st.step, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>−</Text>
              </TouchableOpacity>
              <Text style={{ fontSize:16, fontWeight:'900', color: colors.brand, minWidth:24, textAlign:'center' }}>{sets}</Text>
              <TouchableOpacity
                onPress={() => updateSetsCount(sets + 1)}
                style={[st.step, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={{ fontSize:18, color: colors.textSecondary, marginTop:14 }}>×</Text>

          {/* Reps */}
          <View style={{ alignItems:'center' }}>
            <Text style={{ fontSize:9, color:'#60A5FA', fontWeight:'800', letterSpacing:1, marginBottom:4 }}>REPS</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <TouchableOpacity
                onPress={() => onUpdate(dayName, ex.exerciseId, { targetReps: Math.max(1, defaultReps-1), series: makeDefaultSeries(sets, Math.max(1, defaultReps-1)) })}
                style={[st.step, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>−</Text>
              </TouchableOpacity>
              <TextInput
                value={String(defaultReps)}
                onChangeText={v => {
                  const r = parseInt(v) || 1;
                  onUpdate(dayName, ex.exerciseId, { targetReps: r, series: makeDefaultSeries(sets, r) });
                }}
                keyboardType="numeric" maxLength={3}
                style={[st.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              />
              <TouchableOpacity
                onPress={() => onUpdate(dayName, ex.exerciseId, { targetReps: defaultReps+1, series: makeDefaultSeries(sets, defaultReps+1) })}
                style={[st.step, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={{ fontSize:12, color: colors.textSecondary, marginTop:14, flex:1 }}>
            {sets} serie{sets!==1?'s':''} de {defaultReps} rep{defaultReps!==1?'s':''}
          </Text>
        </View>
      ) : (
        /* Modo custom: una fila por serie */
        <View>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:6 }}>
            <Text style={{ fontSize:11, color: colors.textSecondary, flex:1 }}>
              {sets} serie{sets!==1?'s':''}
            </Text>
            <TouchableOpacity onPress={() => updateSetsCount(sets-1)} style={[st.step, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>−</Text>
            </TouchableOpacity>
            <Text style={{ fontSize:13, fontWeight:'900', color: colors.brand, minWidth:20, textAlign:'center' }}>{sets}</Text>
            <TouchableOpacity onPress={() => updateSetsCount(sets+1)} style={[st.step, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
            {series.map((serie, idx) => (
              <View key={serie.id} style={{ alignItems:'center' }}>
                <Text style={{ fontSize:9, color: colors.textSecondary, marginBottom:3 }}>S{idx+1}</Text>
                <TextInput
                  value={String(serie.reps)}
                  onChangeText={v => updateSerieReps(serie.id, v)}
                  keyboardType="numeric" maxLength={3}
                  style={[st.input, { color:'#60A5FA', borderColor:'rgba(96,165,250,0.4)', backgroundColor: colors.background }]}
                />
              </View>
            ))}
          </View>
          <Text style={{ fontSize:10, color: colors.textSecondary, marginTop:4 }}>
            {series.map((s,i) => `S${i+1}: ${s.reps}`).join(' · ')}
          </Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  step:  { width:24, height:24, borderRadius:7, borderWidth:1, justifyContent:'center', alignItems:'center' },
  input: { borderWidth:1, borderRadius:8, width:46, textAlign:'center', paddingVertical:4, fontSize:14, fontWeight:'800' },
});

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
          exerciseName: exercise.name,
          muscleGroup:  exercise.muscleGroup,
          targetSets:   3,
          targetReps:   10,
          uniform:      true,
          series:       makeDefaultSeries(3, 10),
        }],
      };
    }));
  }

  // Actualización general de campos de un ejercicio
  function updateExField(dayName, exerciseId, updates) {
    setDays(p => p.map(d => d.dayName !== dayName ? d : {
      ...d,
      exercises: d.exercises.map(e =>
        e.exerciseId !== exerciseId ? e : { ...e, ...updates }
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
    } finally { setIsSaving(false); }
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
              <TouchableOpacity key={w}
                style={[s.weekChip, weeks === w.toString() && { backgroundColor: colors.brand, borderColor: colors.brand }]}
                onPress={() => setWeeks(w.toString())}>
                <Text style={[s.weekChipText, weeks === w.toString() && { color: colors.textOnBrand, fontWeight:'700' }]}>
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
            La rutina durará {parseInt(weeks)||0} semana{parseInt(weeks)!==1?'s':''} en total.
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
                <TouchableOpacity key={day}
                  style={[s.dayCircle, active && { backgroundColor: colors.brand, borderColor: colors.brand }]}
                  onPress={() => toggleDay(day)}>
                  <Text style={[s.dayCircleText, active && { color: colors.textOnBrand, fontWeight:'800' }]}>
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
                    <TouchableOpacity style={s.addExBtn}
                      onPress={() => { setSelectedDayName(dayName); setSearch(''); setModalVisible(true); }}>
                      <Text style={s.addExBtnText}>+ Agregar</Text>
                    </TouchableOpacity>
                  </View>

                  {(dayData?.exercises || []).length === 0 ? (
                    <Text style={s.dayEmpty}>Sin ejercicios. Tocá + Agregar.</Text>
                  ) : (
                    (dayData?.exercises || []).map(ex => {
                      const exData = allExercises.find(e => e.id === ex.exerciseId);
                      const exName = ex.exerciseName || exData?.name || ex.exerciseId.slice(0,8);
                      const group  = ex.muscleGroup  || exData?.muscleGroup || 'Otro';
                      const mc     = colors.muscleColors?.[group] || colors.muscleColors?.['Otro'] || { bg:'#1A1A00', text:'#E8B500' };

                      return (
                        <View key={ex.exerciseId} style={[s.exRow, { borderTopColor: colors.border }]}>
                          <View style={{ flex:1 }}>
                            {/* Nombre + badge + quitar */}
                            <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 }}>
                              <View style={[s.exRowBadge, { backgroundColor: mc.bg }]}>
                                <Text style={[s.exRowBadgeText, { color: mc.text }]}>{group.slice(0,2).toUpperCase()}</Text>
                              </View>
                              <Text style={[s.exRowName, { flex:1 }]} numberOfLines={1}>{exName}</Text>
                              <TouchableOpacity onPress={() => removeEx(dayName, ex.exerciseId)} hitSlop={10}>
                                <Text style={[s.exRemove, { color: colors.danger }]}>✕</Text>
                              </TouchableOpacity>
                            </View>
                            {/* Editor de series */}
                            <SeriesEditor
                              ex={ex}
                              dayName={dayName}
                              onUpdate={updateExField}
                              colors={colors}
                            />
                          </View>
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
        <TouchableOpacity style={[s.saveBtn, isSaving && { opacity:0.6 }]} onPress={handleSave} disabled={isSaving}>
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
            <TouchableOpacity style={[s.modalDoneBtn, { backgroundColor: colors.brand }]}
              onPress={() => setModalVisible(false)}>
              <Text style={[s.modalDoneBtnText, { color: colors.textOnBrand }]}>Listo</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.modalSearch, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text>🔍</Text>
            <TextInput style={[s.modalSearchInput, { color: colors.textPrimary }]}
              value={search} onChangeText={setSearch}
              placeholder="Buscar ejercicio..." placeholderTextColor={colors.textLight} />
          </View>

          {filteredEx.length === 0 ? (
            <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:20 }}>
              <Text style={{ color: colors.textMuted, fontSize:14, textAlign:'center' }}>
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
                    style={[s.exPickerItem, { backgroundColor: colors.card, borderColor: inDay ? colors.brand : 'transparent' }, inDay && { backgroundColor: colors.brandLight }]}
                    onPress={() => toggleExInDay(item)}>
                    <View style={[s.exPickerBadge, { backgroundColor: mc.bg }]}>
                      <Text style={[s.exPickerBadgeText, { color: mc.text }]}>{item.muscleGroup}</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={[s.exPickerName, { color: colors.textPrimary }]}>{item.name}</Text>
                    </View>
                    <View style={[s.checkbox, { borderColor: inDay ? colors.brand : colors.border }, inDay && { backgroundColor: colors.brand }]}>
                      {inDay && <Text style={{ color: colors.textOnBrand, fontSize:12, fontWeight:'800' }}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{ padding:16, gap:8 }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container:   { flex:1, backgroundColor: colors.background },
  scroll:      { flex:1 },
  content:     { padding:20 },
  fieldGroup:  { marginBottom:24 },
  fieldLabel:  { fontSize:10, fontWeight:'800', color: colors.brand, letterSpacing:1.5, marginBottom:10 },
  hint:        { fontSize:12, color: colors.textSecondary, marginTop:8 },
  hint2:       { fontSize:12, color: colors.textSecondary, marginBottom:10 },
  input:       { backgroundColor: colors.card, borderWidth:1, borderColor: colors.border, borderRadius:12, paddingHorizontal:14, paddingVertical:13, fontSize:15, color: colors.textPrimary },
  weeksRow:    { flexDirection:'row', gap:8, alignItems:'center', flexWrap:'wrap' },
  weekChip:    { paddingHorizontal:12, paddingVertical:8, borderRadius:20, borderWidth:1.5, borderColor: colors.border, backgroundColor: colors.card },
  weekChipText:{ fontSize:12, fontWeight:'600', color: colors.textSecondary },
  weeksCustom: { width:48, height:38, borderRadius:20, borderWidth:1.5, borderColor: colors.border, backgroundColor: colors.card, textAlign:'center', fontSize:14, fontWeight:'700', color: colors.textPrimary },
  daysRow:     { flexDirection:'row', gap:8 },
  dayCircle:   { flex:1, aspectRatio:1, borderRadius:12, borderWidth:1.5, borderColor: colors.border, backgroundColor: colors.card, justifyContent:'center', alignItems:'center', position:'relative' },
  dayCircleText:{ fontSize:13, fontWeight:'700', color: colors.textSecondary },
  dayCount:    { position:'absolute', top:-5, right:-5, width:18, height:18, borderRadius:9, justifyContent:'center', alignItems:'center', borderWidth:1.5, borderColor: colors.background },
  dayCountText:{ fontSize:9, fontWeight:'800' },
  dayCard:     { backgroundColor: colors.card, borderRadius:16, padding:14, marginBottom:10, borderWidth:0.5, borderColor: colors.border },
  dayCardHeader:{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 },
  dayCardDot:  { width:8, height:8, borderRadius:4 },
  dayCardTitle:{ flex:1, fontSize:15, fontWeight:'800', color: colors.textPrimary },
  addExBtn:    { paddingHorizontal:12, paddingVertical:5, borderRadius:8, backgroundColor: colors.brandLight },
  addExBtnText:{ fontSize:13, color: colors.brand, fontWeight:'700' },
  dayEmpty:    { fontSize:13, color: colors.textLight, textAlign:'center', paddingVertical:10 },
  exRow:       { paddingVertical:12, borderTopWidth:0.5 },
  exRowBadge:  { paddingHorizontal:6, paddingVertical:3, borderRadius:6 },
  exRowBadgeText:{ fontSize:9, fontWeight:'800' },
  exRowName:   { fontSize:13, fontWeight:'600', color: colors.textPrimary },
  exRemove:    { fontSize:16, paddingHorizontal:4 },
  footer:      { padding:20, paddingBottom: Platform.OS==='ios'?36:20, backgroundColor: colors.background, borderTopWidth:0.5, borderTopColor: colors.border },
  saveBtn:     { backgroundColor: colors.brand, borderRadius:14, padding:17, alignItems:'center', shadowColor: colors.brand, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:6 },
  saveBtnText: { color: colors.textOnBrand, fontWeight:'800', fontSize:16, letterSpacing:0.2 },
  modalContainer:{ flex:1 },
  modalHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, borderBottomWidth:0.5 },
  modalTitle:  { fontSize:18, fontWeight:'800', color: colors.textPrimary },
  modalSubtitle:{ fontSize:13, color: colors.textSecondary, marginTop:2 },
  modalDoneBtn:{ paddingHorizontal:18, paddingVertical:9, borderRadius:12 },
  modalDoneBtnText:{ fontWeight:'800', fontSize:14 },
  modalSearch: { flexDirection:'row', alignItems:'center', margin:16, borderWidth:1, borderRadius:12, paddingHorizontal:12, paddingVertical:10, gap:8 },
  modalSearchInput:{ flex:1, fontSize:14 },
  exPickerItem:{ flexDirection:'row', alignItems:'center', borderRadius:14, padding:14, borderWidth:1.5, gap:12 },
  exPickerBadge:{ paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  exPickerBadgeText:{ fontSize:10, fontWeight:'700' },
  exPickerName:{ fontSize:14, fontWeight:'700' },
  checkbox:    { width:26, height:26, borderRadius:13, borderWidth:2, justifyContent:'center', alignItems:'center' },
});