// src/components/HamburgerMenu.js
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Platform, StatusBar,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useSession } from '../context/SessionContext';

const MENU_ITEMS = [
  { id: 'ExercisesTab',    icon: '🏋️', label: 'Ejercicios' },
  { id: 'RoutinesTab',     icon: '📋', label: 'Rutinas' },
  { id: 'StatsTab',        icon: '📊', label: 'Stats' },
  { id: 'TimerTab',        icon: '⏱️', label: 'Timer' },
  { id: 'AchievementsTab', icon: '🏆', label: 'Logros' },
  { id: 'SettingsTab',     icon: '⚙️', label: 'Ajustes' },
];

export default function HamburgerMenu({ navigation, currentTab }) {
  const { colors } = useTheme();
  const { logout } = useSession() || {};
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;

  function openMenu() {
    setOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0, useNativeDriver: true,
      tension: 100, friction: 12,
    }).start();
  }

  function closeMenu() {
    Animated.timing(slideAnim, {
      toValue: -300, duration: 200, useNativeDriver: true,
    }).start(() => setOpen(false));
  }

  function navigate(tab) {
    closeMenu();
    setTimeout(() => navigation.navigate(tab), 200);
  }

  return (
    <>
      {/* Botón hamburguesa */}
      <TouchableOpacity onPress={openMenu} style={styles.btn} activeOpacity={0.7}>
        <View style={[styles.line, { backgroundColor: colors.textPrimary }]} />
        <View style={[styles.line, styles.lineMiddle, { backgroundColor: colors.textPrimary }]} />
        <View style={[styles.line, { backgroundColor: colors.textPrimary }]} />
      </TouchableOpacity>

      {/* Modal del menú */}
      <Modal visible={open} transparent animationType="none" onRequestClose={closeMenu}>
        {/* Backdrop */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeMenu} />

        {/* Panel lateral */}
        <Animated.View style={[
          styles.panel,
          { backgroundColor: colors.card, transform: [{ translateX: slideAnim }] }
        ]}>
          {/* Header del panel */}
          <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.brand }]}>GT</Text>
            <Text style={[styles.panelSubtitle, { color: colors.textSecondary }]}>Personal</Text>
            <TouchableOpacity onPress={closeMenu} style={styles.closeBtn}>
              <Text style={{ fontSize: 22, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Items del menú */}
          <View style={styles.menuItems}>
            {MENU_ITEMS.map(item => {
              const isActive = currentTab === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigate(item.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.menuItem,
                    { borderColor: colors.border },
                    isActive && { backgroundColor: 'rgba(232,181,0,0.08)', borderColor: 'rgba(232,181,0,0.2)' },
                  ]}
                >
                  <View style={[
                    styles.menuIcon,
                    { backgroundColor: isActive ? 'rgba(232,181,0,0.15)' : colors.background }
                  ]}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  </View>
                  <Text style={[
                    styles.menuLabel,
                    { color: isActive ? colors.brand : colors.textPrimary },
                    isActive && { fontWeight: '800' },
                  ]}>
                    {item.label}
                  </Text>
                  {isActive && (
                    <View style={[styles.activeIndicator, { backgroundColor: colors.brand }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cerrar sesión al fondo */}
          <TouchableOpacity
            onPress={() => { closeMenu(); setTimeout(logout, 300); }}
            style={[styles.logoutBtn, { borderColor: 'rgba(239,68,68,0.3)' }]}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 18 }}>🚪</Text>
            <Text style={[styles.logoutText, { color: '#EF4444' }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 8, gap: 5, justifyContent: 'center',
  },
  line: {
    width: 22, height: 2.5, borderRadius: 2,
  },
  lineMiddle: {
    width: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  panel: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 280,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10 || 30,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
  },
  panelHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  panelTitle: {
    fontSize: 28, fontWeight: '900', letterSpacing: -1,
  },
  panelSubtitle: {
    fontSize: 13, flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  menuItems: {
    flex: 1, paddingHorizontal: 12, paddingTop: 8, gap: 4,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 12, borderRadius: 14, borderWidth: 0.5,
    position: 'relative',
  },
  menuIcon: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: {
    fontSize: 15, fontWeight: '600', flex: 1,
  },
  activeIndicator: {
    width: 4, height: 28, borderRadius: 2,
    position: 'absolute', right: 0, top: '50%', marginTop: -14,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 16, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  logoutText: {
    fontSize: 15, fontWeight: '700',
  },
});