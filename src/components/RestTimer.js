import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';

async function buzz(heavy = false) {
  try {
    if (heavy) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate(Platform.OS === 'android' ? [0, 300, 100, 300] : 500);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {}
}

export default function RestTimer({ visible, duration = 60, onFinish, onSkip, nextInfo }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [remaining, setRemaining]         = useState(duration);
  const [selectedDuration, setSelectedDuration] = useState(duration);
  const [running, setRunning]             = useState(true); // arranca corriendo siempre
  const intervalRef                       = useRef(null);
  const slideAnim                         = useRef(new Animated.Value(200)).current;

  // Cuando se hace visible, reiniciamos todo y arrancamos
  useEffect(() => {
    if (visible) {
      setSelectedDuration(duration);
      setRemaining(duration);
      setRunning(true);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, tension: 80, friction: 10,
      }).start();
    } else {
      clearInterval(intervalRef.current);
      setRunning(false);
      Animated.timing(slideAnim, {
        toValue: 200, duration: 200, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Motor del timer — se re-ejecuta cuando cambia running o remaining
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!running || !visible) return;

    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          buzz(true);
          onFinish?.();
          return 0;
        }
        if (r <= 4) buzz(false);
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, visible]);

  // Cuando el usuario elige un preset:
  // 1. Cambia el tiempo seleccionado
  // 2. Resetea el remaining al nuevo tiempo
  // 3. Arranca el timer inmediatamente
  function selectPreset(seconds) {
    clearInterval(intervalRef.current);
    setSelectedDuration(seconds);
    setRemaining(seconds);
    setRunning(true); // arranca solo al cambiar el preset
  }

  if (!visible) return null;

  const progress     = selectedDuration > 0 ? remaining / selectedDuration : 0;
  const minutes      = Math.floor(remaining / 60).toString().padStart(2, '0');
  const seconds      = (remaining % 60).toString().padStart(2, '0');
  const progressColor =
    progress > 0.5 ? colors.success :
    progress > 0.25 ? colors.warning :
    colors.danger;

  const quickTimes = [15, 30, 60, 90, 120];

  return (
    <Animated.View style={[s.container, { transform: [{ translateY: slideAnim }] }]}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerText}>😮‍💨 Descanso</Text>
        {nextInfo ? <Text style={s.nextInfo} numberOfLines={1}>{nextInfo}</Text> : null}
      </View>

      {/* Tiempo grande */}
      <View style={s.displayRow}>
        <Text style={[s.timerText, { color: remaining === 0 ? colors.success : progressColor }]}>
          {remaining === 0 ? '¡Listo! 💪' : `${minutes}:${seconds}`}
        </Text>

        {/* Barra de progreso */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, {
            width: `${progress * 100}%`,
            backgroundColor: progressColor,
          }]} />
        </View>
      </View>

      {/* Presets de tiempo — al tocar cambian Y arrancan solos */}
      <View style={s.quickTimesRow}>
        {quickTimes.map(t => {
          const isSelected = selectedDuration === t;
          return (
            <TouchableOpacity
              key={t}
              style={[s.quickTimeBtn, {
                backgroundColor: isSelected ? colors.primary : colors.background,
                borderColor: isSelected ? colors.primary : colors.border,
              }]}
              onPress={() => selectPreset(t)}
            >
              <Text style={[s.quickTimeBtnText, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                {t < 60 ? `${t}s` : `${t / 60}min`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botones de accion */}
      <View style={s.buttonsRow}>

        {/* Pausar / Continuar */}
        <TouchableOpacity
          style={[s.pauseBtn, { borderColor: colors.border }]}
          onPress={() => setRunning(r => !r)}
        >
          <Text style={[s.pauseBtnText, { color: colors.textSecondary }]}>
            {running ? '⏸ Pausar' : '▶ Continuar'}
          </Text>
        </TouchableOpacity>

        {/* +15 segundos */}
        <TouchableOpacity
          style={[s.addTimeBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
          onPress={() => {
            setRemaining(r => r + 15);
            setSelectedDuration(d => d + 15);
            if (!running) setRunning(true);
          }}
        >
          <Text style={[s.addTimeBtnText, { color: colors.primary }]}>+15s</Text>
        </TouchableOpacity>

        {/* Saltear */}
        <TouchableOpacity style={[s.skipBtn, { borderColor: colors.border }]} onPress={onSkip}>
          <Text style={[s.skipBtnText, { color: colors.textSecondary }]}>⏭ Saltear</Text>
        </TouchableOpacity>

      </View>
    </Animated.View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    position: 'absolute', bottom: 80, left: 16, right: 16,
    backgroundColor: colors.card, borderRadius: 20, padding: 16,
    elevation: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.15, shadowRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  nextInfo: { fontSize: 12, color: colors.textSecondary, flex: 1, textAlign: 'right', marginLeft: 10 },
  displayRow: { alignItems: 'center', marginBottom: 12 },
  timerText: { fontSize: 56, fontWeight: '800', letterSpacing: -2, lineHeight: 62 },
  progressBar: { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 3 },
  quickTimesRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  quickTimeBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  quickTimeBtnText: { fontSize: 12, fontWeight: '600' },
  buttonsRow: { flexDirection: 'row', gap: 8 },
  pauseBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', backgroundColor: colors.background },
  pauseBtnText: { fontSize: 13, fontWeight: '600' },
  addTimeBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  addTimeBtnText: { fontSize: 14, fontWeight: '700' },
  skipBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', backgroundColor: colors.background },
  skipBtnText: { fontSize: 13, fontWeight: '600' },
});