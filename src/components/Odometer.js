// src/components/Odometer.js
// Odómetro animado estilo contador de auto

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

// Un solo dígito que rueda verticalmente
function OdometerDigit({ digit, color, bgColor, fontSize = 36 }) {
  const animValue = useRef(new Animated.Value(digit)).current;
  const prevDigit = useRef(digit);

  useEffect(() => {
    if (digit !== prevDigit.current) {
      // Animar hacia el nuevo dígito
      Animated.timing(animValue, {
        toValue: digit,
        duration: 300,
        useNativeDriver: true,
      }).start();
      prevDigit.current = digit;
    }
  }, [digit]);

  // Cada dígito ocupa `cellH` de altura
  const cellH = fontSize * 1.3;

  // Mostramos dígito anterior, actual y siguiente para el efecto de rodillo
  const translateY = animValue.interpolate({
    inputRange: [digit - 1, digit, digit + 1],
    outputRange: [cellH, 0, -cellH],
    extrapolate: 'clamp',
  });

  return (
    <View style={[odStyles.digitWrap, {
      width: fontSize * 0.72,
      height: cellH,
      backgroundColor: bgColor,
    }]}>
      <Animated.View style={{ transform: [{ translateY }], alignItems: 'center' }}>
        {/* Dígito de arriba (el que viene) */}
        <Text style={[odStyles.digitText, { fontSize, color, lineHeight: cellH }]}>
          {(digit + 1) % 10}
        </Text>
        {/* Dígito actual */}
        <Text style={[odStyles.digitText, { fontSize, color, lineHeight: cellH }]}>
          {digit}
        </Text>
        {/* Dígito de abajo (el anterior) */}
        <Text style={[odStyles.digitText, { fontSize, color, lineHeight: cellH }]}>
          {(digit - 1 + 10) % 10}
        </Text>
      </Animated.View>
    </View>
  );
}

const odStyles = StyleSheet.create({
  digitWrap: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 1,
  },
  digitText: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});

// ── Componente principal ──────────────────────────────────────────────────────
export default function Odometer({
  value = 0,          // valor en metros
  color = '#E8B500',
  bgColor = '#141414',
  fontSize = 36,
  showUnit = true,
}) {
  // Decidir si mostrar en metros o km
  const showKm = value >= 1000;
  const displayValue = showKm
    ? (value / 1000).toFixed(3)  // ej: "1.234"
    : String(Math.round(value)).padStart(4, '0'); // ej: "0042"

  // Separar en dígitos y separadores
  const parts = [];
  for (let i = 0; i < displayValue.length; i++) {
    const ch = displayValue[i];
    if (ch === '.' || ch === ',') {
      parts.push({ type: 'sep', char: '.' });
    } else {
      parts.push({ type: 'digit', value: parseInt(ch) });
    }
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {parts.map((p, i) =>
          p.type === 'digit' ? (
            <OdometerDigit
              key={i}
              digit={p.value}
              color={color}
              bgColor={bgColor}
              fontSize={fontSize}
            />
          ) : (
            <Text key={i} style={{
              fontSize: fontSize * 0.8,
              fontWeight: '900',
              color,
              marginHorizontal: 2,
              lineHeight: fontSize * 1.3,
            }}>
              {p.char}
            </Text>
          )
        )}
        {showUnit && (
          <Text style={{
            fontSize: fontSize * 0.4,
            fontWeight: '800',
            color,
            marginLeft: 6,
            opacity: 0.8,
            lineHeight: fontSize * 1.3,
          }}>
            {showKm ? 'km' : 'm'}
          </Text>
        )}
      </View>
    </View>
  );
}