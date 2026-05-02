// DetailScreen.js
// Pantalla de detalle de un ejercicio.
// Muestra: estadísticas, historial completo, gráfico, video y notas.
//
// Conceptos nuevos:
// - route.params: así recibimos datos de la pantalla anterior (el ID del ejercicio)
// - ScrollView: como FlatList pero para contenido que no es una lista
// - Linking: para abrir URLs externas (YouTube) en el navegador del teléfono
// - Modal: una ventana flotante sobre la pantalla actual

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Video } from 'expo-av';
import {
  getExerciseById,
  addSet,
  deleteSet,
  deleteExercise,
  calculateStats,
  formatDate,
} from '../storage/exercises';
import SetHistoryItem from '../components/SetHistoryItem';
import colors from '../theme/colors';

export default function DetailScreen({ route, navigation }) {
  // route.params contiene los datos que pasamos al navegar.
  // En HomeScreen hicimos: navigation.navigate('Detail', { exerciseId: item.id })
  // Entonces acá recibimos: route.params.exerciseId
  const { exerciseId } = route.params;

  const [exercise, setExercise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Estado del formulario del modal para agregar un registro
  const [formWeight, setFormWeight] = useState('');
  const [formReps, setFormReps] = useState('');
  const [formSeries, setFormSeries] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Cargamos el ejercicio cada vez que la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      loadExercise();
    }, [])
  );

  async function loadExercise() {
    setIsLoading(true);
    try {
      const data = await getExerciseById(exerciseId);
      if (data) {
        setExercise(data);
        // Configuramos el título de la barra de navegación dinámicamente
        navigation.setOptions({ title: data.name });
      }
    } catch (error) {
      console.error('Error cargando ejercicio:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Guarda un nuevo registro de entrenamiento
  async function handleAddSet() {
    // Validamos que los campos no estén vacíos y sean números válidos
    const weight = parseFloat(formWeight);
    const reps = parseInt(formReps, 10);
    const series = parseInt(formSeries, 10);

    // isNaN(x) → true si x no es un número ("NaN" = Not a Number)
    if (isNaN(weight) || isNaN(reps) || isNaN(series)) {
      Alert.alert('Error', 'Completá todos los campos con números válidos');
      return;
    }

    if (weight <= 0 || reps <= 0 || series <= 0) {
      Alert.alert('Error', 'Los valores deben ser mayores a 0');
      return;
    }

    setIsSaving(true);
    try {
      await addSet(exerciseId, { weight, reps, series });
      // Limpiamos el formulario
      setFormWeight('');
      setFormReps('');
      setFormSeries('');
      setShowAddModal(false);
      // Recargamos el ejercicio para mostrar el nuevo registro
      await loadExercise();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el registro');
    } finally {
      setIsSaving(false);
    }
  }

  // Elimina un registro específico
  async function handleDeleteSet(setId) {
    try {
      await deleteSet(exerciseId, setId);
      await loadExercise();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el registro');
    }
  }

  // Elimina el ejercicio completo
  async function handleDeleteExercise() {
    Alert.alert(
      'Eliminar ejercicio',
      `¿Eliminás "${exercise.name}" y todos sus registros? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExercise(exerciseId);
              // goBack() vuelve a la pantalla anterior
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el ejercicio');
            }
          },
        },
      ]
    );
  }

  // Abre la URL del video en el navegador del teléfono
  function handleOpenVideo(url) {
    if (!url) return;
    // Linking.openURL() abre una URL. El sistema del teléfono
    // decide qué app usar (navegador, YouTube app, etc.)
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el link');
    });
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.textSecondary }}>Ejercicio no encontrado</Text>
      </View>
    );
  }

  const { maxWeight, minWeight, lastTen } = calculateStats(exercise.sets);

  // Ordenamos el historial completo de más nuevo a más viejo
  const sortedSets = [...exercise.sets].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const muscleColor = colors.muscleColors[exercise.muscleGroup] || colors.muscleColors['Otro'];

  return (
    <>
      {/* ScrollView permite hacer scroll cuando el contenido es más largo que la pantalla */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header del ejercicio */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={[styles.muscleBadge, { backgroundColor: muscleColor.bg }]}>
              <Text style={[styles.muscleText, { color: muscleColor.text }]}>
                {exercise.muscleGroup}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AddExercise', { exercise })} style={styles.editBtn}>
              <Text style={styles.editBtnText}>✏️ Editar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <Text style={styles.sessionCount}>
            {exercise.sets.length} registro{exercise.sets.length !== 1 ? 's' : ''} en total
          </Text>
        </View>

        {/* Tarjetas de estadísticas */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Peso máximo"
            value={maxWeight !== null ? `${maxWeight} kg` : '—'}
            color={colors.success}
            bgColor={colors.successLight}
            icon="🏆"
          />
          <StatCard
            label="Peso mínimo"
            value={minWeight !== null ? `${minWeight} kg` : '—'}
            color={colors.danger}
            bgColor={colors.dangerLight}
            icon="📉"
          />
        </View>

        {/* Últimos 10 registros - gráfico simple */}
        {lastTen.length > 0 && (
          <SectionCard title={`Últimos ${lastTen.length} registros`}>
            <LastTenChart sets={lastTen} maxW={maxWeight} minW={minWeight} />
          </SectionCard>
        )}

        {/* Video */}
        {(exercise.videoUrl || exercise.videoLocal) && (
          <SectionCard title="Video del ejercicio">
            {exercise.videoUrl && (
              <TouchableOpacity
                style={styles.videoButton}
                onPress={() => handleOpenVideo(exercise.videoUrl)}
              >
                <Text style={styles.videoIcon}>▶️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.videoButtonText}>Ver en YouTube</Text>
                  <Text style={styles.videoUrl} numberOfLines={1}>
                    {exercise.videoUrl}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            {exercise.videoLocal && (
              <View style={styles.videoPlayer}>
                {/* Video es el componente de expo-av para reproducir videos locales */}
                <Video
                  source={{ uri: exercise.videoLocal }}
                  style={styles.videoComponent}
                  useNativeControls           // Muestra los controles nativos del teléfono
                  resizeMode="contain"        // El video se ajusta sin cortarse
                  shouldPlay={false}          // No auto-reproducir
                />
              </View>
            )}
          </SectionCard>
        )}

        {/* Notas / descripción */}
        {exercise.description ? (
          <SectionCard title="Notas y técnica">
            <Text style={styles.description}>{exercise.description}</Text>
          </SectionCard>
        ) : null}

        {/* Historial completo */}
        <SectionCard title="Historial completo">
          {sortedSets.length === 0 ? (
            <Text style={styles.emptyHistory}>
              Todavía no hay registros. ¡Agregá tu primer entrenamiento!
            </Text>
          ) : (
            sortedSets.map(set => (
              <SetHistoryItem
                key={set.id}
                set={set}
                isMax={set.weight === maxWeight}
                isMin={set.weight === minWeight && maxWeight !== minWeight}
                onDelete={handleDeleteSet}
              />
            ))
          )}
        </SectionCard>

        {/* Botón eliminar ejercicio */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteExercise}>
          <Text style={styles.deleteBtnText}>🗑 Eliminar ejercicio</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón flotante para agregar registro */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Registrar peso</Text>
      </TouchableOpacity>

      {/* Modal para agregar registro */}
      {/* Modal muestra una ventana flotante encima de la pantalla */}
      <Modal
        visible={showAddModal}
        animationType="slide"          // Animación de slide desde abajo
        transparent={true}             // El fondo es transparente (se ve la pantalla detrás)
        onRequestClose={() => setShowAddModal(false)}
      >
        {/* KeyboardAvoidingView empuja el contenido hacia arriba cuando aparece el teclado */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar entrenamiento</Text>
            <Text style={styles.modalSubtitle}>{exercise.name}</Text>

            <View style={styles.formRow}>
              <FormField
                label="Peso (kg)"
                value={formWeight}
                onChangeText={setFormWeight}
                placeholder="Ej: 100"
              />
              <FormField
                label="Series"
                value={formSeries}
                onChangeText={setFormSeries}
                placeholder="Ej: 3"
              />
              <FormField
                label="Reps"
                value={formReps}
                onChangeText={setFormReps}
                placeholder="Ej: 8"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleAddSet}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar registro</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// Sub-componente: tarjeta de estadística
function StatCard({ label, value, color, bgColor, icon }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// Sub-componente: contenedor de sección con título
function SectionCard({ title, children }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// Sub-componente: gráfico de barras de los últimos 10 pesos
function LastTenChart({ sets, maxW, minW }) {
  const ordered = [...sets].reverse();
  const range = maxW - minW || 1;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartBars}>
        {ordered.map((set, i) => {
          const pct = (set.weight - minW) / range;
          const barH = Math.max(8, Math.round(pct * 80));
          const isMax = set.weight === maxW;

          return (
            <View key={set.id} style={styles.chartBarWrapper}>
              <Text style={styles.chartBarLabel}>{set.weight}</Text>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: barH,
                    backgroundColor: isMax ? colors.primary : colors.primaryLight,
                    borderColor: colors.primary,
                  },
                ]}
              />
              <Text style={styles.chartBarDate}>
                {new Date(set.date).getDate()}/{new Date(set.date).getMonth() + 1}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Sub-componente: campo del formulario
function FormField({ label, value, onChangeText, placeholder }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        keyboardType="numeric"     // Muestra el teclado numérico directamente
        returnKeyType="next"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: colors.card,
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  muscleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  muscleText: { fontSize: 12, fontWeight: '600' },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: { fontSize: 13, color: colors.textSecondary },
  exerciseName: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  sessionCount: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  sectionCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  chartContainer: { overflow: 'hidden' },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 110,
    gap: 6,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarLabel: { fontSize: 9, color: colors.textSecondary, marginBottom: 3 },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    borderWidth: 1,
    minHeight: 8,
  },
  chartBarDate: { fontSize: 8, color: colors.textLight, marginTop: 3 },

  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  videoIcon: { fontSize: 24 },
  videoButtonText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  videoUrl: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  videoPlayer: { borderRadius: 10, overflow: 'hidden', marginTop: 8 },
  videoComponent: { width: '100%', height: 200 },

  description: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },

  emptyHistory: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 14,
    paddingVertical: 16,
  },

  deleteBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  deleteBtnText: { color: colors.danger, fontWeight: '600', fontSize: 15 },

  fab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  formField: { flex: 1 },
  formLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6, fontWeight: '500' },
  formInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});