import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';
import { saveExercise, updateExercise, MUSCLE_GROUPS, TRACKING_TYPES } from '../storage/exercises';
import { useTheme } from '../theme/ThemeContext';

const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

const ANIMATION_SYSTEM_PROMPT = `Sos un generador de animaciones SVG para ejercicios de gimnasio.
Cuando el usuario describe un ejercicio, generás UN ÚNICO bloque SVG animado que simule el movimiento del cuerpo humano realizando ese ejercicio.

REGLAS ESTRICTAS:
- Respondé SOLO con el código SVG, sin texto adicional, sin markdown, sin backticks
- El SVG debe tener viewBox="0 0 300 400" width="300" height="400"
- Usá figuras simples (círculos, rectángulos, líneas, polígonos) para representar el cuerpo
- Fondo: negro (#0A0A0A). Cuerpo: dorado (#E8B500). Articulaciones: blanco (#fff). Músculos activos: naranja (#FF6B35)
- SIEMPRE incluí animaciones CSS con @keyframes dentro de <style> para simular el movimiento
- El ciclo de animación debe durar entre 1.5s y 3s y repetirse infinitamente (animation-iteration-count: infinite)
- Dibujá: cabeza (círculo), torso (rectángulo), brazos y piernas (rectángulos o líneas)
- Mostrá claramente qué músculos se activan con color naranja durante el movimiento
- La animación debe mostrar el rango completo del movimiento`;

