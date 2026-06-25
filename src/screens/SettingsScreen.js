import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  ScrollView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useSession } from '../../App';

const GYM_NAME = 'GymTracker';

export default function SettingsScreen() {
  const { colors, isDark, themePreference, setThemePreference, toggleTheme } = useTheme();
  const { logout } = useSession();
  const s = makeStyles(colors);
  const [loggingOut, setLoggingOut] = useState(false);

  const themeOptions = [
    { value: 'system', label: 'Seguir el sistema', desc: 'Cambia automáticamente', icon: '📱' },
    { value: 'light',  label: 'Tema claro',         desc: 'Siempre claro',          icon: '☀️' },
    { value: 'dark',   label: 'Tema oscuro',         desc: 'Siempre oscuro',         icon: '🌙' },
  ];

  function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar sesión? Tus datos locales se mantienen en el teléfono.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await logout();
            setLoggingOut(false);
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={s.header}>
        <Text style={s.gymName}>{GYM_NAME.toUpperCase()}</Text>
        <Text style={s.title}>Ajustes</Text>
      </View>

      <View style={s.gymCard}>
        <View style={s.gymIconWrap}><Text style={s.gymIcon}>💪</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.gymCardName}>{GYM_NAME}</Text>
          <Text style={s.gymCardSub}>Perfil del gimnasio</Text>
        </View>
        <View style={[s.gymBadge, { backgroundColor: colors.brandLight }]}>
          <Text style={[s.gymBadgeText, { color: colors.brand }]}>Personal</Text>
        </View>
      </View>

      <SectionTitle title="APARIENCIA" colors={colors} />
      <View style={s.card}>
        <View style={s.settingRow}>
          <View style={s.settingLeft}>
            <Text style={s.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
            <View>
              <Text style={s.settingLabel}>{isDark ? 'Modo oscuro' : 'Modo claro'}</Text>
              <Text style={s.settingDesc}>Tocá para cambiar rápidamente</Text>
            </View>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.brand }} thumbColor="#fff" />
        </View>
      </View>

      <Text style={s.subLabel}>PREFERENCIA DE TEMA</Text>
      <View style={s.card}>
        {themeOptions.map((option, index) => {
          const isSelected = themePreference === option.value;
          return (
            <TouchableOpacity key={option.value}
              style={[s.themeOption, index < themeOptions.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }, isSelected && { backgroundColor: colors.brandLight }]}
              onPress={() => setThemePreference(option.value)} activeOpacity={0.7}
            >
              <Text style={s.themeOptionIcon}>{option.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.themeOptionLabel, isSelected && { color: colors.brand, fontWeight: '800' }]}>{option.label}</Text>
                <Text style={s.themeOptionDesc}>{option.desc}</Text>
              </View>
              <View style={[s.radio, { borderColor: isSelected ? colors.brand : colors.border }, isSelected && { backgroundColor: colors.brand }]}>
                {isSelected && <View style={s.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionTitle title="SOBRE LA APP" colors={colors} />
      <View style={s.card}>
        <InfoRow label="Versión"        value="1.0.0"               colors={colors} />
        <InfoRow label="Stack"          value="React Native + Expo" colors={colors} />
        <InfoRow label="Almacenamiento" value="Local + Nube"        colors={colors} last />
      </View>

      <SectionTitle title="CUENTA" colors={colors} />
      <TouchableOpacity style={[s.logoutBtn, { borderColor: colors.danger }]}
        onPress={handleLogout} disabled={loggingOut} activeOpacity={0.75}>
        {loggingOut
          ? <ActivityIndicator color={colors.danger} size="small" />
          : <Text style={[s.logoutBtnText, { color: colors.danger }]}>🚪 Cerrar sesión</Text>
        }
      </TouchableOpacity>

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
  gymCard: { margin: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.brand + '33' },
  gymIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center' },
  gymIcon: { fontSize: 24 },
  gymCardName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  gymCardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  gymBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  gymBadgeText: { fontSize: 11, fontWeight: '700' },
  subLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 8, marginTop: 14 },
  card: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 16, borderWidth: 0.5, borderColor: colors.border, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { fontSize: 24 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  settingDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  themeOption: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  themeOptionIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  themeOptionLabel: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  themeOptionDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  logoutBtn: { marginHorizontal: 16, marginTop: 4, padding: 16, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.08)' },
  logoutBtnText: { fontSize: 15, fontWeight: '800' },
});