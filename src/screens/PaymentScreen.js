// src/screens/PaymentScreen.js
// Pantalla del alumno para ver su estado de cuota y subir comprobante

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Alert, TextInput,
  Platform, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';

const BASE_URL = 'https://gimnasio-production-7475.up.railway.app';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
  'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const STATUS_CONFIG = {
  paid:     { label:'Al día',           color:'#22C55E', bg:'rgba(34,197,94,0.12)',   icon:'✅', desc:'Tu cuota está pagada y confirmada.' },
  pending:  { label:'Pendiente',        color:'#E8B500', bg:'rgba(232,181,0,0.12)',   icon:'⏳', desc:'Tu comprobante está siendo revisado por el gimnasio.' },
  not_paid: { label:'Cuota pendiente',  color:'#F97316', bg:'rgba(249,115,22,0.12)', icon:'⚠️', desc:'Todavía no registramos tu pago de este mes.' },
  debtor:   { label:'Deudor',           color:'#EF4444', bg:'rgba(239,68,68,0.12)',  icon:'🚨', desc:'Tenés pagos pendientes de meses anteriores.' },
  rejected: { label:'Comprobante rechazado', color:'#EF4444', bg:'rgba(239,68,68,0.12)', icon:'✕', desc:'Tu comprobante fue rechazado. Subí uno nuevo.' },
  no_gym:   { label:'Sin gimnasio',     color:'#888',    bg:'rgba(136,136,136,0.1)', icon:'🏋️', desc:'No estás asociado a ningún gimnasio todavía.' },
};

const PAYMENT_METHOD_LABELS = {
  transfer:'Transferencia', cash:'Efectivo', mercadopago:'MercadoPago', other:'Otro'
};

async function getToken() {
  try { return await AsyncStorage.getItem('gymtracker_access_token'); } catch { return null; }
}

