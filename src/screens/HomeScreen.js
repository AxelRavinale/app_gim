// HomeScreen.js
// La pantalla principal de la app. Muestra la lista de todos los ejercicios.
//
// Conceptos nuevos en este archivo:
// - useState: hook para guardar datos que pueden cambiar en el tiempo
// - useEffect: hook para ejecutar código cuando algo cambia (ej: cuando la pantalla aparece)
// - useFocusEffect: como useEffect pero se ejecuta cada vez que la pantalla recibe el foco
//   (importante porque si venimos de Agregar y creamos un ejercicio nuevo, necesitamos recargar)
// - FlatList: componente eficiente para mostrar listas largas

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllExercises } from '../storage/exercises';
import ExerciseCard from '../components/ExerciseCard';
import colors from '../theme/colors';

export default function HomeScreen({ navigation }) {
  // useState(valorInicial) → retorna [valorActual, funcionParaCambiarElValor]
  // Cada vez que llamás a la función de cambio, el componente se "re-renderiza"
  // (se vuelve a dibujar con el nuevo valor)
  const [exercises, setExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // useFocusEffect se ejecuta cada vez que esta pantalla aparece en pantalla.
  // Usamos useCallback para que React no recree la función innecesariamente.
  // Esto es necesario porque si el usuario va a "Agregar ejercicio" y vuelve,
  // queremos recargar la lista para mostrar el nuevo ejercicio.
  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [])
  );

  // Función que carga los ejercicios del storage
  async function loadExercises() {
    setIsLoading(true);
    try {
      const data = await getAllExercises();
      // Ordenamos por fecha de creación, el más nuevo primero
      const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setExercises(sorted);
    } catch (error) {
      console.error('Error cargando ejercicios:', error);
    } finally {
      // "finally" se ejecuta SIEMPRE, haya error o no.
      // Así nos aseguramos de que el loading se apague.
      setIsLoading(false);
    }
  }

  // Filtramos los ejercicios según lo que escribe el usuario en el buscador.
  // toLowerCase() convierte a minúsculas para que la búsqueda no sea sensible
  // a mayúsculas (ej: "press" encuentra "Press de Banca")
  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Componente que se muestra cuando no hay ejercicios
  function EmptyState() {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏋️</Text>
        <Text style={styles.emptyTitle}>
          {searchQuery ? 'Sin resultados' : 'No tenés ejercicios aún'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery
            ? `No encontramos ejercicios con "${searchQuery}"`
            : 'Tocá el botón + para agregar tu primer ejercicio'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* StatusBar controla la barra de estado del teléfono (hora, batería, etc.) */}
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mis Ejercicios</Text>
          <Text style={styles.subtitle}>
            {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''} registrado{exercises.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Botón para agregar nuevo ejercicio */}
        {/* navigation.navigate() te lleva a otra pantalla */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExercise')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ejercicio o grupo muscular..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          // onChangeText se llama con el nuevo texto cada vez que el usuario escribe
          onChangeText={setSearchQuery}
        />
        {/* Si hay texto en el buscador, mostramos una X para limpiar */}
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de ejercicios */}
      {isLoading ? (
        // ActivityIndicator es el "spinner" de carga
        <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={filteredExercises}

          // keyExtractor le dice a FlatList qué usar como identificador único.
          // Necesita uno para poder redibujar solo las tarjetas que cambiaron,
          // no toda la lista.
          keyExtractor={item => item.id}

          // renderItem define cómo se dibuja cada elemento de la lista.
          // Recibe un objeto con { item } que es el elemento actual.
          renderItem={({ item }) => (
            <ExerciseCard
              exercise={item}
              onPress={() => navigation.navigate('Detail', { exerciseId: item.id })}
            />
          )}

          // ListEmptyComponent se muestra cuando data es un array vacío
          ListEmptyComponent={<EmptyState />}

          // contentContainerStyle aplica estilos al contenedor interno de FlatList
          contentContainerStyle={styles.listContent}

          // Separa los items con un espacio (alternativa al marginBottom en la tarjeta)
          // ItemSeparatorComponent={() => <View style={{ height: 0 }} />}

          // Desactiva el scroll si la lista es más corta que la pantalla
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,                     // Ocupa toda la pantalla disponible
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,              // Quitamos el padding por defecto en Android
  },
  clearSearch: {
    fontSize: 14,
    color: colors.textLight,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    flexGrow: 1,             // Permite que EmptyState ocupe todo el espacio
  },
  loader: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});