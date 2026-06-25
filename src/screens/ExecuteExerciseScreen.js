import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, StatusBar, Alert, Platform,
  ActivityIndicator, Vibration, Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Video } from 'expo-av';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/ThemeContext';
import { getExerciseAnimation } from '../constants/exerciseAnimations';
import { addWeightSession, addTimeSession } from '../storage/exercises';

const DEFAULT_REST_SECONDS = 90;

async function buzz(heavy = false) {
  try {
    if (heavy) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate(Platform.OS === 'android' ? [0, 200, 100, 200] : 400);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch {}
}

function formatTime(secs) {
  const m = Math.floor(Math.abs(secs) / 60).toString().padStart(2, '0');
  const s = (Math.abs(secs) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function svgHtml(svg) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html,body { background:#0A0A0A; width:100%; height:100%;
  display:flex; justify-content:center; align-items:center; overflow:hidden; }
svg { display:block; }
</style>
</head>
<body>${svg}</body>
</html>`;
}

// ── Media del ejercicio: animación / video / YouTube ──────────────────────────
function ExerciseMedia({ exercise, colors }) {
  const [activeTab, setActiveTab] = useState('animation');
  const svgContent = getExerciseAnimation(exercise);
  const hasVideo   = !!exercise.videoLocal;
  const hasYoutube = !!exercise.videoUrl;

  const tabs = [
    { id: 'animation', label: '🎬 Animación' },
    hasVideo   && { id: 'video',   label: '📹 Video' },
    hasYoutube && { id: 'youtube', label: '▶ YouTube' },
  ].filter(Boolean);

  return (
    <View style={{ backgroundColor: colors.card, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
      {/* Tabs — solo si hay más de una opción */}
      {tabs.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
          {tabs.map(tab => (
            <TouchableOpacity key={tab.id}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5,
                borderColor: activeTab === tab.id ? colors.brand : colors.border,
                backgroundColor: activeTab === tab.id ? colors.brandLight : colors.cardAlt,
              }}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={{ fontSize: 12, fontWeight: '700',
                color: activeTab === tab.id ? colors.brand : colors.textSecondary }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Contenido */}
      <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
        {activeTab === 'animation' && (
          <WebView
            source={{ html: svgHtml(svgContent) }}
            style={{ width: 220, height: 220, backgroundColor: '#0A0A0A' }}
            scrollEnabled={false}
            originWhitelist={['*']}
            mixedContentMode="always"
            javaScriptEnabled={true}
          />
        )}

        {activeTab === 'video' && hasVideo && (
          <Video
            source={{ uri: exercise.videoLocal }}
            style={{ width: '100%', height: 220 }}
            useNativeControls
            resizeMode="contain"
            shouldPlay={false}
          />
        )}

        {activeTab === 'youtube' && hasYoutube && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text style={{ fontSize: 36, marginBottom: 14 }}>▶️</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 15, marginBottom: 6, textAlign: 'center' }}>
              Ver en YouTube
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 20, textAlign: 'center' }} numberOfLines={2}>
              {exercise.videoUrl}
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: colors.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              onPress={() => Linking.openURL(exercise.videoUrl)}
            >
              <Text style={{ color: colors.textOnBrand, fontWeight: '800', fontSize: 14 }}>Abrir YouTube →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Timer de descanso fullscreen ──────────────────────────────────────────────
function RestTimer({ seconds, onDone, colors }) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused]       = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (paused) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current); buzz(true); setTimeout(onDone, 300); return 0; }
        if (r <= 4) buzz(false);
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused]);

  const progress = remaining / seconds;
  const progressColor = progress > 0.5 ? colors.success : progress > 0.25 ? colors.warning : colors.danger;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
      <StatusBar barStyle="light-content" />
      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 8 }}>DESCANSO</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 40 }}>Preparate para la próxima serie</Text>

      <View style={{ width: 200, height: 200, justifyContent: 'center', alignItems: 'center', marginBottom: 40 }}>
        <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 5, borderColor: colors.border }} />
        <View style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 5, borderColor: progressColor, borderTopColor: 'transparent', transform: [{ rotate: '-90deg' }] }} />
        <Text style={{ fontSize: 64, fontWeight: '900', color: progressColor, letterSpacing: -3 }}>{formatTime(remaining)}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {[-15, 15, 30].map(secs => (
          <TouchableOpacity key={secs}
            style={{ paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}
            onPress={() => { setRemaining(r => Math.max(0, r + secs)); buzz(); }}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>{secs > 0 ? '+' : ''}{secs}s</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
        <TouchableOpacity
          style={{ flex: 1, paddingVertical: 15, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' }}
          onPress={() => setPaused(p => !p)}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 14 }}>{paused ? '▶ Continuar' : '⏸ Pausar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 2, paddingVertical: 15, borderRadius: 13, backgroundColor: colors.brand, alignItems: 'center' }}
          onPress={() => { clearInterval(intervalRef.current); buzz(); onDone(); }}
        >
          <Text style={{ color: colors.textOnBrand, fontWeight: '900', fontSize: 14 }}>⏭ Saltar descanso</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function ExecuteExerciseScreen({ route, navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const { exercise } = route.params;

  const isCardio = exercise.trackingType === 'time';

  const [series, setSeries] = useState(
    [1, 2, 3].map(n => ({ id: n, weight: '', reps: '', done: false }))
  );
  const [currentSerie, setCurrentSerie] = useState(0);
  const [showRest, setShowRest]         = useState(false);
  const [restSeconds, setRestSeconds]   = useState(DEFAULT_REST_SECONDS);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);

  const [cardioRunning, setCardioRunning] = useState(false);
  const [cardioTime, setCardioTime]       = useState(0);
  const [cardioDistance, setCardioDistance] = useState('');
  const cardioIntervalRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: exercise.name, headerShown: true });
  }, []);

  useEffect(() => {
    if (cardioRunning) {
      cardioIntervalRef.current = setInterval(() => setCardioTime(t => t + 1), 1000);
    } else {
      clearInterval(cardioIntervalRef.current);
    }
    return () => clearInterval(cardioIntervalRef.current);
  }, [cardioRunning]);

  function updateSerie(index, field, value) {
    setSeries(p => p.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function markSerieDone(index) {
    setSeries(p => p.map((s, i) => i === index ? { ...s, done: true } : s));
    buzz();
    if (index < series.length - 1) setCurrentSerie(index + 1);
    setShowRest(true);
  }

  function addSerie() {
    setSeries(p => [...p, { id: p.length + 1, weight: p[p.length - 1]?.weight || '', reps: p[p.length - 1]?.reps || '', done: false }]);
  }

  async function handleSaveWeight() {
    const doneSeries = series.filter(s => s.done || (s.weight && s.reps));
    if (doneSeries.length === 0) return;
    setSaving(true);
    try {
      await addWeightSession(exercise.id, doneSeries.map(s => ({ weight: parseFloat(s.weight) || 0, reps: parseInt(s.reps) || 0 })));
      setSaved(true); buzz(true);
      setTimeout(() => navigation.goBack(), 1200);
    } catch {} finally { setSaving(false); }
  }

  async function handleSaveCardio() {
    setSaving(true);
    try {
      await addTimeSession(exercise.id, { duration: Math.round(cardioTime / 60), distance: cardioDistance ? parseFloat(cardioDistance) : null });
      setSaved(true); buzz(true);
      setTimeout(() => navigation.goBack(), 1200);
    } catch {} finally { setSaving(false); }
  }

  const completedCount = series.filter(s => s.done).length;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Media: animación / video / youtube */}
        <ExerciseMedia exercise={exercise} colors={colors} />

        {/* Info del ejercicio */}
        <View style={s.exerciseInfoSection}>
          <Text style={s.exerciseName}>{exercise.name}</Text>
          {exercise.description ? <Text style={s.exerciseDesc}>{exercise.description}</Text> : null}
        </View>

        {isCardio ? (
          <View style={s.cardioSection}>
            <View style={s.cardioTimer}>
              <Text style={s.cardioTimerLabel}>TIEMPO</Text>
              <Text style={[s.cardioTimerValue, { color: cardioRunning ? colors.brand : colors.textPrimary }]}>
                {formatTime(cardioTime)}
              </Text>
              <TouchableOpacity
                style={[s.cardioTimerBtn, { backgroundColor: cardioRunning ? colors.danger : colors.success }]}
                onPress={() => { setCardioRunning(r => !r); buzz(); }}
              >
                <Text style={s.cardioTimerBtnText}>{cardioRunning ? '⏸ Pausar' : cardioTime > 0 ? '▶ Continuar' : '▶ Iniciar'}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.cardioField}>
              <Text style={s.fieldLabel}>DISTANCIA (km)</Text>
              <TextInput style={s.cardioInput} value={cardioDistance} onChangeText={setCardioDistance}
                placeholder="0.0" placeholderTextColor={colors.textLight} keyboardType="decimal-pad" />
            </View>
          </View>
        ) : (
          <View style={s.strengthSection}>
            <View style={s.seriesHeader}>
              <Text style={s.sectionTitle}>SERIES</Text>
              <Text style={s.seriesProgress}>{completedCount}/{series.length} completadas</Text>
            </View>

            {/* Config descanso */}
            <View style={s.restConfig}>
              <Text style={s.restConfigLabel}>⏱ Descanso entre series</Text>
              <View style={s.restBtns}>
                {[60, 90, 120, 180].map(secs => (
                  <TouchableOpacity key={secs}
                    style={[s.restBtn, restSeconds === secs && { backgroundColor: colors.brand, borderColor: colors.brand }]}
                    onPress={() => setRestSeconds(secs)}
                  >
                    <Text style={[s.restBtnText, restSeconds === secs && { color: colors.textOnBrand }]}>
                      {secs < 120 ? `${secs}s` : `${secs/60}min`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {series.map((serie, index) => {
              const isCurrent = index === currentSerie && !serie.done;
              return (
                <View key={serie.id} style={[
                  s.serieRow,
                  serie.done && { opacity: 0.5 },
                  isCurrent && { borderColor: colors.brand, backgroundColor: colors.brandLight },
                ]}>
                  <View style={[s.serieNum, { backgroundColor: serie.done ? colors.success : isCurrent ? colors.brand : colors.cardAlt }]}>
                    <Text style={[s.serieNumText, { color: (serie.done || isCurrent) ? '#000' : colors.textSecondary }]}>
                      {serie.done ? '✓' : index + 1}
                    </Text>
                  </View>
                  <View style={s.serieInputs}>
                    <View style={s.serieField}>
                      <Text style={s.serieFieldLabel}>PESO (kg)</Text>
                      <TextInput style={[s.serieInput, isCurrent && { borderColor: colors.brand }]}
                        value={serie.weight} onChangeText={v => updateSerie(index, 'weight', v)}
                        placeholder="0" placeholderTextColor={colors.textLight}
                        keyboardType="decimal-pad" editable={!serie.done} selectTextOnFocus />
                    </View>
                    <Text style={s.serieX}>×</Text>
                    <View style={s.serieField}>
                      <Text style={s.serieFieldLabel}>REPS</Text>
                      <TextInput style={[s.serieInput, isCurrent && { borderColor: colors.brand }]}
                        value={serie.reps} onChangeText={v => updateSerie(index, 'reps', v)}
                        placeholder="0" placeholderTextColor={colors.textLight}
                        keyboardType="number-pad" editable={!serie.done} selectTextOnFocus />
                    </View>
                  </View>
                  {!serie.done && (
                    <TouchableOpacity style={[s.serieDoneBtn, { backgroundColor: colors.success }]}
                      onPress={() => markSerieDone(index)}>
                      <Text style={{ fontSize: 18 }}>✓</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <TouchableOpacity style={s.addSerieBtn} onPress={addSerie}>
              <Text style={[s.addSerieBtnText, { color: colors.brand }]}>+ Agregar serie</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer guardar */}
      <View style={s.footer}>
        {saved ? (
          <View style={[s.saveBtn, { backgroundColor: colors.success }]}>
            <Text style={s.saveBtnText}>✓ ¡Guardado!</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={isCardio ? handleSaveCardio : handleSaveWeight}
            disabled={saving}
          >
            <Text style={s.saveBtnText}>{saving ? 'Guardando...' : '💾 Guardar sesión'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {showRest && <RestTimer seconds={restSeconds} colors={colors} onDone={() => setShowRest(false)} />}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  exerciseInfoSection: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  exerciseName: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
  exerciseDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },

  cardioSection: { padding: 16 },
  cardioTimer: { backgroundColor: colors.card, borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 16, borderWidth: 0.5, borderColor: colors.border },
  cardioTimerLabel: { fontSize: 11, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 8 },
  cardioTimerValue: { fontSize: 72, fontWeight: '900', letterSpacing: -3, lineHeight: 80 },
  cardioTimerBtn: { marginTop: 20, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 14 },
  cardioTimerBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  cardioField: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: colors.border },
  cardioInput: { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 14, fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginTop: 8 },

  strengthSection: { padding: 16 },
  seriesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.brand, letterSpacing: 1.5 },
  seriesProgress: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },

  restConfig: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 0.5, borderColor: colors.border },
  restConfigLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 10 },
  restBtns: { flexDirection: 'row', gap: 8 },
  restBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardAlt, alignItems: 'center' },
  restBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },

  serieRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  serieNum: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  serieNumText: { fontSize: 14, fontWeight: '900' },
  serieInputs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  serieField: { flex: 1 },
  serieFieldLabel: { fontSize: 9, fontWeight: '800', color: colors.textLight, letterSpacing: 0.5, marginBottom: 4 },
  serieInput: { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 18, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  serieX: { fontSize: 16, color: colors.textSecondary, marginTop: 14 },
  serieDoneBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addSerieBtn: { paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.brand, borderStyle: 'dashed', alignItems: 'center', marginTop: 4 },
  addSerieBtnText: { fontSize: 14, fontWeight: '700' },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 1.5 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.brand, borderRadius: 14, padding: 17, alignItems: 'center', shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnText: { color: colors.textOnBrand, fontWeight: '900', fontSize: 16 },
});