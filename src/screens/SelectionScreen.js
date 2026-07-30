// src/screens/SelectionScreen.js
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Image, Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SelectionScreen({ navigation }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Logo de fondo — usa StyleSheet.absoluteFillObject en vez de Dimensions */}
      <Image
        source={require('../../assets/icon.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Overlay oscuro */}
      <View style={styles.overlay} />

      {/* Contenido */}
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.brand }]}>GYMTRACKER</Text>
          <Text style={styles.subtitle}>¿Qué vas a hacer hoy?</Text>
        </View>

        {/* Cards */}
        <View style={styles.cards}>

          {/* Entrenamiento */}
          <TouchableOpacity
            style={[styles.card, { borderColor: 'rgba(232,181,0,0.5)' }]}
            onPress={() => navigation.navigate('Training')}
            activeOpacity={0.85}
          >
            <View style={[styles.cardAccent, { backgroundColor: colors.brand }]} />
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(232,181,0,0.15)' }]}>
              <Text style={styles.cardIcon}>🏋️</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Entrenamiento</Text>
              <Text style={styles.cardDesc}>Ejercicios, rutinas, series y pesos</Text>
            </View>
            <View style={[styles.cardArrow, { backgroundColor: colors.brand }]}>
              <Text style={{ color: '#0A0A0A', fontSize: 18, fontWeight: '900' }}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Resistencia */}
          <TouchableOpacity
            style={[styles.card, { borderColor: 'rgba(96,165,250,0.5)' }]}
            onPress={() => navigation.navigate('Cardio')}
            activeOpacity={0.85}
          >
            <View style={[styles.cardAccent, { backgroundColor: '#60A5FA' }]} />
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
              <Text style={styles.cardIcon}>🏃</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Resistencia</Text>
              <Text style={styles.cardDesc}>Cardio, GPS, rutas y distancias</Text>
            </View>
            <View style={[styles.cardArrow, { backgroundColor: '#60A5FA' }]}>
              <Text style={{ color: '#0A0A0A', fontSize: 18, fontWeight: '900' }}>→</Text>
            </View>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  cards: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,10,10,0.8)',
    elevation: 8,
    minHeight: 90,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardIcon: { fontSize: 26 },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 17,
  },
  cardArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});