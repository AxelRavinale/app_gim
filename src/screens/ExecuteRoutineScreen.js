import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, StatusBar, Alert, Platform,
  ActivityIndicator, Vibration, Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import { Video } from 'expo-av';
import { useTheme } from '../theme/ThemeContext';
import { saveSession } from '../storage/routines';
import { getAllExercises, getAllSets } from '../storage/exercises';
import { getExerciseAnimation } from '../constants/exerciseAnimations';

async function buzz(heavy = false) {
  try {
    if (heavy) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate(Platform.OS === 'android' ? [0,200,100,200] : 400);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch {}
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2,'0');
  const s = (secs % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function svgHtml(svg) {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<style>*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#0A0A0A;width:100%;height:100%;display:flex;justify-content:center;align-items:center;overflow:hidden;}
svg{display:block;}</style>
</head><body>${svg}</body></html>`;
}

// ── Media ─────────────────────────────────────────────────────────────────────
function ExerciseMedia({ exercise, colors }) {
  const [tab, setTab] = useState('animation');
  const svg = getExerciseAnimation(exercise || {});
  const hasVideo = !!exercise?.videoLocal;
  const hasYT    = !!exercise?.videoUrl;

  const tabs = [
    { id:'animation', label:'🎬 Animación' },
    hasVideo && { id:'video', label:'📹 Video' },
    hasYT    && { id:'youtube', label:'▶ YouTube' },
  ].filter(Boolean);

  return (
    <View style={{ backgroundColor: colors.card, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
      {tabs.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection:'row', paddingHorizontal:14, paddingTop:10, gap:7 }}>
          {tabs.map(t => (
            <TouchableOpacity key={t.id}
              style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1.5,
                borderColor: tab===t.id ? colors.brand : colors.border,
                backgroundColor: tab===t.id ? colors.brandLight : colors.cardAlt }}
              onPress={() => setTab(t.id)}>
              <Text style={{ fontSize:11, fontWeight:'700', color: tab===t.id ? colors.brand : colors.textSecondary }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={{ height:200, justifyContent:'center', alignItems:'center' }}>
        {tab === 'animation' && (
          <WebView source={{ html: svgHtml(svg) }}
            style={{ width:200, height:200, backgroundColor:'#0A0A0A' }}
            scrollEnabled={false} originWhitelist={['*']} mixedContentMode="always" javaScriptEnabled />
        )}
        {tab === 'video' && hasVideo && (
          <Video source={{ uri: exercise.videoLocal }} style={{ width:'100%', height:200 }}
            useNativeControls resizeMode="contain" shouldPlay={false} />
        )}
        {tab === 'youtube' && hasYT && (
          <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:24 }}>
            <Text style={{ fontSize:32, marginBottom:12 }}>▶️</Text>
            <Text style={{ color:colors.textPrimary, fontWeight:'700', fontSize:14, marginBottom:4, textAlign:'center' }}>Ver en YouTube</Text>
            <TouchableOpacity style={{ backgroundColor:colors.brand, paddingHorizontal:20, paddingVertical:10, borderRadius:10, marginTop:10 }}
              onPress={() => Linking.openURL(exercise.videoUrl)}>
              <Text style={{ color:colors.textOnBrand, fontWeight:'800', fontSize:13 }}>Abrir →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Timer descanso fullscreen ─────────────────────────────────────────────────
function RestTimer({ seconds, onDone, colors }) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused]       = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (paused) { clearInterval(ref.current); return; }
    ref.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(ref.current); buzz(true); setTimeout(onDone, 300); return 0; }
        if (r <= 4) buzz(false);
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [paused]);

  const pct   = remaining / seconds;
  const pColor = pct > 0.5 ? colors.success : pct > 0.25 ? colors.warning : colors.danger;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor:colors.background, zIndex:100, justifyContent:'center', alignItems:'center', padding:24 }]}>
      <Text style={{ fontSize:11, fontWeight:'800', color:colors.brand, letterSpacing:2, marginBottom:8 }}>DESCANSO</Text>
      <Text style={{ fontSize:14, color:colors.textSecondary, marginBottom:36 }}>Preparate para la próxima serie</Text>
      <View style={{ width:200, height:200, justifyContent:'center', alignItems:'center', marginBottom:36 }}>
        <View style={{ position:'absolute', width:200, height:200, borderRadius:100, borderWidth:5, borderColor:colors.border }} />
        <View style={{ position:'absolute', width:200, height:200, borderRadius:100, borderWidth:5, borderColor:pColor, borderTopColor:'transparent', transform:[{rotate:'-90deg'}] }} />
        <Text style={{ fontSize:64, fontWeight:'900', color:pColor, letterSpacing:-3 }}>{formatTime(remaining)}</Text>
      </View>
      <View style={{ flexDirection:'row', gap:10, marginBottom:16 }}>
        {[-15, 15, 30].map(s => (
          <TouchableOpacity key={s}
            style={{ paddingHorizontal:16, paddingVertical:10, borderRadius:12, borderWidth:1, borderColor:colors.border, backgroundColor:colors.card }}
            onPress={() => { setRemaining(r => Math.max(0, r + s)); buzz(); }}>
            <Text style={{ color:colors.textPrimary, fontWeight:'700', fontSize:13 }}>{s > 0 ? '+' : ''}{s}s</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection:'row', gap:10, width:'100%' }}>
        <TouchableOpacity style={{ flex:1, paddingVertical:14, borderRadius:13, borderWidth:1, borderColor:colors.border, backgroundColor:colors.card, alignItems:'center' }}
          onPress={() => setPaused(p => !p)}>
          <Text style={{ color:colors.textSecondary, fontWeight:'700', fontSize:13 }}>{paused ? '▶ Continuar' : '⏸ Pausar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex:2, paddingVertical:14, borderRadius:13, backgroundColor:colors.brand, alignItems:'center' }}
          onPress={() => { clearInterval(ref.current); buzz(); onDone(); }}>
          <Text style={{ color:colors.textOnBrand, fontWeight:'900', fontSize:13 }}>⏭ Saltar descanso</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function ExecuteRoutineScreen({ route, navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { routineId, routineName, week, dayName, dayExercises, existingSession } = route.params;

  const [exercises, setExercises]     = useState([]);
  const [exerciseMap, setExerciseMap] = useState({});
  const [prevWeekMap, setPrevWeekMap] = useState({}); // histórico semana anterior
  const [currentIdx, setCurrentIdx]   = useState(0);
  const [exStates, setExStates]       = useState([]);
  const [showRest, setShowRest]       = useState(false);
  const [restSecs, setRestSecs]       = useState(90);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [done, setDone]               = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: `${routineName} — ${dayName}` });
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const allEx = await getAllExercises();
      const map = {};
      allEx.forEach(ex => { map[ex.id] = ex; });
      setExerciseMap(map);

      const valid = dayExercises.filter(de => map[de.exerciseId] || de.exerciseName);
      setExercises(valid);

      // Construir histórico: última sesión registrada de cada ejercicio
      // como referencia para mostrar "semana pasada"
      const prevMap = {};
      valid.forEach(de => {
        const ex = map[de.exerciseId];
        if (ex && ex.sets && ex.sets.length > 0) {
          // Ordenamos por fecha y tomamos la última sesión
          const sorted = [...ex.sets].sort((a, b) => new Date(b.date) - new Date(a.date));
          const last = sorted[0];
          if (last && last.series && last.series.length > 0) {
            prevMap[de.exerciseId] = last.series; // array de {serieNumber, weight, reps}
          }
        }
      });
      setPrevWeekMap(prevMap);

      // Estado inicial de cada ejercicio
      if (existingSession) {
        setExStates(valid.map(de => {
          const existing = existingSession.exercises?.find(e => e.exerciseId === de.exerciseId);
          return existing || buildState(de);
        }));
      } else {
        setExStates(valid.map(de => buildState(de)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function buildState(de) {
    return {
      exerciseId: de.exerciseId,
      status: 'pending',
      series: Array.from({ length: de.targetSets || 3 }, (_, i) => ({
        serieNumber: i + 1, weight: '', reps: (de.targetReps || 10).toString(), done: false,
      })),
    };
  }

  function updateSerie(exIdx, sIdx, field, value) {
    setExStates(p => p.map((ex, i) => i !== exIdx ? ex : {
      ...ex, series: ex.series.map((s, j) => j !== sIdx ? s : { ...s, [field]: value }),
    }));
  }

  function markSerieDone(exIdx, sIdx) {
    setExStates(p => p.map((ex, i) => i !== exIdx ? ex : {
      ...ex, series: ex.series.map((s, j) => j !== sIdx ? s : { ...s, done: true }),
    }));
    buzz();
    setShowRest(true);
  }

  function addSerie(exIdx) {
    setExStates(p => p.map((ex, i) => i !== exIdx ? ex : {
      ...ex, series: [...ex.series, {
        serieNumber: ex.series.length + 1,
        weight: ex.series[ex.series.length-1]?.weight || '',
        reps: ex.series[ex.series.length-1]?.reps || '10',
        done: false,
      }],
    }));
  }

  function markExDone(exIdx) {
    setExStates(p => p.map((ex, i) => i !== exIdx ? ex : { ...ex, status: 'completed' }));
    buzz(true);
    if (exIdx < exercises.length - 1) setCurrentIdx(exIdx + 1);
    else setDone(true);
  }

  function markExSkipped(exIdx) {
    setExStates(p => p.map((ex, i) => i !== exIdx ? ex : { ...ex, status: 'skipped' }));
    if (exIdx < exercises.length - 1) setCurrentIdx(exIdx + 1);
    else setDone(true);
  }

  async function handleSave(status = 'completed') {
    setSaving(true);
    try {
      await saveSession({ routineId, week, dayName, status, exercises: exStates });
      buzz(true);
      navigation.goBack();
    } catch { Alert.alert('Error', 'No se pudo guardar'); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <View style={s.centered}>
      <ActivityIndicator color={colors.brand} size="large" />
      <Text style={{ color:colors.textSecondary, marginTop:16, fontSize:14 }}>Cargando...</Text>
    </View>
  );

  if (exercises.length === 0) return (
    <View style={s.centered}>
      <Text style={{ fontSize:36, marginBottom:14 }}>🏋️</Text>
      <Text style={{ color:colors.textPrimary, fontSize:16, fontWeight:'700', marginBottom:8 }}>Sin ejercicios</Text>
      <TouchableOpacity style={[s.btn, { backgroundColor:colors.brand }]} onPress={load}>
        <Text style={{ color:colors.textOnBrand, fontWeight:'800' }}>↺ Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const curEx    = exercises[currentIdx];
  const curExData = exerciseMap[curEx?.exerciseId];
  const curState  = exStates[currentIdx];
  const isCardio  = curExData?.trackingType === 'time';
  const completedCount = exStates.filter(e => e.status === 'completed').length;
  const prevSeries = prevWeekMap[curEx?.exerciseId] || [];

  // Stats del ejercicio actual
  const allSets = curExData?.sets || [];
  const validWeights = allSets.map(s => s.maxWeightInSession).filter(w => w != null && isFinite(w) && w > 0);
  const maxWeight = validWeights.length > 0 ? Math.max(...validWeights) : null;
  const lastSet = allSets.length > 0 ? [...allSets].sort((a,b) => new Date(b.date)-new Date(a.date))[0] : null;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Barra de progreso general */}
      <View style={s.progressBar}>
        <View style={s.progressInfo}>
          <Text style={s.progressTitle}>{dayName} · Semana {week}</Text>
          <Text style={s.progressSub}>{completedCount}/{exercises.length} ejercicios</Text>
        </View>
        <View style={[s.progressTrack, { backgroundColor:colors.border }]}>
          <View style={[s.progressFill, { width:`${(completedCount/exercises.length)*100}%`, backgroundColor:colors.brand }]} />
        </View>
      </View>

      {/* Tabs de ejercicios */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabScroll} style={{ maxHeight:52 }}>
        {exercises.map((ex, idx) => {
          const st = exStates[idx];
          const nm = exerciseMap[ex.exerciseId]?.name || ex.exerciseName || `Ej.${idx+1}`;
          const isDone = st?.status === 'completed';
          const isSkip = st?.status === 'skipped';
          const isCur  = idx === currentIdx;
          return (
            <TouchableOpacity key={ex.exerciseId || idx}
              style={[s.tab, isCur && { borderBottomColor:colors.brand, borderBottomWidth:2 }, isDone && { backgroundColor:colors.brandLight }]}
              onPress={() => setCurrentIdx(idx)}>
              <Text style={[s.tabText, isCur && { color:colors.brand, fontWeight:'700' }, isDone && { color:colors.brand }]} numberOfLines={1}>
                {isDone ? '✓ ' : isSkip ? '✕ ' : ''}{nm}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom:130 }}>

        {/* Animación */}
        <ExerciseMedia exercise={curExData || { muscleGroup: curEx?.muscleGroup }} colors={colors} />

        {/* Info compacta del ejercicio */}
        <View style={s.exInfo}>
          <View style={s.exInfoLeft}>
            {(curExData?.muscleGroup || curEx?.muscleGroup) ? (
              <View style={[s.musclePill, { backgroundColor:colors.brandLight }]}>
                <Text style={[s.musclePillText, { color:colors.brand }]}>
                  {curExData?.muscleGroup || curEx?.muscleGroup}
                </Text>
              </View>
            ) : null}
            <Text style={s.exName}>{curExData?.name || curEx?.exerciseName || 'Ejercicio'}</Text>
          </View>
          {/* Stats rápidas */}
          <View style={s.exStats}>
            {maxWeight !== null && (
              <View style={s.exStat}>
                <Text style={[s.exStatVal, { color:colors.brand }]}>{maxWeight}kg</Text>
                <Text style={s.exStatLbl}>máx</Text>
              </View>
            )}
            {lastSet && lastSet.series?.length > 0 && (
              <View style={s.exStat}>
                <Text style={[s.exStatVal, { color:colors.textSecondary }]}>
                  {lastSet.series[0]?.weight}kg×{lastSet.series[0]?.reps}
                </Text>
                <Text style={s.exStatLbl}>última</Text>
              </View>
            )}
          </View>
        </View>

        {curState && (
          <>
            {/* Config descanso */}
            <View style={s.restConfig}>
              <Text style={s.restLabel}>⏱ Descanso</Text>
              <View style={{ flexDirection:'row', gap:8 }}>
                {[60,90,120,180].map(sec => (
                  <TouchableOpacity key={sec}
                    style={[s.restBtn, restSecs===sec && { backgroundColor:colors.brand, borderColor:colors.brand }]}
                    onPress={() => setRestSecs(sec)}>
                    <Text style={[s.restBtnText, restSecs===sec && { color:colors.textOnBrand }]}>
                      {sec < 120 ? `${sec}s` : `${sec/60}min`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {isCardio ? (
              <View style={s.cardioSection}>
                <Text style={s.sectionLabel}>REGISTRO CARDIO</Text>
                <View style={{ flexDirection:'row', gap:12 }}>
                  <View style={{ flex:1 }}>
                    <Text style={s.fieldLabel}>DURACIÓN (min)</Text>
                    <TextInput style={s.bigInput}
                      value={curState.duration || ''}
                      onChangeText={v => setExStates(p => p.map((ex,i) => i!==currentIdx ? ex : {...ex, duration:v}))}
                      placeholder="30" placeholderTextColor={colors.textLight} keyboardType="numeric" />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={s.fieldLabel}>DISTANCIA (km)</Text>
                    <TextInput style={s.bigInput}
                      value={curState.distance || ''}
                      onChangeText={v => setExStates(p => p.map((ex,i) => i!==currentIdx ? ex : {...ex, distance:v}))}
                      placeholder="0.0" placeholderTextColor={colors.textLight} keyboardType="decimal-pad" />
                  </View>
                </View>
              </View>
            ) : (
              <View style={s.strengthSection}>
                {/* Header series con header de histórico */}
                <View style={s.seriesHeaderRow}>
                  <Text style={s.sectionLabel}>SERIES</Text>
                  <View style={s.prevHeader}>
                    <Text style={s.prevHeaderText}>ANTERIOR</Text>
                  </View>
                </View>

                {(curState.series || []).map((serie, sIdx) => {
                  const isCurSerie = !serie.done && sIdx === curState.series.findIndex(s => !s.done);
                  // Dato de la semana anterior para esta serie
                  const prev = prevSeries[sIdx];
                  return (
                    <View key={sIdx} style={[
                      s.serieRow,
                      serie.done && { opacity:0.5 },
                      isCurSerie && { borderColor:colors.brand, backgroundColor:colors.brandLight },
                    ]}>
                      {/* Número */}
                      <View style={[s.serieNum, { backgroundColor: serie.done ? colors.success : isCurSerie ? colors.brand : colors.cardAlt }]}>
                        <Text style={[s.serieNumText, { color: (serie.done || isCurSerie) ? '#000' : colors.textSecondary }]}>
                          {serie.done ? '✓' : sIdx + 1}
                        </Text>
                      </View>

                      {/* Inputs */}
                      <View style={s.serieInputs}>
                        <View style={{ flex:1 }}>
                          <Text style={s.serieFieldLabel}>KG</Text>
                          <TextInput style={[s.serieInput, isCurSerie && { borderColor:colors.brand }]}
                            value={serie.weight}
                            onChangeText={v => updateSerie(currentIdx, sIdx, 'weight', v)}
                            placeholder="0" placeholderTextColor={colors.textLight}
                            keyboardType="decimal-pad" editable={!serie.done} selectTextOnFocus />
                        </View>
                        <Text style={s.serieX}>×</Text>
                        <View style={{ flex:1 }}>
                          <Text style={s.serieFieldLabel}>REPS</Text>
                          <TextInput style={[s.serieInput, isCurSerie && { borderColor:colors.brand }]}
                            value={serie.reps}
                            onChangeText={v => updateSerie(currentIdx, sIdx, 'reps', v)}
                            placeholder="0" placeholderTextColor={colors.textLight}
                            keyboardType="number-pad" editable={!serie.done} selectTextOnFocus />
                        </View>
                      </View>

                      {/* Histórico semana anterior */}
                      <View style={s.prevData}>
                        {prev ? (
                          <>
                            <Text style={s.prevDataVal}>{prev.weight}kg</Text>
                            <Text style={s.prevDataReps}>×{prev.reps}</Text>
                          </>
                        ) : (
                          <Text style={s.prevDataNone}>S/R</Text>
                        )}
                      </View>

                      {/* Check */}
                      {!serie.done && (
                        <TouchableOpacity style={[s.checkBtn, { backgroundColor:colors.success }]}
                          onPress={() => markSerieDone(currentIdx, sIdx)}>
                          <Text style={{ fontSize:17 }}>✓</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                <TouchableOpacity style={s.addSerieBtn} onPress={() => addSerie(currentIdx)}>
                  <Text style={[s.addSerieBtnText, { color:colors.brand }]}>+ Agregar serie</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Botones de ejercicio */}
            {curState.status === 'pending' && (
              <View style={s.exBtns}>
                <TouchableOpacity style={[s.skipBtn, { borderColor:colors.border }]}
                  onPress={() => markExSkipped(currentIdx)}>
                  <Text style={[s.skipBtnText, { color:colors.textSecondary }]}>✕ Saltear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.doneBtn, { backgroundColor:colors.brand }]}
                  onPress={() => markExDone(currentIdx)}>
                  <Text style={[s.doneBtnText, { color:colors.textOnBrand }]}>✓ Completar ejercicio</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {done && (
          <View style={s.completedCard}>
            <Text style={{ fontSize:44, textAlign:'center', marginBottom:12 }}>🏆</Text>
            <Text style={[s.completedTitle, { color:colors.brand }]}>¡Sesión completada!</Text>
            <Text style={[s.completedSub, { color:colors.textSecondary }]}>
              {completedCount} de {exercises.length} ejercicios completados
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: done || completedCount > 0 ? colors.brand : colors.danger }, saving && { opacity:0.6 }]}
          onPress={() => handleSave(done || completedCount > 0 ? 'completed' : 'skipped')}
          disabled={saving}>
          {saving
            ? <ActivityIndicator color={colors.textOnBrand} />
            : <Text style={s.saveBtnText}>
                {done || completedCount > 0
                  ? `💾 Guardar sesión (${completedCount}/${exercises.length})`
                  : '❌ Marcar como faltado'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {showRest && <RestTimer seconds={restSecs} colors={colors} onDone={() => setShowRest(false)} />}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex:1, backgroundColor:colors.background },
  centered: { flex:1, justifyContent:'center', alignItems:'center', padding:32 },
  btn: { paddingHorizontal:24, paddingVertical:12, borderRadius:12 },

  progressBar: { backgroundColor:colors.card, padding:12, borderBottomWidth:0.5, borderBottomColor:colors.border },
  progressInfo: { flexDirection:'row', justifyContent:'space-between', marginBottom:7 },
  progressTitle: { fontSize:13, fontWeight:'700', color:colors.textPrimary },
  progressSub: { fontSize:12, color:colors.textSecondary },
  progressTrack: { height:4, borderRadius:2, overflow:'hidden' },
  progressFill: { height:'100%', borderRadius:2 },

  tabScroll: { paddingHorizontal:10, paddingVertical:6, gap:4 },
  tab: { paddingHorizontal:14, paddingVertical:8, borderRadius:10, backgroundColor:colors.card, borderBottomWidth:2, borderBottomColor:'transparent', marginRight:4, maxWidth:140 },
  tabText: { fontSize:12, fontWeight:'600', color:colors.textSecondary },

  content: { flex:1, padding:14 },

  exInfo: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:colors.card, borderRadius:14, padding:14, marginBottom:10, borderWidth:0.5, borderColor:colors.border },
  exInfoLeft: { flex:1 },
  musclePill: { alignSelf:'flex-start', paddingHorizontal:8, paddingVertical:2, borderRadius:8, marginBottom:5 },
  musclePillText: { fontSize:10, fontWeight:'700' },
  exName: { fontSize:16, fontWeight:'900', color:colors.textPrimary, letterSpacing:-0.3 },
  exStats: { flexDirection:'row', gap:14, alignItems:'flex-end' },
  exStat: { alignItems:'center' },
  exStatVal: { fontSize:14, fontWeight:'800' },
  exStatLbl: { fontSize:9, color:colors.textMuted || colors.textLight, fontWeight:'600', marginTop:1 },

  restConfig: { backgroundColor:colors.card, borderRadius:12, padding:12, marginBottom:10, borderWidth:0.5, borderColor:colors.border },
  restLabel: { fontSize:11, color:colors.textSecondary, marginBottom:8 },
  restBtn: { flex:1, paddingVertical:7, borderRadius:9, borderWidth:1, borderColor:colors.border, backgroundColor:colors.cardAlt, alignItems:'center' },
  restBtnText: { fontSize:11, fontWeight:'700', color:colors.textSecondary },

  sectionLabel: { fontSize:10, fontWeight:'800', color:colors.brand, letterSpacing:1.5 },
  fieldLabel: { fontSize:10, fontWeight:'800', color:colors.brand, letterSpacing:1.5, marginBottom:5 },

  strengthSection: { marginBottom:10 },
  seriesHeaderRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  prevHeader: { paddingHorizontal:8, paddingVertical:3, borderRadius:6, backgroundColor:colors.cardAlt, borderWidth:0.5, borderColor:colors.border },
  prevHeaderText: { fontSize:9, fontWeight:'800', color:colors.textSecondary, letterSpacing:1 },

  serieRow: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:colors.card, borderRadius:13, padding:10, marginBottom:7, borderWidth:1, borderColor:colors.border },
  serieNum: { width:32, height:32, borderRadius:9, justifyContent:'center', alignItems:'center', flexShrink:0 },
  serieNumText: { fontSize:13, fontWeight:'900' },
  serieInputs: { flex:1, flexDirection:'row', alignItems:'center', gap:6 },
  serieFieldLabel: { fontSize:8, fontWeight:'800', color:colors.textLight, letterSpacing:0.5, marginBottom:3 },
  serieInput: { backgroundColor:colors.cardAlt, borderWidth:1, borderColor:colors.border, borderRadius:7, padding:8, fontSize:16, fontWeight:'800', color:colors.textPrimary, textAlign:'center' },
  serieX: { fontSize:14, color:colors.textSecondary, marginTop:12 },

  prevData: { width:52, alignItems:'center', paddingHorizontal:4 },
  prevDataVal: { fontSize:12, fontWeight:'700', color:colors.textSecondary },
  prevDataReps: { fontSize:10, color:colors.textLight, marginTop:1 },
  prevDataNone: { fontSize:12, fontWeight:'700', color:colors.textLight },

  checkBtn: { width:38, height:38, borderRadius:11, justifyContent:'center', alignItems:'center', flexShrink:0 },
  addSerieBtn: { paddingVertical:12, borderRadius:12, borderWidth:1.5, borderColor:colors.brand, borderStyle:'dashed', alignItems:'center', marginTop:4 },
  addSerieBtnText: { fontSize:13, fontWeight:'700' },

  cardioSection: { marginBottom:10 },
  bigInput: { backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:9, padding:12, fontSize:22, fontWeight:'800', color:colors.textPrimary, textAlign:'center' },

  exBtns: { flexDirection:'row', gap:10, marginBottom:10 },
  skipBtn: { flex:1, paddingVertical:13, borderRadius:12, borderWidth:1, alignItems:'center' },
  skipBtnText: { fontSize:13, fontWeight:'700' },
  doneBtn: { flex:2, paddingVertical:13, borderRadius:12, alignItems:'center' },
  doneBtnText: { fontSize:13, fontWeight:'900' },

  completedCard: { backgroundColor:colors.card, borderRadius:18, padding:28, alignItems:'center', borderWidth:1, borderColor:colors.brand+'44' },
  completedTitle: { fontSize:20, fontWeight:'900', marginBottom:6 },
  completedSub: { fontSize:13, textAlign:'center' },

  footer: { position:'absolute', bottom:0, left:0, right:0, padding:16, paddingBottom:Platform.OS==='ios'?34:16, backgroundColor:colors.background, borderTopWidth:0.5, borderTopColor:colors.border },
  saveBtn: { borderRadius:13, padding:16, alignItems:'center' },
  saveBtnText: { color:'#fff', fontWeight:'900', fontSize:15 },
});