// App.js
// El punto de entrada de toda la app. Es lo primero que se ejecuta.
//
// Su responsabilidad es configurar la NAVEGACIÓN.
// La navegación es el sistema que permite moverse entre pantallas.
//
// Usamos "Stack Navigator" que funciona como una pila de pantallas:
// - Cuando navegás a una pantalla nueva, se APILA encima de la anterior
// - Cuando volvés (goBack), se DESAPILA y volvés a la anterior
//
// Ejemplo:
// [HomeScreen] → navegar → [HomeScreen, DetailScreen] → goBack → [HomeScreen]

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Importamos las pantallas
import HomeScreen from './src/screens/HomeScreen';
import DetailScreen from './src/screens/DetailScreen';
import AddExerciseScreen from './src/screens/AddExerciseScreen';

import colors from './src/theme/colors';

// createNativeStackNavigator crea el objeto Stack que usaremos para definir las rutas
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // NavigationContainer es el contenedor principal. Debe envolver todo.
    // Mantiene el historial de navegación y sincroniza la URL/estado.
    <NavigationContainer>
      <StatusBar style="dark" />

      {/* Stack.Navigator contiene todas las pantallas disponibles */}
      {/* screenOptions aplica opciones a TODAS las pantallas por defecto */}
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.primary,       // Color de la flecha "volver" y título
          headerTitleStyle: {
            fontWeight: '700',
            color: colors.textPrimary,
          },
          contentStyle: {
            backgroundColor: colors.background,  // Color de fondo de todas las pantallas
          },
          // Animación al navegar: en Android se desliza de derecha a izquierda
          animation: 'slide_from_right',
        }}
      >
        {/* Cada Stack.Screen define una ruta/pantalla */}
        {/* name: el nombre con el que navegamos (navigation.navigate('nombre')) */}
        {/* component: el componente React a renderizar */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'GymTracker',
            // headerShown: false  // Descomentar si querés ocultar la barra de navegación
          }}
        />

        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{
            // El título se actualiza dinámicamente desde DetailScreen con navigation.setOptions()
            title: 'Ejercicio',
          }}
        />

        <Stack.Screen
          name="AddExercise"
          component={AddExerciseScreen}
          options={{
            title: 'Nuevo ejercicio',
            // "modal" presenta la pantalla deslizándose desde abajo (estilo modal en iOS)
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
