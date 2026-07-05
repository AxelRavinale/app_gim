// src/components/SerieComment.js
// Modal que aparece al terminar una serie para agregar un comentario opcional

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const QUICK_COMMENTS = [
  'Fallé en última rep',
  'Subir peso próxima vez',
  'Bajar peso',
  'Muy fácil',
  'Muy difícil',
  'Técnica mejorada',
  'Sin descanso suficiente',
  'Me quedé corto',
];

export default function SerieComment({
  visible,
  serieNumber,
  weight,
  reps,
  onSave,      // (comment) => void
  onSkip,      // () => void
}) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [comment, setComment] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const inputRef  = useRef(null);

  useEffect(() => {
    if (visible) {
      setComment('');
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true,
        tension: 100, friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300, duration: 200, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  function handleSave() {
    onSave(comment.trim());
    setComment('');
  }

  function handleSkip() {
    onSkip();
    setComment('');
  }

  function handleQuick(text) {
    setComment(text);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={handleSkip} />
        <Animated.View style={[s.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}>

          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <View style={[s.serieBadge, { backgroundColor: 'rgba(232,181,0,0.15)' }]}>
              <Text style={[s.serieBadgeText, { color: colors.brand }]}>Serie {serieNumber}</Text>
            </View>
            <Text style={[s.serieStats, { color: colors.textSecondary }]}>
              {weight > 0 ? `${weight} kg` : ''}{weight > 0 && reps > 0 ? ' · ' : ''}{reps > 0 ? `${reps} reps` : ''}
            </Text>
          </View>

          <Text style={[s.title, { color: colors.textPrimary }]}>¿Querés agregar una nota?</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>
            Opcional — podés registrar cómo te sentiste, si fallaste una rep, etc.
          </Text>

          {/* Quick comments */}
          <View style={s.quickRow}>
            {QUICK_COMMENTS.map(q => (
              <TouchableOpacity
                key={q}
                style={[s.quickChip, {
                  backgroundColor: comment === q ? 'rgba(232,181,0,0.2)' : colors.background,
                  borderColor: comment === q ? colors.brand : colors.border,
                }]}
                onPress={() => handleQuick(comment === q ? '' : q)}
              >
                <Text style={[s.quickText, { color: comment === q ? colors.brand : colors.textSecondary }]}>
                  {q}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input libre */}
          <TextInput
            ref={inputRef}
            style={[s.input, { color: colors.textPrimary, borderColor: comment ? colors.brand : colors.border, backgroundColor: colors.background }]}
            value={comment}
            onChangeText={setComment}
            placeholder="O escribí tu propia nota..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={200}
            returnKeyType="done"
          />

          {/* Botones */}
          <View style={s.buttons}>
            <TouchableOpacity
              style={[s.btnSkip, { borderColor: colors.border }]}
              onPress={handleSkip}
            >
              <Text style={[s.btnSkipText, { color: colors.textSecondary }]}>Saltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnSave, { backgroundColor: colors.brand }]}
              onPress={handleSave}
            >
              <Text style={[s.btnSaveText, { color: '#0A0A0A' }]}>
                {comment ? '✓ Guardar nota' : '✓ Sin nota'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    gap: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#333', alignSelf: 'center', marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  serieBadge: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  serieBadgeText: { fontSize: 13, fontWeight: '800' },
  serieStats:     { fontSize: 13 },

  title:    { fontSize: 17, fontWeight: '900' },
  subtitle: { fontSize: 13, lineHeight: 18 },

  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 7,
  },
  quickChip: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  quickText: { fontSize: 12, fontWeight: '600' },

  input: {
    borderWidth: 1, borderRadius: 12,
    padding: 12, fontSize: 13,
    minHeight: 60, textAlignVertical: 'top',
  },

  buttons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnSkip: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
  btnSkipText:  { fontWeight: '700', fontSize: 14 },
  btnSave: {
    flex: 2, padding: 14, borderRadius: 12,
    alignItems: 'center',
  },
  btnSaveText: { fontWeight: '900', fontSize: 15 },
});