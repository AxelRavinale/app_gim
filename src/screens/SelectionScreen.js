// src/screens/SelectionScreen.js
// Pantalla inicial con dos opciones: Entrenamiento y Cardio

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, ImageBackground, Platform,
} from 'react-native';
import { Image } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function SelectionScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <Image
          source={require('../../assets/logo_circle.png')}
          style={s.logo}
          resizeMode="contain"
        />
        <Text style={s.subtitle}>¿Qué vas a hacer hoy?</Text>
      </View>

      {/* Cards */}
      <View style={s.cards}>

        {/* Card Entrenamiento */}
        <TouchableOpacity
          style={[s.card, { backgroundColor: colors.card, borderColor: 'rgba(232,181,0,0.3)' }]}
          onPress={() => navigation.navigate('Training')}
          activeOpacity={0.85}
        >
          <View style={[s.cardIconWrap, { backgroundColor: 'rgba(232,181,0,0.12)' }]}>
            <Text style={s.cardIcon}>🏋️</Text>
          </View>
          <View style={s.cardContent}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Entrenamiento</Text>
            <Text style={[s.cardDesc, { color: colors.textSecondary }]}>
              Ejercicios, rutinas, series y pesos
            </Text>
          </View>
          <View style={[s.cardArrow, { backgroundColor: colors.brand }]}>
            <Text style={{ color: '#0A0A0A', fontSize: 18, fontWeight: '900' }}>→</Text>
          </View>
          {/* Borde izquierdo de color */}
          <View style={[s.cardAccent, { backgroundColor: colors.brand }]} />
        </TouchableOpacity>

        {/* Card Cardio */}
        <TouchableOpacity
          style={[s.card, { backgroundColor: colors.card, borderColor: 'rgba(96,165,250,0.3)' }]}
          onPress={() => navigation.navigate('Cardio')}
          activeOpacity={0.85}
        >
          <View style={[s.cardIconWrap, { backgroundColor: 'rgba(96,165,250,0.12)' }]}>
            <Text style={s.cardIcon}>🏃</Text>
          </View>
          <View style={s.cardContent}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Cardio</Text>
            <Text style={[s.cardDesc, { color: colors.textSecondary }]}>
              GPS, rutas, distancias y tiempos
            </Text>
          </View>
          <View style={[s.cardArrow, { backgroundColor: '#60A5FA' }]}>
            <Text style={{ color: '#0A0A0A', fontSize: 18, fontWeight: '900' }}>→</Text>
          </View>
          <View style={[s.cardAccent, { backgroundColor: '#60A5FA' }]} />
        </TouchableOpacity>

      </View>

      {/* Footer */}
      <Text style={[s.footer, { color: colors.textLight }]}>
        Seleccioná el tipo de entrenamiento para comenzar
      </Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: { fontSize: 52, marginBottom: 10 },
  appName: {
    fontSize: 13, fontWeight: '800', color: colors.brand,
    letterSpacing: 4, marginBottom: 8,
  },
  subtitle: {
    fontSize: 22, fontWeight: '900', color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  cards: { flex: 1, gap: 16, justifyContent: 'center' },

  card: {
    borderRadius: 20, borderWidth: 1.5,
    padding: 24, flexDirection: 'row',
    alignItems: 'center', gap: 16,
    overflow: 'hidden', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    minHeight: 110,
  },
  cardAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
  },
  cardIconWrap: {
    width: 60, height: 60, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  cardIcon:    { fontSize: 30 },
  cardContent: { flex: 1 },
  cardTitle:   { fontSize: 20, fontWeight: '900', marginBottom: 5, letterSpacing: -0.3 },
  cardDesc:    { fontSize: 13, lineHeight: 19 },
  cardArrow: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },

  footer: {
    textAlign: 'center', fontSize: 12,
    paddingBottom: 30, paddingTop: 20,
  },
});