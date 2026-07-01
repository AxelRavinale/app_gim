// src/components/RoleSwitcher.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useSession } from '../../App';

const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

const ROLE_CONFIG = {
  superadmin: { label:'Super Admin', icon:'⚡', color:'#A78BFA' },
  gym_owner:  { label:'Gimnasio',    icon:'🏢', color:'#E8B500' },
  trainer:    { label:'Entrenador',  icon:'🎓', color:'#22C55E' },
  member:     { label:'Alumno',      icon:'👤', color:'#60A5FA' },
};

const ROLE_DESC = {
  superadmin: 'Panel global de gestión',
  gym_owner:  'Administración del gimnasio',
  trainer:    'Rutinas y alumnos',
  member:     'Mi entrenamiento y cuota',
};

export default function RoleSwitcher() {
  const { colors }   = useTheme();
  const { user, updateUser } = useSession() || {};
  const s = makeStyles(colors);

  const [showModal, setShowModal] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Normalizar roles
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : typeof user?.roles === 'string'
      ? (() => { try { return JSON.parse(user.roles); } catch { return [user?.role||'member']; } })()
      : [user?.role || 'member'];

  // Solo mostrar si tiene más de un rol
  if (!user || roles.length <= 1) return null;

  const activeRole = user.activeRole || user.active_role || user.role || 'member';
  const current    = ROLE_CONFIG[activeRole] || ROLE_CONFIG.member;

  async function handleSwitch(role) {
    if (role === activeRole) { setShowModal(false); return; }
    setSwitching(true);
    try {
      const token = await AsyncStorage.getItem('gymtracker_access_token');
      const res   = await fetch(`${BASE_URL}/api/auth/switch-role`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body:    JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Error al cambiar rol');
      const data = await res.json();

      // Guardar nuevos tokens
      await AsyncStorage.setItem('gymtracker_access_token',  data.accessToken);
      await AsyncStorage.setItem('gymtracker_refresh_token', data.refreshToken);

      // Actualizar user en context y storage
      const updatedUser = {
        ...(data.user || user),
        activeRole: role,
        role,
        roles,
      };
      await AsyncStorage.setItem('gymtracker_user', JSON.stringify(updatedUser));
      updateUser?.(updatedUser);
      setShowModal(false);
    } catch (err) {
      console.error('Error cambiando rol:', err);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <>
      {/* Botón del rol activo */}
      <TouchableOpacity
        style={[s.trigger, { borderColor: current.color + '55', backgroundColor: current.color + '18' }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.75}
      >
        <Text style={s.triggerIcon}>{current.icon}</Text>
        <Text style={[s.triggerLabel, { color: current.color }]}>{current.label}</Text>
        <Text style={[s.triggerArrow, { color: current.color }]}>▾</Text>
      </TouchableOpacity>

      {/* Modal de selección */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={s.backdrop} onPress={() => !switching && setShowModal(false)}>
          <Pressable style={[s.sheet, { backgroundColor: colors.card }]} onPress={() => {}}>

            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: colors.textPrimary }]}>Cambiar rol</Text>
            <Text style={[s.sheetSub, { color: colors.textSecondary }]}>
              Seleccioná cómo querés usar la app
            </Text>

            {switching ? (
              <View style={s.loadingBox}>
                <ActivityIndicator color={colors.brand} size="large" />
                <Text style={[s.loadingText, { color: colors.textSecondary }]}>Cambiando rol...</Text>
              </View>
            ) : (
              roles.map(role => {
                const cfg    = ROLE_CONFIG[role] || {};
                const active = role === activeRole;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[
                      s.roleOption,
                      { borderColor: active ? cfg.color : colors.border, backgroundColor: active ? cfg.color + '12' : colors.cardAlt || colors.card },
                    ]}
                    onPress={() => handleSwitch(role)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.roleIconWrap, { backgroundColor: (cfg.color || colors.brand) + '20' }]}>
                      <Text style={s.roleIcon}>{cfg.icon || '👤'}</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={[s.roleLabel, { color: active ? cfg.color : colors.textPrimary }]}>
                        {cfg.label || role}
                      </Text>
                      <Text style={[s.roleDesc, { color: colors.textSecondary }]}>
                        {ROLE_DESC[role] || ''}
                      </Text>
                    </View>
                    {active && (
                      <View style={[s.activeBadge, { backgroundColor: cfg.color || colors.brand }]}>
                        <Text style={s.activeBadgeText}>Activo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            <TouchableOpacity
              style={[s.cancelBtn, { borderColor: colors.border }]}
              onPress={() => setShowModal(false)}
              disabled={switching}
            >
              <Text style={[s.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  trigger: {
    flexDirection:'row', alignItems:'center', gap:5,
    paddingHorizontal:10, paddingVertical:5,
    borderRadius:20, borderWidth:1,
  },
  triggerIcon:  { fontSize:13 },
  triggerLabel: { fontSize:11, fontWeight:'700' },
  triggerArrow: { fontSize:9 },

  backdrop: {
    flex:1, backgroundColor:'rgba(0,0,0,0.75)',
    justifyContent:'flex-end',
  },
  sheet: {
    borderTopLeftRadius:24, borderTopRightRadius:24,
    padding:24, paddingBottom:40,
  },
  sheetHandle: {
    width:36, height:4, borderRadius:2,
    backgroundColor:'#333', alignSelf:'center', marginBottom:16,
  },
  sheetTitle: { fontSize:20, fontWeight:'900', marginBottom:4 },
  sheetSub:   { fontSize:13, marginBottom:20 },

  roleOption: {
    flexDirection:'row', alignItems:'center', gap:12,
    padding:14, borderRadius:14, borderWidth:1.5, marginBottom:10,
  },
  roleIconWrap: { width:44, height:44, borderRadius:12, justifyContent:'center', alignItems:'center' },
  roleIcon:     { fontSize:22 },
  roleLabel:    { fontSize:14, fontWeight:'800', marginBottom:2 },
  roleDesc:     { fontSize:11, lineHeight:15 },

  activeBadge: {
    paddingHorizontal:10, paddingVertical:4, borderRadius:20,
  },
  activeBadgeText: { fontSize:10, fontWeight:'800', color:'#000' },

  loadingBox: {
    alignItems:'center', paddingVertical:30, gap:12,
  },
  loadingText: { fontSize:14 },

  cancelBtn: {
    marginTop:8, padding:14, borderRadius:12,
    borderWidth:1, alignItems:'center',
  },
  cancelText: { fontWeight:'700', fontSize:14 },
});