// src/components/RoleSwitcher.js
// Selector de rol que aparece en la parte superior de la app
// Solo se muestra si el usuario tiene más de un rol

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Pressable, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

const ROLE_CONFIG = {
  superadmin: { label: 'Super Admin', icon: '⚡', color: '#A78BFA' },
  gym_owner:  { label: 'Gimnasio',    icon: '🏢', color: '#E8B500' },
  trainer:    { label: 'Entrenador',  icon: '🎓', color: '#22C55E' },
  member:     { label: 'Alumno',      icon: '👤', color: '#60A5FA' },
};

export default function RoleSwitcher({ user, onRoleChange }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [showModal, setShowModal] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Si tiene un solo rol no mostramos nada
  if (!user || !user.roles || user.roles.length <= 1) return null;

  const current = ROLE_CONFIG[user.activeRole] || ROLE_CONFIG[user.role] || {};

  async function handleSwitch(role) {
    if (role === user.activeRole) { setShowModal(false); return; }
    setSwitching(true);
    try {
      const token = await AsyncStorage.getItem('gymtracker_access_token');
      const res   = await fetch(`${BASE_URL}/api/auth/switch-role`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ role }),
      });

      if (!res.ok) throw new Error('Error al cambiar rol');

      const data = await res.json();

      // Guardar nuevos tokens
      await AsyncStorage.setItem('gymtracker_access_token', data.accessToken);
      await AsyncStorage.setItem('gymtracker_refresh_token', data.refreshToken);

      setShowModal(false);
      // Notificar al padre para que recargue la interfaz
      onRoleChange({ ...user, activeRole: role, role });
    } catch (err) {
      console.error('Error cambiando rol:', err);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <>
      {/* Botón del rol activo */}
      <TouchableOpacity style={s.trigger} onPress={() => setShowModal(true)} activeOpacity={0.75}>
        <Text style={s.triggerIcon}>{current.icon}</Text>
        <Text style={[s.triggerLabel, { color: current.color || colors.brand }]}>
          {current.label}
        </Text>
        <Text style={s.triggerArrow}>▾</Text>
      </TouchableOpacity>

      {/* Modal de selección */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={s.backdrop} onPress={() => setShowModal(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Cambiar rol</Text>
            <Text style={s.sheetSub}>Seleccioná cómo querés usar la app ahora</Text>

            {switching ? (
              <View style={s.loadingBox}>
                <ActivityIndicator color={colors.brand} />
                <Text style={s.loadingText}>Cambiando rol...</Text>
              </View>
            ) : (
              user.roles.map(role => {
                const cfg    = ROLE_CONFIG[role] || {};
                const active = role === (user.activeRole || user.role);
                return (
                  <TouchableOpacity
                    key={role}
                    style={[s.roleOption, active && { borderColor: cfg.color || colors.brand, backgroundColor: (cfg.color || colors.brand) + '15' }]}
                    onPress={() => handleSwitch(role)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.roleIconWrap, { backgroundColor: (cfg.color || colors.brand) + '20' }]}>
                      <Text style={s.roleIcon}>{cfg.icon || '👤'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.roleLabel, active && { color: cfg.color || colors.brand }]}>
                        {cfg.label || role}
                      </Text>
                      <Text style={s.roleDesc}>{getRoleDesc(role)}</Text>
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

            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
              <Text style={s.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function getRoleDesc(role) {
  const descs = {
    superadmin: 'Panel global de gestión de gimnasios',
    gym_owner:  'Administración: pagos, alumnos, ingresos',
    trainer:    'Rutinas, ejercicios y seguimiento de alumnos',
    member:     'Entrenamiento, progreso y rutinas asignadas',
  };
  return descs[role] || '';
}

const makeStyles = (colors) => StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: colors.cardAlt, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  triggerIcon:  { fontSize: 14 },
  triggerLabel: { fontSize: 12, fontWeight: '700' },
  triggerArrow: { fontSize: 10, color: colors.textSecondary, marginLeft: 2 },

  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  sheetTitle: {
    fontSize: 18, fontWeight: '900', color: colors.textPrimary,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: 13, color: colors.textSecondary, marginBottom: 20,
  },

  roleOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.cardAlt, marginBottom: 10,
  },
  roleIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  roleIcon:  { fontSize: 22 },
  roleLabel: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  roleDesc:  { fontSize: 11, color: colors.textSecondary, lineHeight: 15 },

  activeBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '800', color: '#000' },

  loadingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, justifyContent: 'center',
  },
  loadingText: { color: colors.textSecondary, fontSize: 14 },

  cancelBtn: {
    marginTop: 8, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelText: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
});