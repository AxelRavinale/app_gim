// src/screens/CardioScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, TextInput, Platform, ActivityIndicator, Modal,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useSession } from '../context/SessionContext';
import HamburgerMenu from '../components/HamburgerMenu';
import Odometer from '../components/Odometer';

const SAVED_RUNS_KEY      = 'gymtracker_saved_runs';
const SAVED_CIRCUITS_KEY  = 'gymtracker_saved_circuits';

function haversineDistance(a, b) {
  const R = 6371000;
  const dLat = (b.latitude  - a.latitude)  * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function formatPace(metersPerSecond) {
  if (!metersPerSecond || metersPerSecond <= 0) return '--:--';
  const secPerKm = 1000 / metersPerSecond;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2,'0')}`;
}

function formatDist(m) {
  return m >= 1000 ? `${(m/1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

function formatTotalTime(s) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m}m ${sec}s` : `${m}min`;
}

const TABS = ['Correr', 'Medir'];

// ── Modal: corridas guardadas ─────────────────────────────────────────────────
function SavedRunsModal({ onClose, colors }) {
  const [runs, setRuns]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(SAVED_RUNS_KEY);
      setRuns(raw ? JSON.parse(raw) : []);
    } catch { setRuns([]); }
    setLoading(false);
  }

  async function handleDelete(id) {
    Alert.alert('Eliminar corrida', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const updated = runs.filter(r => r.id !== id);
        await AsyncStorage.setItem(SAVED_RUNS_KEY, JSON.stringify(updated));
        setRuns(updated);
      }},
    ]);
  }

  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'flex-end' }}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, maxHeight:'80%', borderWidth:1, borderColor: colors.border }}>
          <View style={{ flexDirection:'row', alignItems:'center', marginBottom:20 }}>
            <Text style={{ flex:1, fontSize:18, fontWeight:'900', color: colors.textPrimary }}>🏃 Mis corridas</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize:20, color: colors.textSecondary }}>✕</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ padding:20 }} />
          ) : runs.length === 0 ? (
            <View style={{ alignItems:'center', padding:32 }}>
              <Text style={{ fontSize:40, marginBottom:12 }}>🏃</Text>
              <Text style={{ fontSize:16, fontWeight:'800', color: colors.textPrimary, marginBottom:6 }}>Sin corridas guardadas</Text>
              <Text style={{ fontSize:13, color: colors.textSecondary, textAlign:'center' }}>
                Al terminar una corrida podés guardarla para ver el historial
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {runs.map(r => (
                <View key={r.id} style={{ backgroundColor: colors.background, borderRadius:14, padding:16, marginBottom:10, borderWidth:1, borderColor: colors.border }}>
                  <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }}>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontSize:15, fontWeight:'800', color: colors.textPrimary }}>{r.name || 'Corrida'}</Text>
                      <Text style={{ fontSize:11, color: colors.textSecondary, marginTop:2 }}>
                        {new Date(r.date).toLocaleDateString('es-AR', { day:'numeric', month:'short', year:'numeric' })}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(r.id)} style={{ padding:6 }}>
                      <Text style={{ color:'#EF4444' }}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection:'row', gap:10 }}>
                    {[
                      { label:'Distancia', value: formatDist(r.distance) },
                      { label:'Tiempo',    value: formatTime(r.duration) },
                      { label:'Ritmo',     value: `${formatPace(r.distance / r.duration)} /km` },
                    ].map((item,i) => (
                      <View key={i} style={{ flex:1, backgroundColor: colors.card, borderRadius:10, padding:10, alignItems:'center', borderWidth:0.5, borderColor: colors.border }}>
                        <Text style={{ fontSize:14, fontWeight:'900', color: colors.brand }}>{item.value}</Text>
                        <Text style={{ fontSize:10, color: colors.textSecondary, marginTop:2 }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Modal: circuitos guardados ────────────────────────────────────────────────
function SavedCircuitsModal({ onClose, onLoad, colors }) {
  const [circuits, setCircuits] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(SAVED_CIRCUITS_KEY);
      setCircuits(raw ? JSON.parse(raw) : []);
    } catch { setCircuits([]); }
    setLoading(false);
  }

  async function handleDelete(id) {
    Alert.alert('Eliminar circuito', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const updated = circuits.filter(c => c.id !== id);
        await AsyncStorage.setItem(SAVED_CIRCUITS_KEY, JSON.stringify(updated));
        setCircuits(updated);
      }},
    ]);
  }

  return (
    <Modal visible transparent animationType="slide">
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'flex-end' }}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, maxHeight:'80%', borderWidth:1, borderColor: colors.border }}>
          <View style={{ flexDirection:'row', alignItems:'center', marginBottom:20 }}>
            <Text style={{ flex:1, fontSize:18, fontWeight:'900', color: colors.textPrimary }}>⏱ Mis circuitos</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize:20, color: colors.textSecondary }}>✕</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ padding:20 }} />
          ) : circuits.length === 0 ? (
            <View style={{ alignItems:'center', padding:32 }}>
              <Text style={{ fontSize:40, marginBottom:12 }}>⏱</Text>
              <Text style={{ fontSize:16, fontWeight:'800', color: colors.textPrimary, marginBottom:6 }}>Sin circuitos guardados</Text>
              <Text style={{ fontSize:13, color: colors.textSecondary, textAlign:'center' }}>
                Creá un circuito en la sección Circuito y guardalo para reutilizarlo
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {circuits.map(c => (
                <View key={c.id} style={{ backgroundColor: colors.background, borderRadius:14, padding:16, marginBottom:10, borderWidth:1, borderColor: colors.border }}>
                  <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }}>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontSize:15, fontWeight:'800', color: colors.textPrimary }}>{c.name}</Text>
                      <Text style={{ fontSize:11, color: colors.textSecondary, marginTop:2 }}>
                        {c.exercises.length} ejercicios · ~{formatTotalTime(c.totalTime)}
                        {' · '}{new Date(c.createdAt).toLocaleDateString('es-AR', { day:'numeric', month:'short' })}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(c.id)} style={{ padding:6 }}>
                      <Text style={{ color:'#EF4444' }}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4, marginBottom:10 }}>
                    {c.exercises.slice(0,4).map((ex,i) => (
                      <View key={i} style={{ backgroundColor:'rgba(232,181,0,0.1)', borderRadius:6, paddingHorizontal:8, paddingVertical:3 }}>
                        <Text style={{ fontSize:10, color: colors.brand, fontWeight:'700' }}>{ex.name}</Text>
                      </View>
                    ))}
                    {c.exercises.length > 4 && (
                      <View style={{ backgroundColor: colors.card, borderRadius:6, paddingHorizontal:8, paddingVertical:3, borderWidth:1, borderColor: colors.border }}>
                        <Text style={{ fontSize:10, color: colors.textSecondary }}>+{c.exercises.length-4} más</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => { onLoad(c); onClose(); }}
                    style={{ borderRadius:10, padding:10, alignItems:'center', backgroundColor: colors.brand }}>
                    <Text style={{ color:'#0A0A0A', fontWeight:'900', fontSize:13 }}>▶ Iniciar este circuito</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function CardioScreen({ navigation }) {
  const { colors } = useTheme();
  const { logout } = useSession();
  const s = makeStyles(colors);
  const mapRef = useRef(null);

  const [tab, setTab]                     = useState('Correr');
  const [status, setStatus]               = useState('idle');
  const [hasPermission, setHasPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute]                 = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [splits, setSplits]               = useState([]);
  const [splitEvery, setSplitEvery]       = useState('100');
  const [currentSpeed, setCurrentSpeed]   = useState(0);

  const [measurePoints, setMeasurePoints]   = useState([]);
  const [measureDistance, setMeasureDistance] = useState(0);
  const [measuring, setMeasuring]           = useState(false);

  // Modales guardados
  const [showSavedRuns, setShowSavedRuns]         = useState(false);
  const [showSavedCircuits, setShowSavedCircuits] = useState(false);

  const locationSub   = useRef(null);
  const timerRef      = useRef(null);
  const distanceRef   = useRef(0);
  const lastSplitRef  = useRef(0);
  const splitEveryRef = useRef(100);

  useEffect(() => { requestPermission(); return () => cleanup(); }, []);
  useEffect(() => { splitEveryRef.current = parseInt(splitEvery) || 100; }, [splitEvery]);

  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setHasPermission(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCurrentLocation(coords);
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 500);
    } else {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para el tracking GPS.');
    }
  }

  function cleanup() {
    locationSub.current?.remove();
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function startRun() {
    setStatus('running');
    setRoute([]); setTotalDistance(0); setElapsedSeconds(0); setSplits([]);
    distanceRef.current = 0; lastSplitRef.current = 0;
    timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 5 },
      (loc) => {
        const newPoint = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentLocation(newPoint);
        setCurrentSpeed(loc.coords.speed || 0);
        setRoute(prev => {
          if (prev.length === 0) return [newPoint];
          const dist = haversineDistance(prev[prev.length-1], newPoint);
          distanceRef.current += dist;
          setTotalDistance(distanceRef.current);
          if (distanceRef.current - lastSplitRef.current >= splitEveryRef.current) {
            setSplits(sp => [...sp, { num: sp.length+1, distance: Math.round(distanceRef.current) }]);
            lastSplitRef.current = distanceRef.current;
          }
          return [...prev, newPoint];
        });
        mapRef.current?.animateToRegion({ ...newPoint, latitudeDelta: 0.003, longitudeDelta: 0.003 }, 300);
      }
    );
  }

  function pauseRun() {
    setStatus('paused');
    locationSub.current?.remove();
    clearInterval(timerRef.current);
  }

  async function resumeRun() {
    setStatus('running');
    timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 5 },
      (loc) => {
        const newPoint = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentLocation(newPoint);
        setRoute(prev => {
          if (prev.length === 0) return [newPoint];
          distanceRef.current += haversineDistance(prev[prev.length-1], newPoint);
          setTotalDistance(distanceRef.current);
          return [...prev, newPoint];
        });
      }
    );
  }

  async function finishRun() {
    cleanup();
    setStatus('finished');
    // Guardar corrida automáticamente
    try {
      const raw  = await AsyncStorage.getItem(SAVED_RUNS_KEY);
      const runs = raw ? JSON.parse(raw) : [];
      const newRun = {
        id:       Date.now().toString(),
        name:     `Corrida ${new Date().toLocaleDateString('es-AR')}`,
        date:     new Date().toISOString(),
        distance: totalDistance,
        duration: elapsedSeconds,
        route:    route,
      };
      await AsyncStorage.setItem(SAVED_RUNS_KEY, JSON.stringify([newRun, ...runs]));
    } catch {}
  }

  function resetRun() {
    cleanup();
    setStatus('idle'); setRoute([]); setTotalDistance(0);
    setElapsedSeconds(0); setSplits([]);
    distanceRef.current = 0; lastSplitRef.current = 0;
  }

  async function startMeasuring() {
    setMeasurePoints([]); setMeasureDistance(0); setMeasuring(true);
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 500, distanceInterval: 1 },
      (loc) => {
        const newPoint = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentLocation(newPoint);
        setMeasurePoints(prev => {
          const next = [...prev, newPoint];
          if (next.length > 1) {
            const dist = haversineDistance(next[next.length-2], next[next.length-1]);
            setMeasureDistance(d => d + dist);
          }
          return next;
        });
      }
    );
  }

  function stopMeasuring()  { locationSub.current?.remove(); setMeasuring(false); }
  function resetMeasure()   { locationSub.current?.remove(); setMeasuring(false); setMeasurePoints([]); setMeasureDistance(0); }
  function addManualPoint() {
    if (!currentLocation) return;
    setMeasurePoints(prev => {
      const next = [...prev, currentLocation];
      if (next.length > 1) {
        const dist = haversineDistance(next[next.length-2], next[next.length-1]);
        setMeasureDistance(d => d + dist);
      }
      return next;
    });
  }

  const avgSpeed = elapsedSeconds > 0 ? totalDistance / elapsedSeconds : 0;

  // Items del menú hamburguesa
  const CARDIO_MENU_ITEMS = [
    { id: 'CardioTimer',  icon: '⏱️', label: 'Circuito HIIT', onPress: () => navigation.navigate('CardioTimer') },
    { id: 'Cronometro',   icon: '🏁', label: 'Cronómetro',    onPress: () => navigation.navigate('Cronometro') },
    { divider: true, label: 'GUARDADOS' },
    { id: 'saved-runs',     icon: '🏃', label: 'Mis corridas',  onPress: () => setShowSavedRuns(true),     accent: '#22C55E' },
    { id: 'saved-circuits', icon: '💾', label: 'Mis circuitos', onPress: () => setShowSavedCircuits(true), accent: '#E8B500' },
  ];

  if (!hasPermission) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={[s.permText, { color: colors.textSecondary }]}>Solicitando permisos de ubicación...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header con hamburguesa */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <HamburgerMenu
          navigation={navigation}
          currentTab={null}
          items={CARDIO_MENU_ITEMS}
          onLogout={logout}
          title="GT"
          subtitle="Resistencia"
        />
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Cardio</Text>
        {/* Tabs */}
        <View style={[s.tabs, { backgroundColor: colors.background }]}>
          {TABS.map(t => (
            <TouchableOpacity key={t} onPress={() => { setTab(t); resetRun(); resetMeasure(); }}
              style={[s.tabBtn, tab===t && { backgroundColor: colors.brand }]}>
              <Text style={[s.tabText, { color: tab===t ? '#0A0A0A' : colors.textSecondary }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Mapa */}
      <View style={s.mapWrap}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          customMapStyle={darkMapStyle}
          showsUserLocation showsMyLocationButton={false}
          initialRegion={currentLocation
            ? { ...currentLocation, latitudeDelta: 0.005, longitudeDelta: 0.005 }
            : { latitude:-33.8688, longitude:151.2093, latitudeDelta:0.01, longitudeDelta:0.01 }}
          onPress={tab === 'Medir' && !measuring ? (e) => {
            const pt = e.nativeEvent.coordinate;
            setMeasurePoints(prev => {
              const next = [...prev, pt];
              if (next.length > 1) {
                const dist = haversineDistance(next[next.length-2], next[next.length-1]);
                setMeasureDistance(d => d + dist);
              }
              return next;
            });
          } : undefined}
        >
          {tab === 'Correr' && route.length > 1 && (
            <Polyline coordinates={route} strokeColor="#E8B500" strokeWidth={4} />
          )}
          {tab === 'Correr' && route.length > 0 && (
            <Marker coordinate={route[0]} title="Inicio">
              <View style={s.markerStart}><Text style={{ fontSize:16 }}>🏁</Text></View>
            </Marker>
          )}
          {tab === 'Medir' && measurePoints.length > 1 && (
            <Polyline coordinates={measurePoints} strokeColor="#60A5FA" strokeWidth={3} lineDashPattern={[8,4]} />
          )}
          {tab === 'Medir' && measurePoints.map((pt, i) => (
            <Marker key={i} coordinate={pt} title={`Punto ${i+1}`}>
              <View style={[s.markerPoint, { backgroundColor: i===0 ? '#22C55E' : '#60A5FA' }]}>
                <Text style={{ color:'#fff', fontSize:10, fontWeight:'800' }}>{i+1}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {tab === 'Correr' && status === 'running' && (
          <View style={[s.overlay, { backgroundColor:'rgba(10,10,10,0.88)' }]}>
            <View style={{ alignItems:'center', marginBottom:8 }}>
              <Odometer value={totalDistance} color="#E8B500" bgColor="#1A1A1A" fontSize={38} />
            </View>
            <View style={s.overlayRow}>
              <View style={s.overlayStat}>
                <Text style={s.overlayVal}>{formatTime(elapsedSeconds)}</Text>
                <Text style={s.overlayLbl}>TIEMPO</Text>
              </View>
              <View style={s.overlayStat}>
                <Text style={s.overlayVal}>{formatPace(avgSpeed)}</Text>
                <Text style={s.overlayLbl}>RITMO /km</Text>
              </View>
              <View style={s.overlayStat}>
                <Text style={s.overlayVal}>{(avgSpeed * 3.6).toFixed(1)}</Text>
                <Text style={s.overlayLbl}>km/h</Text>
              </View>
            </View>
          </View>
        )}

        {tab === 'Medir' && measureDistance > 0 && (
          <View style={[s.measureOverlay, { backgroundColor:'rgba(10,10,10,0.90)' }]}>
            <Text style={s.measureLbl}>DISTANCIA MEDIDA</Text>
            <View style={{ marginTop:6 }}>
              <Odometer value={measureDistance} color="#60A5FA" bgColor="#0D0D1A" fontSize={42} />
            </View>
          </View>
        )}
      </View>

      {/* Panel inferior */}
      <ScrollView style={[s.panel, { backgroundColor: colors.card }]}
        contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>

        {tab === 'Correr' && (
          <>
            {status === 'idle' && (
              <>
                <View style={s.configRow}>
                  <Text style={[s.configLabel, { color: colors.textSecondary }]}>Mostrar parcial cada</Text>
                  <TextInput
                    style={[s.configInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={splitEvery} onChangeText={setSplitEvery}
                    keyboardType="numeric" maxLength={4} />
                  <Text style={[s.configLabel, { color: colors.textSecondary }]}>metros</Text>
                </View>
                <TouchableOpacity style={[s.btnPrimary, { backgroundColor: colors.brand }]} onPress={startRun}>
                  <Text style={[s.btnPrimaryText, { color:'#0A0A0A' }]}>▶ Empezar a correr</Text>
                </TouchableOpacity>
              </>
            )}
            {status === 'running' && (
              <View style={s.runButtons}>
                <TouchableOpacity style={[s.btnSecondary, { borderColor: colors.border }]} onPress={pauseRun}>
                  <Text style={[s.btnSecText, { color: colors.textPrimary }]}>⏸ Pausar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnDanger]} onPress={finishRun}>
                  <Text style={s.btnDangerText}>⏹ Terminar</Text>
                </TouchableOpacity>
              </View>
            )}
            {status === 'paused' && (
              <View style={s.runButtons}>
                <TouchableOpacity style={[s.btnPrimary, { backgroundColor: colors.brand }]} onPress={resumeRun}>
                  <Text style={[s.btnPrimaryText, { color:'#0A0A0A' }]}>▶ Continuar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnDanger]} onPress={finishRun}>
                  <Text style={s.btnDangerText}>⏹ Terminar</Text>
                </TouchableOpacity>
              </View>
            )}
            {status === 'finished' && (
              <>
                <Text style={[s.sectionTitle, { color: colors.brand }]}>RESUMEN</Text>
                <View style={s.summaryGrid}>
                  {[
                    { label:'Distancia', value: formatDist(totalDistance) },
                    { label:'Tiempo',    value: formatTime(elapsedSeconds) },
                    { label:'Ritmo/km',  value: formatPace(avgSpeed) },
                    { label:'Vel. prom', value: `${(avgSpeed*3.6).toFixed(1)} km/h` },
                  ].map((item,i) => (
                    <View key={i} style={[s.summaryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[s.summaryVal, { color: colors.brand }]}>{item.value}</Text>
                      <Text style={[s.summaryLbl, { color: colors.textSecondary }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>
                {splits.length > 0 && (
                  <>
                    <Text style={[s.sectionTitle, { color: colors.brand, marginTop:16 }]}>PARCIALES CADA {splitEvery}m</Text>
                    {splits.map((split,i) => (
                      <View key={i} style={[s.splitRow, { borderBottomColor: colors.border }]}>
                        <Text style={[s.splitNum, { color: colors.textSecondary }]}>#{split.num}</Text>
                        <Text style={[s.splitDist, { color: colors.textPrimary }]}>{split.distance}m</Text>
                      </View>
                    ))}
                  </>
                )}
                <TouchableOpacity style={[s.btnSecondary, { borderColor: colors.border, marginTop:16 }]} onPress={resetRun}>
                  <Text style={[s.btnSecText, { color: colors.textPrimary }]}>🔄 Nueva carrera</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {tab === 'Medir' && (
          <>
            <Text style={[s.measureHelp, { color: colors.textSecondary }]}>
              {!measuring
                ? 'Tocá puntos en el mapa para medir distancias, o usá los botones para medir mientras caminás'
                : 'Caminando... se va registrando la distancia automáticamente'}
            </Text>
            {measureDistance > 0 && (
              <View style={[s.measureResult, { backgroundColor:'rgba(96,165,250,0.08)', borderColor:'rgba(96,165,250,0.3)' }]}>
                <Text style={[s.measureResultLbl, { color: colors.textSecondary, marginBottom:8 }]}>distancia medida</Text>
                <Odometer value={measureDistance} color="#60A5FA" bgColor="#0A0A18" fontSize={32} />
              </View>
            )}
            <View style={s.measureButtons}>
              {!measuring ? (
                <>
                  <TouchableOpacity style={[s.btnMeasure, { backgroundColor:'rgba(96,165,250,0.15)', borderColor:'rgba(96,165,250,0.4)' }]} onPress={addManualPoint}>
                    <Text style={{ color:'#60A5FA', fontWeight:'800', fontSize:13 }}>📍 Marcar punto aquí</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btnMeasure, { backgroundColor:'rgba(34,197,94,0.15)', borderColor:'rgba(34,197,94,0.4)' }]} onPress={startMeasuring}>
                    <Text style={{ color:'#22C55E', fontWeight:'800', fontSize:13 }}>🚶 Medir caminando</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[s.btnDanger, { backgroundColor:'#EF4444' }]} onPress={stopMeasuring}>
                  <Text style={s.btnDangerText}>⏹ Detener medición</Text>
                </TouchableOpacity>
              )}
              {(measurePoints.length > 0 || measureDistance > 0) && (
                <TouchableOpacity style={[s.btnSecondary, { borderColor: colors.border }]} onPress={resetMeasure}>
                  <Text style={[s.btnSecText, { color: colors.textPrimary }]}>🗑 Limpiar</Text>
                </TouchableOpacity>
              )}
            </View>
            {measurePoints.length > 0 && (
              <Text style={[s.measureCount, { color: colors.textSecondary }]}>
                {measurePoints.length} punto{measurePoints.length!==1?'s':''} marcado{measurePoints.length!==1?'s':''}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      {showSavedRuns && (
        <SavedRunsModal colors={colors} onClose={() => setShowSavedRuns(false)} />
      )}
      {showSavedCircuits && (
        <SavedCircuitsModal
          colors={colors}
          onClose={() => setShowSavedCircuits(false)}
          onLoad={(circuit) => navigation.navigate('CardioTimer', { circuit })}
        />
      )}
    </View>
  );
}

const darkMapStyle = [
  { elementType:'geometry', stylers:[{ color:'#212121' }] },
  { elementType:'labels.icon', stylers:[{ visibility:'off' }] },
  { elementType:'labels.text.fill', stylers:[{ color:'#757575' }] },
  { elementType:'labels.text.stroke', stylers:[{ color:'#212121' }] },
  { featureType:'road', elementType:'geometry', stylers:[{ color:'#2c2c2c' }] },
  { featureType:'road.arterial', elementType:'geometry', stylers:[{ color:'#373737' }] },
  { featureType:'road.highway', elementType:'geometry', stylers:[{ color:'#3c3c3c' }] },
  { featureType:'water', elementType:'geometry', stylers:[{ color:'#000000' }] },
  { featureType:'poi', stylers:[{ visibility:'off' }] },
];

const makeStyles = (colors) => StyleSheet.create({
  container:  { flex:1, backgroundColor: colors.background },
  centered:   { flex:1, justifyContent:'center', alignItems:'center', gap:16 },
  permText:   { fontSize:14, textAlign:'center', paddingHorizontal:30 },
  header: {
    paddingTop: Platform.OS==='ios' ? 50 : 30,
    paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: 0.5, flexDirection:'row',
    alignItems:'center', gap:10,
  },
  headerTitle: { fontSize:18, fontWeight:'900', flex:1 },
  tabs:   { flexDirection:'row', borderRadius:10, overflow:'hidden', padding:2 },
  tabBtn: { paddingHorizontal:14, paddingVertical:7, borderRadius:8 },
  tabText:{ fontSize:12, fontWeight:'700' },
  mapWrap:    { height:260, position:'relative' },
  overlay:    { position:'absolute', bottom:0, left:0, right:0, padding:12 },
  overlayRow: { flexDirection:'row', justifyContent:'space-around' },
  overlayStat:{ alignItems:'center' },
  overlayVal: { fontSize:20, fontWeight:'900', color:'#E8B500' },
  overlayLbl: { fontSize:9, color:'#888', fontWeight:'700', marginTop:2 },
  measureOverlay: { position:'absolute', top:12, left:12, right:12, borderRadius:14, padding:14, alignItems:'center' },
  measureLbl: { fontSize:10, color:'#888', fontWeight:'700' },
  markerStart:{ width:34, height:34, borderRadius:17, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center' },
  markerPoint:{ width:24, height:24, borderRadius:12, justifyContent:'center', alignItems:'center' },
  panel:      { flex:1 },
  configRow:  { flexDirection:'row', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' },
  configLabel:{ fontSize:13 },
  configInput:{ width:70, borderWidth:1, borderRadius:10, padding:9, textAlign:'center', fontSize:16, fontWeight:'800' },
  btnPrimary: { borderRadius:14, padding:17, alignItems:'center', marginBottom:8 },
  btnPrimaryText: { fontWeight:'900', fontSize:16 },
  btnSecondary:   { borderRadius:14, padding:14, alignItems:'center', borderWidth:1, marginBottom:8 },
  btnSecText:     { fontWeight:'700', fontSize:14 },
  btnDanger:      { borderRadius:14, padding:14, alignItems:'center', flex:1, backgroundColor:'#EF4444' },
  btnDangerText:  { color:'#fff', fontWeight:'900', fontSize:14 },
  runButtons:     { flexDirection:'row', gap:10 },
  sectionTitle:   { fontSize:10, fontWeight:'800', letterSpacing:1.5, marginBottom:10 },
  summaryGrid:    { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:8 },
  summaryCard:    { flex:1, minWidth:'45%', borderRadius:12, padding:14, borderWidth:0.5, alignItems:'center' },
  summaryVal:     { fontSize:20, fontWeight:'900', marginBottom:4 },
  summaryLbl:     { fontSize:11, fontWeight:'600' },
  splitRow:       { flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:0.5 },
  splitNum:       { fontSize:13 },
  splitDist:      { fontSize:13, fontWeight:'700' },
  measureHelp:    { fontSize:13, lineHeight:20, marginBottom:14, textAlign:'center' },
  measureResult:  { borderRadius:14, padding:16, alignItems:'center', marginBottom:14, borderWidth:1 },
  measureResultLbl:{ fontSize:11, fontWeight:'600' },
  measureButtons: { gap:10 },
  btnMeasure:     { borderRadius:12, padding:14, alignItems:'center', borderWidth:1.5 },
  measureCount:   { textAlign:'center', fontSize:12, marginTop:10 },
});