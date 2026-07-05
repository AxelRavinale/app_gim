import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Vibration, Platform, Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import { Video } from 'expo-av';
import { saveSession } from '../storage/routines';
import { getExercisesByIds, addWeightSession, addTimeSession, calculateStats, TRACKING_TYPES, formatDuration } from '../storage/exercises';
import RestTimer from '../components/RestTimer';
import SerieComment from '../components/SerieComment';
import { getExerciseAnimation } from '../constants/exerciseAnimations';
import { useTheme } from '../theme/ThemeContext';

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

// ── Media del ejercicio: animación / video / YouTube ──────────────────────────
function ExerciseMedia({ exercise, colors }) {
  const [activeTab, setActiveTab] = useState('animation');
  const svgContent = getExerciseAnimation(exercise || {});
  const hasVideo   = !!exercise?.videoLocal;
  const hasYoutube = !!exercise?.videoUrl;

  const tabs = [
    { id: 'animation', label: '🎬 Animación' },
    hasVideo   && { id: 'video',   label: '📹 Video' },
    hasYoutube && { id: 'youtube', label: '▶ YouTube' },
  ].filter(Boolean);

  return (
    <View style={{ backgroundColor: colors.card, borderBottomWidth: 0.5, borderBottomColor: colors.border, marginBottom: 10, borderRadius: 14, overflow: 'hidden' }}>
      {tabs.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 14, paddingTop: 10, gap: 7 }}>
          {tabs.map(tab => (
            <TouchableOpacity key={tab.id}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5,
                borderColor: activeTab === tab.id ? colors.brand : colors.border,
                backgroundColor: activeTab === tab.id ? colors.brandLight : colors.cardAlt }}
              onPress={() => setActiveTab(tab.id)}>
              <Text style={{ fontSize: 11, fontWeight: '700',
                color: activeTab === tab.id ? colors.brand : colors.textSecondary }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
        {activeTab === 'animation' && (
          <WebView source={{ html: svgHtml(svgContent) }}
            style={{ width: 200, height: 200, backgroundColor: '#0A0A0A' }}
            scrollEnabled={false} originWhitelist={['*']} mixedContentMode="always" javaScriptEnabled />
        )}
        {activeTab === 'video' && hasVideo && (
          <Video source={{ uri: exercise.videoLocal }} style={{ width: '100%', height: 200 }}
            useNativeControls resizeMode="contain" shouldPlay={false} />
        )}
        {activeTab === 'youtube' && hasYoutube && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>▶️</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 4, textAlign: 'center' }}>Ver en YouTube</Text>
            <TouchableOpacity style={{ backgroundColor: colors.brand, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10 }}
              onPress={() => Linking.openURL(exercise.videoUrl)}>
              <Text style={{ color: colors.textOnBrand, fontWeight: '800', fontSize: 13 }}>Abrir →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

async function buzz(heavy = false) {
  try {
    if (heavy) { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Vibration.vibrate(Platform.OS === 'android' ? [0,200,100,200] : 400); }
    else { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
  } catch {}
}

function formatTime(s) {
  return `${Math.floor(Math.abs(s)/60).toString().padStart(2,'0')}:${(Math.abs(s)%60).toString().padStart(2,'0')}`;
}

export default function ExecuteRoutineScreen({ route, navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { routineId, routineName, week, dayName, dayExercises, existingSession } = route.params;

  const [exercisesMap, setExercisesMap]   = useState({});
  const [exerciseStates, setExerciseStates] = useState([]);
  const [isSaving, setIsSaving]           = useState(false);
  const [isLoading, setIsLoading]         = useState(true);
  const [restTimerVisible, setRestTimerVisible] = useState(false);
  const [restTimerInfo, setRestTimerInfo]       = useState('');
  const [serieTimers, setSerieTimers]     = useState({});
  const timerIntervalsRef = useRef({});

  // Estado para el modal de comentario
  const [commentModal, setCommentModal] = useState({
    visible: false, exerciseId: null, serieIndex: null,
    serieNumber: 0, weight: 0, reps: 0,
  });

  useEffect(() => {
    loadData();
    navigation.setOptions({ title: `${dayName} — Sem. ${week}` });
    return () => { Object.values(timerIntervalsRef.current).forEach(clearInterval); };
  }, []);

  async function loadData() {
    const ids = dayExercises.map(e => e.exerciseId);
    const exList = await getExercisesByIds(ids);
    const map = {};
    exList.forEach(ex => { map[ex.id] = ex; });
    setExercisesMap(map);
    const states = dayExercises.map(de => {
      const exData = map[de.exerciseId];
      const isCardio = exData?.trackingType === TRACKING_TYPES.TIME;
      if (existingSession?.exercises) {
        const sessionEx = existingSession.exercises.find(e => e.exerciseId === de.exerciseId);
        if (sessionEx) return {
          exerciseId: de.exerciseId, status: sessionEx.status,
          series: isCardio
            ? (sessionEx.cardioSeries?.length > 0 ? sessionEx.cardioSeries.map(cs => ({ duration: cs.duration?.toString()||'', distance: cs.distance?.toString()||'', completed: cs.completed||false, comment: cs.comment||'' })) : Array.from({length:de.targetSets},()=>({duration:'',distance:'',completed:false,comment:''})))
            : (sessionEx.series?.length > 0 ? sessionEx.series.map(s=>({weight:s.weight?.toString()||'',reps:s.reps?.toString()||'',completed:false,comment:s.comment||''})) : Array.from({length:de.targetSets},()=>({weight:'',reps:de.targetReps?.toString()||'',completed:false,comment:''}))),
        };
      }
      return { exerciseId: de.exerciseId, status: 'pending',
        series: isCardio
          ? Array.from({length:de.targetSets},()=>({duration:'',distance:'',completed:false,comment:''}))
          : Array.from({length:de.targetSets},()=>({weight:'',reps:de.targetReps?.toString()||'',completed:false,comment:''})) };
    });
    setExerciseStates(states);
    setIsLoading(false);
  }

  function updateSerie(exerciseId, index, field, value) {
    setExerciseStates(prev => prev.map(ex => {
      if (ex.exerciseId !== exerciseId) return ex;
      const newSeries = [...ex.series]; newSeries[index] = { ...newSeries[index], [field]: value };
      return { ...ex, series: newSeries };
    }));
  }

  function setStatus(exerciseId, status) {
    setExerciseStates(prev => prev.map(ex => ex.exerciseId !== exerciseId ? ex : { ...ex, status }));
  }

  function toggleSerieTimer(exerciseId, serieIndex) {
    const key = `${exerciseId}_${serieIndex}`;
    const current = serieTimers[key] || { running: false, elapsed: 0 };
    if (current.running) {
      clearInterval(timerIntervalsRef.current[key]);
      setSerieTimers(prev => ({ ...prev, [key]: { ...current, running: false } }));
    } else {
      timerIntervalsRef.current[key] = setInterval(() => {
        setSerieTimers(prev => ({ ...prev, [key]: { ...prev[key], elapsed: (prev[key]?.elapsed||0)+1 } }));
      }, 1000);
      setSerieTimers(prev => ({ ...prev, [key]: { ...current, running: true } }));
    }
  }

  function resetSerieTimer(exerciseId, serieIndex) {
    const key = `${exerciseId}_${serieIndex}`;
    clearInterval(timerIntervalsRef.current[key]);
    setSerieTimers(prev => ({ ...prev, [key]: { running: false, elapsed: 0 } }));
  }

  function useSerieTimer(exerciseId, serieIndex) {
    const key = `${exerciseId}_${serieIndex}`;
    const elapsed = serieTimers[key]?.elapsed || 0;
    updateSerie(exerciseId, serieIndex, 'duration', Math.max(1, Math.round(elapsed/60)).toString());
    resetSerieTimer(exerciseId, serieIndex);
    buzz(true);
  }

  // Al completar serie → mostrar modal de comentario
  function handleSerieCompleted(exerciseId, serieIndex, totalSeries, exerciseName) {
    buzz(false);
    const exState = exerciseStates.find(ex => ex.exerciseId === exerciseId);
    const serie   = exState?.series[serieIndex];
    setCommentModal({
      visible:     true,
      exerciseId,
      serieIndex,
      serieNumber: serieIndex + 1,
      weight:      parseFloat(serie?.weight) || 0,
      reps:        parseInt(serie?.reps)     || 0,
      totalSeries,
      exerciseName,
    });
  }

  // Al guardar comentario (o saltear)
  function handleCommentSave(comment) {
    const { exerciseId, serieIndex, totalSeries, exerciseName } = commentModal;
    updateSerie(exerciseId, serieIndex, 'completed', true);
    updateSerie(exerciseId, serieIndex, 'comment', comment);
    setCommentModal(p => ({ ...p, visible: false }));
    // Mostrar timer de descanso
    setRestTimerInfo(serieIndex < totalSeries-1 ? `Serie ${serieIndex+2} — ${exerciseName}` : `Fin — ${exerciseName}`);
    setRestTimerVisible(true);
  }

  function handleCommentSkip() {
    const { exerciseId, serieIndex, totalSeries, exerciseName } = commentModal;
    updateSerie(exerciseId, serieIndex, 'completed', true);
    setCommentModal(p => ({ ...p, visible: false }));
    setRestTimerInfo(serieIndex < totalSeries-1 ? `Serie ${serieIndex+2} — ${exerciseName}` : `Fin — ${exerciseName}`);
    setRestTimerVisible(true);
  }

  async function handleFinish() {
    const allDone = exerciseStates.every(ex => ex.status==='completed'||ex.status==='skipped');
    if (!allDone) { Alert.alert('¿Terminaste?','Hay ejercicios pendientes.',[{text:'Seguir',style:'cancel'},{text:'Finalizar',onPress:doSave}]); } else doSave();
  }

  async function doSave() {
    setIsSaving(true);
    try {
      const sessionExercises = exerciseStates.map(ex => {
        const isCardio = exercisesMap[ex.exerciseId]?.trackingType === TRACKING_TYPES.TIME;
        if (ex.status==='skipped') return { exerciseId:ex.exerciseId, status:'skipped', series:[], cardioSeries:[], duration:null, distance:null };
        if (isCardio) {
          const cs = ex.series.map(sr=>({duration:parseFloat(sr.duration)||null,distance:parseFloat(sr.distance)||null,completed:sr.completed||false,comment:sr.comment||''}));
          return { exerciseId:ex.exerciseId, status:'completed', series:[], cardioSeries:cs, duration:cs.reduce((a,c)=>a+(c.duration||0),0)||null, distance:cs.reduce((a,c)=>a+(c.distance||0),0)||null };
        }
        return { exerciseId:ex.exerciseId, status:'completed', series:ex.series.map(sr=>({weight:parseFloat(sr.weight)||0,reps:parseInt(sr.reps)||0,comment:sr.comment||''})), cardioSeries:[], duration:null, distance:null };
      });
      const dayStatus = exerciseStates.every(ex=>ex.status==='skipped')?'skipped':'completed';
      const session = await saveSession({routineId,week,dayName,status:dayStatus,exercises:sessionExercises});
      for (const ex of sessionExercises) {
        if (ex.status==='skipped') continue;
        const exData = exercisesMap[ex.exerciseId];
        if (!exData) continue;
        if (exData.trackingType===TRACKING_TYPES.TIME) { for (const cs of (ex.cardioSeries||[])) { if (cs.duration) await addTimeSession(ex.exerciseId,{duration:cs.duration,distance:cs.distance},session.id); } }
        else { const valid=ex.series.filter(sr=>sr.weight>0||sr.reps>0); if (valid.length>0) await addWeightSession(ex.exerciseId,valid,session.id); }
      }
      navigation.goBack();
    } catch { Alert.alert('Error','No se pudo guardar.'); } finally { setIsSaving(false); }
  }

  if (isLoading) return <View style={s.centered}><ActivityIndicator color={colors.brand} size="large" /></View>;

  const completedCount = exerciseStates.filter(ex => ex.status === 'completed').length;
  const totalCount = exerciseStates.length;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.sessionHeader}>
          <View>
            <Text style={s.sessionTitle}>{routineName}</Text>
            <Text style={s.sessionSub}>{dayName}  ·  Semana {week}</Text>
          </View>
          <View style={s.sessionProgress}>
            <Text style={[s.sessionProgressText, { color: colors.brand }]}>{completedCount}/{totalCount}</Text>
            <Text style={s.sessionProgressLabel}>hechos</Text>
          </View>
        </View>

        <View style={[s.sessionProgressBar, { backgroundColor: colors.border }]}>
          <View style={[s.sessionProgressFill, { width: totalCount > 0 ? `${(completedCount/totalCount)*100}%` : '0%', backgroundColor: colors.brand }]} />
        </View>

        {dayExercises.map((de, exIndex) => {
          const exData  = exercisesMap[de.exerciseId];
          const exState = exerciseStates[exIndex];
          if (!exData || !exState) return null;
          const isCardio    = exData.trackingType === TRACKING_TYPES.TIME;
          const stats       = calculateStats(exData.sets, exData.trackingType);
          const isSkipped   = exState.status === 'skipped';
          const isCompleted = exState.status === 'completed';
          const lastSession = exData.sets.length > 0 ? [...exData.sets].sort((a,b)=>new Date(b.date)-new Date(a.date))[0] : null;

          return (
            <View key={de.exerciseId} style={[
              s.exCard,
              isCompleted && { borderColor: colors.success + '60' },
              isSkipped && { opacity: 0.5, borderColor: colors.danger },
            ]}>
              <View style={s.exHeader}>
                <View style={[s.exStatusDot, { backgroundColor: isCompleted ? colors.success : isSkipped ? colors.danger : colors.border }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.exName}>{exData.name}</Text>
                  <Text style={s.exTarget}>
                    {isCardio ? `⏱ Cardio · ${de.targetSets} serie${de.targetSets!==1?'s':''}` : `${de.targetSets} series × ${de.targetReps} reps`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[s.skipBtn, isSkipped && { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}
                  onPress={() => setStatus(de.exerciseId, isSkipped ? 'pending' : 'skipped')}
                >
                  <Text style={[s.skipBtnText, isSkipped && { color: colors.danger }]}>
                    {isSkipped ? 'Deshacer' : 'No hice'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Animación / Video */}
              {!isSkipped && (
                <ExerciseMedia exercise={exData || {}} colors={colors} />
              )}

              {!isSkipped && lastSession && (
                <View style={s.ref}>
                  <Text style={s.refTitle}>ÚLTIMO REGISTRO</Text>
                  {isCardio ? (
                    <View style={s.refRow}>
                      <View style={[s.refChip, { backgroundColor: colors.brandLight }]}><Text style={[s.refChipVal, { color: colors.brand }]}>{stats.maxDuration ? formatDuration(stats.maxDuration) : '—'}</Text><Text style={s.refChipLbl}>Máx dur.</Text></View>
                    </View>
                  ) : (
                    <View style={s.refRow}>
                      <View style={[s.refChip, { backgroundColor: colors.brandLight }]}><Text style={[s.refChipVal, { color: colors.brand }]}>{stats.maxWeight ? `${stats.maxWeight}kg` : '—'}</Text><Text style={s.refChipLbl}>Peso máx.</Text></View>
                      <View style={[s.refChip, { backgroundColor: colors.cardAlt }]}>
                        {(() => {
                          const series = (lastSession.series||[]).filter(sr=>sr.weight>0||sr.reps>0);
                          if (series.length===0) return <Text style={s.refChipVal}>—</Text>;
                          const allSame = series.every(sr=>sr.weight===series[0].weight&&sr.reps===series[0].reps);
                          return <Text style={[s.refChipVal,{color:colors.textPrimary,fontSize:11}]}>{allSame ? `${series.length}×${series[0].weight}kg×${series[0].reps}` : series.map(sr=>`${sr.weight}kg×${sr.reps}`).join(' ')}</Text>;
                        })()}
                        <Text style={s.refChipLbl}>Última vez</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {!isSkipped && (
                <View style={s.seriesContainer}>
                  <View style={s.colHeader}>
                    <Text style={[s.colHeaderText, { width: 30 }]}>#</Text>
                    {isCardio ? (
                      <>
                        <Text style={[s.colHeaderText, { flex: 1.2 }]}>Cronómetro</Text>
                        <Text style={[s.colHeaderText, { flex: 0.8 }]}>Min</Text>
                        <Text style={[s.colHeaderText, { flex: 0.8 }]}>Km</Text>
                      </>
                    ) : (
                      <>
                        <Text style={[s.colHeaderText, { flex: 1 }]}>Peso (kg)</Text>
                        <Text style={[s.colHeaderText, { flex: 1 }]}>Reps</Text>
                      </>
                    )}
                    <Text style={[s.colHeaderText, { width: 40 }]}>✓</Text>
                  </View>

                  {exState.series.map((serie, sIndex) => {
                    const done  = serie.completed || false;
                    const key   = `${de.exerciseId}_${sIndex}`;
                    const timer = serieTimers[key] || { running: false, elapsed: 0 };

                    return (
                      <View key={sIndex}>
                        <View style={[s.serieRow, done && { opacity: 0.75 }]}>
                          <View style={[s.serieNumBadge, { backgroundColor: done ? colors.success : colors.brandLight, width: 30 }]}>
                            <Text style={[s.serieNumText, { color: done ? '#fff' : colors.brand }]}>{sIndex+1}</Text>
                          </View>

                          {isCardio ? (
                            <>
                              <View style={[s.miniTimer, { flex: 1.2 }]}>
                                <Text style={[s.miniTimerText, { color: timer.running ? colors.success : colors.textPrimary }]}>{formatTime(timer.elapsed)}</Text>
                                <View style={s.miniTimerBtns}>
                                  <TouchableOpacity style={[s.miniTimerBtn, { backgroundColor: timer.running ? colors.warning : colors.success }]} onPress={() => toggleSerieTimer(de.exerciseId, sIndex)} disabled={done}>
                                    <Text style={s.miniTimerBtnIcon}>{timer.running ? '⏸' : '▶'}</Text>
                                  </TouchableOpacity>
                                  {timer.elapsed > 0 && !done && (
                                    <TouchableOpacity style={[s.miniTimerBtn, { backgroundColor: colors.brandLight }]} onPress={() => useSerieTimer(de.exerciseId, sIndex)}>
                                      <Text style={[s.miniTimerBtnIcon, { color: colors.brand }]}>↓</Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                              <TextInput style={[s.serieInput, { flex: 0.8 }, done && { borderColor: colors.success }]} value={serie.duration} onChangeText={v=>updateSerie(de.exerciseId,sIndex,'duration',v)} keyboardType="numeric" placeholder="—" placeholderTextColor={colors.textLight} textAlign="center" editable={!done} />
                              <TextInput style={[s.serieInput, { flex: 0.8 }, done && { borderColor: colors.success }]} value={serie.distance} onChangeText={v=>updateSerie(de.exerciseId,sIndex,'distance',v)} keyboardType="numeric" placeholder="—" placeholderTextColor={colors.textLight} textAlign="center" editable={!done} />
                            </>
                          ) : (
                            <>
                              <TextInput style={[s.serieInput, done && { borderColor: colors.success }]} value={serie.weight} onChangeText={v=>updateSerie(de.exerciseId,sIndex,'weight',v)} keyboardType="numeric" placeholder="—" placeholderTextColor={colors.textLight} textAlign="center" editable={!done} />
                              <TextInput style={[s.serieInput, done && { borderColor: colors.success }]} value={serie.reps} onChangeText={v=>updateSerie(de.exerciseId,sIndex,'reps',v)} keyboardType="numeric" placeholder="—" placeholderTextColor={colors.textLight} textAlign="center" editable={!done} />
                            </>
                          )}

                          <TouchableOpacity
                            style={[s.checkBtn, { width: 40, backgroundColor: done ? colors.success : colors.cardAlt, borderColor: done ? colors.success : colors.border }]}
                            onPress={() => { if (!done) handleSerieCompleted(de.exerciseId, sIndex, exState.series.length, exData.name); }}
                          >
                            <Text style={{ color: done ? '#fff' : colors.textLight, fontSize: 15, fontWeight: '800' }}>{done ? '✓' : '○'}</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Mostrar comentario si tiene */}
                        {done && serie.comment ? (
                          <View style={[s.commentChip, { backgroundColor: 'rgba(232,181,0,0.08)', borderColor: 'rgba(232,181,0,0.2)' }]}>
                            <Text style={{ fontSize: 11, color: colors.brand }}>💬 {serie.comment}</Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}

              {!isSkipped && (
                <TouchableOpacity
                  style={[s.completeBtn, isCompleted && { backgroundColor: colors.success, borderColor: colors.success }]}
                  onPress={() => { setStatus(de.exerciseId, isCompleted ? 'pending' : 'completed'); if (!isCompleted) buzz(true); }}
                >
                  <Text style={[s.completeBtnText, isCompleted && { color: '#fff' }]}>
                    {isCompleted ? '✅ Ejercicio completado' : 'Marcar como completado'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        <View style={{ height: 110 }} />
      </ScrollView>

      <RestTimer visible={restTimerVisible} duration={60} nextInfo={restTimerInfo} onFinish={() => setRestTimerVisible(false)} onSkip={() => setRestTimerVisible(false)} />

      {/* Modal de comentario por serie */}
      <SerieComment
        visible={commentModal.visible}
        serieNumber={commentModal.serieNumber}
        weight={commentModal.weight}
        reps={commentModal.reps}
        onSave={handleCommentSave}
        onSkip={handleCommentSkip}
      />

      <View style={s.footer}>
        <TouchableOpacity style={[s.finishBtn, isSaving && { opacity: 0.6 }]} onPress={handleFinish} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color={colors.textOnBrand} /> : <Text style={s.finishBtnText}>Finalizar entrenamiento ✓</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content:   { padding: 16 },

  sessionHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  sessionTitle:        { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  sessionSub:          { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sessionProgress:     { alignItems: 'center', backgroundColor: colors.brandLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  sessionProgressText: { fontSize: 18, fontWeight: '800' },
  sessionProgressLabel:{ fontSize: 10, color: colors.textSecondary },
  sessionProgressBar:  { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 16 },
  sessionProgressFill: { height: '100%', borderRadius: 2 },

  exCard:      { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  exHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  exStatusDot: { width: 10, height: 10, borderRadius: 5 },
  exName:      { fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.2 },
  exTarget:    { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  skipBtn:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardAlt },
  skipBtnText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },

  ref:        { backgroundColor: colors.cardAlt, borderRadius: 10, padding: 10, marginBottom: 12, borderLeftWidth: 2, borderLeftColor: colors.brand },
  refTitle:   { fontSize: 9, fontWeight: '800', color: colors.brand, letterSpacing: 1.2, marginBottom: 8 },
  refRow:     { flexDirection: 'row', gap: 8 },
  refChip:    { flex: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  refChipVal: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  refChipLbl: { fontSize: 9, color: colors.textSecondary },

  seriesContainer: { gap: 6 },
  colHeader:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2, marginBottom: 4 },
  colHeaderText:   { fontSize: 9, fontWeight: '700', color: colors.textLight, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  serieRow:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  serieNumBadge:   { height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  serieNumText:    { fontSize: 13, fontWeight: '800' },
  serieInput:      { flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.cardAlt, fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  checkBtn:        { height: 44, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },

  commentChip: { marginTop: 4, marginLeft: 35, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },

  miniTimer:       { alignItems: 'center', gap: 3 },
  miniTimerText:   { fontSize: 14, fontWeight: '800', letterSpacing: -0.5 },
  miniTimerBtns:   { flexDirection: 'row', gap: 3 },
  miniTimerBtn:    { width: 24, height: 24, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  miniTimerBtnIcon:{ fontSize: 11, color: '#fff', fontWeight: '800' },

  completeBtn:     { marginTop: 14, padding: 13, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  completeBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },

  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.border },
  finishBtn:      { backgroundColor: colors.brand, borderRadius: 14, padding: 17, alignItems: 'center', shadowColor: colors.brand, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:6 },
  finishBtnText:  { color: colors.textOnBrand, fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
});