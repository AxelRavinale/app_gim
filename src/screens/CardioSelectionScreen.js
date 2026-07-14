// src/screens/CardioSelectionScreen.js
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, StatusBar,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useSession } from '../context/SessionContext';

export default function CardioSelectionScreen({ navigation }) {
  const { colors } = useTheme();
  const { user }   = useSession() || {};
  const s = makeStyles(colors);

  const hasGym = !!(user?.gymId || user?.gym_id);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={{ color: colors.brand, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.gymName}>GYMTRACKER</Text>
          <Text style={s.title}>Cardio</Text>
        </View>
      </View>

      <View style={s.cards}>

        {/* Card Gimnasio */}
        <TouchableOpacity
          style={[s.card, {
            backgroundColor: colors.card,
            borderColor: hasGym ? 'rgba(34,197,94,0.35)' : colors.border,
            opacity: hasGym ? 1 : 0.6,
          }]}
          onPress={() => hasGym ? navigation.navigate('GymCardio') : navigation.navigate('JoinGym')}
          activeOpacity={0.85}
        >
          <View style={[s.cardAccent, { backgroundColor: hasGym ? '#22C55E' : colors.border }]} />
          <View style={[s.cardIconWrap, { backgroundColor: hasGym ? 'rgba(34,197,94,0.12)' : 'rgba(136,136,136,0.1)' }]}>
            <Text style={s.cardIcon}>{hasGym ? '🏋️' : '🔒'}</Text>
          </View>
          <View style={s.cardContent}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Gimnasio</Text>
            <Text style={[s.cardDesc, { color: colors.textSecondary }]}>
              {hasGym
                ? 'Planes y circuitos de tu entrenador'
                : 'Uníte a un gimnasio para acceder'}
            </Text>
            {!hasGym && (
              <View style={[s.lockBadge, { backgroundColor:'rgba(136,136,136,0.15)', borderColor:'rgba(136,136,136,0.3)' }]}>
                <Text style={{ fontSize:10, color:colors.textSecondary, fontWeight:'700' }}>
                  🔑 Ingresar código del gimnasio
                </Text>
              </View>
            )}
          </View>
          <View style={[s.cardArrow, { backgroundColor: hasGym ? '#22C55E' : colors.border }]}>
            <Text style={{ color: hasGym ? '#0A0A0A' : colors.textSecondary, fontSize:18, fontWeight:'900' }}>
              {hasGym ? '→' : '+'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card Personal */}
        <TouchableOpacity
          style={[s.card, { backgroundColor: colors.card, borderColor:'rgba(96,165,250,0.35)' }]}
          onPress={() => navigation.navigate('CardioPersonal')}
          activeOpacity={0.85}
        >
          <View style={[s.cardAccent, { backgroundColor:'#60A5FA' }]} />
          <View style={[s.cardIconWrap, { backgroundColor:'rgba(96,165,250,0.12)' }]}>
            <Text style={s.cardIcon}>🏃</Text>
          </View>
          <View style={s.cardContent}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Personal</Text>
            <Text style={[s.cardDesc, { color: colors.textSecondary }]}>
              GPS, rutas, distancias y circuitos propios
            </Text>
          </View>
          <View style={[s.cardArrow, { backgroundColor:'#60A5FA' }]}>
            <Text style={{ color:'#0A0A0A', fontSize:18, fontWeight:'900' }}>→</Text>
          </View>
        </TouchableOpacity>

      </View>

      <Text style={[s.footer, { color: colors.textLight }]}>
        Seleccioná el tipo de cardio
      </Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex:1, backgroundColor:colors.background,
    paddingTop: Platform.OS==='ios' ? 50 : 30,
  },
  header: {
    flexDirection:'row', alignItems:'center', gap:14,
    paddingHorizontal:20, paddingBottom:20,
    borderBottomWidth:0.5, borderBottomColor:colors.border,
    marginBottom:10,
  },
  backBtn:  { padding:4 },
  gymName:  { fontSize:10, fontWeight:'800', color:colors.brand, letterSpacing:2, marginBottom:2 },
  title:    { fontSize:22, fontWeight:'900', color:colors.textPrimary },

  cards: { flex:1, padding:20, gap:16, justifyContent:'center' },

  card: {
    borderRadius:20, borderWidth:1.5, padding:22,
    flexDirection:'row', alignItems:'center', gap:16,
    overflow:'hidden', position:'relative',
    shadowColor:'#000', shadowOffset:{width:0,height:4},
    shadowOpacity:0.25, shadowRadius:10, elevation:5,
    minHeight:110,
  },
  cardAccent:   { position:'absolute', left:0, top:0, bottom:0, width:4 },
  cardIconWrap: { width:58, height:58, borderRadius:16, justifyContent:'center', alignItems:'center', flexShrink:0 },
  cardIcon:     { fontSize:28 },
  cardContent:  { flex:1, gap:4 },
  cardTitle:    { fontSize:20, fontWeight:'900', letterSpacing:-0.3 },
  cardDesc:     { fontSize:13, lineHeight:19 },
  cardArrow:    { width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center', flexShrink:0 },
  lockBadge:    { marginTop:6, alignSelf:'flex-start', paddingHorizontal:10, paddingVertical:4, borderRadius:20, borderWidth:1 },
  footer:       { textAlign:'center', fontSize:12, paddingBottom:30, paddingTop:10 },
});