// AchievementToast.js
// Notificacion visual que aparece cuando se desbloquea un logro.
// Se muestra en la parte superior de la pantalla por 3 segundos.
// Usa Animated de React Native para la animacion de entrada/salida.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// Props:
// - achievement: el objeto del logro a mostrar (puede ser null)
// - onHide: funcion para cerrar el toast
export default function AchievementToast({ achievement, onHide }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const slideAnim  = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!achievement) return;

    // Animacion de entrada: sube desde arriba
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    // Auto-ocultar despues de 3.5 segundos
    const timer = setTimeout(() => {
      hideToast();
    }, 3500);

    return () => clearTimeout(timer);
  }, [achievement]);

  function hideToast() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onHide?.());
  }

  if (!achievement) return null;

  return (
    <Animated.View style={[
      s.container,
      { transform: [{ translateY: slideAnim }], opacity: opacityAnim }
    ]}>
      <TouchableOpacity style={s.inner} onPress={hideToast} activeOpacity={0.9}>
        {/* Icono del logro */}
        <View style={s.iconContainer}>
          <Text style={s.icon}>{achievement.icon}</Text>
        </View>

        {/* Texto */}
        <View style={s.textContainer}>
          <Text style={s.label}>¡Logro desbloqueado!</Text>
          <Text style={s.title} numberOfLines={1}>{achievement.title}</Text>
          <Text style={s.description} numberOfLines={2}>
            {/* Reemplaza {exerciseName} en la descripcion si existe */}
            {achievement.description.replace('{exerciseName}', achievement.data?.exerciseName || '')}
          </Text>
        </View>

        {/* Puntos */}
        <View style={s.pointsBadge}>
          <Text style={s.pointsText}>+{achievement.points}</Text>
          <Text style={s.pointsLabel}>pts</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
  },
  inner: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 26 },
  textContainer: { flex: 1 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  pointsBadge: {
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  pointsText: { fontSize: 16, fontWeight: '800', color: '#D97706' },
  pointsLabel: { fontSize: 9, color: '#D97706', fontWeight: '600' },
});