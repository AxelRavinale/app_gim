// src/screens/NoGymScreen.js
// Pantalla que aparece cuando el alumno no está vinculado a ningún gimnasio

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, StatusBar,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function NoGymScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <View style={s.content}>
        <Text style={s.emoji}>🏋️</Text>
        <Text style={[s.title, { color: colors.textPrimary }]}>
          Todavía no estás en un gimnasio
        </Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Para acceder al entrenamiento necesitás vincularte a un gimnasio primero.
          Pedile el código de invitación a tu entrenador.
        </Text>

        <TouchableOpacity
          style={[s.btnPrimary, { backgroundColor: colors.brand }]}
          onPress={() => navigation.navigate('JoinGym')}
          activeOpacity={0.85}
        >
          <Text style={[s.btnPrimaryText, { color: '#0A0A0A' }]}>
            🔑 Ingresar código del gimnasio
          </Text>
        </TouchableOpacity>

        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.infoTitle, { color: colors.brand }]}>¿Cómo obtengo el código?</Text>
          <View style={{ gap: 10, marginTop: 10 }}>
            {[
              { icon: '1️⃣', text: 'Pedíselo a tu entrenador o al gimnasio' },
              { icon: '2️⃣', text: 'El dueño lo ve en su panel web (Dashboard)' },
              { icon: '3️⃣', text: 'Ingresalo acá y quedás vinculado automáticamente' },
            ].map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Text style={{ fontSize: 16 }}>{step.icon}</Text>
                <Text style={[s.infoText, { color: colors.textSecondary }]}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: {
    flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  emoji:    { fontSize: 64, marginBottom: 8 },
  title:    { fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

  btnPrimary: {
    width: '100%', borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#E8B500', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnPrimaryText: { fontWeight: '900', fontSize: 16 },

  infoCard: {
    width: '100%', borderRadius: 16, padding: 18, borderWidth: 1,
  },
  infoTitle: { fontSize: 13, fontWeight: '800' },
  infoText:  { fontSize: 13, flex: 1, lineHeight: 20 },
});