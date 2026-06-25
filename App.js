import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, ActivityIndicator, View } from 'react-native';

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

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { authAPI, getSavedUser }   from './src/services/api';

// Contexto global de sesión — permite cerrar sesión desde cualquier pantalla
export const SessionContext = createContext({ logout: () => {} });
export function useSession() { return useContext(SessionContext); }

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

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
      <Stack.Screen name="ExecuteExercise" component={ExecuteExerciseScreen} options={{ title: 'Ejecutar' }} />
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
      <Stack.Screen name="ExecuteRoutine" component={ExecuteRoutineScreen} options={{ title: 'Entrenar' }} />
    </Stack.Navigator>
  );
}

function StatsStack()        { const { colors } = useTheme(); return <Stack.Navigator screenOptions={buildScreenOptions(colors)}><Stack.Screen name="Stats"        component={StatsScreen}        options={{ headerShown: false }} /></Stack.Navigator>; }
function TimerStack()        { const { colors } = useTheme(); return <Stack.Navigator screenOptions={buildScreenOptions(colors)}><Stack.Screen name="Timer"        component={TimerScreen}        options={{ headerShown: false }} /></Stack.Navigator>; }
function AchievementsStack() { const { colors } = useTheme(); return <Stack.Navigator screenOptions={buildScreenOptions(colors)}><Stack.Screen name="Achievements" component={AchievementsScreen} options={{ headerShown: false }} /></Stack.Navigator>; }
function SettingsStack()     { const { colors } = useTheme(); return <Stack.Navigator screenOptions={buildScreenOptions(colors)}><Stack.Screen name="Settings"     component={SettingsScreen}     options={{ headerShown: false }} /></Stack.Navigator>; }

function MainApp() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const icons = { ExercisesTab:'🏋️', RoutinesTab:'📋', StatsTab:'📊', TimerTab:'⏱️', AchievementsTab:'🏆', SettingsTab:'⚙️' };
          return <Text style={{ fontSize: focused ? 20 : 16 }}>{icons[route.name] || '•'}</Text>;
        },
        tabBarActiveTintColor:   colors.brand,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 0.5, paddingBottom: 6, paddingTop: 4, height: 62 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      })}
    >
      <Tab.Screen name="ExercisesTab"    component={ExercisesStack}    options={{ tabBarLabel: 'Ejercicios' }} />
      <Tab.Screen name="RoutinesTab"     component={RoutinesStack}     options={{ tabBarLabel: 'Rutinas' }} />
      <Tab.Screen name="StatsTab"        component={StatsStack}        options={{ tabBarLabel: 'Stats' }} />
      <Tab.Screen name="TimerTab"        component={TimerStack}        options={{ tabBarLabel: 'Timer' }} />
      <Tab.Screen name="AchievementsTab" component={AchievementsStack} options={{ tabBarLabel: 'Logros' }} />
      <Tab.Screen name="SettingsTab"     component={SettingsStack}     options={{ tabBarLabel: 'Ajustes' }} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const [user, setUser]             = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => { checkSession(); }, []);

  async function checkSession() {
    try {
      const savedUser = await getSavedUser();
      const isLogged  = await authAPI.isLoggedIn();
      if (savedUser && isLogged) setUser(savedUser);
    } catch {}
    finally { setIsChecking(false); }
  }

  // Función de logout que se pasa por contexto a cualquier pantalla
  async function logout() {
    try { await authAPI.logout(); } catch {}
    setUser(null);
  }

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
        <Text style={{ fontSize: 36, marginBottom: 16 }}>💪</Text>
        <ActivityIndicator color="#E8B500" size="large" />
      </View>
    );
  }

  return (
    <SessionContext.Provider value={{ logout, user }}>
      <NavigationContainer>
        <StatusBar style="light" />
        {user
          ? <MainApp />
          : <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login">
                {(props) => <LoginScreen {...props} onLoginSuccess={(u) => setUser(u)} />}
              </Stack.Screen>
            </Stack.Navigator>
        }
      </NavigationContainer>
    </SessionContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}