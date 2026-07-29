// src/components/RestTimer.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, Vibration, Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getFraseAleatoria, FRASES_DESCANSO, FRASES_ULTIMA_SERIE } from '../constants/motivational';
import { hablarFraseMotivadora, hablarCuentaRegresiva, hablar, detenerAudio } from '../utils/audioHelper';

export default function RestTimer({ visible, duration = 60, nextInfo, onFinish, onSkip, isLastSerie = false }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [remaining, setRemaining] = useState(duration);
  const [frase, setFrase]         = useState('');
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef     = useRef(null);

  useEffect(() => {
    if (visible) {
      setRemaining(duration);
      // Elegir frase según si es la última serie
      setFrase(getFraseAleatoria(isLastSerie ? FRASES_ULTIMA_SERIE : FRASES_DESCANSO));

      // Animar la barra de progreso
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: duration * 1000,
        useNativeDriver: false,
      }).start();

      timerRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Vibrar al terminar
            Vibration.vibrate(Platform.OS === 'android' ? [0, 300, 100, 300] : 600);
            onFinish?.();
            return 0;
          }
          // Vibrar a los 3 segundos
          if (prev === 4) Vibration.vibrate(100);
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => {
      clearInterval(timerRef.current);
      detenerAudio();
    };
  }, [visible, duration]);

  // Cambiar frase cada 15 segundos
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setFrase(getFraseAleatoria(FRASES_DESCANSO));
    }, 15000);
    return () => clearInterval(interval);
  }, [visible]);

  const pct     = duration > 0 ? remaining / duration : 0;
  const urgente = remaining <= 5;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={[s.container, { backgroundColor: colors.card }]}>

          {/* Frase motivadora */}
          <Text style={[s.frase, { color: urgente ? '#EF4444' : colors.brand }]}>
            {urgente ? '⚡ ¡YA MISMO!' : frase}
          </Text>

          {/* Timer circular */}
          <View style={s.timerWrap}>
            <View style={[s.timerBg, { borderColor: colors.border }]}>
              <Text style={[s.timerText, { color: urgente ? '#EF4444' : colors.textPrimary }]}>
                {remaining}
              </Text>
              <Text style={[s.timerLabel, { color: colors.textSecondary }]}>seg</Text>
            </View>
          </View>

          {/* Barra de progreso */}
          <View style={[s.progressBg, { backgroundColor: colors.border }]}>
            <Animated.View style={[s.progressFill, {
              backgroundColor: urgente ? '#EF4444' : colors.brand,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            }]} />
          </View>

          {/* Info próxima serie */}
          {nextInfo ? (
            <Text style={[s.nextInfo, { color: colors.textSecondary }]}>
              Siguiente → {nextInfo}
            </Text>
          ) : null}

          {/* Botón saltar */}
          <TouchableOpacity
            style={[s.skipBtn, { backgroundColor: colors.brand }]}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Text style={[s.skipText, { color: '#0A0A0A' }]}>Saltar descanso →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  container:    { width: '100%', borderRadius: 24, padding: 28, alignItems: 'center', gap: 16 },
  frase:        { fontSize: 16, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3, minHeight: 48 },
  timerWrap:    { alignItems: 'center', justifyContent: 'center' },
  timerBg:      { width: 120, height: 120, borderRadius: 60, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center' },
  timerText:    { fontSize: 48, fontWeight: '900', lineHeight: 56 },
  timerLabel:   { fontSize: 13, marginTop: -4 },
  progressBg:   { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  nextInfo:     { fontSize: 13, textAlign: 'center' },
  skipBtn:      { width: '100%', padding: 14, borderRadius: 14, alignItems: 'center' },
  skipText:     { fontWeight: '900', fontSize: 15 },
});