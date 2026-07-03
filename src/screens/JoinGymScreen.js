// src/screens/JoinGymScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

export default function JoinGymScreen({ navigation, onJoined }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [code, setCode]           = useState('');
  const [gymInfo, setGymInfo]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [joining, setJoining]     = useState(false);
  const [error, setError]         = useState('');

  async function handleSearch() {
    if (code.trim().length < 4) { setError('Ingresá el código completo'); return; }
    setLoading(true); setError(''); setGymInfo(null);
    try {
      const res  = await fetch(`${BASE_URL}/api/gyms/by-code/${code.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Código inválido'); return; }
      setGymInfo(data);
    } catch {
      setError('No se pudo conectar al servidor');
    } finally { setLoading(false); }
  }

  async function handleJoin() {
    setJoining(true); setError('');
    try {
      const token = await AsyncStorage.getItem('gymtracker_access_token');
      const res   = await fetch(`${BASE_URL}/api/gyms/join`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body:    JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al unirse'); return; }

      Alert.alert('🎉 ¡Bienvenido!', data.message, [
        { text: 'OK', onPress: () => onJoined?.() }
      ]);
    } catch {
      setError('Error al conectar con el servidor');
    } finally { setJoining(false); }
  }

  return (
    <KeyboardAvoidingView
      style={[s.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.content}>
        <Text style={s.emoji}>🏋️</Text>
        <Text style={[s.title, { color: colors.textPrimary }]}>Unirse a un gimnasio</Text>
        <Text style={[s.subtitle, { color: colors.textSecondary }]}>
          Ingresá el código que te dio tu gimnasio para vincularte
        </Text>

        {/* Input de código */}
        <View style={[s.codeWrap, { borderColor: gymInfo ? colors.brand : colors.border, backgroundColor: colors.card }]}>
          <TextInput
            value={code}
            onChangeText={v => { setCode(v.toUpperCase()); setGymInfo(null); setError(''); }}
            style={[s.codeInput, { color: colors.brand }]}
            placeholder="XXXXXX"
            placeholderTextColor={colors.textLight}
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>

        {error ? (
          <View style={[s.errorBox, { backgroundColor:'rgba(239,68,68,0.1)', borderColor:'rgba(239,68,68,0.3)' }]}>
            <Text style={{ color:'#EF4444', fontSize:13, textAlign:'center' }}>⚠ {error}</Text>
          </View>
        ) : null}

        {/* Info del gym encontrado */}
        {gymInfo && (
          <View style={[s.gymCard, { backgroundColor: colors.card, borderColor: 'rgba(34,197,94,0.4)' }]}>
            <Text style={{ fontSize:28, marginBottom:8 }}>🏋️</Text>
            <Text style={[s.gymName, { color: colors.textPrimary }]}>{gymInfo.name}</Text>
            <Text style={[s.gymCode, { color: colors.brand }]}>Código: {gymInfo.invite_code}</Text>
          </View>
        )}

        {/* Botón buscar */}
        {!gymInfo && (
          <TouchableOpacity
            style={[s.btn, { backgroundColor: colors.brand }]}
            onPress={handleSearch}
            disabled={loading || code.trim().length < 4}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#0A0A0A" />
              : <Text style={s.btnText}>Buscar gimnasio</Text>
            }
          </TouchableOpacity>
        )}

        {/* Botón confirmar unirse */}
        {gymInfo && (
          <View style={{ gap: 10, width:'100%' }}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#22C55E' }]}
              onPress={handleJoin}
              disabled={joining}
              activeOpacity={0.8}
            >
              {joining
                ? <ActivityIndicator color="#fff" />
                : <Text style={[s.btnText, { color:'#fff' }]}>✓ Unirme a {gymInfo.name}</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnSecondary, { borderColor: colors.border }]}
              onPress={() => { setGymInfo(null); setCode(''); }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight:'700', fontSize:14 }}>
                Ingresar otro código
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[s.hint, { color: colors.textLight }]}>
          El código lo encontrás en el panel web del gimnasio o preguntale a tu entrenador
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex:1 },
  content: {
    flex:1, padding:28, alignItems:'center', justifyContent:'center', gap:16,
  },
  emoji:    { fontSize:56, marginBottom:4 },
  title:    { fontSize:24, fontWeight:'900', letterSpacing:-0.5, textAlign:'center' },
  subtitle: { fontSize:14, textAlign:'center', lineHeight:21, marginBottom:8 },

  codeWrap: {
    width:'100%', borderRadius:16, borderWidth:2,
    padding:4, alignItems:'center',
  },
  codeInput: {
    fontSize:36, fontWeight:'900', letterSpacing:12,
    textAlign:'center', padding:16, width:'100%',
  },

  errorBox: { borderRadius:12, padding:12, width:'100%', borderWidth:1 },

  gymCard: {
    width:'100%', borderRadius:16, padding:24,
    alignItems:'center', borderWidth:2,
  },
  gymName: { fontSize:20, fontWeight:'900', marginBottom:4 },
  gymCode: { fontSize:13, fontWeight:'700' },

  btn: {
    width:'100%', borderRadius:14, padding:16,
    alignItems:'center',
    shadowColor:'#000', shadowOffset:{width:0,height:4},
    shadowOpacity:0.2, shadowRadius:8, elevation:4,
  },
  btnText:      { color:'#0A0A0A', fontWeight:'900', fontSize:16 },
  btnSecondary: { width:'100%', borderRadius:14, padding:14, alignItems:'center', borderWidth:1 },

  hint: { fontSize:12, textAlign:'center', lineHeight:18, marginTop:8 },
});