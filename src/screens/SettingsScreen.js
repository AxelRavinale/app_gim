import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, StatusBar } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useSession } from '../context/SessionContext';

const GYM_NAME = 'GymTracker';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, themePreference, setThemePreference, toggleTheme } = useTheme();
  const { user, logout } = useSession() || {};
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  async function handleSync() {
    setSyncing(true); setSyncResult(null);
    try {
      const localExercises = await getAllExercises();
      if (!localExercises || localExercises.length === 0) {
        Alert.alert('Sin datos', 'No hay ejercicios locales para sincronizar.');
        return;
      }
      const token = await AsyncStorage.getItem('gymtracker_access_token');
      if (!token) {
        Alert.alert('Error', 'No estás autenticado. Cerrá sesión e iniciá de nuevo.');
        return;
      }
      const res = await fetch('https://gimnasio-production-7475.up.railway.app/api/exercises/sync', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ exercises: localExercises }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      const count = data.synced || localExercises.length;
      setSyncResult({ success: true, count });
      Alert.alert('✅ Sincronizado', `${count} ejercicio${count!==1?'s':''} subido${count!==1?'s':''} al servidor.`);
    } catch (err) {
      console.error('Sync error:', err);
      setSyncResult({ success: false });
      Alert.alert('Error de sincronización', err.message || 'No se pudo conectar al servidor');
    } finally { setSyncing(false); }
  }
  const s = makeStyles(colors);

  const themeOptions = [
    { value: 'system', label: 'Seguir el sistema', desc: 'Cambia automáticamente', icon: '📱' },
    { value: 'light',  label: 'Tema claro',        desc: 'Siempre claro',         icon: '☀️' },
    { value: 'dark',   label: 'Tema oscuro',        desc: 'Siempre oscuro',        icon: '🌙' },
  ];

  const activeRole = user?.activeRole || user?.role || 'member';
  const hasGym     = !!user?.gymId || !!user?.gym_id;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.gymName}>{GYM_NAME.toUpperCase()}</Text>
        <Text style={s.title}>Ajustes</Text>
      </View>

      {/* Perfil usuario */}
      {user && (
        <View style={[s.gymCard, { borderColor: colors.brand + '33' }]}>
          <View style={[s.gymIconWrap, { backgroundColor: colors.brand }]}>
            <Text style={s.gymIcon}>
              {(user.firstName?.[0] || user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.gymCardName, { color: colors.textPrimary }]}>
              {user.firstName || user.first_name || ''} {user.lastName || user.last_name || ''}
            </Text>
            <Text style={[s.gymCardSub, { color: colors.textSecondary }]}>{user.email}</Text>
          </View>
          <View style={[s.gymBadge, { backgroundColor: colors.brandLight }]}>
            <Text style={[s.gymBadgeText, { color: colors.brand }]}>{activeRole}</Text>
          </View>
        </View>
      )}

      {/* Unirse a un gimnasio — solo si no tiene gym o es member */}
      {(!hasGym || activeRole === 'member') && (
        <>
          <SectionTitle title="GIMNASIO" colors={colors} />
          <View style={s.card}>
            <TouchableOpacity
              style={s.gymJoinBtn}
              onPress={() => navigation.navigate('JoinGym')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 24 }}>🏋️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.gymJoinTitle, { color: colors.textPrimary }]}>
                  {hasGym ? 'Cambiar de gimnasio' : 'Unirme a un gimnasio'}
                </Text>
                <Text style={[s.gymJoinSub, { color: colors.textSecondary }]}>
                  Ingresá el código que te dio tu entrenador
                </Text>
              </View>
              <Text style={{ color: colors.brand, fontSize: 18 }}>→</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Apariencia */}
      <SectionTitle title="APARIENCIA" colors={colors} />
      <View style={s.card}>
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Text style={s.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
            <View>
              <Text style={[s.settingLabel, { color: colors.textPrimary }]}>{isDark ? 'Modo oscuro' : 'Modo claro'}</Text>
              <Text style={[s.settingDesc, { color: colors.textSecondary }]}>Tocá para cambiar rápidamente</Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.brand }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <Text style={[s.subLabel, { color: colors.textSecondary }]}>PREFERENCIA DE TEMA</Text>
      <View style={s.card}>
        {themeOptions.map((option, index) => {
          const isSelected = themePreference === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                s.themeOption,
                index < themeOptions.length-1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
                isSelected && { backgroundColor: colors.brandLight },
              ]}
              onPress={() => setThemePreference(option.value)}
              activeOpacity={0.7}
            >
              <Text style={s.themeOptionIcon}>{option.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.themeOptionLabel, { color: colors.textPrimary }, isSelected && { color: colors.brand, fontWeight: '800' }]}>{option.label}</Text>
                <Text style={[s.themeOptionDesc, { color: colors.textSecondary }]}>{option.desc}</Text>
              </View>
              <View style={[s.radio, { borderColor: isSelected ? colors.brand : colors.border }, isSelected && { backgroundColor: colors.brand }]}>
                {isSelected && <View style={s.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sobre la app */}
      <SectionTitle title="SOBRE LA APP" colors={colors} />
      <View style={s.card}>
        <InfoRow label="Versión"  value="1.0.0"             colors={colors} />
        <InfoRow label="Stack"    value="React Native + Expo" colors={colors} />
        <InfoRow label="Backend"  value="Railway + PostgreSQL" colors={colors} last />
      </View>

      {/* Panel web */}
      <SectionTitle title="PANEL WEB" colors={colors} />
      <View style={s.card}>
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={async () => {
            const url = 'https://gymtracker-backend-five.vercel.app';
            const supported = await Linking.canOpenURL(url);
            if (supported) await Linking.openURL(url);
            else Alert.alert('Error', 'No se pudo abrir el navegador');
          }}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>🌐</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.logoutText, { color: colors.textPrimary }]}>Ir al panel web</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Gestión completa desde el navegador</Text>
          </View>
          <Text style={{ color: colors.brand, fontSize: 16 }}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 0.5, backgroundColor: colors.border, marginHorizontal: 14 }} />

        <TouchableOpacity
          style={s.logoutBtn}
          onPress={handleSync}
          disabled={syncing}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>{syncing ? '⏳' : '☁️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.logoutText, { color: colors.textPrimary }]}>
              {syncing ? 'Sincronizando...' : 'Subir datos al servidor'}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
              {syncResult?.success
                ? `✅ ${syncResult.count} ejercicio${syncResult.count!==1?'s':''} sincronizado${syncResult.count!==1?'s':''}`
                : 'Exportar ejercicios locales a la web'}
            </Text>
          </View>
          <Text style={{ color: colors.brand, fontSize: 16 }}>↑</Text>
        </TouchableOpacity>
      </View>

      {/* Cerrar sesión */}
      <SectionTitle title="CUENTA" colors={colors} />
      <View style={s.card}>
        <TouchableOpacity
          style={[s.logoutBtn, { borderColor: 'rgba(239,68,68,0.3)' }]}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 18 }}>🚪</Text>
          <Text style={[s.logoutText, { color: '#EF4444' }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SectionTitle({ title, colors }) {
  return <Text style={{ fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, paddingHorizontal: 20, marginTop: 24, marginBottom: 8 }}>{title}</Text>;
}

function InfoRow({ label, value, colors, last }) {
  return (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }, !last && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
      <Text style={{ fontSize: 14, color: colors.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.card, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  gymName: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },

  gymCard: { margin: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1 },
  gymIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  gymIcon: { fontSize: 22, fontWeight: '900', color: '#0A0A0A' },
  gymCardName: { fontSize: 16, fontWeight: '800' },
  gymCardSub: { fontSize: 12, marginTop: 2 },
  gymBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  gymBadgeText: { fontSize: 11, fontWeight: '700' },

  card: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, overflow: 'hidden' },

  gymJoinBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  gymJoinTitle: { fontSize: 15, fontWeight: '700' },
  gymJoinSub: { fontSize: 12, marginTop: 2 },

  subLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 8, marginTop: 14 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { fontSize: 24 },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingDesc: { fontSize: 12, marginTop: 1 },

  themeOption: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  themeOptionIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  themeOptionLabel: { fontSize: 14, fontWeight: '500' },
  themeOptionDesc: { fontSize: 12, marginTop: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderWidth: 1 },
  logoutText: { fontSize: 15, fontWeight: '700' },
});