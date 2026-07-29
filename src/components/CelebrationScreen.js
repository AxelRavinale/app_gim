// src/components/CelebrationScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, Vibration, Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getFraseAleatoria, FRASES_DIA_COMPLETO, MENSAJES_DIA_COMPLETO } from '../constants/motivational';

export default function CelebrationScreen({ visible, titulo, subtitulo, onClose }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim  = useRef(new Animated.Value(0)).current;

  const fraseTitulo  = getFraseAleatoria(FRASES_DIA_COMPLETO);
  const fraseMensaje = getFraseAleatoria(MENSAJES_DIA_COMPLETO);

  useEffect(() => {
    if (visible) {
      // Vibración de celebración
      Vibration.vibrate(
        Platform.OS === 'android'
          ? [0, 200, 100, 200, 100, 400]
          : [0, 400]
      );

      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1, useNativeDriver: true,
          tension: 80, friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]).start();

      // Bounce del emoji
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: -12, duration: 400, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0,   duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[s.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[
          s.card, { backgroundColor: colors.card },
          { transform: [{ scale: scaleAnim }] }
        ]}>
          {/* Emoji animado */}
          <Animated.Text style={[s.emoji, { transform: [{ translateY: bounceAnim }] }]}>
            🏆
          </Animated.Text>

          {/* Título */}
          <Text style={[s.titulo, { color: colors.brand }]}>{fraseTitulo}</Text>

          {/* Subtítulo de qué completó */}
          {titulo ? (
            <View style={[s.badge, { backgroundColor: 'rgba(232,181,0,0.12)', borderColor: 'rgba(232,181,0,0.3)' }]}>
              <Text style={[s.badgeText, { color: colors.brand }]}>{titulo}</Text>
            </View>
          ) : null}

          {subtitulo ? (
            <Text style={[s.subtitulo, { color: colors.textSecondary }]}>{subtitulo}</Text>
          ) : null}

          {/* Frase motivadora */}
          <Text style={[s.mensaje, { color: colors.textPrimary }]}>{fraseMensaje}</Text>

          {/* Estrellas decorativas */}
          <View style={s.estrellas}>
            {['⭐','🌟','✨','🌟','⭐'].map((e, i) => (
              <Text key={i} style={{ fontSize: i === 2 ? 28 : 20 }}>{e}</Text>
            ))}
          </View>

          {/* Botón cerrar */}
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.brand }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={[s.btnText, { color: '#0A0A0A' }]}>¡Seguir así! 💪</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:      { width: '100%', borderRadius: 28, padding: 32, alignItems: 'center', gap: 14 },
  emoji:     { fontSize: 72, marginBottom: 4 },
  titulo:    { fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  badge:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  subtitulo: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  mensaje:   { fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 23, fontStyle: 'italic' },
  estrellas: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn:       { width: '100%', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 4 },
  btnText:   { fontWeight: '900', fontSize: 17 },
});