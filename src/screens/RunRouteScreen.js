// src/screens/RunRouteScreen.js
// Pantalla para correr siguiendo una ruta predefinida del trainer

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Vibration, Platform,
} from 'react-native';
import MapView, { Polyline, Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../theme/ThemeContext';
import Odometer from '../components/Odometer';

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

export default function RunRouteScreen({ route: navRoute, navigation }) {
  const { route } = navRoute.params; // La ruta del trainer
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const mapRef = useRef(null);

  // Convertir coords del backend {lat,lng} a {latitude,longitude} para el mapa
  const routeCoords = (route.coordinates || []).map(c => ({
    latitude:  c.lat || c.latitude,
    longitude: c.lng || c.longitude,
  }));

  const [status, setStatus]           = useState('idle'); // idle|running|paused|finished
  const [currentPos, setCurrentPos]   = useState(null);
  const [runPath, setRunPath]         = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentSpeed, setCurrentSpeed]   = useState(0);
  const [distanceToRoute, setDistanceToRoute] = useState(null);
  const [offRoute, setOffRoute]       = useState(false);

  const locationSub  = useRef(null);
  const timerRef     = useRef(null);
  const distanceRef  = useRef(0);

  useEffect(() => {
    requestPermission();
    return () => cleanup();
  }, []);

  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setCurrentPos(coords);

    // Centrar mapa en el inicio de la ruta o en la posición actual
    const center = routeCoords[0] || coords;
    mapRef.current?.animateToRegion({
      ...center, latitudeDelta: 0.008, longitudeDelta: 0.008,
    }, 500);
  }

  function cleanup() {
    locationSub.current?.remove();
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // Encontrar punto más cercano de la ruta
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
            const dist = haversineDistance(prev[prev.length-1], newPoint);
            distanceRef.current += dist;
            setTotalDistance(distanceRef.current);
          }
          return [...prev, newPoint];
        });

        // Verificar si está en la ruta
        const closest = getClosestPointOnRoute(newPoint);
        if (closest !== null) {
          setDistanceToRoute(Math.round(closest));
          const isOff = closest > 50; // más de 50m = fuera de ruta
          setOffRoute(isOff);
          if (isOff) Vibration.vibrate(200);
        }

        mapRef.current?.animateToRegion({
          ...newPoint, latitudeDelta: 0.004, longitudeDelta: 0.004,
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
  }

  function resetRun() {
    cleanup();
    setStatus('idle');
    setRunPath([]);
    setTotalDistance(0);
    setElapsedSeconds(0);
    distanceRef.current = 0;
  }

  const avgSpeed = elapsedSeconds > 0 ? totalDistance / elapsedSeconds : 0;
  const routeProgress = route.distance_m > 0
    ? Math.min(100, Math.round((totalDistance / route.distance_m) * 100))
    : 0;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding:4 }}>
          <Text style={{ color: colors.brand, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>{route.name}</Text>
          <Text style={{ fontSize:11, color: colors.textSecondary }}>
            📍 {route.distance_m >= 1000
              ? `${(route.distance_m/1000).toFixed(2)} km`
              : `${Math.round(route.distance_m || 0)} m`} · Ruta del entrenador
          </Text>
        </View>
        {/* Indicador fuera de ruta */}
        {status === 'running' && distanceToRoute !== null && (
          <View style={[s.offRouteBadge, { backgroundColor: offRoute ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)' }]}>
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
          initialRegion={routeCoords[0] ? {
            ...routeCoords[0], latitudeDelta: 0.008, longitudeDelta: 0.008,
          } : { latitude:-33.8, longitude:151.2, latitudeDelta:0.01, longitudeDelta:0.01 }}
        >
          {/* Ruta del trainer (referencia) */}
          {routeCoords.length > 1 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="rgba(96,165,250,0.7)"
              strokeWidth={5}
              lineDashPattern={[10, 5]}
            />
          )}

          {/* Inicio y fin de la ruta */}
          {routeCoords.length > 0 && (
            <Marker coordinate={routeCoords[0]} title="Inicio">
              <View style={s.markerStart}><Text style={{ fontSize:16 }}>🟢</Text></View>
            </Marker>
          )}
          {routeCoords.length > 1 && (
            <Marker coordinate={routeCoords[routeCoords.length-1]} title="Final">
              <View style={s.markerEnd}><Text style={{ fontSize:16 }}>🏁</Text></View>
            </Marker>
          )}

          {/* Camino recorrido por el alumno */}
          {runPath.length > 1 && (
            <Polyline
              coordinates={runPath}
              strokeColor="#E8B500"
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Overlay stats durante carrera */}
        {status === 'running' && (
          <View style={[s.overlay, { backgroundColor:'rgba(10,10,10,0.88)' }]}>
            <Odometer value={totalDistance} color="#E8B500" bgColor="#1A1A1A" fontSize={34} />
            <View style={s.statsRow}>
              <View style={s.stat}>
                <Text style={s.statVal}>{formatTime(elapsedSeconds)}</Text>
                <Text style={s.statLbl}>TIEMPO</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statVal}>{formatPace(avgSpeed)}</Text>
                <Text style={s.statLbl}>RITMO /km</Text>
              </View>
              <View style={s.stat}>
                <Text style={[s.statVal, { color:'var(--brand)', fontSize:14 }]}>{routeProgress}%</Text>
                <Text style={s.statLbl}>RUTA</Text>
              </View>
            </View>
            {/* Barra de progreso de la ruta */}
            <View style={[s.progressBar, { backgroundColor:'rgba(255,255,255,0.1)' }]}>
              <View style={[s.progressFill, { width:`${routeProgress}%`, backgroundColor: colors.brand }]} />
            </View>
          </View>
        )}
      </View>

      {/* Panel inferior */}
      <View style={[s.panel, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {status === 'idle' && (
          <TouchableOpacity style={[s.btnPrimary, { backgroundColor: colors.brand }]} onPress={startRun}>
            <Text style={[s.btnPrimaryText, { color:'#0A0A0A' }]}>▶ Empezar a correr</Text>
          </TouchableOpacity>
        )}

        {status === 'running' && (
          <View style={{ flexDirection:'row', gap:10 }}>
            <TouchableOpacity style={[s.btnSecondary, { borderColor: colors.border, flex:1 }]} onPress={pauseRun}>
              <Text style={[s.btnSecText, { color: colors.textPrimary }]}>⏸ Pausar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnDanger, { flex:1 }]} onPress={finishRun}>
              <Text style={{ color:'#fff', fontWeight:'900', fontSize:14 }}>⏹ Terminar</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'paused' && (
          <View style={{ flexDirection:'row', gap:10 }}>
            <TouchableOpacity style={[s.btnPrimary, { backgroundColor: colors.brand, flex:1 }]} onPress={resumeRun}>
              <Text style={[s.btnPrimaryText, { color:'#0A0A0A' }]}>▶ Continuar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnDanger, { flex:1 }]} onPress={finishRun}>
              <Text style={{ color:'#fff', fontWeight:'900', fontSize:14 }}>⏹ Terminar</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'finished' && (
          <>
            <Text style={[s.sectionTitle, { color: colors.brand, marginBottom:12 }]}>RESUMEN</Text>
            <View style={s.summaryGrid}>
              {[
                { label:'Distancia recorrida', value: totalDistance >= 1000 ? `${(totalDistance/1000).toFixed(2)} km` : `${Math.round(totalDistance)} m` },
                { label:'Ruta completada',     value: `${routeProgress}%` },
                { label:'Tiempo total',         value: formatTime(elapsedSeconds) },
                { label:'Ritmo promedio',       value: `${formatPace(avgSpeed)} /km` },
              ].map((item,i) => (
                <View key={i} style={[s.summaryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[s.summaryVal, { color: colors.brand }]}>{item.value}</Text>
                  <Text style={[s.summaryLbl, { color: colors.textSecondary }]}>{item.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[s.btnSecondary, { borderColor: colors.border, marginTop:12 }]} onPress={resetRun}>
              <Text style={[s.btnSecText, { color: colors.textPrimary }]}>🔄 Volver a correr</Text>
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

const makeStyles = (colors) => StyleSheet.create({
  container:   { flex:1, backgroundColor:colors.background },
  header:      { paddingTop:Platform.OS==='ios'?50:30, paddingBottom:12, paddingHorizontal:16, borderBottomWidth:0.5, flexDirection:'row', alignItems:'center', gap:12 },
  title:       { fontSize:16, fontWeight:'900' },
  offRouteBadge:{ paddingHorizontal:10, paddingVertical:5, borderRadius:20 },

  overlay:     { position:'absolute', bottom:0, left:0, right:0, padding:14 },
  statsRow:    { flexDirection:'row', justifyContent:'space-around', marginTop:8 },
  stat:        { alignItems:'center' },
  statVal:     { fontSize:18, fontWeight:'900', color:'#E8B500' },
  statLbl:     { fontSize:9, color:'#888', fontWeight:'700', marginTop:2 },
  progressBar: { height:4, borderRadius:2, overflow:'hidden', marginTop:10 },
  progressFill:{ height:4, borderRadius:2 },

  markerStart: { width:32, height:32, justifyContent:'center', alignItems:'center' },
  markerEnd:   { width:32, height:32, justifyContent:'center', alignItems:'center' },

  panel:       { padding:16, paddingBottom:Platform.OS==='ios'?32:16, borderTopWidth:0.5 },
  btnPrimary:  { borderRadius:14, padding:16, alignItems:'center' },
  btnPrimaryText:{ fontWeight:'900', fontSize:16 },
  btnSecondary:{ borderRadius:14, padding:14, alignItems:'center', borderWidth:1 },
  btnSecText:  { fontWeight:'700', fontSize:14 },
  btnDanger:   { borderRadius:14, padding:14, alignItems:'center', backgroundColor:'#EF4444' },

  sectionTitle:{ fontSize:10, fontWeight:'800', letterSpacing:1.5 },
  summaryGrid: { flexDirection:'row', flexWrap:'wrap', gap:10 },
  summaryCard: { flex:1, minWidth:'45%', borderRadius:12, padding:12, borderWidth:0.5, alignItems:'center' },
  summaryVal:  { fontSize:18, fontWeight:'900', marginBottom:4 },
  summaryLbl:  { fontSize:11, fontWeight:'600' },
});