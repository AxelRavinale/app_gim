// src/screens/GymRoutinesScreen.js
// Rutinas asignadas por el trainer al alumno

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, ScrollView, FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

const BASE_URL  = 'https://gimnasio-production-7475.up.railway.app';
const DIAS_SHORT = { 'Lunes':'L','Martes':'M','Miércoles':'X','Jueves':'J','Viernes':'V','Sábado':'S','Domingo':'D' };

export default function GymRoutinesScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [routines, setRoutines] = useState([]);
  const [loading, setLoading]   = useState(true);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('gymtracker_access_token');
      const res   = await fetch(`${BASE_URL}/api/routines`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      // Solo rutinas creadas por otros (el trainer)
      setRoutines(Array.isArray(data) ? data : []);
    } catch { setRoutines([]); }
    finally { setLoading(false); }
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <Text style={s.gymName}>GYMTRACKER</Text>
        <Text style={s.title}>Rutinas del gimnasio</Text>
        <Text style={s.subtitle}>{routines.length} rutina{routines.length!==1?'s':''} asignada{routines.length!==1?'s':''}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.brand} size="large" />
      ) : routines.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>📋</Text>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>Sin rutinas asignadas</Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            Tu entrenador todavía no te asignó ninguna rutina.
          </Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const days = item.days || [];
            const activeDays = days.filter(d => (d.exercises||d.Exercises||[]).length > 0);
            const totalEx = activeDays.reduce((a,d) => a + (d.exercises||d.Exercises||[]).length, 0);

            return (
              <TouchableOpacity
                style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('GymRoutineDetail', { routineId: item.id, routineName: item.name, readonly: true })}
                activeOpacity={0.85}
              >
                <View style={s.cardTop}>
                  {/* Barra de color */}
                  <View style={{ height: 3, backgroundColor: colors.brand, marginBottom: 12, borderRadius: 2 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.routineName, { color: colors.textPrimary }]}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        {[`📅 ${item.weeks} sem.`, `🏋️ ${activeDays.length} días/sem`, `≡ ${totalEx} ejercicios`].map((t,i) => (
                          <View key={i} style={[s.metaChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {/* Badge solo lectura */}
                    <View style={[s.readonlyBadge, { backgroundColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.3)' }]}>
                      <Text style={{ fontSize: 10, color: '#60A5FA', fontWeight: '700' }}>👁 Solo lectura</Text>
                    </View>
                  </View>

                  {/* Días */}
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: 12 }}>
                    {Object.entries(DIAS_SHORT).map(([day, short]) => {
                      const active = activeDays.some(d => d.dayName === day || d.day_name === day);
                      return (
                        <View key={day} style={[s.dayChip, {
                          backgroundColor: active ? 'rgba(232,181,0,0.15)' : colors.background,
                          borderColor:     active ? 'rgba(232,181,0,0.4)' : colors.border,
                        }]}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: active ? colors.brand : colors.textLight }}>
                            {short}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[s.startBtn, { backgroundColor: colors.brand }]}
                    onPress={() => navigation.navigate('GymRoutineDetail', { routineId: item.id, routineName: item.name, readonly: true })}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 14 }}>▶ Ver rutina</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       { backgroundColor: colors.card, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  gymName:      { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 4 },
  title:        { fontSize: 24, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle:     { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  empty:        { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle:   { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  emptySub:     { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card:         { borderRadius: 16, marginBottom: 14, borderWidth: 1, overflow: 'hidden' },
  cardTop:      { padding: 16 },
  routineName:  { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  metaChip:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 0.5 },
  readonlyBadge:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, marginLeft: 8 },
  dayChip:      { flex: 1, aspectRatio: 1, borderRadius: 6, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  startBtn:     { marginTop: 14, borderRadius: 12, padding: 13, alignItems: 'center' },
});