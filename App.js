import React, { useState, useEffect } from 'react';
import * as Updates from 'expo-updates';
import { NavigationContainer } from '@react-navigation/native';
import { SessionProvider, useSession } from './src/context/SessionContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen           from './src/screens/LoginScreen';
import HomeScreen            from './src/screens/HomeScreen';
import DetailScreen          from './src/screens/DetailScreen';
import AddExerciseScreen     from './src/screens/AddExerciseScreen';
import ExecuteExerciseScreen from './src/screens/ExecuteExerciseScreen';
import RoutinesScreen        from './src/screens/RoutinesScreen';
import RoutineDetailScreen   from './src/screens/RoutineDetailScreen';
import AddRoutineScreen      from './src/screens/AddRoutineScreen';
import ExecuteRoutineScreen  from './src/screens/ExecuteRoutineScreen';
import StatsScreen           from './src/screens/StatsScreen';
import TimerScreen           from './src/screens/TimerScreen';
import AchievementsScreen    from './src/screens/AchievementsScreen';
import SettingsScreen        from './src/screens/SettingsScreen';
import PaymentScreen         from './src/screens/PaymentScreen';
import SelectionScreen       from './src/screens/SelectionScreen';
import JoinGymScreen         from './src/screens/JoinGymScreen';
import NoGymScreen               from './src/screens/NoGymScreen';
import TrainingSelectionScreen   from './src/screens/TrainingSelectionScreen';
import GymHomeScreen           from './src/screens/GymHomeScreen';
import GymRoutinesScreen       from './src/screens/GymRoutinesScreen';
import GymCardioScreen         from './src/screens/GymCardioScreen';
import CardioSelectionScreen   from './src/screens/CardioSelectionScreen';
import RunRouteScreen          from './src/screens/RunRouteScreen';
import HamburgerMenu           from './src/components/HamburgerMenu';
import CardioScreen          from './src/screens/CardioScreen';
import CardioTimerScreen     from './src/screens/CardioTimerScreen';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { authAPI, getSavedUser }   from './src/services/api';

function buildScreenOptions(colors) {
  return {
    headerStyle:      { backgroundColor: colors.card },
    headerTintColor:  colors.brand,
    headerTitleStyle: { fontWeight: '800', color: colors.textPrimary, fontSize: 17 },
    contentStyle:     { backgroundColor: colors.background },
    animation:        'slide_from_right',
  };
}

function ExercisesStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={buildScreenOptions(colors)}>
      <Stack.Screen name="Home"            component={HomeScreen}            options={{ headerShown: false }} />
      <Stack.Screen name="Detail"          component={DetailScreen}          options={{ title: 'Ejercicio' }} />
      <Stack.Screen name="AddExercise"     component={AddExerciseScreen}     options={{ title: 'Nuevo ejercicio', presentation: 'modal' }} />
      <Stack.Screen name="ExecuteExercise" component={ExecuteExerciseScreen} options={{ title: 'Ejecutar', headerShown: false }} />
    </Stack.Navigator>
  );
}

function RoutinesStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={buildScreenOptions(colors)}>
      <Stack.Screen name="Routines"       component={RoutinesScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="RoutineDetail"  component={RoutineDetailScreen}  options={{ title: 'Rutina' }} />
      <Stack.Screen name="AddRoutine"     component={AddRoutineScreen}     options={{ title: 'Nueva rutina', presentation: 'modal' }} />
      <Stack.Screen name="ExecuteRoutine" component={ExecuteRoutineScreen} options={{ title: 'Entrenar', headerShown: false }} />
    </Stack.Navigator>
  );
}

