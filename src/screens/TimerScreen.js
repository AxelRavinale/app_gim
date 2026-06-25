import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Vibration, Platform, StatusBar } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';

const MODES = { STOPWATCH: 'stopwatch', COUNTDOWN: 'countdown', INTERVALS: 'intervals' };
const COUNTDOWN_PRESETS = [{ label: '30s', seconds: 30 },{ label: '60s', seconds: 60 },{ label: '90s', seconds: 90 },{ label: '2min', seconds: 120 },{ label: '3min', seconds: 180 },{ label: '5min', seconds: 300 }];

function formatTime(totalSeconds) {
  const m = Math.floor(Math.abs(totalSeconds)/60).toString().padStart(2,'0');
  const s = (Math.abs(totalSeconds)%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

async function buzz(heavy = false) {
  try {
    if (heavy) { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Vibration.vibrate(Platform.OS==='android'?[0,200,100,200]:400); }
    else { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
  } catch {}
}

export default function TimerScreen() {
  const { colors, isDark } = useTheme();
  const s = makeStyles(colors);
  const [mode, setMode] = useState(MODES.STOPWATCH);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={s.header}>
        <Text style={s.gymName}>GYMTRACKER</Text>
        <Text style={s.title}>Cronómetro</Text>
      </View>

      {/* Selector de modo */}
      <View style={s.modeRow}>
        {[
          { id: MODES.STOPWATCH, label: '⏱', sublabel: 'Cronómetro' },
          { id: MODES.COUNTDOWN, label: '⏳', sublabel: 'Regresiva' },
          { id: MODES.INTERVALS, label: '🔄', sublabel: 'Intervalos' },
        ].map(m => (
          <TouchableOpacity
            key={m.id}
            style={[s.modeBtn, mode === m.id && { backgroundColor: colors.brand, borderColor: colors.brand }]}
            onPress={() => setMode(m.id)}
          >
            <Text style={s.modeBtnIcon}>{m.label}</Text>
            <Text style={[s.modeBtnLabel, mode === m.id && { color: colors.textOnBrand, fontWeight: '700' }]}>{m.sublabel}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.content}>
        {mode === MODES.STOPWATCH  && <StopwatchMode  colors={colors} s={s} />}
        {mode === MODES.COUNTDOWN  && <CountdownMode  colors={colors} s={s} />}
        {mode === MODES.INTERVALS  && <IntervalsMode  colors={colors} s={s} />}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StopwatchMode({ colors, s }) {
  const [time, setTime]       = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps]       = useState([]);
  const intervalRef           = useRef(null);

  useEffect(() => {
    if (running) { intervalRef.current = setInterval(() => setTime(t => t+1), 1000); }
    else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  return (
    <View>
      <BigDisplay time={formatTime(time)} color={running ? colors.brand : colors.textPrimary} sub={running ? 'corriendo...' : time > 0 ? 'pausado' : 'listo'} colors={colors} />
      <View style={s.controlsRow}>
        <CtrlBtn label="🏁 Vuelta" onPress={() => { if (running) { buzz(); setLaps(p => [{ id: Date.now(), time }, ...p]); } }} colors={colors} />
        <MainBtn label={running ? '⏸ Pausar' : time > 0 ? '▶ Continuar' : '▶ Iniciar'} color={running ? colors.danger : colors.success} onPress={() => { setRunning(r => !r); buzz(); }} />
        <CtrlBtn label="↺ Reset" onPress={() => { setRunning(false); setTime(0); setLaps([]); }} colors={colors} />
      </View>
      {laps.length > 0 && (
        <View style={s.lapsBox}>
          <Text style={s.lapsTitle}>VUELTAS</Text>
          {laps.map((lap, i) => (
            <View key={lap.id} style={[s.lapRow, { borderBottomColor: colors.border }]}>
              <Text style={s.lapNum}>Vuelta {laps.length - i}</Text>
              <Text style={s.lapTime}>{formatTime(lap.time)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function CountdownMode({ colors, s }) {
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [remaining, setRemaining]       = useState(60);
  const [running, setRunning]           = useState(false);
  const [finished, setFinished]         = useState(false);
  const [customInput, setCustomInput]   = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { clearInterval(intervalRef.current); setRunning(false); setFinished(true); buzz(true); return 0; }
          if (r <= 4) buzz(false);
          return r - 1;
        });
      }, 1000);
    } else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function selectPreset(seconds) { setTotalSeconds(seconds); setRemaining(seconds); setRunning(false); setFinished(false); }
  function handleReset() { setRunning(false); setFinished(false); setRemaining(totalSeconds); }

  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const pColor = progress > 0.5 ? colors.success : progress > 0.25 ? colors.warning : colors.danger;

  return (
    <View>
      <View style={s.presetsRow}>
        {COUNTDOWN_PRESETS.map(p => (
          <TouchableOpacity key={p.seconds} style={[s.presetBtn, totalSeconds===p.seconds && !running && { backgroundColor: colors.brand, borderColor: colors.brand }]} onPress={() => selectPreset(p.seconds)}>
            <Text style={[s.presetBtnText, totalSeconds===p.seconds && { color: colors.textOnBrand }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.customRow}>
        <TextInput style={s.customInput} value={customInput} onChangeText={setCustomInput} placeholder="seg. custom" placeholderTextColor={colors.textLight} keyboardType="numeric" />
        <TouchableOpacity style={s.customApplyBtn} onPress={() => { const v=parseInt(customInput); if (!isNaN(v)&&v>0) { selectPreset(v); setCustomInput(''); } }}>
          <Text style={s.customApplyText}>Aplicar</Text>
        </TouchableOpacity>
      </View>
      <BigDisplay
        time={finished ? '¡Listo!' : formatTime(remaining)}
        color={finished ? colors.success : pColor}
        sub={finished ? '💪 Tiempo completado' : running ? 'corriendo...' : 'listo'}
        colors={colors}
        progress={progress}
        progressColor={pColor}
      />
      <View style={s.controlsRow}>
        <CtrlBtn label="↺ Reset" onPress={handleReset} colors={colors} />
        <MainBtn
          label={finished ? '↺ Repetir' : running ? '⏸ Pausar' : remaining < totalSeconds ? '▶ Continuar' : '▶ Iniciar'}
          color={running ? colors.warning : colors.success}
          onPress={() => { if (finished) handleReset(); else { setRunning(r => !r); buzz(); } }}
        />
        <View style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function IntervalsMode({ colors, s }) {
  const [totalSeries,   setTotalSeries]   = useState(3);
  const [workTime,      setWorkTime]      = useState(40);
  const [restTime,      setRestTime]      = useState(20);
  const [useCustom,     setUseCustom]     = useState(false);
  const [customIntervals, setCustomIntervals] = useState([]);
  const [isRunning,     setIsRunning]     = useState(false);
  const [phase,         setPhase]         = useState('idle');
  const [currentSerie,  setCurrentSerie]  = useState(1);
  const [remaining,     setRemaining]     = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    setCustomIntervals(Array.from({ length: totalSeries }, (_, i) => customIntervals[i] || { work: workTime, rest: restTime }));
  }, [totalSeries]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!isRunning || phase === 'idle' || phase === 'done') return;
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current); handlePhaseEnd(); return 0; }
        if (r <= 4) buzz(false);
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase, currentSerie]);

  function getCurrentTimes() {
    const idx = currentSerie - 1;
    if (useCustom && customIntervals[idx]) return { work: customIntervals[idx].work, rest: customIntervals[idx].rest };
    return { work: workTime, rest: restTime };
  }

  function handlePhaseEnd() {
    const { work, rest } = getCurrentTimes();
    if (phase === 'work') {
      if (currentSerie >= totalSeries) { setPhase('done'); setIsRunning(false); buzz(true); }
      else { setPhase('rest'); setRemaining(rest); buzz(true); setIsRunning(true); }
    } else if (phase === 'rest') {
      const next = currentSerie + 1;
      setCurrentSerie(next);
      const nextT = useCustom && customIntervals[next-1] ? customIntervals[next-1] : { work: workTime, rest: restTime };
      setPhase('work'); setRemaining(nextT.work); buzz(true); setIsRunning(true);
    }
  }

  function handleStart() {
    const { work } = getCurrentTimes();
    setCurrentSerie(1); setPhase('work'); setRemaining(work); setIsRunning(true); buzz();
  }

  function handleReset() { setIsRunning(false); setPhase('idle'); setCurrentSerie(1); setRemaining(0); }

  const phaseColor = phase === 'work' ? colors.success : phase === 'rest' ? colors.brand : phase === 'done' ? colors.warning : colors.textSecondary;
  const phaseLabel = phase === 'work' ? '💪 TRABAJANDO' : phase === 'rest' ? '😮‍💨 DESCANSO' : phase === 'done' ? '🏆 ¡COMPLETADO!' : '';

  return (
    <View>
      <View style={s.intervalsConfig}>
        <Text style={s.configSectionTitle}>CONFIGURACIÓN</Text>
        <View style={s.configRow}>
          <ConfigField label="Series" value={totalSeries.toString()} onChange={v => setTotalSeries(parseInt(v)||1)} colors={colors} />
          <ConfigField label="Trabajo (s)" value={workTime.toString()} onChange={v => setWorkTime(parseInt(v)||0)} colors={colors} />
          <ConfigField label="Descanso (s)" value={restTime.toString()} onChange={v => setRestTime(parseInt(v)||0)} colors={colors} />
        </View>
        <TouchableOpacity style={[s.customToggle, useCustom && { borderColor: colors.brand, backgroundColor: colors.brandLight }]} onPress={() => setUseCustom(u => !u)}>
          <Text style={[s.customToggleText, { color: useCustom ? colors.brand : colors.textSecondary }]}>
            {useCustom ? '✓ Tiempos individuales activados' : '⚙ Personalizar cada serie'}
          </Text>
        </TouchableOpacity>
        {useCustom && (
          <View style={s.customIntervalsBox}>
            {customIntervals.map((interval, i) => (
              <View key={i} style={[s.customIntervalRow, { borderBottomColor: colors.border }]}>
                <Text style={[s.customIntervalLabel, { color: colors.textPrimary }]}>Serie {i+1}</Text>
                <ConfigField label="Trabajo" value={interval.work.toString()} onChange={v => setCustomIntervals(p => p.map((it,idx) => idx===i ? {...it,work:parseInt(v)||0} : it))} colors={colors} small />
                <ConfigField label="Descanso" value={interval.rest.toString()} onChange={v => setCustomIntervals(p => p.map((it,idx) => idx===i ? {...it,rest:parseInt(v)||0} : it))} colors={colors} small />
              </View>
            ))}
          </View>
        )}
      </View>

      {phase !== 'idle' && (
        <>
          <BigDisplay time={phase==='done'?'🏆':formatTime(remaining)} color={phaseColor} sub={phaseLabel} colors={colors} />
          {phase !== 'done' && (
            <View style={s.seriesDots}>
              {Array.from({ length: totalSeries }, (_, i) => (
                <View key={i} style={[s.serieDot, { backgroundColor: i < currentSerie-1 ? colors.success : i === currentSerie-1 ? phaseColor : colors.border, width: i === currentSerie-1 ? 24 : 10 }]} />
              ))}
            </View>
          )}
        </>
      )}

      <View style={s.controlsRow}>
        {phase !== 'idle' && <CtrlBtn label="↺ Reset" onPress={handleReset} colors={colors} />}
        {phase === 'idle' || phase === 'done'
          ? <MainBtn label={phase==='done'?'↺ Repetir':'▶ Iniciar'} color={colors.success} onPress={handleStart} full={phase==='idle'} />
          : <MainBtn label={isRunning?'⏸ Pausar':'▶ Continuar'} color={isRunning?colors.warning:colors.success} onPress={() => { setIsRunning(r=>!r); buzz(); }} />
        }
        {(phase!=='idle'&&phase!=='done') && (
          <CtrlBtn label="⏭ Saltar" onPress={() => { clearInterval(intervalRef.current); handlePhaseEnd(); }} colors={colors} />
        )}
      </View>
    </View>
  );
}

// Sub-componentes
function BigDisplay({ time, color, sub, colors, progress, progressColor }) {
  return (
    <View style={[bigDisplayStyles.container, { backgroundColor: colors.cardAlt }]}>
      <Text style={[bigDisplayStyles.time, { color }]}>{time}</Text>
      {progress !== undefined && (
        <View style={[bigDisplayStyles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[bigDisplayStyles.progressFill, { width: `${progress*100}%`, backgroundColor: progressColor }]} />
        </View>
      )}
      <Text style={[bigDisplayStyles.sub, { color: colors.textSecondary }]}>{sub}</Text>
    </View>
  );
}
const bigDisplayStyles = StyleSheet.create({
  container: { borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 20 },
  time: { fontSize: 72, fontWeight: '900', letterSpacing: -3, lineHeight: 80 },
  progressBar: { width: '80%', height: 5, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  sub: { fontSize: 13, marginTop: 8 },
});

function MainBtn({ label, color, onPress, full }) {
  return (
    <TouchableOpacity
      style={[{ flex: full ? 1 : 2, paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: color, elevation: 3 }]}
      onPress={onPress}
    >
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function CtrlBtn({ label, onPress, colors }) {
  return (
    <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardAlt, alignItems: 'center' }} onPress={onPress}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ConfigField({ label, value, onChange, colors, small }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 9, color: colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' }}>{label}</Text>
      <TextInput style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: small ? 6 : 10, fontSize: small ? 14 : 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', width: '100%' }} value={value} onChangeText={onChange} keyboardType="numeric" selectTextOnFocus />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.card, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  gymName: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  modeRow: { flexDirection: 'row', gap: 8, padding: 16 },
  modeBtn: { flex: 1, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', paddingVertical: 12 },
  modeBtnIcon: { fontSize: 22, marginBottom: 4 },
  modeBtnLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  content: { paddingHorizontal: 16 },
  controlsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  presetBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  presetBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  customRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  customInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.cardAlt },
  customApplyBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.brandLight, borderWidth: 1, borderColor: colors.brand, justifyContent: 'center' },
  customApplyText: { fontSize: 13, fontWeight: '700', color: colors.brand },
  lapsBox: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: colors.border },
  lapsTitle: { fontSize: 11, fontWeight: '800', color: colors.brand, letterSpacing: 1.5, marginBottom: 10 },
  lapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5 },
  lapNum: { fontSize: 13, color: colors.textSecondary },
  lapTime: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  intervalsConfig: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 0.5, borderColor: colors.border },
  configSectionTitle: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 1.5, marginBottom: 12 },
  configRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  customToggle: { padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', marginBottom: 12 },
  customToggleText: { fontSize: 13, fontWeight: '600' },
  customIntervalsBox: { backgroundColor: colors.cardAlt, borderRadius: 12, padding: 10 },
  customIntervalRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5 },
  customIntervalLabel: { fontSize: 13, fontWeight: '600', width: 60 },
  seriesDots: { flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  serieDot: { height: 8, borderRadius: 4, backgroundColor: colors.border },
});