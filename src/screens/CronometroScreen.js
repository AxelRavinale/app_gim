// src/screens/CronometroScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, StatusBar, Vibration, Share,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

function formatTime(ms, showMs = true) {
  const totalSec = Math.floor(ms / 1000);
  const h   = Math.floor(totalSec / 3600);
  const m   = Math.floor((totalSec % 3600) / 60);
  const s   = totalSec % 60;
  const mss = Math.floor((ms % 1000) / 10);

  const base = h > 0
    ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

  return showMs ? `${base}.${String(mss).padStart(2,'0')}` : base;
}

function formatDiff(ms) {
  const sign = ms >= 0 ? '+' : '-';
  return `${sign}${formatTime(Math.abs(ms), true)}`;
}

export default function CronometroScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [status, setStatus]   = useState('idle');   // idle | running | paused
  const [elapsed, setElapsed] = useState(0);        // ms totales
  const [parciales, setParciales] = useState([]);   // lista de parciales

  const startTimeRef  = useRef(null);
  const elapsedRef    = useRef(0);
  const intervalRef   = useRef(null);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  function start() {
    setStatus('running');
    startTimeRef.current = Date.now() - elapsedRef.current;
    intervalRef.current = setInterval(() => {
      const now = Date.now() - startTimeRef.current;
      elapsedRef.current = now;
      setElapsed(now);
    }, 10); // actualizar cada 10ms para mostrar centésimas
  }

  function pause() {
    clearInterval(intervalRef.current);
    setStatus('paused');
    Vibration.vibrate(100);
  }

  function resume() {
    setStatus('running');
    startTimeRef.current = Date.now() - elapsedRef.current;
    intervalRef.current = setInterval(() => {
      const now = Date.now() - startTimeRef.current;
      elapsedRef.current = now;
      setElapsed(now);
    }, 10);
  }

  function reset() {
    clearInterval(intervalRef.current);
    setStatus('idle');
    setElapsed(0);
    elapsedRef.current = 0;
    setParciales([]);
  }

  function addParcial() {
    if (status !== 'running') return;
    Vibration.vibrate(80);
    const now = elapsedRef.current;
    setParciales(prev => {
      const ultimo = prev.length > 0 ? prev[prev.length - 1].total : 0;
      const vuelta = now - ultimo;
      return [...prev, {
        numero: prev.length + 1,
        total:  now,
        vuelta: vuelta,
      }];
    });
  }

  async function compartir() {
    const lineas = [
      `🏃 CRONÓMETRO GYMTRACKER`,
      `⏱ Tiempo total: ${formatTime(elapsed, false)}`,
      '',
      ...parciales.map(p =>
        `Parcial ${p.numero}: ${formatTime(p.total, false)} (vuelta: ${formatTime(p.vuelta, false)})`
      ),
    ];
    await Share.share({ message: lineas.join('\n') });
  }

  // Calcular el mejor y peor parcial
  const tiemposVuelta = parciales.map(p => p.vuelta);
  const mejorVuelta   = tiemposVuelta.length > 0 ? Math.min(...tiemposVuelta) : null;
  const peorVuelta    = tiemposVuelta.length > 0 ? Math.max(...tiemposVuelta) : null;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding:4 }}>
          <Text style={{ color: colors.brand, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Cronómetro</Text>
        {elapsed > 0 && status !== 'running' && (
          <TouchableOpacity onPress={compartir} style={{ padding:4 }}>
            <Text style={{ fontSize: 18 }}>⬆️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Display principal */}
      <View style={[s.displayWrap, { backgroundColor: colors.card }]}>
        {/* Tiempo principal */}
        <Text style={[s.mainTime, { color: status === 'running' ? colors.brand : colors.textPrimary }]}>
          {formatTime(elapsed, true)}
        </Text>

        {/* Último parcial */}
        {parciales.length > 0 && (
          <View style={s.lastParcialWrap}>
            <Text style={[s.lastParcialLabel, { color: colors.textSecondary }]}>
              Último parcial
            </Text>
            <Text style={[s.lastParcialTime, { color: colors.brand }]}>
              {formatTime(parciales[parciales.length - 1].vuelta, true)}
            </Text>
          </View>
        )}

        {/* Stats rápidos */}
        {parciales.length > 1 && (
          <View style={[s.statsRow, { borderTopColor: colors.border }]}>
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: VERDE }]}>{formatTime(mejorVuelta, false)}</Text>
              <Text style={[s.statLbl, { color: colors.textSecondary }]}>Mejor vuelta</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: colors.border }]} />
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: colors.textPrimary }]}>
                {formatTime(Math.round(elapsed / parciales.length), false)}
              </Text>
              <Text style={[s.statLbl, { color: colors.textSecondary }]}>Promedio</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: colors.border }]} />
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: ROJO }]}>{formatTime(peorVuelta, false)}</Text>
              <Text style={[s.statLbl, { color: colors.textSecondary }]}>Peor vuelta</Text>
            </View>
          </View>
        )}
      </View>

      {/* Botones de control */}
      <View style={s.controls}>
        {status === 'idle' && (
          <>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[s.btnMain, { backgroundColor: VERDE }]}
              onPress={start}
              activeOpacity={0.85}
            >
              <Text style={s.btnMainText}>▶ Iniciar</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </>
        )}

        {status === 'running' && (
          <>
            <TouchableOpacity
              style={[s.btnSecondary, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={addParcial}
              activeOpacity={0.8}
            >
              <Text style={[s.btnSecText, { color: colors.brand }]}>🏁 Parcial</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnMain, { backgroundColor: NARANJA }]}
              onPress={pause}
              activeOpacity={0.85}
            >
              <Text style={s.btnMainText}>⏸ Pausar</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'paused' && (
          <>
            <TouchableOpacity
              style={[s.btnSecondary, { borderColor: ROJO+'55', backgroundColor: ROJO+'15' }]}
              onPress={reset}
              activeOpacity={0.8}
            >
              <Text style={[s.btnSecText, { color: ROJO }]}>↺ Reiniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnMain, { backgroundColor: VERDE }]}
              onPress={resume}
              activeOpacity={0.85}
            >
              <Text style={s.btnMainText}>▶ Continuar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Lista de parciales */}
      {parciales.length > 0 && (
        <View style={[s.parcialesContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={[s.parcialesHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.parcialesTitle, { color: colors.brand }]}>
              PARCIALES ({parciales.length})
            </Text>
            {status !== 'running' && parciales.length > 0 && (
              <TouchableOpacity onPress={reset}>
                <Text style={{ fontSize: 12, color: ROJO, fontWeight: '700' }}>Borrar</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
            {[...parciales].reverse().map((p, idx) => {
              const esMejor = p.vuelta === mejorVuelta && parciales.length > 1;
              const esPeor  = p.vuelta === peorVuelta  && parciales.length > 1;
              const diff    = parciales.length > 1 && idx < parciales.length - 1
                ? p.vuelta - parciales[parciales.length - 2 - idx]?.vuelta
                : null;

              return (
                <View key={p.numero}
                  style={[s.parcialRow, { borderBottomColor: colors.border },
                    esMejor && { backgroundColor: 'rgba(34,197,94,0.07)' },
                    esPeor  && { backgroundColor: 'rgba(239,68,68,0.07)' },
                  ]}>
                  {/* Número */}
                  <View style={[s.parcialNum, {
                    backgroundColor: esMejor ? 'rgba(34,197,94,0.2)' : esPeor ? 'rgba(239,68,68,0.2)' : 'rgba(232,181,0,0.12)',
                  }]}>
                    <Text style={{ fontSize: 11, fontWeight: '900',
                      color: esMejor ? VERDE : esPeor ? ROJO : colors.brand }}>
                      {p.numero}
                    </Text>
                  </View>

                  {/* Tiempo de vuelta */}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.parcialVuelta, {
                      color: esMejor ? VERDE : esPeor ? ROJO : colors.textPrimary
                    }]}>
                      {formatTime(p.vuelta, true)}
                      {esMejor && <Text style={{ fontSize: 11, color: VERDE }}> ← Mejor</Text>}
                      {esPeor  && <Text style={{ fontSize: 11, color: ROJO  }}> ← Peor</Text>}
                    </Text>
                  </View>

                  {/* Tiempo total acumulado */}
                  <Text style={[s.parcialTotal, { color: colors.textSecondary }]}>
                    {formatTime(p.total, false)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const VERDE   = '#22C55E';
const ROJO    = '#EF4444';
const NARANJA = '#F97316';

const makeStyles = (colors) => StyleSheet.create({
  container:  { flex:1 },
  header:     { paddingTop: Platform.OS==='ios'?50:30, paddingBottom:14, paddingHorizontal:16,
    borderBottomWidth:0.5, flexDirection:'row', alignItems:'center', gap:12 },
  headerTitle:{ fontSize:18, fontWeight:'900', flex:1 },

  displayWrap:{ alignItems:'center', paddingVertical:32, paddingHorizontal:20 },
  mainTime:   { fontSize:58, fontWeight:'900', fontVariant:['tabular-nums'],
    letterSpacing:-2, fontFamily: Platform.OS==='ios' ? 'Menlo' : 'monospace' },

  lastParcialWrap: { alignItems:'center', marginTop:12 },
  lastParcialLabel:{ fontSize:11, marginBottom:4 },
  lastParcialTime: { fontSize:22, fontWeight:'800' },

  statsRow:    { flexDirection:'row', marginTop:20, paddingTop:16, borderTopWidth:0.5, width:'100%' },
  statItem:    { flex:1, alignItems:'center' },
  statVal:     { fontSize:16, fontWeight:'900' },
  statLbl:     { fontSize:10, marginTop:3 },
  statDivider: { width:0.5 },

  controls:  { flexDirection:'row', gap:12, paddingHorizontal:20, paddingVertical:16 },
  btnMain:   { flex:2, borderRadius:16, padding:16, alignItems:'center',
    shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:6 },
  btnMainText:{ color:'#0A0A0A', fontWeight:'900', fontSize:17 },
  btnSecondary:{ flex:1, borderRadius:16, padding:16, alignItems:'center', borderWidth:1.5 },
  btnSecText: { fontWeight:'800', fontSize:14 },

  parcialesContainer: { flex:1, borderTopWidth:0.5 },
  parcialesHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingHorizontal:16, paddingVertical:10, borderBottomWidth:0.5 },
  parcialesTitle: { fontSize:10, fontWeight:'800', letterSpacing:1.5 },

  parcialRow: { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:11,
    borderBottomWidth:0.5 },
  parcialNum: { width:28, height:28, borderRadius:14, justifyContent:'center', alignItems:'center', flexShrink:0 },
  parcialVuelta: { fontSize:14, fontWeight:'700' },
  parcialTotal:  { fontSize:12 },
});