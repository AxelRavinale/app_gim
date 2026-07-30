// src/screens/SelectionScreen.js
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Image, Platform, SafeAreaView,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function SelectionScreen({ navigation }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Logo fondo */}
      <Image
        source={require('../../assets/icon.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Overlay */}
      <View style={styles.overlay} />

      {/* SafeAreaView para respetar notch */}
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.brand }]}>GYMTRACKER</Text>
          <Text style={styles.subtitle}>¿Qué vas a hacer hoy?</Text>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Cards al fondo */}
        <View style={styles.cards}>
          <TouchableOpacity
            style={[styles.card, { borderColor: 'rgba(232,181,0,0.5)' }]}
            onPress={() => navigation.navigate('Training')}
            activeOpacity={0.85}
          >
            <View style={[styles.accent, { backgroundColor: colors.brand }]} />
            <Text style={styles.cardIcon}>🏋️</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Entrenamiento</Text>
              <Text style={styles.cardDesc}>Ejercicios, rutinas, series y pesos</Text>
            </View>
            <Text style={[styles.arrow, { color: colors.brand }]}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { borderColor: 'rgba(96,165,250,0.5)' }]}
            onPress={() => navigation.navigate('Cardio')}
            activeOpacity={0.85}
          >
            <View style={[styles.accent, { backgroundColor: '#60A5FA' }]} />
            <Text style={styles.cardIcon}>🏃</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Resistencia</Text>
              <Text style={styles.cardDesc}>Cardio, GPS, rutas y distancias</Text>
            </View>
            <Text style={[styles.arrow, { color: '#60A5FA' }]}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0A0A0A' },
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  safeArea:   { flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header:     { alignItems: 'center', marginTop: 40 },
  appName:    { fontSize: 13, fontWeight: '800', letterSpacing: 4, marginBottom: 8 },
  subtitle:   { fontSize: 24, fontWeight: '900', color: '#fff' },
  cards:      { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.85)',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
    gap: 14,
    overflow: 'hidden',
  },
  accent:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardIcon: { fontSize: 28 },
  cardText: { flex: 1 },
  cardTitle:{ fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 2 },
  cardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  arrow:    { fontSize: 22, fontWeight: '900' },
});