export default function PaymentScreen({ navigation }) {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [amount, setAmount]       = useState('');
  const [method, setMethod]       = useState('transfer');

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/payments/my-status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
      // Pre-llenar monto con el del plan
      if (json.plan_price) setAmount(json.plan_price.toString());
    } catch (err) {
      console.error('Error cargando estado de pago:', err);
    } finally { setLoading(false); }
  }

  async function handleUploadReceipt() {
    // Pedir permiso a la galería
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para subir el comprobante.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const token = await getToken();
      const imageUri = result.assets[0].uri;

      // Subir imagen como FormData
      const formData = new FormData();
      formData.append('file', {
        uri:  imageUri,
        type: 'image/jpeg',
        name: `comprobante_${Date.now()}.jpg`,
      });

      // Por ahora usamos la URI local como receipt_url
      // En producción esto debería subirse a un storage (S3, Cloudinary, etc.)
      // y usar la URL pública
      const receiptUrl = imageUri;

      const res = await fetch(`${BASE_URL}/api/payments/upload-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptUrl,
          amount:        parseFloat(amount) || null,
          paymentMethod: method,
        }),
      });

      if (!res.ok) throw new Error('Error al subir');

      Alert.alert('✅ Enviado', 'Tu comprobante fue enviado al gimnasio para revisión.');
      setShowUpload(false);
      await load();
    } catch (err) {
      Alert.alert('Error', 'No se pudo subir el comprobante. Intentá de nuevo.');
    } finally { setUploading(false); }
  }

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const token = await getToken();
      const receiptUrl = result.assets[0].uri;

      const res = await fetch(`${BASE_URL}/api/payments/upload-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptUrl,
          amount:        parseFloat(amount) || null,
          paymentMethod: method,
        }),
      });

      if (!res.ok) throw new Error('Error al subir');

      Alert.alert('✅ Enviado', 'Tu comprobante fue enviado al gimnasio.');
      setShowUpload(false);
      await load();
    } catch {
      Alert.alert('Error', 'No se pudo subir el comprobante.');
    } finally { setUploading(false); }
  }

  if (loading) return (
    <View style={s.centered}>
      <ActivityIndicator color={colors.brand} size="large" />
    </View>
  );

  const status    = data?.status || 'no_gym';
  const stCfg     = STATUS_CONFIG[status] || STATUS_CONFIG.not_paid;
  const canUpload = ['not_paid','debtor','rejected'].includes(status);
  const isPending = status === 'pending';

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerLabel}>GYMTRACKER</Text>
        <Text style={s.headerTitle}>Mi cuota</Text>
        <Text style={s.headerSub}>{MONTHS[(data?.current_month||1)-1]} {data?.current_year}</Text>
      </View>

      {/* Card de estado principal */}
      <View style={[s.statusCard, { backgroundColor: stCfg.bg, borderColor: stCfg.color + '40' }]}>
        <Text style={s.statusIcon}>{stCfg.icon}</Text>
        <Text style={[s.statusLabel, { color: stCfg.color }]}>{stCfg.label}</Text>
        <Text style={s.statusDesc}>{stCfg.desc}</Text>

        {/* Info del plan */}
        {data?.plan_name && (
          <View style={s.planInfo}>
            <Text style={s.planName}>{data.plan_name}</Text>
            {data?.plan_price && (
              <Text style={[s.planPrice, { color: stCfg.color }]}>
                ${parseFloat(data.plan_price).toLocaleString('es-AR')}
              </Text>
            )}
          </View>
        )}

        {/* Gym name */}
        {data?.gym_name && (
          <Text style={s.gymName}>{data.gym_name}</Text>
        )}
      </View>

      {/* Pago actual */}
      {data?.current_payment && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>PAGO DEL MES</Text>
          <View style={s.paymentCard}>
            <View style={s.paymentRow}>
              <Text style={s.paymentLabel}>Monto</Text>
              <Text style={s.paymentValue}>${parseFloat(data.current_payment.amount || 0).toLocaleString('es-AR')}</Text>
            </View>
            <View style={s.paymentRow}>
              <Text style={s.paymentLabel}>Método</Text>
              <Text style={s.paymentValue}>{PAYMENT_METHOD_LABELS[data.current_payment.payment_method] || data.current_payment.payment_method}</Text>
            </View>
            {data.current_payment.confirmed_at && (
              <View style={s.paymentRow}>
                <Text style={s.paymentLabel}>Confirmado</Text>
                <Text style={[s.paymentValue, { color: colors.success }]}>
                  {new Date(data.current_payment.confirmed_at).toLocaleDateString('es-AR')}
                </Text>
              </View>
            )}
            {data.current_payment.notes && (
              <View style={[s.paymentRow, { flexDirection:'column', gap:4 }]}>
                <Text style={s.paymentLabel}>Notas del gimnasio</Text>
                <Text style={[s.paymentValue, { color: colors.textSecondary, fontSize:12 }]}>{data.current_payment.notes}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Aviso de deuda */}
      {status === 'debtor' && data?.past_debt > 0 && (
        <View style={[s.debtAlert, { backgroundColor:'rgba(239,68,68,0.1)', borderColor:'rgba(239,68,68,0.3)' }]}>
          <Text style={{ color:'#EF4444', fontWeight:'800', fontSize:14, marginBottom:4 }}>
            🚨 Tenés {data.past_debt} mes{data.past_debt>1?'es':''} adeudado{data.past_debt>1?'s':''}
          </Text>
          <Text style={{ color:colors.textSecondary, fontSize:12 }}>
            Contactá al gimnasio para regularizar tu situación.
          </Text>
        </View>
      )}

      {/* Botón subir comprobante */}
      {canUpload && !showUpload && (
        <View style={s.section}>
          <TouchableOpacity
            style={[s.uploadBtn, { backgroundColor: colors.brand }]}
            onPress={() => setShowUpload(true)}
            activeOpacity={0.8}
          >
            <Text style={[s.uploadBtnText, { color: colors.textOnBrand }]}>
              📎 Subir comprobante de pago
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Panel de subida */}
      {showUpload && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>SUBIR COMPROBANTE</Text>
          <View style={[s.uploadPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Monto */}
            <Text style={s.fieldLabel}>MONTO PAGADO</Text>
            <TextInput
              style={[s.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.cardAlt }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textLight}
              keyboardType="decimal-pad"
            />

            {/* Método de pago */}
            <Text style={[s.fieldLabel, { marginTop: 14 }]}>MÉTODO DE PAGO</Text>
            <View style={{ flexDirection:'row', gap:8, marginBottom:16 }}>
              {[['transfer','🏦 Transferencia'],['cash','💵 Efectivo'],['other','Otro']].map(([val,label]) => (
                <TouchableOpacity key={val}
                  style={[s.methodBtn, {
                    borderColor: method===val ? colors.brand : colors.border,
                    backgroundColor: method===val ? colors.brandLight : colors.cardAlt,
                  }]}
                  onPress={() => setMethod(val)}
                >
                  <Text style={[s.methodBtnText, { color: method===val ? colors.brand : colors.textSecondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botones de foto */}
            <Text style={s.fieldLabel}>COMPROBANTE</Text>
            <View style={{ flexDirection:'row', gap:10, marginBottom:8 }}>
              <TouchableOpacity
                style={[s.photoBtn, { backgroundColor: colors.card, borderColor: colors.border, flex:1 }]}
                onPress={handleTakePhoto}
                disabled={uploading}
              >
                <Text style={{ fontSize:22, marginBottom:4 }}>📷</Text>
                <Text style={{ fontSize:12, color:colors.textSecondary, fontWeight:'600' }}>Sacar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.photoBtn, { backgroundColor: colors.card, borderColor: colors.border, flex:1 }]}
                onPress={handleUploadReceipt}
                disabled={uploading}
              >
                {uploading ? <ActivityIndicator color={colors.brand} /> : (
                  <>
                    <Text style={{ fontSize:22, marginBottom:4 }}>🖼️</Text>
                    <Text style={{ fontSize:12, color:colors.textSecondary, fontWeight:'600' }}>Galería</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.cancelUploadBtn, { borderColor: colors.border }]}
              onPress={() => setShowUpload(false)}
            >
              <Text style={{ color: colors.textSecondary, fontWeight:'700', fontSize:13 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Estado pendiente */}
      {isPending && (
        <View style={[s.pendingInfo, { backgroundColor: colors.brandLight, borderColor: colors.brand + '44' }]}>
          <Text style={{ color: colors.brand, fontWeight:'800', fontSize:14, marginBottom:6 }}>
            ⏳ Esperando confirmación
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize:12, lineHeight:18 }}>
            Tu comprobante fue enviado. El gimnasio lo revisará y confirmará en breve.
            Si tenés alguna duda, contactá directamente al gimnasio.
          </Text>
        </View>
      )}

      {/* Historial */}
      {data?.history && data.history.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>HISTORIAL DE PAGOS</Text>
          {data.history.map((payment, i) => {
            const statusColors = {
              confirmed: colors.success,
              pending:   colors.brand,
              rejected:  colors.danger,
            };
            const statusLabels = { confirmed:'Confirmado', pending:'Pendiente', rejected:'Rechazado' };
            const color = statusColors[payment.status] || colors.textSecondary;
            return (
              <View key={payment.id || i} style={[s.historyItem, { borderColor: colors.border }]}>
                <View style={{ flex:1 }}>
                  <Text style={s.historyMonth}>
                    {MONTHS[payment.period_month-1]} {payment.period_year}
                  </Text>
                  <Text style={{ fontSize:11, color:colors.textSecondary, marginTop:2 }}>
                    {PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}
                  </Text>
                </View>
                <View style={{ alignItems:'flex-end' }}>
                  <Text style={{ fontSize:14, fontWeight:'800', color: colors.textPrimary }}>
                    ${parseFloat(payment.amount || 0).toLocaleString('es-AR')}
                  </Text>
                  <Text style={{ fontSize:11, fontWeight:'700', color, marginTop:2 }}>
                    {statusLabels[payment.status] || payment.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Banner web */}
      <TouchableOpacity
        style={[s.webBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => Linking.openURL('https://gymtracker-backend-five.vercel.app')}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize:20, marginRight:10 }}>🌐</Text>
        <View style={{ flex:1 }}>
          <Text style={{ fontSize:13, fontWeight:'800', color:colors.brand }}>Ver más en la web</Text>
          <Text style={{ fontSize:11, color:colors.textSecondary, marginTop:2 }}>
            Accedé al panel web para ver tus gráficos de progreso y más detalles
          </Text>
        </View>
        <Text style={{ color:colors.textSecondary, fontSize:16 }}>→</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex:1, backgroundColor:colors.background },
  centered:  { flex:1, justifyContent:'center', alignItems:'center' },

  header: { backgroundColor:colors.card, paddingHorizontal:20, paddingTop:20, paddingBottom:16, borderBottomWidth:0.5, borderBottomColor:colors.border },
  headerLabel: { fontSize:9, fontWeight:'800', color:colors.brand, letterSpacing:2.5, marginBottom:4 },
  headerTitle: { fontSize:26, fontWeight:'900', color:colors.textPrimary, letterSpacing:-0.5 },
  headerSub:   { fontSize:13, color:colors.textSecondary, marginTop:3 },

  statusCard: { margin:16, borderRadius:20, padding:24, borderWidth:1.5, alignItems:'center' },
  statusIcon:  { fontSize:48, marginBottom:10 },
  statusLabel: { fontSize:20, fontWeight:'900', marginBottom:8, letterSpacing:-0.3 },
  statusDesc:  { fontSize:13, color:'#aaa', textAlign:'center', lineHeight:19 },
  planInfo:    { marginTop:16, alignItems:'center', borderTopWidth:0.5, borderTopColor:'rgba(255,255,255,0.1)', paddingTop:14, width:'100%' },
  planName:    { fontSize:12, color:'#aaa', marginBottom:4 },
  planPrice:   { fontSize:28, fontWeight:'900', letterSpacing:-1 },
  gymName:     { fontSize:11, color:'#666', marginTop:10 },

  section: { paddingHorizontal:16, marginBottom:16 },
  sectionTitle: { fontSize:10, fontWeight:'800', color:colors.brand, letterSpacing:1.5, marginBottom:10 },

  paymentCard: { backgroundColor:colors.card, borderRadius:14, padding:16, borderWidth:0.5, borderColor:colors.border },
  paymentRow:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:8, borderBottomWidth:0.5, borderBottomColor:colors.border },
  paymentLabel:{ fontSize:12, color:colors.textSecondary },
  paymentValue:{ fontSize:13, fontWeight:'700', color:colors.textPrimary },

  debtAlert: { marginHorizontal:16, marginBottom:16, padding:16, borderRadius:14, borderWidth:1 },

  uploadBtn: { borderRadius:14, padding:17, alignItems:'center', shadowColor:colors.brand, shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:6 },
  uploadBtnText: { fontWeight:'900', fontSize:15 },

  uploadPanel: { borderRadius:16, padding:18, borderWidth:1 },
  fieldLabel:  { fontSize:10, fontWeight:'800', color:colors.brand, letterSpacing:1.5, marginBottom:8 },
  input: { borderWidth:1, borderRadius:10, paddingHorizontal:14, paddingVertical:12, fontSize:18, fontWeight:'800', textAlign:'center', marginBottom:4 },
  methodBtn: { flex:1, paddingVertical:10, borderRadius:10, borderWidth:1.5, alignItems:'center' },
  methodBtnText: { fontSize:11, fontWeight:'700' },
  photoBtn: { borderWidth:1, borderRadius:12, padding:16, alignItems:'center', justifyContent:'center', minHeight:80 },
  cancelUploadBtn: { marginTop:8, paddingVertical:13, borderRadius:12, borderWidth:1, alignItems:'center' },

  pendingInfo: { marginHorizontal:16, marginBottom:16, padding:16, borderRadius:14, borderWidth:1 },

  historyItem: { flexDirection:'row', alignItems:'center', padding:14, borderRadius:12, borderWidth:0.5, marginBottom:8 },
  historyMonth: { fontSize:13, fontWeight:'700', color:colors.textPrimary },

  webBanner: { marginHorizontal:16, marginTop:8, padding:16, borderRadius:14, borderWidth:1, flexDirection:'row', alignItems:'center' },
});