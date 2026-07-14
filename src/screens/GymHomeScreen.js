// src/screens/GymHomeScreen.js
// Ejercicios del gimnasio (trainer) con registro personal del alumno

import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, StatusBar, ActivityIndicator, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useSession } from '../context/SessionContext';

const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

export default function GymHomeScreen({ navigation }) {
  const { colors } = useTheme();
  const { user }   = useSession() || {};
  const s = makeStyles(colors);

  const [exercises, setExercises]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('Todos');

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('gymtracker_access_token');
      const res   = await fetch(`${BASE_URL}/api/exercises`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      // Solo ejercicios del gym que no sean del propio usuario
      const gymEx = Array.isArray(data)
        ? data.filter(ex => ex.gym_id && ex.user_id !== user?.id)
        : [];
      setExercises(gymEx);
    } catch { setExercises([]); }
    finally { setLoading(false); }
  }

  const muscleGroups = ['Todos', ...new Set(exercises.map(e => e.muscle_group).filter(Boolean))];

  const filtered = exercises.filter(ex => {
    const matchSearch = (ex.name||'').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Todos' || ex.muscle_group === filter;
    return matchSearch && matchFilter;
  });

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <Text style={s.gymName}>GYMTRACKER</Text>
        <Text style={s.title}>Ejercicios del gimnasio</Text>
        <Text style={s.subtitle}>{exercises.length} ejercicio{exercises.length!==1?'s':''} disponible{exercises.length!==1?'s':''}</Text>
      </View>

      {/* Buscador */}
      <View style={s.searchWrap}>
        <Text>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar ejercicio..."
          placeholderTextColor={colors.textLight}
          value={search} onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: colors.textLight }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 4 }}
        style={{ maxHeight: 44 }}>
        {muscleGroups.map(g => {
          const active = filter === g;
          return (
            <TouchableOpacity key={g}
              style={[s.chip, active && { backgroundColor: colors.brand, borderColor: colors.brand }]}
              onPress={() => setFilter(g)}>
              <Text style={[s.chipText, active && { color: '#0A0A0A' }]}>{g}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.brand} size="large" />
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 48, marginBottom: 14 }}>📋</Text>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
            {exercises.length === 0 ? 'Aún no hay ejercicios' : 'Sin resultados'}
          </Text>
          <Text style={[s.emptySub, { color: colors.textSecondary }]}>
            {exercises.length === 0
              ? 'Tu entrenador todavía no cargó ejercicios'
              : 'Probá con otro filtro'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const mc = colors.muscleColors?.[item.muscle_group] || { bg:'rgba(232,181,0,0.15)', text:'#E8B500' };
            return (
              <TouchableOpacity
                style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('Detail', { exerciseId: item.id })}
                activeOpacity={0.75}
              >
                <View style={[s.accent, { backgroundColor: mc.bg }]}>
                  <Text style={[s.accentText, { color: mc.text }]}>
                    {(item.muscle_group||'?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 12 }}>
                  <Text style={[s.exName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[s.exMeta, { color: colors.textSecondary }]}>
                    {item.muscle_group} · {item.tracking_type === 'time' ? '⏱ Tiempo' : '🏋️ Peso+Reps'}
                  </Text>
                  {item.description ? (
                    <Text style={[s.exDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
                <Text style={[s.arrow, { color: colors.textLight }]}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  header:     { backgroundColor: colors.card, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  gymName:    { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 4 },
  title:      { fontSize: 24, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle:   { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.cardAlt, marginHorizontal: 16, marginVertical: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 0.5, borderColor: colors.border },
  searchInput:{ flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  chip:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
  chipText:   { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card:       { flexDirection: 'row', borderRadius: 14, marginBottom: 10, borderWidth: 0.5, overflow: 'hidden', alignItems: 'center' },
  accent:     { width: 32, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' },
  accentText: { fontSize: 12, fontWeight: '900' },
  exName:     { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  exMeta:     { fontSize: 12 },
  exDesc:     { fontSize: 11, marginTop: 3, fontStyle: 'italic' },
  arrow:      { fontSize: 22, paddingRight: 12 },
});