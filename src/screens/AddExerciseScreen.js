// AddExerciseScreen.js
// Pantalla para CREAR un nuevo ejercicio o EDITAR uno existente.
// Es la misma pantalla para ambos casos: si recibimos "exercise" en params,
// estamos editando; si no, estamos creando uno nuevo.
//
// Conceptos nuevos:
// - expo-image-picker: para elegir videos de la galería
// - Formularios controlados: cada campo del form tiene su propio estado

import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { saveExercise, updateExercise } from '../storage/exercises';
import colors from '../theme/colors';

// Lista de grupos musculares disponibles
const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Otro'];

export default function AddExerciseScreen({ route, navigation }) {
  // Si route.params.exercise existe, estamos editando. Si no, creando.
  const editingExercise = route.params?.exercise || null;
  const isEditing = editingExercise !== null;

  // Inicializamos el estado con los datos existentes (si editamos) o vacíos (si creamos)
  const [name, setName] = useState(editingExercise?.name || '');
  const [muscleGroup, setMuscleGroup] = useState(editingExercise?.muscleGroup || 'Pecho');
  const [description, setDescription] = useState(editingExercise?.description || '');
  const [youtubeUrl, setYoutubeUrl] = useState(editingExercise?.videoUrl || '');
  const [localVideoUri, setLocalVideoUri] = useState(editingExercise?.videoLocal || null);
  const [isSaving, setIsSaving] = useState(false);

  // useLayoutEffect es como useEffect pero se ejecuta ANTES de que el componente
  // se dibuje en pantalla. Lo usamos para cambiar el título de la barra de navegación.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Editar ejercicio' : 'Nuevo ejercicio',
    });
  }, [isEditing]);

  // Abre el selector de videos de la galería del teléfono
  async function handlePickVideo() {
    // Primero pedimos permiso para acceder a la galería
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permiso denegado',
        'Necesitamos acceso a tu galería para agregar videos.'
      );
      return;
    }

    // launchImageLibraryAsync abre el selector de medios
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Solo videos
      quality: 1,
    });

    // Si el usuario canceló, result.canceled es true
    if (!result.canceled && result.assets.length > 0) {
      setLocalVideoUri(result.assets[0].uri);
    }
  }

  // Valida y guarda el ejercicio
  async function handleSave() {
    // Trim elimina espacios al principio y al final
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del ejercicio es obligatorio');
      return;
    }

    // Validamos que la URL de YouTube tenga un formato básico correcto
    if (youtubeUrl && !youtubeUrl.startsWith('http')) {
      Alert.alert('Error', 'La URL del video debe empezar con http:// o https://');
      return;
    }

    setIsSaving(true);

    const exerciseData = {
      name: name.trim(),
      muscleGroup,
      description: description.trim(),
      videoUrl: youtubeUrl.trim(),
      videoLocal: localVideoUri,
    };

    try {
      if (isEditing) {
        // Actualizamos el ejercicio existente
        await updateExercise(editingExercise.id, exerciseData);
      } else {
        // Creamos un ejercicio nuevo
        await saveExercise(exerciseData);
      }
      // goBack() vuelve a la pantalla anterior
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el ejercicio. Intentá de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    // KeyboardAvoidingView evita que el teclado tape los campos del formulario
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        // keyboardShouldPersistTaps="handled" permite tocar botones sin cerrar el teclado
      >

        {/* Campo: Nombre */}
        <FormSection title="Nombre del ejercicio *">
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Press de Banca, Sentadilla..."
            placeholderTextColor={colors.textLight}
            maxLength={60}
            returnKeyType="next"
          />
        </FormSection>

        {/* Campo: Grupo muscular */}
        <FormSection title="Grupo muscular">
          {/* Mostramos los grupos como una grilla de botones seleccionables */}
          <View style={styles.muscleGrid}>
            {MUSCLE_GROUPS.map(group => {
              const isSelected = muscleGroup === group;
              const muscleColor = colors.muscleColors[group];

              return (
                <TouchableOpacity
                  key={group}
                  style={[
                    styles.muscleBtn,
                    isSelected && {
                      backgroundColor: muscleColor.bg,
                      borderColor: muscleColor.text,
                    },
                  ]}
                  onPress={() => setMuscleGroup(group)}
                >
                  <Text
                    style={[
                      styles.muscleBtnText,
                      isSelected && { color: muscleColor.text, fontWeight: '600' },
                    ]}
                  >
                    {group}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormSection>

        {/* Campo: Descripción / notas */}
        <FormSection title="Notas y técnica (opcional)">
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Puntos clave de la técnica, consejos, rangos de movimiento..."
            placeholderTextColor={colors.textLight}
            multiline={true}           // Permite múltiples líneas
            numberOfLines={4}
            textAlignVertical="top"    // El texto empieza desde arriba (Android)
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </FormSection>

        {/* Campo: URL de YouTube */}
        <FormSection title="Video de YouTube (opcional)">
          <TextInput
            style={styles.input}
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor={colors.textLight}
            keyboardType="url"         // Teclado optimizado para URLs
            autoCapitalize="none"      // No auto-capitalizar (las URLs son minúsculas)
            autoCorrect={false}        // Sin autocorrección
          />
        </FormSection>

        {/* Campo: Video propio de la galería */}
        <FormSection title="Video propio (opcional)">
          <TouchableOpacity style={styles.videoPickerBtn} onPress={handlePickVideo}>
            <Text style={styles.videoPickerIcon}>📹</Text>
            <Text style={styles.videoPickerText}>
              {localVideoUri ? '✅ Video seleccionado' : 'Elegir video de la galería'}
            </Text>
          </TouchableOpacity>

          {localVideoUri && (
            <TouchableOpacity
              style={styles.removeVideoBtn}
              onPress={() => setLocalVideoUri(null)}
            >
              <Text style={styles.removeVideoText}>✕ Quitar video</Text>
            </TouchableOpacity>
          )}
        </FormSection>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Botón guardar fijo en la parte inferior */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEditing ? '✅ Guardar cambios' : '✅ Crear ejercicio'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Sub-componente: sección del formulario con título
function FormSection({ title, children }) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 20 },

  formSection: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },

  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',    // Permite que los elementos pasen a la siguiente línea
    gap: 8,
  },
  muscleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  muscleBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  videoPickerBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoPickerIcon: { fontSize: 22 },
  videoPickerText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  removeVideoBtn: { marginTop: 8, alignItems: 'center', padding: 8 },
  removeVideoText: { color: colors.danger, fontSize: 13 },

  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});