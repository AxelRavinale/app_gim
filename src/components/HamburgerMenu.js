// src/components/HamburgerMenu.js
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Animated, Platform, StatusBar,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const DEFAULT_ITEMS = [
  { id: 'ExercisesTab',    icon: '🏋️', label: 'Ejercicios' },
  { id: 'RoutinesTab',     icon: '📋', label: 'Rutinas' },
  { id: 'StatsTab',        icon: '📊', label: 'Stats' },
  { id: 'TimerTab',        icon: '⏱️', label: 'Timer' },
  { id: 'AchievementsTab', icon: '🏆', label: 'Logros' },
  { id: 'SettingsTab',     icon: '⚙️', label: 'Ajustes' },
];

// Cada item puede tener:
//   id      → navega a esa tab/screen con navigation.navigate(id)
//   onPress → función custom que se ejecuta al tocar (para abrir modales, etc.)
//   icon, label → visuales
//   divider → si es true, muestra un separador antes del item

export default function HamburgerMenu({
  navigation, currentTab, items, onLogout, title = 'GT', subtitle = 'Personal'
}) {
  const MENU_ITEMS = items || DEFAULT_ITEMS;
  const { colors } = useTheme();
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

  function handleItem(item) {
    closeMenu();
    setTimeout(() => {
      if (item.onPress) {
        item.onPress();
      } else if (item.id) {
        navigation.navigate(item.id);
      }
    }, 200);
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
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeMenu} />

        <Animated.View style={[
          styles.panel,
          { backgroundColor: colors.card, transform: [{ translateX: slideAnim }] }
        ]}>
          {/* Header */}
          <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.panelTitle, { color: colors.brand }]}>{title}</Text>
            <Text style={[styles.panelSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            <TouchableOpacity onPress={closeMenu} style={styles.closeBtn}>
              <Text style={{ fontSize: 22, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Items */}
          <View style={styles.menuItems}>
            {MENU_ITEMS.map((item, index) => {
              if (item.divider) {
                return (
                  <View key={`divider-${index}`} style={[styles.divider, { borderColor: colors.border }]}>
                    {item.label && (
                      <Text style={{ fontSize:9, fontWeight:'800', color: colors.textSecondary, letterSpacing:1.5 }}>
                        {item.label}
                      </Text>
                    )}
                  </View>
                );
              }

              const isActive = currentTab === item.id;
              return (
                <TouchableOpacity
                  key={item.id || `item-${index}`}
                  onPress={() => handleItem(item)}
                  activeOpacity={0.7}
                  style={[
                    styles.menuItem,
                    { borderColor: colors.border },
                    isActive && { backgroundColor: 'rgba(232,181,0,0.08)', borderColor: 'rgba(232,181,0,0.2)' },
                    item.accent && { backgroundColor: `${item.accent}10`, borderColor: `${item.accent}30` },
                  ]}
                >
                  <View style={[
                    styles.menuIcon,
                    { backgroundColor: isActive ? 'rgba(232,181,0,0.15)' : colors.background },
                    item.accent && { backgroundColor: `${item.accent}18` },
                  ]}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  </View>
                  <Text style={[
                    styles.menuLabel,
                    { color: item.accent || (isActive ? colors.brand : colors.textPrimary) },
                    isActive && { fontWeight: '800' },
                  ]}>
                    {item.label}
                  </Text>
                  {isActive && !item.accent && (
                    <View style={[styles.activeIndicator, { backgroundColor: colors.brand }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cerrar sesión */}
          {onLogout && (
            <TouchableOpacity
              onPress={() => { closeMenu(); setTimeout(() => onLogout?.(), 300); }}
              style={[styles.logoutBtn, { borderColor: 'rgba(239,68,68,0.3)' }]}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 18 }}>🚪</Text>
              <Text style={[styles.logoutText, { color: '#EF4444' }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn:       { padding: 8, gap: 5, justifyContent: 'center' },
  line:      { width: 22, height: 2.5, borderRadius: 2 },
  lineMiddle:{ width: 16 },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  panel: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 280,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10 || 30,
    shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 20,
  },
  panelHeader: {
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 0.5, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  panelTitle:    { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  panelSubtitle: { fontSize: 13, flex: 1 },
  closeBtn:      { padding: 4 },
  menuItems:     { flex: 1, paddingHorizontal: 12, paddingTop: 8, gap: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 12, borderRadius: 14, borderWidth: 0.5, position: 'relative',
  },
  menuIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
  activeIndicator: {
    width: 4, height: 28, borderRadius: 2,
    position: 'absolute', right: 0, top: '50%', marginTop: -14,
  },
  divider: {
    borderTopWidth: 0.5, marginVertical: 6,
    marginHorizontal: 4, paddingTop: 10,
  },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    margin: 16, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});