export default function AddExerciseScreen({ route, navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const editingExercise = route.params?.exercise || null;
  const isEditing = editingExercise !== null;

  const [name, setName]               = useState(editingExercise?.name || '');
  const [muscleGroup, setMuscleGroup] = useState(editingExercise?.muscleGroup || 'Pecho');
  const [trackingType, setTrackingType] = useState(editingExercise?.trackingType || TRACKING_TYPES.WEIGHT);
  const [description, setDescription] = useState(editingExercise?.description || '');
  const [youtubeUrl, setYoutubeUrl]   = useState(editingExercise?.videoUrl || '');
  const [localVideoUri, setLocalVideoUri] = useState(editingExercise?.videoLocal || null);
  const [animationSvg, setAnimationSvg] = useState(editingExercise?.animationSvg || null);
  const [isSaving, setIsSaving]       = useState(false);

  // Estado del generador de animación
  const [showAnimModal, setShowAnimModal] = useState(false);
  const [generatingAnim, setGeneratingAnim] = useState(false);
  const [previewSvg, setPreviewSvg]     = useState(null);
  const [animFeedback, setAnimFeedback] = useState('');
  const [animHistory, setAnimHistory]   = useState([]);
  const [animIteration, setAnimIteration] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Editar ejercicio' : 'Nuevo ejercicio' });
  }, [isEditing]);

  function handleMuscleGroupChange(group) {
    setMuscleGroup(group);
    if (group === 'Cardio') setTrackingType(TRACKING_TYPES.TIME);
  }

  async function handlePickVideo() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 1 });
    if (!result.canceled && result.assets.length > 0) setLocalVideoUri(result.assets[0].uri);
  }

  // ── Generación de animación con IA ────────────────────────────────────────
  async function generateAnimation(feedback = '') {
    if (!description.trim()) {
      Alert.alert('Necesitás una descripción', 'Describí el ejercicio antes de generar la animación.');
      return;
    }
    setGeneratingAnim(true);

    const userMessage = animIteration === 0
      ? `Ejercicio: ${name || 'sin nombre'}\nDescripción: ${description}`
      : `Mejorá la animación anterior. Feedback: ${feedback}\nEjercicio: ${name}\nDescripción: ${description}`;

    const messages = [...animHistory, { role: 'user', content: userMessage }];

    try {
      // Usamos el proxy del backend para evitar exponer la API key en la app
      const token = await AsyncStorage.getItem('gymtracker_access_token');
      const response = await fetch(`${BASE_URL}/api/ai/animation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages, system: ANIMATION_SYSTEM_PROMPT }),
      });

      const data = await response.json();
      const rawSvg = data.content?.[0]?.text || '';
      const svgMatch = rawSvg.match(/<svg[\s\S]*<\/svg>/);
      const cleanSvg = svgMatch ? svgMatch[0] : rawSvg;

      setPreviewSvg(cleanSvg);
      setAnimHistory([...messages, { role: 'assistant', content: cleanSvg }]);
      setAnimIteration(i => i + 1);
      setAnimFeedback('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar la animación. Verificá tu conexión.');
    } finally {
      setGeneratingAnim(false);
    }
  }

  function confirmAnimation() {
    setAnimationSvg(previewSvg);
    setShowAnimModal(false);
    setPreviewSvg(null);
    setAnimHistory([]);
    setAnimIteration(0);
  }

  function openAnimGenerator() {
    if (!description.trim()) {
      Alert.alert('Primero describí el ejercicio', 'La descripción se usa para generar la animación correcta.');
      return;
    }
    setShowAnimModal(true);
    setPreviewSvg(null);
    setAnimHistory([]);
    setAnimIteration(0);
    // Generamos automáticamente al abrir
    setTimeout(() => generateAnimation(), 100);
  }

  // ── Guardar ejercicio ──────────────────────────────────────────────────────
  async function handleSave() {
    if (!name.trim()) { Alert.alert('Error', 'El nombre es obligatorio'); return; }
    if (youtubeUrl && !youtubeUrl.startsWith('http')) { Alert.alert('Error', 'La URL debe empezar con http://'); return; }
    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        muscleGroup,
        trackingType,
        description: description.trim(),
        videoUrl: youtubeUrl.trim(),
        videoLocal: localVideoUri,
        animationSvg,
      };
      if (isEditing) await updateExercise(editingExercise.id, data);
      else await saveExercise(data);
      navigation.goBack();
    } catch { Alert.alert('Error', 'No se pudo guardar.'); } finally { setIsSaving(false); }
  }

  // HTML para el WebView - compatible con Android
  const svgHtml = (svg) => {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    background-color: #0A0A0A;
    width: 100%; height: 100%;
    display: flex; justify-content: center; align-items: center;
    overflow: hidden;
  }
  svg { display: block; }
</style>
</head>
<body>${svg}</body>
</html>`;
    return html;
  };

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Nombre */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>NOMBRE DEL EJERCICIO *</Text>
          <TextInput style={s.input} value={name} onChangeText={setName}
            placeholder="Ej: Press de Banca, Sentadilla..."
            placeholderTextColor={colors.textLight} maxLength={60} />
          <Text style={s.charCount}>{name.length}/60</Text>
        </View>

        {/* Grupo muscular */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>GRUPO MUSCULAR</Text>
          <View style={s.muscleGrid}>
            {MUSCLE_GROUPS.map(group => {
              const isSel = muscleGroup === group;
              const mc = colors.muscleColors[group] || colors.muscleColors['Otro'];
              return (
                <TouchableOpacity key={group}
                  style={[s.muscleBtn, { borderColor: colors.border, backgroundColor: colors.card }, isSel && { backgroundColor: mc.bg, borderColor: mc.text }]}
                  onPress={() => handleMuscleGroupChange(group)}
                >
                  <Text style={[s.muscleBtnText, { color: colors.textSecondary }, isSel && { color: mc.text, fontWeight: '700' }]}>
                    {group}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tipo de tracking */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>TIPO DE REGISTRO</Text>
          <View style={s.trackingRow}>
            {[
              { type: TRACKING_TYPES.WEIGHT, icon: '🏋️', label: 'Peso + Reps', desc: 'Press, Sentadilla...' },
              { type: TRACKING_TYPES.TIME,   icon: '⏱️', label: 'Tiempo',      desc: 'Cinta, Bici...' },
            ].map(opt => {
              const isSel = trackingType === opt.type;
              return (
                <TouchableOpacity key={opt.type}
                  style={[s.trackingOption, { borderColor: colors.border, backgroundColor: colors.card }, isSel && { borderColor: colors.brand, backgroundColor: colors.brandLight }]}
                  onPress={() => setTrackingType(opt.type)} activeOpacity={0.7}
                >
                  <Text style={s.trackingIcon}>{opt.icon}</Text>
                  <Text style={[s.trackingLabel, { color: colors.textPrimary }, isSel && { color: colors.brand }]}>{opt.label}</Text>
                  <Text style={s.trackingDesc}>{opt.desc}</Text>
                  {isSel && <View style={[s.trackingCheck, { backgroundColor: colors.brand }]}><Text style={{ color: colors.textOnBrand, fontSize: 10, fontWeight: '800' }}>✓</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Descripción */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>DESCRIPCIÓN DEL MOVIMIENTO *</Text>
          <Text style={s.fieldHint}>Describí la técnica en detalle — se usa para generar la animación.</Text>
          <TextInput style={[s.input, s.textArea]} value={description} onChangeText={setDescription}
            placeholder="Posición inicial, músculos que trabajan, rango de movimiento, posición final..."
            placeholderTextColor={colors.textLight} multiline numberOfLines={4}
            textAlignVertical="top" maxLength={500} />
          <Text style={s.charCount}>{description.length}/500</Text>
        </View>

        {/* Animación IA */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>ANIMACIÓN DEL EJERCICIO</Text>

          {animationSvg ? (
            /* Preview de la animación confirmada */
            <View style={s.animPreviewCard}>
              <View style={s.animPreviewHeader}>
                <View style={[s.animBadge, { backgroundColor: colors.brandLight }]}>
                  <Text style={[s.animBadgeText, { color: colors.brand }]}>✓ Animación lista</Text>
                </View>
                <TouchableOpacity onPress={openAnimGenerator} style={s.animEditBtn}>
                  <Text style={[s.animEditBtnText, { color: colors.textSecondary }]}>Cambiar</Text>
                </TouchableOpacity>
              </View>
              <View style={s.animPreviewBox}>
                <WebView
                  source={{ html: svgHtml(animationSvg) }}
                  style={{ width: 160, height: 160, backgroundColor: '#0A0A0A' }}
                  scrollEnabled={false}
                  originWhitelist={['*']}
                  mixedContentMode="always"
                  javaScriptEnabled={true}
                />
              </View>
            </View>
          ) : (
            /* Botón para generar */
            <TouchableOpacity
              style={[s.generateAnimBtn, !description.trim() && { opacity: 0.5 }]}
              onPress={openAnimGenerator}
              disabled={!description.trim()}
            >
              <Text style={s.generateAnimIcon}>✨</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.generateAnimText, { color: colors.brand }]}>Generar animación con IA</Text>
                <Text style={s.generateAnimHint}>
                  {description.trim() ? 'Claude va a crear un SVG animado basado en tu descripción' : 'Primero describí el ejercicio arriba'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* YouTube */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>VIDEO YOUTUBE <Text style={s.optional}>(opcional)</Text></Text>
          <TextInput style={s.input} value={youtubeUrl} onChangeText={setYoutubeUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor={colors.textLight} keyboardType="url"
            autoCapitalize="none" autoCorrect={false} />
        </View>

        {/* Video propio */}
        <View style={s.fieldGroup}>
          <Text style={s.fieldLabel}>VIDEO PROPIO <Text style={s.optional}>(opcional)</Text></Text>
          <TouchableOpacity style={s.videoPickerBtn} onPress={handlePickVideo}>
            <Text style={s.videoPickerIcon}>📹</Text>
            <Text style={[s.videoPickerText, { color: localVideoUri ? colors.success : colors.textSecondary }]}>
              {localVideoUri ? '✅ Video seleccionado' : 'Elegir video de la galería'}
            </Text>
          </TouchableOpacity>
          {localVideoUri && (
            <TouchableOpacity style={s.removeVideoBtn} onPress={() => setLocalVideoUri(null)}>
              <Text style={[s.removeVideoText, { color: colors.danger }]}>✕ Quitar video</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer guardar */}
      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, isSaving && { opacity: 0.6 }]} onPress={handleSave} disabled={isSaving}>
          {isSaving
            ? <ActivityIndicator color={colors.textOnBrand} />
            : <Text style={s.saveBtnText}>{isEditing ? '✓ Guardar cambios' : '✓ Crear ejercicio'}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Modal generador de animación */}
      <Modal visible={showAnimModal} animationType="slide" onRequestClose={() => setShowAnimModal(false)}>
        <View style={[s.animModal, { backgroundColor: colors.background }]}>

          {/* Header modal */}
          <View style={[s.animModalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <View>
              <Text style={[s.animModalTitle, { color: colors.textPrimary }]}>Animación IA</Text>
              <Text style={[s.animModalSubtitle, { color: colors.brand }]}>
                {animIteration === 0 ? 'Generando...' : `Iteración ${animIteration}`}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowAnimModal(false)}
              style={[s.animModalCloseBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>

            {/* Preview SVG */}
            <View style={[s.animSvgPreview, { backgroundColor: '#0A0A0A', borderColor: colors.border }]}>
              {generatingAnim ? (
                <View style={{ padding: 60, alignItems: 'center', gap: 16 }}>
                  <ActivityIndicator color={colors.brand} size="large" />
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {animIteration === 0 ? 'Generando animación...' : 'Mejorando animación...'}
                  </Text>
                </View>
              ) : previewSvg ? (
                <WebView
                  source={{ html: svgHtml(previewSvg) }}
                  style={{ width: 300, height: 400, alignSelf: 'center', backgroundColor: '#0A0A0A' }}
                  scrollEnabled={false}
                  originWhitelist={['*']}
                  mixedContentMode="always"
                  javaScriptEnabled={true}
                />
              ) : null}
            </View>

            {/* Leyenda colores */}
            {previewSvg && !generatingAnim && (
              <View style={s.animLegend}>
                <View style={s.animLegendItem}>
                  <View style={[s.animLegendDot, { backgroundColor: '#E8B500' }]} />
                  <Text style={[s.animLegendText, { color: colors.textSecondary }]}>Cuerpo</Text>
                </View>
                <View style={s.animLegendItem}>
                  <View style={[s.animLegendDot, { backgroundColor: '#FF6B35' }]} />
                  <Text style={[s.animLegendText, { color: colors.textSecondary }]}>Músculos activos</Text>
                </View>
              </View>
            )}

            {/* Feedback para mejorar */}
            {previewSvg && !generatingAnim && (
              <>
                <Text style={[s.fieldLabel, { marginTop: 20 }]}>¿QUÉ MEJORAR?</Text>
                <TextInput
                  style={[s.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card, marginBottom: 12 }]}
                  value={animFeedback}
                  onChangeText={setAnimFeedback}
                  placeholder="Ej: Los brazos no bajan suficiente, mostrá más el movimiento de cadera..."
                  placeholderTextColor={colors.textLight}
                  multiline numberOfLines={2}
                />
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  <TouchableOpacity
                    style={[s.animImproveBtn, { borderColor: colors.border, backgroundColor: colors.card }, !animFeedback.trim() && { opacity: 0.4 }]}
                    onPress={() => generateAnimation(animFeedback)}
                    disabled={!animFeedback.trim() || generatingAnim}
                  >
                    <Text style={[s.animImproveBtnText, { color: colors.textSecondary }]}>↺ Mejorar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.animConfirmBtn, { backgroundColor: colors.brand }]}
                    onPress={confirmAnimation}
                  >
                    <Text style={[s.animConfirmBtnText, { color: colors.textOnBrand }]}>✓ Usar esta animación</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Ejemplos de descripción */}
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>DESCRIPCIÓN ACTUAL</Text>
            <View style={[s.descPreviewBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.descPreviewText, { color: colors.textSecondary }]}>{description}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: 20 },

  fieldGroup: { marginBottom: 24 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: colors.brand, letterSpacing: 1.5, marginBottom: 8 },
  fieldHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 8, marginTop: -4 },
  optional: { color: colors.textLight, fontWeight: '600', letterSpacing: 0 },
  charCount: { fontSize: 11, color: colors.textLight, textAlign: 'right', marginTop: 4 },

  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: colors.textPrimary,
  },
  textArea: { height: 110, paddingTop: 13 },

  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muscleBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  muscleBtnText: { fontSize: 13 },

  trackingRow: { flexDirection: 'row', gap: 12 },
  trackingOption: { flex: 1, borderWidth: 2, borderRadius: 16, padding: 16, alignItems: 'center', position: 'relative' },
  trackingIcon: { fontSize: 28, marginBottom: 8 },
  trackingLabel: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  trackingDesc: { fontSize: 11, color: '#888', textAlign: 'center' },
  trackingCheck: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Animación
  generateAnimBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.brandLight, borderWidth: 1.5, borderColor: colors.brand,
    borderRadius: 14, padding: 16, borderStyle: 'dashed',
  },
  generateAnimIcon: { fontSize: 24 },
  generateAnimText: { fontSize: 14, fontWeight: '800' },
  generateAnimHint: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  animPreviewCard: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.brand + '44' },
  animPreviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  animBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  animBadgeText: { fontSize: 12, fontWeight: '700' },
  animEditBtn: { padding: 6 },
  animEditBtnText: { fontSize: 13, fontWeight: '600' },
  animPreviewBox: { height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0A' },

  videoPickerBtn: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  videoPickerIcon: { fontSize: 22 },
  videoPickerText: { fontSize: 14, fontWeight: '600' },
  removeVideoBtn: { marginTop: 8, alignSelf: 'center', padding: 8 },
  removeVideoText: { fontSize: 13, fontWeight: '600' },

  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.border },
  saveBtn: { backgroundColor: colors.brand, borderRadius: 14, padding: 17, alignItems: 'center', shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnText: { color: colors.textOnBrand, fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },

  // Modal animación
  animModal: { flex: 1 },
  animModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 0.5 },
  animModalTitle: { fontSize: 18, fontWeight: '900' },
  animModalSubtitle: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  animModalCloseBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  animSvgPreview: { borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, marginBottom: 12, minHeight: 200, justifyContent: 'center', alignItems: 'center' },
  animLegend: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginBottom: 8 },
  animLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  animLegendDot: { width: 10, height: 10, borderRadius: 5 },
  animLegendText: { fontSize: 12 },
  animImproveBtn: { flex: 1, padding: 13, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  animImproveBtnText: { fontSize: 13, fontWeight: '700' },
  animConfirmBtn: { flex: 2, padding: 13, borderRadius: 12, alignItems: 'center' },
  animConfirmBtnText: { fontSize: 13, fontWeight: '900' },
  descPreviewBox: { borderRadius: 12, padding: 14, borderWidth: 0.5 },
  descPreviewText: { fontSize: 13, lineHeight: 20 },
});