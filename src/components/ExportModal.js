import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { shareExerciseAsText, shareAllAsText, exportExerciseAsCSV, exportAllAsCSV, exportExerciseAsPDF, exportAllAsPDF } from '../utils/exportUtils';

export default function ExportModal({ visible, onClose, exercise, exercises = [] }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [loading, setLoading] = useState(null);
  const isGlobal = exercise === null;

  async function handleExport(type) {
    setLoading(type);
    try {
      if (type === 'text') { if (isGlobal) await shareAllAsText(exercises); else await shareExerciseAsText(exercise); }
      else if (type === 'csv') { if (isGlobal) await exportAllAsCSV(exercises); else await exportExerciseAsCSV(exercise); }
      else if (type === 'pdf') { if (isGlobal) await exportAllAsPDF(exercises); else await exportExerciseAsPDF(exercise); }
      onClose();
    } catch (error) {
      Alert.alert('Error al exportar', error.message || 'Intentá de nuevo.');
    } finally { setLoading(null); }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={s.container}>
        <View style={s.handle} />
        <Text style={s.title}>{isGlobal ? 'Exportar todo' : `Exportar "${exercise?.name}"`}</Text>
        <Text style={s.subtitle}>
          {isGlobal ? `${exercises.length} ejercicios · ${exercises.reduce((a, e) => a + e.sets.length, 0)} sesiones` : `${exercise?.sets?.length || 0} sesiones registradas`}
        </Text>
        <View style={s.optionsContainer}>
          {[
            { type: 'text', icon: '💬', title: 'Compartir como texto', desc: 'Para WhatsApp, email o cualquier app', color: '#25D366' },
            { type: 'csv',  icon: '📊', title: 'Exportar como CSV',    desc: 'Para Excel o Google Sheets',          color: '#217346' },
            { type: 'pdf',  icon: '📄', title: 'Exportar reporte HTML', desc: 'Reporte visual para imprimir',        color: colors.danger },
          ].map(opt => (
            <TouchableOpacity key={opt.type} style={[s.option, { borderColor: opt.color + '40' }]} onPress={() => handleExport(opt.type)} disabled={loading === opt.type} activeOpacity={0.7}>
              <View style={[s.optionIcon, { backgroundColor: opt.color + '20' }]}>
                {loading === opt.type ? <ActivityIndicator color={opt.color} size="small" /> : <Text style={s.optionIconText}>{opt.icon}</Text>}
              </View>
              <View style={s.optionInfo}>
                <Text style={[s.optionTitle, { color: opt.color }]}>{opt.title}</Text>
                <Text style={s.optionDesc}>{opt.desc}</Text>
              </View>
              <Text style={[s.optionArrow, { color: opt.color }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
          <Text style={s.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  container: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
  optionsContainer: { gap: 10, marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, backgroundColor: colors.background, gap: 14 },
  optionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  optionIconText: { fontSize: 22 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  optionDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  optionArrow: { fontSize: 22 },
  cancelBtn: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
});