import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, StatusBar, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { authAPI } from '../services/api';
import { useTheme } from '../theme/ThemeContext';

const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

export default function LoginScreen({ onLoginSuccess }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [mode, setMode]             = useState('login');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [gymCode, setGymCode]       = useState('');
  const [gymInfo, setGymInfo]       = useState(null);
  const [checkingGym, setCheckingGym] = useState(false);
  const [isLoading, setIsLoading]   = useState(false);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue:1, duration:600, useNativeDriver:true }),
      Animated.timing(formAnim, { toValue:1, duration:400, useNativeDriver:true }),
    ]).start();
  }, []);

  // Verifica el código del gimnasio al escribirlo
  useEffect(() => {
    if (gymCode.length < 10) { setGymInfo(null); return; }
    const timer = setTimeout(() => verifyGymCode(gymCode), 800);
    return () => clearTimeout(timer);
  }, [gymCode]);

  async function verifyGymCode(code) {
    setCheckingGym(true);
    try {
      const response = await fetch(`${BASE_URL}/api/gym-info/${code}`);
      if (response.ok) {
        const data = await response.json();
        setGymInfo(data);
      } else {
        setGymInfo(null);
      }
    } catch { setGymInfo(null); }
    finally { setCheckingGym(false); }
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Completá email y contraseña');
      return;
    }
    if (mode === 'register' && !firstName.trim()) {
      Alert.alert('Error', 'Ingresá tu nombre');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await authAPI.login(email.trim().toLowerCase(), password);
      } else {
        data = await authAPI.register(
          email.trim().toLowerCase(), password,
          firstName.trim(), lastName.trim(),
          gymCode.trim() || null
        );
      }
      onLoginSuccess(data.user);
    } catch (error) {
      Alert.alert('Error', error.message || 'Algo salió mal. Intentá de nuevo.');
    } finally { setIsLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS==='ios'?'padding':'height'}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <Animated.View style={[s.logoSection, { opacity:logoAnim, transform:[{ translateY: logoAnim.interpolate({ inputRange:[0,1], outputRange:[30,0] }) }] }]}>
          <View style={s.logoIcon}>
            <Text style={s.logoIconText}>💪</Text>
          </View>
          <Text style={s.appName}>GymTracker</Text>
          <View style={s.brandLine} />
        </Animated.View>

        {/* Formulario */}
        <Animated.View style={[s.formCard, { opacity:formAnim }]}>

          {/* Selector login / registro */}
          <View style={s.modeSelector}>
            {[['login','Iniciar sesión'],['register','Registrarse']].map(([val,label]) => (
              <TouchableOpacity key={val} style={[s.modeBtn, mode===val && s.modeBtnActive]} onPress={() => setMode(val)}>
                <Text style={[s.modeBtnText, mode===val && s.modeBtnTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campos registro */}
          {mode === 'register' && (
            <>
              <View style={s.nameRow}>
                <View style={{ flex:1 }}>
                  <Text style={s.fieldLabel}>NOMBRE *</Text>
                  <TextInput style={s.input} value={firstName} onChangeText={setFirstName}
                    placeholder="Juan" placeholderTextColor={colors.textLight} autoCapitalize="words" />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.fieldLabel}>APELLIDO</Text>
                  <TextInput style={s.input} value={lastName} onChangeText={setLastName}
                    placeholder="Pérez" placeholderTextColor={colors.textLight} autoCapitalize="words" />
                </View>
              </View>

              {/* Código del gimnasio */}
              <Text style={s.fieldLabel}>CÓDIGO DEL GIMNASIO <Text style={s.optional}>(opcional)</Text></Text>
              <View style={s.gymCodeRow}>
                <TextInput
                  style={[s.input, { flex:1 }]}
                  value={gymCode}
                  onChangeText={setGymCode}
                  placeholder="Pegá el código que te dio tu profe..."
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {checkingGym && <ActivityIndicator color={colors.brand} size="small" style={{ marginLeft:8 }} />}
              </View>

              {/* Info del gimnasio verificado */}
              {gymInfo && (
                <View style={[s.gymVerified, { borderColor: gymInfo.primary_color || colors.brand }]}>
                  <Text style={{ fontSize:18 }}>✅</Text>
                  <View style={{ flex:1 }}>
                    <Text style={[s.gymVerifiedName, { color: gymInfo.primary_color || colors.brand }]}>{gymInfo.name}</Text>
                    <Text style={s.gymVerifiedSub}>Te vas a unir a este gimnasio</Text>
                  </View>
                </View>
              )}
              {gymCode.length > 10 && !gymInfo && !checkingGym && (
                <View style={s.gymNotFound}>
                  <Text style={{ color: colors.danger, fontSize:13 }}>⚠ Código inválido o gimnasio inactivo</Text>
                </View>
              )}
            </>
          )}

          {/* Email */}
          <Text style={s.fieldLabel}>EMAIL *</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail}
            placeholder="tu@email.com" placeholderTextColor={colors.textLight}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

          {/* Password */}
          <Text style={[s.fieldLabel, { marginTop:14 }]}>CONTRASEÑA *</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres" placeholderTextColor={colors.textLight}
            secureTextEntry />

          {/* Submit */}
          <TouchableOpacity style={[s.submitBtn, isLoading && { opacity:0.7 }]} onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
            {isLoading
              ? <ActivityIndicator color="#0A0A0A" />
              : <Text style={s.submitBtnText}>{mode==='login'?'Entrar →':'Crear cuenta →'}</Text>
            }
          </TouchableOpacity>

          {mode === 'register' && (
            <Text style={s.gymHint}>
              ¿No tenés código? Podés usar la app sin gimnasio y unirte después.
            </Text>
          )}
        </Animated.View>

        <Text style={s.version}>GymTracker v1.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex:1, backgroundColor:'#0A0A0A' },
  scroll: { flexGrow:1, justifyContent:'center', padding:24 },
  logoSection: { alignItems:'center', marginBottom:32 },
  logoIcon: { width:72, height:72, borderRadius:20, backgroundColor:'#E8B500', justifyContent:'center', alignItems:'center', marginBottom:14, shadowColor:'#E8B500', shadowOffset:{width:0,height:6}, shadowOpacity:0.4, shadowRadius:12, elevation:10 },
  logoIconText: { fontSize:36 },
  appName: { fontSize:32, fontWeight:'900', color:'#F5F5F5', letterSpacing:-1 },
  brandLine: { width:36, height:3, backgroundColor:'#E8B500', borderRadius:2, marginTop:8 },
  formCard: { backgroundColor:'#111', borderRadius:20, padding:20, borderWidth:0.5, borderColor:'#1E1E1E' },
  modeSelector: { flexDirection:'row', backgroundColor:'#0A0A0A', borderRadius:12, padding:3, marginBottom:20 },
  modeBtn: { flex:1, paddingVertical:10, borderRadius:10, alignItems:'center' },
  modeBtnActive: { backgroundColor:'#E8B500' },
  modeBtnText: { fontSize:13, fontWeight:'600', color:'#555' },
  modeBtnTextActive: { color:'#0A0A0A', fontWeight:'800' },
  nameRow: { flexDirection:'row', gap:10, marginBottom:4 },
  fieldLabel: { fontSize:10, fontWeight:'800', color:'#E8B500', letterSpacing:1.5, marginBottom:6, marginTop:4 },
  optional: { color:'#444', fontWeight:'600', letterSpacing:0 },
  input: { backgroundColor:'#0A0A0A', borderWidth:1, borderColor:'#1E1E1E', borderRadius:12, paddingHorizontal:14, paddingVertical:13, fontSize:15, color:'#F5F5F5', marginBottom:4 },
  gymCodeRow: { flexDirection:'row', alignItems:'center', marginBottom:8 },
  gymVerified: { flexDirection:'row', alignItems:'center', gap:10, padding:12, borderRadius:12, borderWidth:1.5, marginBottom:8, backgroundColor:'rgba(232,181,0,0.05)' },
  gymVerifiedName: { fontSize:14, fontWeight:'800' },
  gymVerifiedSub: { fontSize:11, color:'#666', marginTop:2 },
  gymNotFound: { padding:10, borderRadius:10, backgroundColor:'rgba(239,68,68,0.1)', marginBottom:8 },
  submitBtn: { backgroundColor:'#E8B500', borderRadius:14, padding:17, alignItems:'center', marginTop:20, shadowColor:'#E8B500', shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:10, elevation:6 },
  submitBtnText: { color:'#0A0A0A', fontWeight:'900', fontSize:16, letterSpacing:0.3 },
  gymHint: { fontSize:12, color:'#333', textAlign:'center', marginTop:14, lineHeight:18 },
  version: { textAlign:'center', color:'#222', fontSize:11, marginTop:24 },
});