// SplashScreen.js
// Pantalla de bienvenida que aparece cuando abre la app.
// Por ahora tiene un boton "Entrar" que lleva directo al home.
// Cuando hagamos el backend, aqui va a vivir el login/registro.
//
// Conceptos:
// - Animated: animaciones de React Native (fade + slide)
// - useEffect con setTimeout: ejecuta codigo despues de N milisegundos
// - LinearGradient: gradiente de fondo (instalado con expo)

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar, Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onEnter }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  // Valores animados
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(30)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity     = useRef(new Animated.Value(0)).current;
  const btnTranslateY  = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Secuencia de animaciones: logo → tagline → boton
    Animated.sequence([
      // Logo aparece
      Animated.parallel([
        Animated.timing(logoOpacity,    { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(logoTranslateY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      // Tagline aparece despues de 200ms
      Animated.delay(200),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      // Boton aparece despues de 300ms
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(btnOpacity,     { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(btnTranslateY,  { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Fondo decorativo: circulos */}
      <View style={s.bgCircle1} />
      <View style={s.bgCircle2} />

      {/* Logo y nombre */}
      <Animated.View style={[s.logoSection, { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] }]}>
        <View style={s.logoIcon}>
          <Text style={s.logoIconText}>💪</Text>
        </View>
        <Text style={s.appName}>GymTracker</Text>
        <View style={s.brandLine} />
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[s.taglineSection, { opacity: taglineOpacity }]}>
        <Text style={s.tagline}>Entrená con propósito.</Text>
        <Text style={s.taglineSub}>Registrá cada kilo. Superá cada récord.</Text>

        {/* Features highlight */}
        <View style={s.featuresRow}>
          {['Rutinas', 'Progreso', 'Récords'].map((f, i) => (
            <View key={i} style={s.featureChip}>
              <Text style={s.featureChipText}>{f}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Boton de entrada */}
      <Animated.View style={[s.btnSection, { opacity: btnOpacity, transform: [{ translateY: btnTranslateY }] }]}>
        <TouchableOpacity style={s.enterBtn} onPress={onEnter} activeOpacity={0.85}>
          <Text style={s.enterBtnText}>Comenzar  →</Text>
        </TouchableOpacity>
        <Text style={s.loginHint}>
          Próximamente: inicio de sesión y sincronización con tu gimnasio
        </Text>
      </Animated.View>

      {/* Version */}
      <Text style={s.version}>v1.0</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Circulos decorativos de fondo
  bgCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#E8B500',
    opacity: 0.04,
    top: -60,
    right: -80,
  },
  bgCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E8B500',
    opacity: 0.06,
    bottom: 100,
    left: -50,
  },

  // Logo
  logoSection: { alignItems: 'center', marginBottom: 48 },
  logoIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#E8B500',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#E8B500',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoIconText: { fontSize: 38 },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F5F5F5',
    letterSpacing: -1,
  },
  brandLine: {
    width: 40,
    height: 3,
    backgroundColor: '#E8B500',
    borderRadius: 2,
    marginTop: 10,
  },

  // Tagline
  taglineSection: { alignItems: 'center', marginBottom: 56 },
  tagline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5F5F5',
    textAlign: 'center',
    marginBottom: 8,
  },
  taglineSub: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresRow: { flexDirection: 'row', gap: 10 },
  featureChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8B50044',
    backgroundColor: '#E8B50011',
  },
  featureChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8B500',
    letterSpacing: 0.3,
  },

  // Boton
  btnSection: { width: '100%', alignItems: 'center' },
  enterBtn: {
    width: '100%',
    backgroundColor: '#E8B500',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#E8B500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  enterBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: 0.3,
  },
  loginHint: {
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },

  version: {
    position: 'absolute',
    bottom: 24,
    fontSize: 11,
    color: '#333',
  },
});