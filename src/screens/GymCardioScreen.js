// src/screens/GymCardioScreen.js
// Planes de cardio asignados por el trainer

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

const TYPE_CFG = {
  circuit:    { label:'Circuito',  icon:'⚡', color:'#E8B500' },
  running:    { label:'Running',   icon:'🏃', color:'#22C55E' },
  hiit:       { label:'HIIT',      icon:'🔥', color:'#EF4444' },
  functional: { label:'Funcional', icon:'💪', color:'#A78BFA' },
};

export default function GymCardioScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [plans, setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('gymtracker_access_token');
      const res   = await fetch(`${BASE_URL}/api/cardio/my-plans`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch { setPlans([]); }
    finally { setLoading(false); }
  }

  function handleStart(plan) {
    // Convertir el plan al formato de CardioTimerScreen
    const exercises = (plan.exercises || []).map(ex => ({
      id:        ex.id || String(Math.random()),
      name:      ex.name,
      series:    (ex.uniform !== false)
        ? Array.from({ length: ex.series || 3 }, () => ({
            id: String(Math.random()), duration: ex.duration || 30, rest: ex.rest || 15,
          }))
        : Array.from({ length: ex.series || 3 }, () => ({
            id: String(Math.random()), duration: ex.duration || 30, rest: ex.rest || 15,
          })),
      restAfter: ex.rest_after || ex.restAfter || 60,
      uniform:   ex.uniform !== false,
      seriesCount: ex.series || 3,
    }));

    navigation.navigate('CardioTimer', { exercises, planName: plan.name });
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.gymName}>GYMTRACKER</Text>
        <Text style={s.title}>Planes de cardio</Text>
        <Text style={s.subtitle}>{plans.length} plan{plans.length!==1?'es':''} asignado{plans.length!==1?'s':''}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex:1 }} color={colors.brand} size="large" />
      ) : plans.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize:52, marginBottom:16 }}>🏃</Text>
          <Text style={[s.emptyTitle, { color:colors.textPrimary }]}>Sin planes asignados</Text>
          <Text style={[s.emptySub, { color:colors.textSecondary }]}>
            Tu entrenador todavía no te asignó ningún plan de cardio.
          </Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding:16, paddingBottom:30 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const cfg = TYPE_CFG[item.type] || TYPE_CFG.circuit;
            const totalTime = (item.exercises||[]).reduce(
              (a,ex) => a + (ex.series||3)*((ex.duration||30)+(ex.rest||15)), 0
            );
            return (
              <View style={[s.card, { backgroundColor:colors.card, borderColor:colors.border }]}>
                <View style={[s.cardBar, { backgroundColor:cfg.color }]} />
                <View style={s.cardContent}>
                  <View style={s.cardHeader}>
                    <View style={[s.typeIcon, { backgroundColor:cfg.color+'18' }]}>
                      <Text style={{ fontSize:22 }}>{cfg.icon}</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={[s.planName, { color:colors.textPrimary }]}>{item.name}</Text>
                      <View style={{ flexDirection:'row', gap:8, marginTop:4, flexWrap:'wrap' }}>
                        <View style={[s.badge, { backgroundColor:cfg.color+'18' }]}>
                          <Text style={{ fontSize:10, fontWeight:'700', color:cfg.color }}>{cfg.label}</Text>
                        </View>
                        <Text style={[s.meta, { color:colors.textSecondary }]}>⏱ ~{Math.round(totalTime/60)}min</Text>
                        <Text style={[s.meta, { color:colors.textSecondary }]}>≡ {(item.exercises||[]).length} ejercicios</Text>
                      </View>
                    </View>
                  </View>

                  {item.description ? (
                    <Text style={[s.desc, { color:colors.textSecondary }]}>{item.description}</Text>
                  ) : null}

                  {/* Lista de ejercicios */}
                  <View style={s.exList}>
                    {(item.exercises||[]).map((ex, i) => (
                      <View key={i} style={[s.exRow, { borderBottomColor:colors.border }]}>
                        <View style={[s.exDot, { backgroundColor:cfg.color }]} />
                        <Text style={[s.exName, { color:colors.textPrimary }]}>{ex.name}</Text>
                        <Text style={[s.exMeta, { color:colors.textSecondary }]}>
                          {ex.series}×{ex.duration}s
                        </Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[s.startBtn, { backgroundColor:cfg.color }]}
                    onPress={() => handleStart(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color:'#0A0A0A', fontWeight:'900', fontSize:15 }}>
                      ▶ Comenzar {cfg.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex:1, backgroundColor:colors.background },
  header:    { backgroundColor:colors.card, paddingHorizontal:20, paddingTop:20, paddingBottom:16, borderBottomWidth:0.5, borderBottomColor:colors.border },
  gymName:   { fontSize:10, fontWeight:'800', color:colors.brand, letterSpacing:2, marginBottom:4 },
  title:     { fontSize:24, fontWeight:'900', color:colors.textPrimary, letterSpacing:-0.5 },
  subtitle:  { fontSize:13, color:colors.textSecondary, marginTop:4 },
  empty:     { flex:1, justifyContent:'center', alignItems:'center', padding:40 },
  emptyTitle:{ fontSize:20, fontWeight:'800', textAlign:'center', marginBottom:8 },
  emptySub:  { fontSize:14, textAlign:'center', lineHeight:22 },
  card:      { borderRadius:16, marginBottom:14, borderWidth:0.5, overflow:'hidden' },
  cardBar:   { height:4 },
  cardContent:{ padding:16 },
  cardHeader:{ flexDirection:'row', gap:12, marginBottom:12, alignItems:'flex-start' },
  typeIcon:  { width:44, height:44, borderRadius:12, justifyContent:'center', alignItems:'center', flexShrink:0 },
  planName:  { fontSize:17, fontWeight:'900', letterSpacing:-0.3 },
  badge:     { paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  meta:      { fontSize:11 },
  desc:      { fontSize:13, lineHeight:19, marginBottom:12 },
  exList:    { marginBottom:14 },
  exRow:     { flexDirection:'row', alignItems:'center', gap:8, paddingVertical:7, borderBottomWidth:0.5 },
  exDot:     { width:6, height:6, borderRadius:3, flexShrink:0 },
  exName:    { flex:1, fontSize:13, fontWeight:'600' },
  exMeta:    { fontSize:12 },
  startBtn:  { borderRadius:12, padding:14, alignItems:'center' },
});