// src/screens/CardioTimerScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, Vibration, Platform, StatusBar,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function makeSerie(duration = 30, rest = 15) {
  return { id: uuidv4(), duration, rest };
}

function makeExercise(name = 'Ejercicio') {
  return {
    id:          uuidv4(),
    name,
    series:      [makeSerie(30, 15), makeSerie(30, 15), makeSerie(30, 15)],
    restAfter:   60,
    uniform:     true,   // todas las series iguales
    seriesCount: 3,      // cantidad de series cuando uniform=true
  };
}

const DEFAULT_EXERCISES = [
  { id:'1', name:'Burpees',          series:[makeSerie(30,15),makeSerie(30,15),makeSerie(30,15)], restAfter:60, uniform:true,  seriesCount:3 },
  { id:'2', name:'Jumping Jacks',    series:[makeSerie(45,15),makeSerie(45,15),makeSerie(45,15)], restAfter:60, uniform:true,  seriesCount:3 },
  { id:'3', name:'Mountain Climbers',series:[makeSerie(30,20),makeSerie(25,15),makeSerie(20,10)], restAfter:0,  uniform:false, seriesCount:3 },
];

// ── Editor de una serie ───────────────────────────────────────────────────────
function SerieRow({ serie, index, onChange, onDelete, canDelete, colors }) {
  return (
    <View style={[srStyles.row, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={[srStyles.num, { backgroundColor: 'rgba(232,181,0,0.15)' }]}>
        <Text style={{ color: colors.brand, fontWeight:'900', fontSize:12 }}>{index + 1}</Text>
      </View>

      {/* Duración */}
      <View style={srStyles.field}>
        <Text style={[srStyles.lbl, { color: colors.brand }]}>DURACIÓN</Text>
        <View style={srStyles.controls}>
          <TouchableOpacity style={[srStyles.step, { borderColor: colors.border }]}
            onPress={() => onChange({ ...serie, duration: Math.max(5, serie.duration - 5) })}>
            <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>−</Text>
          </TouchableOpacity>
          <TextInput
            value={String(serie.duration)}
            onChangeText={v => onChange({ ...serie, duration: Math.max(5, parseInt(v)||5) })}
            keyboardType="numeric" maxLength={3}
            style={[srStyles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
          />
          <TouchableOpacity style={[srStyles.step, { borderColor: colors.border }]}
            onPress={() => onChange({ ...serie, duration: Math.min(600, serie.duration + 5) })}>
            <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={[srStyles.unit, { color: colors.textSecondary }]}>seg</Text>
      </View>

      {/* Descanso */}
      <View style={srStyles.field}>
        <Text style={[srStyles.lbl, { color: '#60A5FA' }]}>DESCANSO</Text>
        <View style={srStyles.controls}>
          <TouchableOpacity style={[srStyles.step, { borderColor: colors.border }]}
            onPress={() => onChange({ ...serie, rest: Math.max(0, serie.rest - 5) })}>
            <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>−</Text>
          </TouchableOpacity>
          <TextInput
            value={String(serie.rest)}
            onChangeText={v => onChange({ ...serie, rest: Math.max(0, parseInt(v)||0) })}
            keyboardType="numeric" maxLength={3}
            style={[srStyles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
          />
          <TouchableOpacity style={[srStyles.step, { borderColor: colors.border }]}
            onPress={() => onChange({ ...serie, rest: Math.min(300, serie.rest + 5) })}>
            <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={[srStyles.unit, { color: colors.textSecondary }]}>seg</Text>
      </View>

      {canDelete && (
        <TouchableOpacity style={srStyles.delBtn} onPress={onDelete}>
          <Text style={{ color: '#EF4444', fontSize:14 }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const srStyles = StyleSheet.create({
  row:      { flexDirection:'row', alignItems:'center', gap:8, padding:10, borderRadius:12, borderWidth:1, marginBottom:6 },
  num:      { width:26, height:26, borderRadius:13, justifyContent:'center', alignItems:'center', flexShrink:0 },
  field:    { flex:1, alignItems:'center', gap:3 },
  lbl:      { fontSize:7, fontWeight:'800', letterSpacing:1 },
  controls: { flexDirection:'row', alignItems:'center', gap:4 },
  step:     { width:24, height:24, borderRadius:7, borderWidth:1, justifyContent:'center', alignItems:'center' },
  input:    { borderWidth:1, borderRadius:8, width:46, textAlign:'center', paddingVertical:4, fontSize:14, fontWeight:'800' },
  unit:     { fontSize:8 },
  delBtn:   { padding:6, flexShrink:0 },
});

// ── Editor de ejercicio completo ──────────────────────────────────────────────
function ExerciseEditor({ exercise, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast, colors }) {
  const [expanded, setExpanded] = useState(true);

  const uniform      = exercise.uniform !== false; // default true
  const seriesCount  = exercise.seriesCount || exercise.series.length || 3;
  const templateSerie = exercise.series[0] || makeSerie(30, 15);

  function updateSerie(serieId, updated) {
    onChange({ ...exercise, series: exercise.series.map(s => s.id === serieId ? updated : s) });
  }
  function deleteSerie(serieId) {
    if (exercise.series.length <= 1) { Alert.alert('', 'Necesitás al menos una serie'); return; }
    onChange({ ...exercise, series: exercise.series.filter(s => s.id !== serieId) });
  }
  function addSerie() {
    const last = exercise.series[exercise.series.length - 1];
    onChange({ ...exercise, series: [...exercise.series, makeSerie(last?.duration||30, last?.rest||15)] });
  }

  // Cambiar entre uniforme e individual
  function toggleUniform(val) {
    if (val) {
      // Pasar a uniforme: todas las series toman los valores de la primera
      const base = exercise.series[0] || makeSerie(30, 15);
      const count = exercise.series.length || 3;
      const newSeries = Array.from({ length: count }, () => ({ ...base, id: uuidv4() }));
      onChange({ ...exercise, uniform: true, seriesCount: count, series: newSeries });
    } else {
      onChange({ ...exercise, uniform: false });
    }
  }

  // Cambiar duración/descanso cuando es uniforme (actualiza todas las series)
  function updateUniform(field, value) {
    const newSeries = exercise.series.map(s => ({ ...s, [field]: value }));
    onChange({ ...exercise, series: newSeries });
  }

  // Cambiar cantidad de series en modo uniforme
  function updateSeriesCount(newCount) {
    const count = Math.max(1, Math.min(20, newCount));
    const base  = exercise.series[0] || makeSerie(30, 15);
    const newSeries = Array.from({ length: count }, (_, i) =>
      exercise.series[i] ? exercise.series[i] : { ...base, id: uuidv4() }
    );
    onChange({ ...exercise, seriesCount: count, series: newSeries });
  }

  const totalEx = exercise.series.reduce((a,s) => a + s.duration + s.rest, 0);

  return (
    <View style={[exStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header ejercicio */}
      <TouchableOpacity style={exStyles.header} onPress={() => setExpanded(p=>!p)} activeOpacity={0.7}>
        <View style={[exStyles.drag, { backgroundColor: 'rgba(232,181,0,0.12)' }]}>
          <Text style={{ color: colors.brand, fontSize:12 }}>☰</Text>
        </View>
        <View style={{ flex:1 }}>
          <TextInput
            value={exercise.name}
            onChangeText={v => onChange({ ...exercise, name: v })}
            style={[exStyles.nameInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder="Nombre del ejercicio"
            placeholderTextColor={colors.textLight}
            onPress={e => e.stopPropagation?.()}
          />
          <Text style={{ fontSize:10, color: colors.textSecondary, marginTop:3 }}>
            {exercise.series.length} serie{exercise.series.length!==1?'s':''} · ~{Math.round(totalEx/60)}min
          </Text>
        </View>
        <View style={{ flexDirection:'row', gap:4 }}>
          {!isFirst  && <TouchableOpacity style={[exStyles.iconBtn, { borderColor: colors.border }]} onPress={onMoveUp}><Text style={{ color: colors.textSecondary, fontSize:11 }}>▲</Text></TouchableOpacity>}
          {!isLast   && <TouchableOpacity style={[exStyles.iconBtn, { borderColor: colors.border }]} onPress={onMoveDown}><Text style={{ color: colors.textSecondary, fontSize:11 }}>▼</Text></TouchableOpacity>}
          <TouchableOpacity style={[exStyles.iconBtn, { borderColor:'rgba(239,68,68,0.3)', backgroundColor:'rgba(239,68,68,0.08)' }]} onPress={onDelete}><Text style={{ color:'#EF4444', fontSize:11 }}>🗑</Text></TouchableOpacity>
          <View style={[exStyles.iconBtn, { borderColor: colors.border }]}><Text style={{ color: colors.textSecondary, fontSize:11 }}>{expanded?'▲':'▼'}</Text></View>
        </View>
      </TouchableOpacity>

      {/* Series */}
      {expanded && (
        <View style={{ paddingTop:8 }}>

          {/* Toggle uniforme / individual */}
          <View style={[exStyles.toggleRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={{ fontSize:12, color: colors.textSecondary, flex:1 }}>Todas las series iguales</Text>
            <View style={{ flexDirection:'row', gap:0, borderRadius:8, overflow:'hidden', borderWidth:1, borderColor: colors.border }}>
              {[true, false].map(val => (
                <TouchableOpacity key={String(val)}
                  onPress={() => toggleUniform(val)}
                  style={{
                    paddingHorizontal:14, paddingVertical:6,
                    backgroundColor: uniform===val ? colors.brand : colors.card,
                  }}>
                  <Text style={{ fontSize:11, fontWeight:'800', color: uniform===val ? '#0A0A0A' : colors.textSecondary }}>
                    {val ? 'Sí' : 'No'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* MODO UNIFORME */}
          {uniform && (
            <View style={[exStyles.uniformBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {/* Cantidad de series */}
              <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 }}>
                <Text style={{ fontSize:12, color: colors.textSecondary, flex:1 }}>Cantidad de series</Text>
                <TouchableOpacity style={[srStyles.step, { borderColor: colors.border }]}
                  onPress={() => updateSeriesCount(seriesCount - 1)}>
                  <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>−</Text>
                </TouchableOpacity>
                <Text style={{ fontSize:20, fontWeight:'900', color: colors.brand, minWidth:28, textAlign:'center' }}>
                  {seriesCount}
                </Text>
                <TouchableOpacity style={[srStyles.step, { borderColor: colors.border }]}
                  onPress={() => updateSeriesCount(seriesCount + 1)}>
                  <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Duración y descanso únicos */}
              <View style={{ flexDirection:'row', gap:16 }}>
                <View style={{ flex:1, alignItems:'center' }}>
                  <Text style={{ fontSize:8, fontWeight:'800', color: colors.brand, letterSpacing:1, marginBottom:6 }}>DURACIÓN (s)</Text>
                  <View style={srStyles.controls}>
                    <TouchableOpacity style={[srStyles.step, { borderColor: colors.border }]}
                      onPress={() => updateUniform('duration', Math.max(5, templateSerie.duration - 5))}>
                      <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                      value={String(templateSerie.duration)}
                      onChangeText={v => updateUniform('duration', Math.max(5, parseInt(v)||5))}
                      keyboardType="numeric" maxLength={3}
                      style={[srStyles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card, width:56 }]}
                    />
                    <TouchableOpacity style={[srStyles.step, { borderColor: colors.border }]}
                      onPress={() => updateUniform('duration', Math.min(600, templateSerie.duration + 5))}>
                      <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ flex:1, alignItems:'center' }}>
                  <Text style={{ fontSize:8, fontWeight:'800', color:'#60A5FA', letterSpacing:1, marginBottom:6 }}>DESCANSO (s)</Text>
                  <View style={srStyles.controls}>
                    <TouchableOpacity style={[srStyles.step, { borderColor: colors.border }]}
                      onPress={() => updateUniform('rest', Math.max(0, templateSerie.rest - 5))}>
                      <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>−</Text>
                    </TouchableOpacity>
                    <TextInput
                      value={String(templateSerie.rest)}
                      onChangeText={v => updateUniform('rest', Math.max(0, parseInt(v)||0))}
                      keyboardType="numeric" maxLength={3}
                      style={[srStyles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card, width:56 }]}
                    />
                    <TouchableOpacity style={[srStyles.step, { borderColor: colors.border }]}
                      onPress={() => updateUniform('rest', Math.min(300, templateSerie.rest + 5))}>
                      <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={{ fontSize:11, color: colors.textSecondary, textAlign:'center', marginTop:10 }}>
                {seriesCount} serie{seriesCount!==1?'s':''} de {templateSerie.duration}s
                {templateSerie.rest > 0 ? ` · ${templateSerie.rest}s descanso c/u` : ' · sin descanso'}
              </Text>
            </View>
          )}

          {/* MODO INDIVIDUAL */}
          {!uniform && (
            <>
              <View style={{ flexDirection:'row', paddingHorizontal:4, marginBottom:4, marginTop:8 }}>
                <View style={{ width:26, marginRight:8 }} />
                <Text style={{ flex:1, fontSize:8, fontWeight:'800', color: colors.brand, textAlign:'center', letterSpacing:1 }}>DURACIÓN (s)</Text>
                <Text style={{ flex:1, fontSize:8, fontWeight:'800', color:'#60A5FA', textAlign:'center', letterSpacing:1 }}>DESCANSO (s)</Text>
                <View style={{ width:26 }} />
              </View>
              {exercise.series.map((serie, idx) => (
                <SerieRow
                  key={serie.id} serie={serie} index={idx} colors={colors}
                  canDelete={exercise.series.length > 1}
                  onChange={upd => updateSerie(serie.id, upd)}
                  onDelete={() => deleteSerie(serie.id)}
                />
              ))}
              <TouchableOpacity style={[exStyles.addSerie, { borderColor: colors.border }]} onPress={addSerie}>
                <Text style={{ color: colors.brand, fontWeight:'700', fontSize:13 }}>+ Agregar serie</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Descanso después de este ejercicio */}
          <View style={[exStyles.restAfterRow, { backgroundColor: colors.background, borderColor: 'rgba(167,139,250,0.3)' }]}>
            <Text style={{ fontSize:10, fontWeight:'800', color:'#A78BFA', letterSpacing:1 }}>DESCANSO TRAS ESTE EJERCICIO</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginTop:8 }}>
              <TouchableOpacity style={[srStyles.step, { borderColor: colors.border, width:30, height:30 }]}
                onPress={() => onChange({ ...exercise, restAfter: Math.max(0, (exercise.restAfter||0) - 5) })}>
                <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>−</Text>
              </TouchableOpacity>
              <TextInput
                value={String(exercise.restAfter ?? 60)}
                onChangeText={v => onChange({ ...exercise, restAfter: Math.max(0, parseInt(v)||0) })}
                keyboardType="numeric" maxLength={3}
                style={[srStyles.input, { color: '#A78BFA', borderColor: 'rgba(167,139,250,0.4)', backgroundColor: colors.card, width:52 }]}
              />
              <TouchableOpacity style={[srStyles.step, { borderColor: colors.border, width:30, height:30 }]}
                onPress={() => onChange({ ...exercise, restAfter: Math.min(300, (exercise.restAfter||0) + 5) })}>
                <Text style={{ color: colors.textPrimary, fontWeight:'800' }}>+</Text>
              </TouchableOpacity>
              <Text style={{ fontSize:12, color: colors.textSecondary }}>segundos</Text>
              {(exercise.restAfter||0) === 0 && (
                <Text style={{ fontSize:11, color: '#A78BFA', fontWeight:'700' }}>sin descanso</Text>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const exStyles = StyleSheet.create({
  card:      { borderRadius:14, padding:12, borderWidth:1, marginBottom:10 },
  header:    { flexDirection:'row', alignItems:'center', gap:8 },
  drag:      { width:30, height:30, borderRadius:9, justifyContent:'center', alignItems:'center', flexShrink:0 },
  nameInput: { borderWidth:1, borderRadius:10, padding:9, fontSize:14, fontWeight:'700', flex:1 },
  iconBtn:   { width:28, height:28, borderRadius:8, borderWidth:1, justifyContent:'center', alignItems:'center' },
  addSerie:     { borderRadius:10, borderWidth:1, borderStyle:'dashed', padding:10, alignItems:'center', marginTop:4 },
  restAfterRow: { borderRadius:10, borderWidth:1, padding:12, marginTop:8, alignItems:'center' },
  toggleRow:    { flexDirection:'row', alignItems:'center', borderRadius:10, borderWidth:1, padding:10, marginBottom:8 },
  uniformBox:   { borderRadius:10, borderWidth:1, padding:14, marginBottom:8 },
});

// ── Ejecución del circuito ────────────────────────────────────────────────────
function RunCircuit({ exercises, globalRest, onFinish, colors }) {
  const [phase, setPhase]           = useState('countdown');
  const [countdown, setCountdown]   = useState(3);
  const [exIdx, setExIdx]           = useState(0);
  const [serieIdx, setSerieIdx]     = useState(0);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [paused, setPaused]         = useState(false);
  const timerRef   = useRef(null);
  const elapsedRef = useRef(null);

  const currentEx    = exercises[exIdx];
  const currentSerie = currentEx?.series[serieIdx];

  useEffect(() => {
    elapsedRef.current = setInterval(() => setTotalElapsed(p => p + 1), 1000);
    timerRef.current = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { clearInterval(timerRef.current); startPhase('work', exercises[0].series[0].duration); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => { clearInterval(timerRef.current); clearInterval(elapsedRef.current); };
  }, []);

  function startPhase(newPhase, duration) {
    setPhase(newPhase);
    setTimeLeft(duration);
    Vibration.vibrate(newPhase === 'work' ? 150 : [0,100,100,100]);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current); advancePhase(newPhase); return 0; }
        return p - 1;
      });
    }, 1000);
  }

  function advancePhase(currentPhase) {
    // Estado actual a través de refs para evitar stale closures
    setExIdx(curEx => {
      setSerieIdx(curSerie => {
        const ex    = exercises[curEx];
        const serie = ex.series[curSerie];

        if (currentPhase === 'work') {
          // Termina trabajo → descanso de esta serie
          if (serie.rest > 0) {
            startPhase('rest', serie.rest);
          } else {
            advanceSerie(curEx, curSerie);
          }
        } else if (currentPhase === 'rest') {
          advanceSerie(curEx, curSerie);
        } else if (currentPhase === 'global_rest') {
          const nextEx = curEx + 1;
          if (nextEx < exercises.length) {
            setExIdx(nextEx);
            setSerieIdx(0);
            startPhase('work', exercises[nextEx].series[0].duration);
          }
        }
        return curSerie;
      });
      return curEx;
    });
  }

  function advanceSerie(curEx, curSerie) {
    const ex = exercises[curEx];
    const nextSerie = curSerie + 1;
    if (nextSerie < ex.series.length) {
      // Siguiente serie del mismo ejercicio
      setSerieIdx(nextSerie);
      startPhase('work', ex.series[nextSerie].duration);
    } else {
      // Terminó todas las series de este ejercicio
      const nextEx = curEx + 1;
      if (nextEx < exercises.length) {
        // Usar el restAfter del ejercicio actual (individual)
        const restAfter = ex.restAfter ?? globalRest;
        if (restAfter > 0) {
          startPhase('global_rest', restAfter);
          setTimeout(() => { setExIdx(nextEx); setSerieIdx(0); }, restAfter * 1000 + 100);
        } else {
          setExIdx(nextEx);
          setSerieIdx(0);
          startPhase('work', exercises[nextEx].series[0].duration);
        }
      } else {
        // Terminó todo
        setPhase('done');
        clearInterval(elapsedRef.current);
        Vibration.vibrate([0,300,200,300,200,300]);
      }
    }
  }

  function togglePause() {
    if (paused) {
      setPaused(false);
      elapsedRef.current = setInterval(() => setTotalElapsed(p => p + 1), 1000);
      timerRef.current = setInterval(() => {
        setTimeLeft(p => {
          if (p <= 1) { clearInterval(timerRef.current); advancePhase(phase); return 0; }
          return p - 1;
        });
      }, 1000);
    } else {
      setPaused(true);
      clearInterval(timerRef.current);
      clearInterval(elapsedRef.current);
    }
  }

  const phaseCfg = {
    countdown:   { label:'PREPARATE',   color:'#E8B500', bg:'rgba(232,181,0,0.12)' },
    work:        { label:'¡TRABAJÁ!',   color:'#22C55E', bg:'rgba(34,197,94,0.12)' },
    rest:        { label:'DESCANSO',    color:'#60A5FA', bg:'rgba(96,165,250,0.12)' },
    global_rest: { label:'CAMBIO',      color:'#A78BFA', bg:'rgba(167,139,250,0.12)' },
    done:        { label:'¡LISTO!',     color:'#E8B500', bg:'rgba(232,181,0,0.12)' },
  };
  const cfg = phaseCfg[phase] || phaseCfg.work;

  const totalSeries = exercises.reduce((a,e) => a + e.series.length, 0);
  const doneSeries  = exercises.slice(0,exIdx).reduce((a,e) => a + e.series.length, 0) + serieIdx;
  const progress    = totalSeries > 0 ? doneSeries / totalSeries : 0;

  return (
    <View style={{ flex:1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      <View style={{ height:4, backgroundColor: colors.border }}>
        <View style={{ height:4, width:`${progress*100}%`, backgroundColor: colors.brand }} />
      </View>

      <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:24, gap:20 }}>
        {phase === 'countdown' ? (
          <>
            <Text style={{ fontSize:90, fontWeight:'900', color: colors.brand }}>{countdown}</Text>
            <Text style={{ fontSize:16, color: colors.textSecondary }}>Preparate para</Text>
            <Text style={{ fontSize:22, fontWeight:'900', color: colors.textPrimary }}>{exercises[0]?.name}</Text>
          </>
        ) : phase === 'done' ? (
          <>
            <Text style={{ fontSize:52 }}>🏆</Text>
            <Text style={{ fontSize:28, fontWeight:'900', color: colors.brand }}>¡Circuito completo!</Text>
            <View style={{ padding:24, borderRadius:16, backgroundColor: colors.card, borderWidth:1, borderColor: colors.border, width:'100%', alignItems:'center' }}>
              <Text style={{ fontSize:13, color: colors.textSecondary }}>Tiempo total</Text>
              <Text style={{ fontSize:40, fontWeight:'900', color: colors.brand, marginTop:4 }}>{formatTime(totalElapsed)}</Text>
            </View>
            <TouchableOpacity style={{ borderRadius:14, padding:16, backgroundColor: colors.brand, width:'100%', alignItems:'center' }} onPress={onFinish}>
              <Text style={{ color:'#0A0A0A', fontWeight:'900', fontSize:16 }}>✓ Volver</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[runStyles.phaseBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[runStyles.phaseText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>

            <Text style={[runStyles.exName, { color: colors.textPrimary }]}>
              {phase === 'global_rest' ? `Siguiente: ${exercises[exIdx]?.name}` : currentEx?.name}
            </Text>

            {phase === 'work' && (
              <Text style={{ fontSize:14, color: colors.textSecondary }}>
                Serie {serieIdx + 1} de {currentEx?.series.length}
              </Text>
            )}

            <View style={[runStyles.timerWrap, { borderColor: cfg.color+'55', backgroundColor: cfg.bg }]}>
              <Text style={[runStyles.timerText, { color: cfg.color }]}>{formatTime(timeLeft)}</Text>
              {phase === 'work' && currentSerie?.rest > 0 && (
                <Text style={{ fontSize:10, color: colors.textSecondary, marginTop:4 }}>
                  Luego {currentSerie.rest}s descanso
                </Text>
              )}
            </View>

            <Text style={{ fontSize:12, color: colors.textSecondary }}>
              Ej. {exIdx + 1}/{exercises.length} · Tiempo: {formatTime(totalElapsed)}
            </Text>

            {/* Próximo ejercicio */}
            {(phase === 'global_rest' || (exIdx < exercises.length - 1 && serieIdx === currentEx?.series.length - 1)) && (
              <View style={{ padding:12, borderRadius:12, backgroundColor: colors.card, borderWidth:1, borderColor: colors.border, width:'100%', alignItems:'center' }}>
                <Text style={{ fontSize:10, color: colors.textSecondary }}>SIGUIENTE EJERCICIO</Text>
                <Text style={{ fontSize:16, fontWeight:'800', color: colors.textPrimary, marginTop:3 }}>
                  {exercises[exIdx + 1]?.name}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={{ borderRadius:12, paddingHorizontal:32, paddingVertical:13, borderWidth:1, borderColor: colors.border, backgroundColor: colors.card }}
              onPress={togglePause}
            >
              <Text style={{ color: colors.textPrimary, fontWeight:'700', fontSize:15 }}>
                {paused ? '▶ Continuar' : '⏸ Pausar'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const runStyles = StyleSheet.create({
  phaseBadge: { paddingHorizontal:24, paddingVertical:10, borderRadius:20 },
  phaseText:  { fontSize:15, fontWeight:'800', letterSpacing:2 },
  exName:     { fontSize:28, fontWeight:'900', textAlign:'center', letterSpacing:-0.5 },
  timerWrap:  { width:200, height:200, borderRadius:100, borderWidth:4, justifyContent:'center', alignItems:'center' },
  timerText:  { fontSize:52, fontWeight:'900', letterSpacing:-2 },
});

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function CardioTimerScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [exercises, setExercises]   = useState(DEFAULT_EXERCISES);
  const [globalRest, setGlobalRest] = useState(60);
  const [running, setRunning]       = useState(false);

  const totalTime = exercises.reduce((a,ex,i) =>
    a + ex.series.reduce((b,s) => b + s.duration + s.rest, 0)
    + (i < exercises.length - 1 ? (ex.restAfter ?? globalRest) : 0), 0);

  function addExercise() {
    setExercises(p => [...p, makeExercise(`Ejercicio ${p.length + 1}`)]);
  }
  function updateExercise(id, upd) {
    setExercises(p => p.map(e => e.id === id ? upd : e));
  }
  function deleteExercise(id) {
    if (exercises.length <= 1) { Alert.alert('', 'Necesitás al menos un ejercicio'); return; }
    setExercises(p => p.filter(e => e.id !== id));
  }
  function moveUp(idx)   { setExercises(p => { const a=[...p]; [a[idx-1],a[idx]]=[a[idx],a[idx-1]]; return a; }); }
  function moveDown(idx) { setExercises(p => { const a=[...p]; [a[idx],a[idx+1]]=[a[idx+1],a[idx]]; return a; }); }

  if (running) {
    return <RunCircuit exercises={exercises} globalRest={globalRest} colors={colors} onFinish={() => setRunning(false)} />;
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding:4 }}>
          <Text style={{ color: colors.brand, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={[s.title, { color: colors.textPrimary }]}>Circuito cardio</Text>
          <Text style={{ fontSize:12, color: colors.textSecondary }}>
            ~{Math.round(totalTime/60)} min · {exercises.length} ejercicio{exercises.length!==1?'s':''}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding:16, paddingBottom:140 }}>
        {/* Info descanso entre ejercicios */}
        <View style={[s.globalRestCard, { backgroundColor:'rgba(167,139,250,0.08)', borderColor:'rgba(167,139,250,0.25)' }]}>
          <Text style={[s.sectionLbl, { color:'#A78BFA' }]}>DESCANSO ENTRE EJERCICIOS</Text>
          <Text style={{ fontSize:12, color: colors.textSecondary, marginTop:6 }}>
            Configurá el descanso de cada ejercicio al final de su lista de series 👇
          </Text>
        </View>

        <Text style={[s.sectionLbl, { color: colors.brand, marginBottom:10, marginTop:4 }]}>EJERCICIOS</Text>
        {exercises.map((ex, idx) => (
          <ExerciseEditor
            key={ex.id} exercise={ex} colors={colors}
            onChange={upd => updateExercise(ex.id, upd)}
            onDelete={() => deleteExercise(ex.id)}
            onMoveUp={() => moveUp(idx)} onMoveDown={() => moveDown(idx)}
            isFirst={idx===0} isLast={idx===exercises.length-1}
          />
        ))}

        <TouchableOpacity style={[s.addBtn, { borderColor: colors.border }]} onPress={addExercise}>
          <Text style={{ color: colors.brand, fontWeight:'800', fontSize:15 }}>+ Agregar ejercicio</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[s.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View style={[s.summaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label:'Ejercicios', val: exercises.length },
            { label:'Series',     val: exercises.reduce((a,e)=>a+e.series.length,0) },
            { label:'~Tiempo',    val: `${Math.round(totalTime/60)}min` },
          ].map((item,i) => (
            <View key={i} style={{ alignItems:'center', flex:1 }}>
              <Text style={{ fontSize:18, fontWeight:'900', color: colors.brand }}>{item.val}</Text>
              <Text style={{ fontSize:10, color: colors.textSecondary, marginTop:2 }}>{item.label}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={[s.startBtn, { backgroundColor: colors.brand }]} onPress={() => {
          if (exercises.every(e => e.name.trim())) setRunning(true);
          else Alert.alert('', 'Todos los ejercicios deben tener nombre');
        }}>
          <Text style={{ color:'#0A0A0A', fontWeight:'900', fontSize:17 }}>▶ Comenzar circuito</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container:     { flex:1, backgroundColor: colors.background },
  header:        { paddingTop: Platform.OS==='ios'?50:30, paddingBottom:14, paddingHorizontal:16, borderBottomWidth:0.5, flexDirection:'row', alignItems:'center', gap:12 },
  title:         { fontSize:20, fontWeight:'900' },
  globalRestCard:{ borderRadius:14, padding:14, borderWidth:1, marginBottom:16 },
  sectionLbl:    { fontSize:10, fontWeight:'800', letterSpacing:1.5 },
  stepper:       { width:46, height:46, borderRadius:13, borderWidth:1, justifyContent:'center', alignItems:'center' },
  addBtn:        { borderRadius:14, borderWidth:1.5, borderStyle:'dashed', padding:14, alignItems:'center', marginTop:4 },
  footer:        { padding:16, paddingBottom: Platform.OS==='ios'?32:16, borderTopWidth:0.5 },
  summaryRow:    { flexDirection:'row', borderRadius:12, padding:12, borderWidth:0.5, marginBottom:12 },
  startBtn:      { borderRadius:14, padding:17, alignItems:'center', shadowColor:'#E8B500', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:10, elevation:6 },
});