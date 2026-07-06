// src/screens/SelectionScreen.js
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, Image, Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function SelectionScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Logo de fondo ocupando toda la pantalla */}
      <Image
        source={require('../../assets/icon.png')}
        style={s.bgLogo}
        resizeMode="cover"
      />

      {/* Overlay oscuro para que las cards se lean bien */}
      <View style={s.overlay} />

      {/* Contenido encima */}
      <View style={s.content}>
        {/* Título arriba */}
        <View style={s.header}>
          <Text style={s.appName}>GYMTRACKER</Text>
          <Text style={s.subtitle}>¿Qué vas a hacer hoy?</Text>
        </View>

        {/* Cards abajo */}
        <View style={s.cards}>

          {/* Card Entrenamiento */}
          <TouchableOpacity
            style={[s.card, { borderColor: 'rgba(232,181,0,0.5)' }]}
            onPress={() => navigation.navigate('Training')}
            activeOpacity={0.85}
          >
            <View style={[s.cardIconWrap, { backgroundColor: 'rgba(232,181,0,0.15)' }]}>
              <Text style={s.cardIcon}>🏋️</Text>
            </View>
            <View style={s.cardContent}>
              <Text style={[s.cardTitle, { color: '#fff' }]}>Entrenamiento</Text>
              <Text style={[s.cardDesc, { color: 'rgba(255,255,255,0.6)' }]}>
                Ejercicios, rutinas, series y pesos
              </Text>
            </View>
            <View style={[s.cardArrow, { backgroundColor: colors.brand }]}>
              <Text style={{ color: '#0A0A0A', fontSize: 18, fontWeight: '900' }}>→</Text>
            </View>
            <View style={[s.cardAccent, { backgroundColor: colors.brand }]} />
          </TouchableOpacity>

          {/* Card Cardio */}
          <TouchableOpacity
            style={[s.card, { borderColor: 'rgba(96,165,250,0.5)' }]}
            onPress={() => navigation.navigate('Cardio')}
            activeOpacity={0.85}
          >
            <View style={[s.cardIconWrap, { backgroundColor: 'rgba(96,165,250,0.15)' }]}>
              <Text style={s.cardIcon}>🏃</Text>
            </View>
            <View style={s.cardContent}>
              <Text style={[s.cardTitle, { color: '#fff' }]}>Cardio</Text>
              <Text style={[s.cardDesc, { color: 'rgba(255,255,255,0.6)' }]}>
                GPS, rutas, distancias y tiempos
              </Text>
            </View>
            <View style={[s.cardArrow, { backgroundColor: '#60A5FA' }]}>
              <Text style={{ color: '#0A0A0A', fontSize: 18, fontWeight: '900' }}>→</Text>
            </View>
            <View style={[s.cardAccent, { backgroundColor: '#60A5FA' }]} />
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  // Logo ocupa toda la pantalla de fondo
  bgLogo: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },

  // Overlay para oscurecer el fondo y que se lean las cards
  overlay: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // Contenido encima del logo
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  header: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brand,
    letterSpacing: 4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 22,
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
    position: 'relative',
    backgroundColor: 'rgba(10,10,10,0.75)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 100,
  },
  cardAccent:   { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardIconWrap: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  cardIcon:     { fontSize: 28 },
  cardContent:  { flex: 1 },
  cardTitle:    { fontSize: 20, fontWeight: '900', marginBottom: 4, letterSpacing: -0.3 },
  cardDesc:     { fontSize: 13, lineHeight: 19 },
  cardArrow:    { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
});