// src/screens/RunRouteScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Vibration, Platform, StatusBar, Modal, Dimensions,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../theme/ThemeContext';

function haversineDistance(a, b) {
  const R = 6371000;
  const dLat = (b.latitude  - a.latitude)  * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude  * Math.PI / 180;
  const lat2 = b.latitude  * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

function formatTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
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

export default function RunRouteScreen({ route: navRoute, navigation }) {
  const { route } = navRoute.params;
  const { colors } = useTheme();
  const mapRef = useRef(null);

  const routeCoords = (route.coordinates || []).map(c => ({
    latitude:  c.lat || c.latitude,
    longitude: c.lng || c.longitude,
  }));

  const [status, setStatus]               = useState('idle');
  const [fullscreen, setFullscreen]       = useState(false);
  const [currentPos, setCurrentPos]       = useState(null);
  const [runPath, setRunPath]             = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentSpeed, setCurrentSpeed]   = useState(0);
  const [distanceToRoute, setDistanceToRoute] = useState(null);
  const [offRoute, setOffRoute]           = useState(false);

  const locationSub = useRef(null);
  const timerRef    = useRef(null);
  const distanceRef = useRef(0);

  useEffect(() => {
    requestPermission();
    return () => cleanup();
  }, []);

  async function requestPermission() {
    const { status: ps } = await Location.requestForegroundPermissionsAsync();
    if (ps !== 'granted') { Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.'); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setCurrentPos(coords);
    const center = routeCoords[0] || coords;
    mapRef.current?.animateToRegion({ ...center, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 500);
  }

  function cleanup() {
    locationSub.current?.remove();
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function getClosestPointOnRoute(pos) {
    if (!routeCoords.length) return null;
    let minDist = Infinity;
    for (const pt of routeCoords) {
      const d = haversineDistance(pos, pt);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  async function startRun() {
    setStatus('running');
    setFullscreen(true);  // ← activa fullscreen
    setRunPath([]);
    distanceRef.current = 0;
    setTotalDistance(0);
    setElapsedSeconds(0);

    timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000);

    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 3 },
      (loc) => {
        const newPoint = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentPos(newPoint);
        setCurrentSpeed(loc.coords.speed || 0);
        setRunPath(prev => {
          if (prev.length > 0) {
            distanceRef.current += haversineDistance(prev[prev.length-1], newPoint);
            setTotalDistance(distanceRef.current);
          }
          return [...prev, newPoint];
        });
        const closest = getClosestPointOnRoute(newPoint);
        if (closest !== null) {
          setDistanceToRoute(Math.round(closest));
          const isOff = closest > 50;
          setOffRoute(isOff);
          if (isOff) Vibration.vibrate(200);
        }
        mapRef.current?.animateToRegion({ ...newPoint, latitudeDelta: 0.004, longitudeDelta: 0.004 }, 300);
      }
    );
  }

  function pauseRun() {
    setStatus('paused');
    setFullscreen(false);
    locationSub.current?.remove();
    clearInterval(timerRef.current);
  }

  async function resumeRun() {
    setStatus('running');
    setFullscreen(true);
    timerRef.current = setInterval(() => setElapsedSeconds(p => p + 1), 1000);
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 3 },
      (loc) => {
        const newPoint = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentPos(newPoint);
        setRunPath(prev => {
          if (prev.length > 0) {
            distanceRef.current += haversineDistance(prev[prev.length-1], newPoint);
            setTotalDistance(distanceRef.current);
          }
          return [...prev, newPoint];
        });
      }
    );
  }

  function finishRun() {
    cleanup();
    setStatus('finished');
    setFullscreen(false);
  }

  function resetRun() {
    cleanup();
    setStatus('idle');
    setFullscreen(false);
    setRunPath([]);
    setTotalDistance(0);
    setElapsedSeconds(0);
    distanceRef.current = 0;
  }

  const avgSpeed     = elapsedSeconds > 0 ? totalDistance / elapsedSeconds : 0;
  const routeProgress = route.distance_m > 0
    ? Math.min(100, Math.round((totalDistance / route.distance_m) * 100))
    : 0;

  // ── FULLSCREEN: solo el mapa con overlays ──────────────────────────────────


  // ── VISTA NORMAL + MODAL FULLSCREEN ──────────────────────────────────────
  const { width: SW, height: SH } = Dimensions.get('screen');

  return (
    <View style={{ flex:1, backgroundColor: colors.background }}>

      {/* Modal fullscreen — usa Dimensions de la pantalla real */}
      <Modal visible={fullscreen} animationType="none" statusBarTranslucent>
        <StatusBar hidden />
        <View style={{ width: SW, height: SH, backgroundColor: '#000' }}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ width: SW, height: SH }}
            customMapStyle={darkMapStyle}
            showsUserLocation
            showsMyLocationButton={false}
            initialRegion={routeCoords[0]
              ? { ...routeCoords[0], latitudeDelta: 0.008, longitudeDelta: 0.008 }
              : { latitude:-33.8, longitude:151.2, latitudeDelta:0.01, longitudeDelta:0.01 }}
          >
            {routeCoords.length > 1 && (
              <Polyline coordinates={routeCoords} strokeColor="rgba(96,165,250,0.7)"
                strokeWidth={5} lineDashPattern={[10,5]} />
            )}
            {routeCoords.length > 0 && (
              <Marker coordinate={routeCoords[0]} title="Inicio">
                <Text style={{ fontSize:20 }}>🟢</Text>
              </Marker>
            )}
            {routeCoords.length > 1 && (
              <Marker coordinate={routeCoords[routeCoords.length-1]} title="Final">
                <Text style={{ fontSize:20 }}>🏁</Text>
              </Marker>
            )}
            {runPath.length > 1 && (
              <Polyline coordinates={runPath} strokeColor="#E8B500" strokeWidth={4} />
            )}
          </MapView>

          {/* Top overlay */}
          <View style={[fs.topBar, { top: Platform.OS==='ios' ? 50 : 30 }]}>
            <TouchableOpacity style={fs.exitBtn} onPress={() => setFullscreen(false)}>
              <Text style={{ color:'#fff', fontSize:12, fontWeight:'700' }}>⛶ Normal</Text>
            </TouchableOpacity>
            {distanceToRoute !== null && (
              <View style={[fs.routeBadge, {
                backgroundColor: offRoute ? 'rgba(239,68,68,0.9)' : 'rgba(34,197,94,0.9)'
              }]}>
                <Text style={{ color:'#fff', fontSize:12, fontWeight:'800' }}>
                  {offRoute ? `⚠ +${distanceToRoute}m` : '✓ En ruta'}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom overlay */}
          <View style={[fs.bottomOverlay, { paddingBottom: Platform.OS==='ios' ? 44 : 24 }]}>
            <Text style={fs.bigDist}>{formatDist(totalDistance)}</Text>
            <View style={fs.statsRow}>
              <View style={fs.stat}>
                <Text style={fs.statVal}>{formatTime(elapsedSeconds)}</Text>
                <Text style={fs.statLbl}>TIEMPO</Text>
              </View>
              <View style={fs.statDivider} />
              <View style={fs.stat}>
                <Text style={fs.statVal}>{formatPace(avgSpeed)}</Text>
                <Text style={fs.statLbl}>RITMO /km</Text>
              </View>
              <View style={fs.statDivider} />
              <View style={fs.stat}>
                <Text style={fs.statVal}>{routeProgress}%</Text>
                <Text style={fs.statLbl}>COMPLETADO</Text>
              </View>
            </View>
            <View style={fs.progressBg}>
              <View style={[fs.progressFill, { width: `${routeProgress}%` }]} />
            </View>
            <View style={fs.btns}>
              <TouchableOpacity style={fs.btnPause} onPress={pauseRun}>
                <Text style={{ color:'#fff', fontWeight:'800', fontSize:15 }}>⏸ Pausar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={fs.btnStop} onPress={finishRun}>
                <Text style={{ color:'#fff', fontWeight:'900', fontSize:15 }}>⏹ Terminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding:4 }}>
          <Text style={{ color: colors.brand, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{route.name}</Text>
          <Text style={{ fontSize:11, color: colors.textSecondary }}>
            📍 {formatDist(route.distance_m || 0)} · Ruta del entrenador
          </Text>
        </View>
        {status === 'running' && distanceToRoute !== null && (
          <View style={[styles.routeBadge, {
            backgroundColor: offRoute ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'
          }]}>
            <Text style={{ fontSize:10, fontWeight:'800', color: offRoute ? '#EF4444' : '#22C55E' }}>
              {offRoute ? `⚠ +${distanceToRoute}m` : '✓ En ruta'}
            </Text>
          </View>
        )}
      </View>

      {/* Mapa */}
      <View style={{ flex:1, position:'relative' }}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          customMapStyle={darkMapStyle}
          showsUserLocation
          showsMyLocationButton={false}
          initialRegion={routeCoords[0]
            ? { ...routeCoords[0], latitudeDelta: 0.008, longitudeDelta: 0.008 }
            : { latitude:-33.8, longitude:151.2, latitudeDelta:0.01, longitudeDelta:0.01 }}
        >
          {routeCoords.length > 1 && (
            <Polyline coordinates={routeCoords} strokeColor="rgba(96,165,250,0.7)"
              strokeWidth={5} lineDashPattern={[10,5]} />
          )}
          {routeCoords.length > 0 && (
            <Marker coordinate={routeCoords[0]} title="Inicio">
              <Text style={{ fontSize:20 }}>🟢</Text>
            </Marker>
          )}
          {routeCoords.length > 1 && (
            <Marker coordinate={routeCoords[routeCoords.length-1]} title="Final">
              <Text style={{ fontSize:20 }}>🏁</Text>
            </Marker>
          )}
          {runPath.length > 1 && (
            <Polyline coordinates={runPath} strokeColor="#E8B500" strokeWidth={4} />
          )}
        </MapView>

        {/* Overlay stats durante carrera (vista normal) */}
        {status === 'running' && (
          <View style={styles.overlay}>
            <Text style={styles.overlayDist}>{formatDist(totalDistance)}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{formatTime(elapsedSeconds)}</Text>
                <Text style={styles.statLbl}>TIEMPO</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{formatPace(avgSpeed)}</Text>
                <Text style={styles.statLbl}>RITMO /km</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{routeProgress}%</Text>
                <Text style={styles.statLbl}>RUTA</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Panel inferior */}
      <View style={[styles.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {status === 'idle' && (
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.brand }]} onPress={startRun}>
            <Text style={{ color:'#0A0A0A', fontWeight:'900', fontSize:16 }}>▶ Empezar a correr</Text>
          </TouchableOpacity>
        )}

        {status === 'running' && (
          <View style={{ flexDirection:'row', gap:10 }}>
            <TouchableOpacity style={[styles.btnSec, { borderColor: colors.border, flex:1 }]} onPress={pauseRun}>
              <Text style={{ color: colors.textPrimary, fontWeight:'700', fontSize:14 }}>⏸ Pausar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnDanger, { flex:1 }]} onPress={finishRun}>
              <Text style={{ color:'#fff', fontWeight:'900', fontSize:14 }}>⏹ Terminar</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'paused' && (
          <View style={{ flexDirection:'row', gap:10 }}>
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.brand, flex:1 }]} onPress={resumeRun}>
              <Text style={{ color:'#0A0A0A', fontWeight:'900', fontSize:14 }}>▶ Continuar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnDanger, { flex:1 }]} onPress={finishRun}>
              <Text style={{ color:'#fff', fontWeight:'900', fontSize:14 }}>⏹ Terminar</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'finished' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.brand, marginBottom:12 }]}>RESUMEN</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:12 }}>
              {[
                { label:'Distancia', value: formatDist(totalDistance) },
                { label:'Ruta completada', value: `${routeProgress}%` },
                { label:'Tiempo total', value: formatTime(elapsedSeconds) },
                { label:'Ritmo promedio', value: `${formatPace(avgSpeed)} /km` },
              ].map((item,i) => (
                <View key={i} style={[styles.summaryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.summaryVal, { color: colors.brand }]}>{item.value}</Text>
                  <Text style={{ fontSize:11, color: colors.textSecondary, fontWeight:'600' }}>{item.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.btnSec, { borderColor: colors.border }]} onPress={resetRun}>
              <Text style={{ color: colors.textPrimary, fontWeight:'700', fontSize:14 }}>🔄 Volver a correr</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const darkMapStyle = [
  { elementType:'geometry', stylers:[{ color:'#212121' }] },
  { elementType:'labels.text.fill', stylers:[{ color:'#757575' }] },
  { featureType:'road', elementType:'geometry', stylers:[{ color:'#2c2c2c' }] },
  { featureType:'water', elementType:'geometry', stylers:[{ color:'#000000' }] },
  { featureType:'poi', stylers:[{ visibility:'off' }] },
];

// Estilos fullscreen
const fs = StyleSheet.create({
  topBar: {
    position:'absolute', top: Platform.OS==='ios'?50:30,
    left:0, right:0, flexDirection:'row',
    justifyContent:'space-between', alignItems:'center',
    paddingHorizontal:16, zIndex:10,
  },
  exitBtn: {
    backgroundColor:'rgba(10,10,10,0.8)',
    paddingHorizontal:14, paddingVertical:9,
    borderRadius:12, borderWidth:1,
    borderColor:'rgba(255,255,255,0.2)',
  },
  routeBadge: {
    paddingHorizontal:14, paddingVertical:9, borderRadius:12,
  },
  bottomOverlay: {
    position:'absolute', bottom:0, left:0, right:0,
    backgroundColor:'rgba(10,10,10,0.88)',
    paddingTop:16, paddingHorizontal:20,
    paddingBottom: Platform.OS==='ios' ? 40 : 20,
    zIndex:10,
  },
  bigDist: {
    fontSize:48, fontWeight:'900', color:'#E8B500',
    textAlign:'center', letterSpacing:-1, marginBottom:8,
  },
  statsRow: {
    flexDirection:'row', justifyContent:'space-around',
    marginBottom:10,
  },
  stat:      { alignItems:'center' },
  statVal:   { fontSize:18, fontWeight:'900', color:'#F5F5F5' },
  statLbl:   { fontSize:9, color:'#888', fontWeight:'700', marginTop:2 },
  statDivider:{ width:1, backgroundColor:'rgba(255,255,255,0.15)', marginVertical:4 },
  progressBg:{ height:4, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:2, marginBottom:14, overflow:'hidden' },
  progressFill:{ height:4, backgroundColor:'#E8B500', borderRadius:2 },
  btns: { flexDirection:'row', gap:10 },
  btnPause: {
    flex:1, padding:15, borderRadius:14, alignItems:'center',
    borderWidth:1, borderColor:'rgba(255,255,255,0.2)',
    backgroundColor:'rgba(255,255,255,0.1)',
  },
  btnStop: {
    flex:1, padding:15, borderRadius:14, alignItems:'center',
    backgroundColor:'#EF4444',
  },
});

// Estilos vista normal
const styles = StyleSheet.create({
  header:    { paddingTop:Platform.OS==='ios'?50:30, paddingBottom:12, paddingHorizontal:16, borderBottomWidth:0.5, flexDirection:'row', alignItems:'center', gap:12 },
  title:     { fontSize:16, fontWeight:'900' },
  routeBadge:{ paddingHorizontal:10, paddingVertical:5, borderRadius:20 },
  overlay:   { position:'absolute', bottom:0, left:0, right:0, padding:14, backgroundColor:'rgba(10,10,10,0.85)' },
  overlayDist:{ fontSize:28, fontWeight:'900', color:'#E8B500', textAlign:'center', marginBottom:8 },
  statsRow:  { flexDirection:'row', justifyContent:'space-around' },
  stat:      { alignItems:'center' },
  statVal:   { fontSize:16, fontWeight:'900', color:'#E8B500' },
  statLbl:   { fontSize:9, color:'#888', fontWeight:'700', marginTop:2 },
  panel:     { padding:16, paddingBottom:Platform.OS==='ios'?32:16, borderTopWidth:0.5 },
  btnPrimary:{ borderRadius:14, padding:16, alignItems:'center' },
  btnSec:    { borderRadius:14, padding:14, alignItems:'center', borderWidth:1 },
  btnDanger: { borderRadius:14, padding:14, alignItems:'center', backgroundColor:'#EF4444' },
  sectionTitle:{ fontSize:10, fontWeight:'800', letterSpacing:1.5 },
  summaryCard:{ flex:1, minWidth:'45%', borderRadius:12, padding:12, borderWidth:0.5, alignItems:'center' },
  summaryVal: { fontSize:18, fontWeight:'900', marginBottom:4 },
});