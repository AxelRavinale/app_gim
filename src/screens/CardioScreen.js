// src/screens/CardioScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, TextInput, Platform, ActivityIndicator,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../theme/ThemeContext';
import Odometer from '../components/Odometer';

// Calcula distancia entre dos coords en metros (Haversine)
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

const TABS = ['Correr', 'Medir'];

export default function CardioScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const mapRef = useRef(null);

  const [tab, setTab]                   = useState('Correr');
  const [status, setStatus]             = useState('idle'); // idle | running | paused | finished
  const [hasPermission, setHasPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute]               = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [splits, setSplits]             = useState([]); // tiempos parciales
  const [splitEvery, setSplitEvery]     = useState('100'); // metros
  const [lastSplitAt, setLastSplitAt]   = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  // Medidor de distancias
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureDistance, setMeasureDistance] = useState(0);
  const [measuring, setMeasuring]         = useState(false);

  const locationSub = useRef(null);
  const timerRef    = useRef(null);
  const distanceRef = useRef(0);
  const lastSplitRef = useRef(0);
  const splitEveryRef = useRef(100);

  useEffect(() => {
    requestPermission();
    return () => cleanup();
  }, []);

  useEffect(() => { splitEveryRef.current = parseInt(splitEvery) || 100; }, [splitEvery]);

  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setHasPermission(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCurrentLocation(coords);
      mapRef.current?.animateToRegion({
        ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005,
      }, 500);
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
    setRoute([]);
    setTotalDistance(0);
    setElapsedSeconds(0);
    setSplits([]);
    setLastSplitAt(0);
    distanceRef.current  = 0;
    lastSplitRef.current = 0;

    // Timer
    timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000);

    // GPS
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 5 },
      (loc) => {
        const newPoint = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentLocation(newPoint);
        setCurrentSpeed(loc.coords.speed || 0);

        setRoute(prev => {
          if (prev.length === 0) return [newPoint];
          const dist = haversineDistance(prev[prev.length - 1], newPoint);
          distanceRef.current += dist;
          setTotalDistance(distanceRef.current);

          // Splits automáticos
          const splitEveryM = splitEveryRef.current;
          if (distanceRef.current - lastSplitRef.current >= splitEveryM) {
            setSplits(sp => {
              const splitNum   = sp.length + 1;
              const splitDist  = distanceRef.current;
              return [...sp, { num: splitNum, distance: Math.round(splitDist), time: null }];
            });
            lastSplitRef.current = distanceRef.current;
          }

          return [...prev, newPoint];
        });

        // Centrar mapa
        mapRef.current?.animateToRegion({
          ...newPoint, latitudeDelta: 0.003, longitudeDelta: 0.003,
        }, 300);
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
        setCurrentSpeed(loc.coords.speed || 0);
        setRoute(prev => {
          if (prev.length === 0) return [newPoint];
          const dist = haversineDistance(prev[prev.length - 1], newPoint);
          distanceRef.current += dist;
          setTotalDistance(distanceRef.current);
          return [...prev, newPoint];
        });
      }
    );
  }

  function finishRun() {
    cleanup();
    setStatus('finished');
  }

  function resetRun() {
    cleanup();
    setStatus('idle');
    setRoute([]);
    setTotalDistance(0);
    setElapsedSeconds(0);
    setSplits([]);
    distanceRef.current  = 0;
    lastSplitRef.current = 0;
  }

  // ── Medidor ────────────────────────────────────────────────────────────────
  async function startMeasuring() {
    setMeasurePoints([]);
    setMeasureDistance(0);
    setMeasuring(true);
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

  function stopMeasuring() {
    locationSub.current?.remove();
    setMeasuring(false);
  }

  function resetMeasure() {
    locationSub.current?.remove();
    setMeasuring(false);
    setMeasurePoints([]);
    setMeasureDistance(0);
  }

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

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={[s.permText, { color: colors.textSecondary }]}>
          Solicitando permisos de ubicación...
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ color: colors.brand, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Cardio</Text>
        {/* Botón circuito */}
        <TouchableOpacity
          style={{ paddingHorizontal:10, paddingVertical:7, borderRadius:10, backgroundColor:'rgba(232,181,0,0.15)', borderWidth:1, borderColor:'rgba(232,181,0,0.4)' }}
          onPress={() => navigation.navigate('CardioTimer')}
        >
          <Text style={{ fontSize:11, fontWeight:'800', color: colors.brand }}>⏱ Circuito</Text>
        </TouchableOpacity>
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
          showsUserLocation
          showsMyLocationButton={false}
          initialRegion={currentLocation ? {
            ...currentLocation, latitudeDelta: 0.005, longitudeDelta: 0.005,
          } : { latitude: -33.8688, longitude: 151.2093, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
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
          {/* Ruta de carrera */}
          {tab === 'Correr' && route.length > 1 && (
            <Polyline coordinates={route} strokeColor="#E8B500" strokeWidth={4} />
          )}
          {tab === 'Correr' && route.length > 0 && (
            <Marker coordinate={route[0]} title="Inicio">
              <View style={s.markerStart}><Text style={{ fontSize: 16 }}>🏁</Text></View>
            </Marker>
          )}

          {/* Puntos de medición */}
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

        {/* Stats overlay durante carrera */}
        {tab === 'Correr' && status === 'running' && (
          <View style={[s.overlay, { backgroundColor: 'rgba(10,10,10,0.88)' }]}>
            {/* Odómetro central */}
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

        {/* Distancia medición — odómetro */}
        {tab === 'Medir' && measureDistance > 0 && (
          <View style={[s.measureOverlay, { backgroundColor: 'rgba(10,10,10,0.90)' }]}>
            <Text style={s.measureLbl}>DISTANCIA MEDIDA</Text>
            <View style={{ marginTop:6 }}>
              <Odometer value={measureDistance} color="#60A5FA" bgColor="#0D0D1A" fontSize={42} />
            </View>
          </View>
        )}
      </View>

      {/* Panel inferior */}
      <ScrollView style={[s.panel, { backgroundColor: colors.card }]}
        contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>

        {/* ── CORRER ─────────────────────────────────────────────────── */}
        {tab === 'Correr' && (
          <>
            {status === 'idle' && (
              <>
                <View style={s.configRow}>
                  <Text style={[s.configLabel, { color: colors.textSecondary }]}>
                    Mostrar parcial cada
                  </Text>
                  <TextInput
                    style={[s.configInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                    value={splitEvery} onChangeText={setSplitEvery}
                    keyboardType="numeric" maxLength={4}
                  />
                  <Text style={[s.configLabel, { color: colors.textSecondary }]}>metros</Text>
                </View>
                <TouchableOpacity style={[s.btnPrimary, { backgroundColor: colors.brand }]} onPress={startRun}>
                  <Text style={[s.btnPrimaryText, { color: '#0A0A0A' }]}>▶ Empezar a correr</Text>
                </TouchableOpacity>
              </>
            )}

            {status === 'running' && (
              <View style={s.runButtons}>
                <TouchableOpacity style={[s.btnSecondary, { borderColor: colors.border }]} onPress={pauseRun}>
                  <Text style={[s.btnSecText, { color: colors.textPrimary }]}>⏸ Pausar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnDanger, { backgroundColor: '#EF4444' }]} onPress={finishRun}>
                  <Text style={s.btnDangerText}>⏹ Terminar</Text>
                </TouchableOpacity>
              </View>
            )}

            {status === 'paused' && (
              <View style={s.runButtons}>
                <TouchableOpacity style={[s.btnPrimary, { backgroundColor: colors.brand }]} onPress={resumeRun}>
                  <Text style={[s.btnPrimaryText, { color: '#0A0A0A' }]}>▶ Continuar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnDanger, { backgroundColor: '#EF4444' }]} onPress={finishRun}>
                  <Text style={s.btnDangerText}>⏹ Terminar</Text>
                </TouchableOpacity>
              </View>
            )}

            {status === 'finished' && (
              <>
                {/* Resumen */}
                <Text style={[s.sectionTitle, { color: colors.brand }]}>RESUMEN</Text>
                <View style={s.summaryGrid}>
                  {[
                    { label:'Distancia', value: totalDistance >= 1000 ? `${(totalDistance/1000).toFixed(2)} km` : `${Math.round(totalDistance)} m` },
                    { label:'Tiempo',    value: formatTime(elapsedSeconds) },
                    { label:'Ritmo/km',  value: formatPace(avgSpeed) },
                    { label:'Vel. prom', value: `${(avgSpeed * 3.6).toFixed(1)} km/h` },
                  ].map((item, i) => (
                    <View key={i} style={[s.summaryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[s.summaryVal, { color: colors.brand }]}>{item.value}</Text>
                      <Text style={[s.summaryLbl, { color: colors.textSecondary }]}>{item.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Parciales */}
                {splits.length > 0 && (
                  <>
                    <Text style={[s.sectionTitle, { color: colors.brand, marginTop: 16 }]}>
                      PARCIALES CADA {splitEvery}m
                    </Text>
                    {splits.map((split, i) => (
                      <View key={i} style={[s.splitRow, { borderBottomColor: colors.border }]}>
                        <Text style={[s.splitNum, { color: colors.textSecondary }]}>#{split.num}</Text>
                        <Text style={[s.splitDist, { color: colors.textPrimary }]}>{split.distance}m</Text>
                      </View>
                    ))}
                  </>
                )}

                <TouchableOpacity style={[s.btnSecondary, { borderColor: colors.border, marginTop: 16 }]} onPress={resetRun}>
                  <Text style={[s.btnSecText, { color: colors.textPrimary }]}>🔄 Nueva carrera</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* ── MEDIR ──────────────────────────────────────────────────── */}
        {tab === 'Medir' && (
          <>
            <Text style={[s.measureHelp, { color: colors.textSecondary }]}>
              {!measuring
                ? 'Tocá puntos en el mapa para medir distancias, o usá los botones para medir mientras caminás'
                : 'Caminando... se va registrando la distancia automáticamente'
              }
            </Text>

            {measureDistance > 0 && (
              <View style={[s.measureResult, { backgroundColor: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.3)' }]}>
                <Text style={[s.measureResultLbl, { color: colors.textSecondary, marginBottom:8 }]}>distancia medida</Text>
                <Odometer value={measureDistance} color="#60A5FA" bgColor="#0A0A18" fontSize={32} />
              </View>
            )}

            <View style={s.measureButtons}>
              {!measuring ? (
                <>
                  <TouchableOpacity style={[s.btnMeasure, { backgroundColor: 'rgba(96,165,250,0.15)', borderColor: 'rgba(96,165,250,0.4)' }]} onPress={addManualPoint}>
                    <Text style={{ color: '#60A5FA', fontWeight: '800', fontSize: 13 }}>📍 Marcar punto aquí</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btnMeasure, { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)' }]} onPress={startMeasuring}>
                    <Text style={{ color: '#22C55E', fontWeight: '800', fontSize: 13 }}>🚶 Medir caminando</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[s.btnDanger, { backgroundColor: '#EF4444' }]} onPress={stopMeasuring}>
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
    </View>
  );
}

// Estilo oscuro para Google Maps
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
  container:  { flex:1, backgroundColor:colors.background },
  centered:   { flex:1, justifyContent:'center', alignItems:'center', gap:16 },
  permText:   { fontSize:14, textAlign:'center', paddingHorizontal:30 },

  header: {
    paddingTop: Platform.OS==='ios' ? 50 : 30,
    paddingBottom: 12, paddingHorizontal: 16,
    borderBottomWidth: 0.5, flexDirection:'row',
    alignItems:'center', gap:12,
  },
  backBtn:     { padding:4 },
  headerTitle: { fontSize:18, fontWeight:'900', flex:1 },
  tabs: { flexDirection:'row', borderRadius:10, overflow:'hidden', padding:2 },
  tabBtn:   { paddingHorizontal:14, paddingVertical:7, borderRadius:8 },
  tabText:  { fontSize:12, fontWeight:'700' },

  mapWrap: { height:260, position:'relative' },

  overlay: {
    position:'absolute', bottom:0, left:0, right:0, padding:12,
  },
  overlayRow:  { flexDirection:'row', justifyContent:'space-around' },
  overlayStat: { alignItems:'center' },
  overlayVal:  { fontSize:20, fontWeight:'900', color:'#E8B500' },
  overlayLbl:  { fontSize:9, color:'#888', fontWeight:'700', marginTop:2 },

  measureOverlay: {
    position:'absolute', top:12, left:12, right:12,
    borderRadius:14, padding:14, alignItems:'center',
  },
  measureDist: { fontSize:28, fontWeight:'900', color:'#60A5FA' },
  measureLbl:  { fontSize:10, color:'#888', fontWeight:'700', marginTop:2 },

  markerStart: { width:34, height:34, borderRadius:17, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center' },
  markerPoint: { width:24, height:24, borderRadius:12, justifyContent:'center', alignItems:'center' },

  panel: { flex:1 },

  configRow:  { flexDirection:'row', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' },
  configLabel:{ fontSize:13 },
  configInput:{
    width:70, borderWidth:1, borderRadius:10, padding:9,
    textAlign:'center', fontSize:16, fontWeight:'800',
  },

  btnPrimary: { borderRadius:14, padding:17, alignItems:'center', marginBottom:8 },
  btnPrimaryText: { fontWeight:'900', fontSize:16 },
  btnSecondary: { borderRadius:14, padding:14, alignItems:'center', borderWidth:1, marginBottom:8 },
  btnSecText: { fontWeight:'700', fontSize:14 },
  btnDanger: { borderRadius:14, padding:14, alignItems:'center', flex:1 },
  btnDangerText: { color:'#fff', fontWeight:'900', fontSize:14 },
  runButtons: { flexDirection:'row', gap:10 },

  sectionTitle: { fontSize:10, fontWeight:'800', letterSpacing:1.5, marginBottom:10 },
  summaryGrid:  { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:8 },
  summaryCard:  { flex:1, minWidth:'45%', borderRadius:12, padding:14, borderWidth:0.5, alignItems:'center' },
  summaryVal:   { fontSize:20, fontWeight:'900', marginBottom:4 },
  summaryLbl:   { fontSize:11, fontWeight:'600' },

  splitRow:  { flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:0.5 },
  splitNum:  { fontSize:13 },
  splitDist: { fontSize:13, fontWeight:'700' },

  measureHelp:  { fontSize:13, lineHeight:20, marginBottom:14, textAlign:'center' },
  measureResult:{ borderRadius:14, padding:16, alignItems:'center', marginBottom:14, borderWidth:1 },
  measureResultVal:{ fontSize:32, fontWeight:'900' },
  measureResultLbl:{ fontSize:11, fontWeight:'600', marginTop:4 },
  measureButtons:{ gap:10 },
  btnMeasure:{ borderRadius:12, padding:14, alignItems:'center', borderWidth:1.5 },
  measureCount:{ textAlign:'center', fontSize:12, marginTop:10 },
});