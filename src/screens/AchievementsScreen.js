import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ACHIEVEMENTS_CATALOG, getUnlockedAchievements, getAchievementStats } from '../storage/achievements';
import { useTheme } from '../theme/ThemeContext';

const GYM_NAME = 'GymTracker';

export default function AchievementsScreen() {
  const { colors, isDark } = useTheme();
  const s = makeStyles(colors);
  const [unlockedList, setUnlockedList] = useState([]);
  const [stats, setStats]               = useState(null);
  const [isLoading, setIsLoading]       = useState(true);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setIsLoading(true);
    const [unlocked, st] = await Promise.all([getUnlockedAchievements(), getAchievementStats()]);
    setUnlockedList(unlocked); setStats(st); setIsLoading(false);
  }

  const unlockedMap = {};
  unlockedList.forEach(a => { unlockedMap[a.id] = a; });

  const categories = {};
  Object.values(ACHIEVEMENTS_CATALOG).forEach(a => {
    if (!categories[a.category]) categories[a.category] = [];
    categories[a.category].push(a);
  });

  const categoryIcons = { 'Primeros pasos': '⭐', 'Récords': '🏆', 'Constancia': '🔥', 'Rutinas': '📋', 'Variedad': '🦾' };

  if (isLoading) return <View style={s.centered}><ActivityIndicator color={colors.brand} size="large" /></View>;

  const completionPct = stats ? Math.round((stats.totalUnlocked / stats.totalPossible) * 100) : 0;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.gymName}>{GYM_NAME.toUpperCase()}</Text>
        <Text style={s.title}>Logros</Text>
      </View>

      {/* Tarjeta de puntos */}
      <View style={s.pointsCard}>
        <View style={s.pointsTop}>
          <View>
            <Text style={s.pointsLabel}>PUNTOS TOTALES</Text>
            <Text style={s.pointsValue}>{stats?.points ?? 0}</Text>
          </View>
          <View style={s.pointsCircle}>
            <Text style={s.pointsCircleText}>{completionPct}%</Text>
            <Text style={s.pointsCircleSub}>logros</Text>
          </View>
        </View>
        <View style={[s.pointsBar, { backgroundColor: colors.border }]}>
          <View style={[s.pointsBarFill, { width: `${completionPct}%` }]} />
        </View>
        <Text style={s.pointsBarLabel}>{stats?.totalUnlocked ?? 0} de {stats?.totalPossible ?? 0} logros desbloqueados</Text>

        {/* Mini stats por categoria */}
        <View style={s.miniStats}>
          {Object.entries(categories).map(([cat, achs]) => {
            const unlockedInCat = achs.filter(a => unlockedMap[a.id]).length;
            return (
              <View key={cat} style={s.miniStat}>
                <Text style={s.miniStatIcon}>{categoryIcons[cat] || '🎯'}</Text>
                <Text style={s.miniStatValue}>{unlockedInCat}/{achs.length}</Text>
                <Text style={s.miniStatLabel}>{cat}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Logros por categoria */}
      {Object.entries(categories).map(([category, achievements]) => (
        <View key={category} style={s.categorySection}>
          <View style={s.categoryHeader}>
            <Text style={s.categoryIcon}>{categoryIcons[category] || '🎯'}</Text>
            <Text style={s.categoryTitle}>{category.toUpperCase()}</Text>
          </View>

          <View style={s.achievementsGrid}>
            {achievements.map(achievement => {
              const unlocked = unlockedMap[achievement.id];
              const isUnlocked = !!unlocked;
              return (
                <View
                  key={achievement.id}
                  style={[
                    s.achCard,
                    isUnlocked
                      ? { borderColor: colors.brand, backgroundColor: colors.brandLight + '60' }
                      : { borderColor: colors.border, opacity: 0.5 },
                  ]}
                >
                  {/* Icono */}
                  <View style={[s.achIconWrap, { backgroundColor: isUnlocked ? colors.brandLight : colors.cardAlt }]}>
                    <Text style={[s.achIcon, !isUnlocked && { opacity: 0.4 }]}>{achievement.icon}</Text>
                    {isUnlocked && <View style={s.unlockedDot} />}
                  </View>

                  <Text style={[s.achTitle, { color: isUnlocked ? colors.textPrimary : colors.textLight }]} numberOfLines={2}>
                    {achievement.title}
                  </Text>
                  <Text style={[s.achDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {achievement.description.replace('{exerciseName}', unlocked?.data?.exerciseName || '...')}
                  </Text>

                  <View style={[s.achPtsBadge, { backgroundColor: isUnlocked ? colors.brand : colors.border }]}>
                    <Text style={[s.achPtsText, { color: isUnlocked ? colors.textOnBrand : colors.textLight }]}>
                      {isUnlocked ? '✓ ' : ''}{achievement.points} pts
                    </Text>
                  </View>

                  {isUnlocked && unlocked.unlockedAt && (
                    <Text style={s.achDate}>
                      {new Date(unlocked.unlockedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                    </Text>
                  )}
                  {!isUnlocked && <Text style={s.lockIcon}>🔒</Text>}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { backgroundColor: colors.card, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  gymName: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },

  pointsCard: { margin: 16, backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.brand + '44', shadowColor: colors.brand, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  pointsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pointsLabel: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 1.5, marginBottom: 4 },
  pointsValue: { fontSize: 52, fontWeight: '900', color: colors.brand, letterSpacing: -2, lineHeight: 56 },
  pointsCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: colors.brand, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.brandLight },
  pointsCircleText: { fontSize: 18, fontWeight: '900', color: colors.brand },
  pointsCircleSub: { fontSize: 9, color: colors.brand, fontWeight: '700' },
  pointsBar: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  pointsBarFill: { height: '100%', borderRadius: 3, backgroundColor: colors.brand },
  pointsBarLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 16 },
  miniStats: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 14 },
  miniStat: { flex: 1, alignItems: 'center', gap: 2 },
  miniStatIcon: { fontSize: 18 },
  miniStatValue: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  miniStatLabel: { fontSize: 9, color: colors.textSecondary, textAlign: 'center' },

  categorySection: { paddingHorizontal: 16, marginBottom: 8 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 12 },
  categoryIcon: { fontSize: 18 },
  categoryTitle: { fontSize: 11, fontWeight: '800', color: colors.brand, letterSpacing: 1.5 },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achCard: { width: '47%', backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1.5, alignItems: 'center', gap: 6 },
  achIconWrap: { width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  achIcon: { fontSize: 28 },
  unlockedDot: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.card },
  achTitle: { fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 17 },
  achDesc: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  achPtsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  achPtsText: { fontSize: 11, fontWeight: '800' },
  achDate: { fontSize: 9, color: colors.brand, fontWeight: '600' },
  lockIcon: { fontSize: 14, position: 'absolute', top: 8, right: 8 },
});