function StatsStack()        { const { colors } = useTheme(); return <Stack.Navigator screenOptions={buildScreenOptions(colors)}><Stack.Screen name="Stats"        component={StatsScreen}        options={{ headerShown: false }} /></Stack.Navigator>; }
function TimerStack()        { const { colors } = useTheme(); return <Stack.Navigator screenOptions={buildScreenOptions(colors)}><Stack.Screen name="Timer"        component={TimerScreen}        options={{ headerShown: false }} /></Stack.Navigator>; }
function AchievementsStack() { const { colors } = useTheme(); return <Stack.Navigator screenOptions={buildScreenOptions(colors)}><Stack.Screen name="Achievements" component={AchievementsScreen} options={{ headerShown: false }} /></Stack.Navigator>; }
function SettingsStack()     { const { colors } = useTheme(); return <Stack.Navigator screenOptions={buildScreenOptions(colors)}><Stack.Screen name="Settings"     component={SettingsScreen}     options={{ headerShown: false }} /></Stack.Navigator>; }
function PaymentStack()      { const { colors } = useTheme(); return <Stack.Navigator screenOptions={buildScreenOptions(colors)}><Stack.Screen name="Payment"      component={PaymentScreen}      options={{ headerShown: false }} /></Stack.Navigator>; }

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function MainApp() {
  const { colors }  = useTheme();
  const { user }    = useSession();

  const activeRole = user?.activeRole || user?.role || 'member';
  const hasGym     = !!(user?.gymId || user?.gym_id);

  const ROLE_ICONS = {
    ExercisesTab:    '🏋️',
    RoutinesTab:     '📋',
    StatsTab:        '📊',
    TimerTab:        '⏱️',
    AchievementsTab: '🏆',
    PaymentTab:      '💳',
    SettingsTab:     '⚙️',
  };

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Selection" component={SelectionScreen} />
        {/* Selección Gimnasio / Personal */}
        <Stack.Screen name="Training" component={TrainingSelectionScreen} />

        {/* GymTraining — Stack con tabs del gimnasio */}
        <Stack.Screen name="GymTraining">
          {() => {
            const GymStack = createNativeStackNavigator();
            return (
              <GymStack.Navigator screenOptions={{ headerShown: false }}>
                <GymStack.Screen name="GymTabs">
                  {() => (
                    <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 20 : 16 }}>
              {ROLE_ICONS[route.name] || '•'}
            </Text>
          ),
          tabBarActiveTintColor:   colors.brand,
          tabBarInactiveTintColor: colors.textLight,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor:  colors.border,
            borderTopWidth:  0.5,
            paddingBottom:   6,
            paddingTop:      4,
            height:          62,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        })}
      >
        <Tab.Screen name="ExercisesTab"    component={ExercisesStack}    options={{ tabBarLabel: 'Ejercicios' }} />
        <Tab.Screen name="RoutinesTab"     component={RoutinesStack}     options={{ tabBarLabel: 'Rutinas' }} />
        <Tab.Screen name="StatsTab"        component={StatsStack}        options={{ tabBarLabel: 'Stats' }} />
        <Tab.Screen name="TimerTab"        component={TimerStack}        options={{ tabBarLabel: 'Timer' }} />
        <Tab.Screen name="AchievementsTab" component={AchievementsStack} options={{ tabBarLabel: 'Logros' }} />
        <Tab.Screen name="PaymentTab"      component={PaymentStack}      options={{ tabBarLabel: 'Mi cuota' }} />
        <Tab.Screen name="SettingsTab"     component={SettingsStack}     options={{ tabBarLabel: 'Ajustes' }} />
            </Tab.Navigator>
                  )}
                </GymStack.Screen>
                <GymStack.Screen name="Detail"         component={DetailScreen}          options={{ title: 'Ejercicio' }} />
                <GymStack.Screen name="ExecuteRoutine" component={ExecuteRoutineScreen}  options={{ headerShown: false }} />
                <GymStack.Screen name="GymRoutineDetail" component={RoutineDetailScreen} options={{ title: 'Rutina' }} />
              </GymStack.Navigator>
            );
          }}
        </Stack.Screen>

        {/* PersonalTraining — Stack con hamburger menu */}
        <Stack.Screen name="PersonalTraining">
          {() => {
            const PersonalStack = createNativeStackNavigator();
            return (
              <PersonalStack.Navigator
                initialRouteName="ExercisesTab"
                screenOptions={({ navigation, route }) => ({
                  headerStyle: { backgroundColor: colors.card },
                  headerTintColor: colors.textPrimary,
                  headerTitleStyle: { fontWeight: '800', fontSize: 17 },
                  headerLeft: () => (
                    <HamburgerMenu navigation={navigation} currentTab={route.name} />
                  ),
                  headerRight: () => (
                    <TouchableOpacity onPress={() => navigation.navigate('SettingsTab')}
                      style={{ padding: 8, marginRight: 4 }}>
                      <Text style={{ fontSize: 20 }}>⚙️</Text>
                    </TouchableOpacity>
                  ),
                })}
              >
                <PersonalStack.Screen name="ExercisesTab"    component={ExercisesStack}    options={{ title: 'Ejercicios' }} />
                <PersonalStack.Screen name="RoutinesTab"     component={RoutinesStack}     options={{ title: 'Rutinas' }} />
                <PersonalStack.Screen name="StatsTab"        component={StatsStack}        options={{ title: 'Estadísticas' }} />
                <PersonalStack.Screen name="TimerTab"        component={TimerStack}        options={{ title: 'Timer' }} />
                <PersonalStack.Screen name="AchievementsTab" component={AchievementsStack} options={{ title: 'Logros' }} />
                <PersonalStack.Screen name="SettingsTab"     component={SettingsStack}     options={{ title: 'Ajustes' }} />
              </PersonalStack.Navigator>
            );
          }}
        </Stack.Screen>

        <Stack.Screen name="Cardio"         component={CardioSelectionScreen} options={{ headerShown:false }} />
        <Stack.Screen name="CardioPersonal" component={CardioScreen}           options={{ headerShown:false }} />
        <Stack.Screen name="CardioTimer"    component={CardioTimerScreen}      options={{ headerShown:false }} />
        <Stack.Screen name="GymCardio"      component={GymCardioScreen}        options={{ headerShown:false }} />
        <Stack.Screen name="RunRoute"       component={RunRouteScreen}         options={{ headerShown:false }} />
        <Stack.Screen name="JoinGym"        component={JoinGymScreen} options={{ headerShown:false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppContent() {
  const { colors }                      = useTheme();
  const [user, setUser]                 = useState(null);
  const [isChecking, setIsChecking]     = useState(true);

  useEffect(() => {
    checkSession();
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    try {
      if (__DEV__) return; // No checkear en desarrollo
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    } catch {}
  }

  async function checkSession() {
    try {
      const savedUser = await getSavedUser();
      const isLogged  = await authAPI.isLoggedIn();
      if (savedUser && isLogged) {
        // Asegurarse que roles sea siempre un array
        const normalizedUser = {
          ...savedUser,
          roles: Array.isArray(savedUser.roles)
            ? savedUser.roles
            : typeof savedUser.roles === 'string'
              ? JSON.parse(savedUser.roles)
              : [savedUser.role || 'member'],
          activeRole: savedUser.activeRole || savedUser.active_role || savedUser.role || 'member',
        };
        setUser(normalizedUser);
      }
    } catch (err) {
      console.log('Error checkSession:', err.message);
    } finally {
      setIsChecking(false);
    }
  }

  async function handleLogout() {
    try { await authAPI.logout(); } catch {}
    await AsyncStorage.multiRemove([
      'gymtracker_access_token',
      'gymtracker_refresh_token',
      'gymtracker_user',
    ]);
    setUser(null);
  }

  function handleUserChange(updatedUser) {
    const normalized = {
      ...updatedUser,
      roles: Array.isArray(updatedUser.roles)
        ? updatedUser.roles
        : typeof updatedUser.roles === 'string'
          ? JSON.parse(updatedUser.roles)
          : [updatedUser.role || 'member'],
      activeRole: updatedUser.activeRole || updatedUser.active_role || updatedUser.role || 'member',
    };
    setUser(normalized);
    // Guardar en AsyncStorage también
    AsyncStorage.setItem('gymtracker_user', JSON.stringify(normalized)).catch(() => {});
  }

  if (isChecking) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#0A0A0A' }}>
        <Text style={{ fontSize:36, marginBottom:16 }}>💪</Text>
        <ActivityIndicator color="#E8B500" size="large" />
      </View>
    );
  }

  if (!user) return <LoginScreen onLoginSuccess={handleUserChange} />;

  return (
    <MainApp />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </ThemeProvider>
  );
}