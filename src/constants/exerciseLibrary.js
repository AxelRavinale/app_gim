// src/constants/exerciseLibrary.js
// Biblioteca de ejercicios precargados

export const EXERCISE_LIBRARY = [
  // ── PECHO ────────────────────────────────────────────────────────────────
  { id:'lib_1',  name:'Press de banca',          muscleGroup:'Pecho',    trackingType:'weight', description:'Ejercicio fundamental para el pecho. Tumbado en el banco, bajá la barra al pecho y empujá hacia arriba.' },
  { id:'lib_2',  name:'Press inclinado',          muscleGroup:'Pecho',    trackingType:'weight', description:'Igual que el press de banca pero con el banco inclinado 30-45°. Trabaja la parte superior del pecho.' },
  { id:'lib_3',  name:'Press declinado',          muscleGroup:'Pecho',    trackingType:'weight', description:'Con el banco declinado. Trabaja la parte inferior del pecho.' },
  { id:'lib_4',  name:'Aperturas con mancuernas', muscleGroup:'Pecho',    trackingType:'weight', description:'Tumbado en el banco, abrí los brazos hacia los lados con leve flexión de codos y juntá arriba.' },
  { id:'lib_5',  name:'Fondos en paralelas',      muscleGroup:'Pecho',    trackingType:'weight', description:'Apoyado en las paralelas, bajá el cuerpo flexionando los codos y empujá hacia arriba. Inclinarte hacia adelante activa más el pecho.' },
  { id:'lib_6',  name:'Flexiones',                muscleGroup:'Pecho',    trackingType:'weight', description:'Ejercicio con peso corporal. Manos a ancho de hombros, bajá el pecho al suelo y empujá.' },
  { id:'lib_7',  name:'Crossover en polea',       muscleGroup:'Pecho',    trackingType:'weight', description:'Con poleas altas, llevá las manos hacia el centro cruzándolas. Excelente para definición.' },

  // ── ESPALDA ──────────────────────────────────────────────────────────────
  { id:'lib_8',  name:'Dominadas',                muscleGroup:'Espalda',  trackingType:'weight', description:'Colgado de la barra, jalá el cuerpo hacia arriba hasta que el mentón supere la barra.' },
  { id:'lib_9',  name:'Remo con barra',           muscleGroup:'Espalda',  trackingType:'weight', description:'Inclinado hacia adelante, jalá la barra hacia el abdomen. Uno de los mejores ejercicios para la espalda.' },
  { id:'lib_10', name:'Remo con mancuerna',       muscleGroup:'Espalda',  trackingType:'weight', description:'Apoyado en el banco, jalá la mancuerna hacia la cadera con el codo cerca del cuerpo.' },
  { id:'lib_11', name:'Jalón al pecho',           muscleGroup:'Espalda',  trackingType:'weight', description:'En polea alta, jalá la barra hacia el pecho con los codos apuntando hacia abajo.' },
  { id:'lib_12', name:'Pullover',                 muscleGroup:'Espalda',  trackingType:'weight', description:'Tumbado en el banco, llevá la mancuerna por encima de la cabeza y traé de vuelta.' },
  { id:'lib_13', name:'Peso muerto',              muscleGroup:'Espalda',  trackingType:'weight', description:'Ejercicio rey para toda la cadena posterior. Levantá la barra desde el suelo manteniendo la espalda recta.' },
  { id:'lib_14', name:'Hiperextensiones',         muscleGroup:'Espalda',  trackingType:'weight', description:'En el banco romano, bajá el torso y subí contrayendo la zona lumbar y glúteos.' },

  // ── PIERNAS ──────────────────────────────────────────────────────────────
  { id:'lib_15', name:'Sentadilla',               muscleGroup:'Piernas',  trackingType:'weight', description:'El ejercicio más completo para piernas. Bajá hasta que los muslos queden paralelos al suelo.' },
  { id:'lib_16', name:'Sentadilla frontal',       muscleGroup:'Piernas',  trackingType:'weight', description:'Con la barra en la parte delantera del hombro. Mayor activación de cuádriceps.' },
  { id:'lib_17', name:'Prensa de piernas',        muscleGroup:'Piernas',  trackingType:'weight', description:'En la máquina, empujá la plataforma con los pies. Variá la posición de los pies para trabajar distintas zonas.' },
  { id:'lib_18', name:'Extensión de cuádriceps',  muscleGroup:'Piernas',  trackingType:'weight', description:'En la máquina, extendé las piernas hacia arriba. Aislamiento de cuádriceps.' },
  { id:'lib_19', name:'Curl de isquiotibiales',   muscleGroup:'Piernas',  trackingType:'weight', description:'Boca abajo en la máquina, flexioná las rodillas jalando el peso hacia los glúteos.' },
  { id:'lib_20', name:'Peso muerto rumano',       muscleGroup:'Piernas',  trackingType:'weight', description:'Con las piernas casi extendidas, bajá la barra por las piernas sintiendo el estiramiento de isquiotibiales.' },
  { id:'lib_21', name:'Zancadas',                 muscleGroup:'Piernas',  trackingType:'weight', description:'Adelantá un pie y bajá la rodilla trasera hacia el suelo. Excelente para glúteos y cuádriceps.' },
  { id:'lib_22', name:'Elevación de talones',     muscleGroup:'Piernas',  trackingType:'weight', description:'De pie o sentado, subí en puntillas. Trabaja los gemelos.' },
  { id:'lib_23', name:'Hip Thrust',               muscleGroup:'Piernas',  trackingType:'weight', description:'Apoyado en el banco con la barra en las caderas, empujá las caderas hacia arriba. El mejor para glúteos.' },

  // ── HOMBROS ──────────────────────────────────────────────────────────────
  { id:'lib_24', name:'Press militar',            muscleGroup:'Hombros',  trackingType:'weight', description:'De pie o sentado, empujá la barra desde los hombros hacia arriba. Ejercicio base para hombros.' },
  { id:'lib_25', name:'Press Arnold',             muscleGroup:'Hombros',  trackingType:'weight', description:'Con mancuernas, empezá con las palmas hacia vos, rotaté y empujá hacia arriba. Mayor rango de movimiento.' },
  { id:'lib_26', name:'Elevaciones laterales',    muscleGroup:'Hombros',  trackingType:'weight', description:'Con mancuernas, levantá los brazos a los lados hasta la altura de los hombros. Trabaja el deltoides medio.' },
  { id:'lib_27', name:'Elevaciones frontales',    muscleGroup:'Hombros',  trackingType:'weight', description:'Levantá los brazos al frente hasta la altura de los hombros. Trabaja el deltoides anterior.' },
  { id:'lib_28', name:'Pájaro',                   muscleGroup:'Hombros',  trackingType:'weight', description:'Inclinado hacia adelante, abrí los brazos hacia los lados. Trabaja el deltoides posterior.' },
  { id:'lib_29', name:'Encogimiento de hombros',  muscleGroup:'Hombros',  trackingType:'weight', description:'Con barra o mancuernas, subí los hombros hacia las orejas. Trabaja el trapecio.' },

  // ── BRAZOS ───────────────────────────────────────────────────────────────
  { id:'lib_30', name:'Curl de bíceps',           muscleGroup:'Brazos',   trackingType:'weight', description:'Con barra o mancuernas, flexioná los codos llevando el peso hacia los hombros.' },
  { id:'lib_31', name:'Curl martillo',            muscleGroup:'Brazos',   trackingType:'weight', description:'Igual que el curl pero con las palmas enfrentadas. Trabaja el braquial y braquiorradial.' },
  { id:'lib_32', name:'Curl concentrado',         muscleGroup:'Brazos',   trackingType:'weight', description:'Sentado, apoyá el codo en el muslo y realizá el curl. Máximo aislamiento del bíceps.' },
  { id:'lib_33', name:'Fondos en banco',          muscleGroup:'Brazos',   trackingType:'weight', description:'Con manos en el banco y pies al frente, bajá el cuerpo flexionando los codos. Trabaja el tríceps.' },
  { id:'lib_34', name:'Press francés',            muscleGroup:'Brazos',   trackingType:'weight', description:'Tumbado, bajá la barra EZ hacia la frente y extendé. Excelente para el tríceps.' },
  { id:'lib_35', name:'Extensión de tríceps',     muscleGroup:'Brazos',   trackingType:'weight', description:'En polea o con mancuerna, extendé el codo llevando el peso hacia abajo o arriba.' },
  { id:'lib_36', name:'Curl de muñeca',           muscleGroup:'Brazos',   trackingType:'weight', description:'Con el antebrazo apoyado, flexioná y extendé la muñeca. Trabaja los flexores del antebrazo.' },

  // ── CORE ─────────────────────────────────────────────────────────────────
  { id:'lib_37', name:'Plancha',                  muscleGroup:'Core',     trackingType:'time',   description:'Apoyado en antebrazos y puntas de pie, mantené el cuerpo recto el mayor tiempo posible.' },
  { id:'lib_38', name:'Abdominales',              muscleGroup:'Core',     trackingType:'weight', description:'Tumbado, llevá los hombros hacia las rodillas contrayendo el abdomen.' },
  { id:'lib_39', name:'Crunch',                   muscleGroup:'Core',     trackingType:'weight', description:'Versión más corta del abdominal, enfocada en la contracción del recto abdominal.' },
  { id:'lib_40', name:'Elevación de piernas',     muscleGroup:'Core',     trackingType:'weight', description:'Tumbado, levantá las piernas rectas hasta 90° y bajá sin tocar el suelo. Trabaja el abdomen inferior.' },
  { id:'lib_41', name:'Russian twist',            muscleGroup:'Core',     trackingType:'weight', description:'Sentado con las piernas elevadas, rotá el torso de lado a lado. Trabaja los oblicuos.' },
  { id:'lib_42', name:'Plancha lateral',          muscleGroup:'Core',     trackingType:'time',   description:'Apoyado en un antebrazo y el pie lateral, mantené el cuerpo recto. Trabaja los oblicuos.' },
  { id:'lib_43', name:'Rueda abdominal',          muscleGroup:'Core',     trackingType:'weight', description:'Con la rueda en el suelo, extendé el cuerpo hacia adelante y regresá. Muy exigente para el core.' },
  { id:'lib_44', name:'Mountain climbers',        muscleGroup:'Core',     trackingType:'time',   description:'En posición de plancha, alternás las rodillas hacia el pecho rápidamente.' },

  // ── CARDIO ───────────────────────────────────────────────────────────────
  { id:'lib_45', name:'Burpees',                  muscleGroup:'Cardio',   trackingType:'time',   description:'Desde de pie, bajá al suelo, hacé una flexión, saltá y aplaudí. Ejercicio completo de alta intensidad.' },
  { id:'lib_46', name:'Jumping jacks',            muscleGroup:'Cardio',   trackingType:'time',   description:'Saltá abriendo piernas y brazos simultáneamente y luego cerrá. Calentamiento clásico.' },
  { id:'lib_47', name:'Saltar la soga',           muscleGroup:'Cardio',   trackingType:'time',   description:'Con o sin soga real, saltá manteniendo el ritmo. Excelente para coordinación y cardio.' },
  { id:'lib_48', name:'Escaladores',              muscleGroup:'Cardio',   trackingType:'time',   description:'En plancha, llevá las rodillas al pecho alternadamente a máxima velocidad.' },
  { id:'lib_49', name:'Step',                     muscleGroup:'Cardio',   trackingType:'time',   description:'Subí y bajá de un escalón o cajón de forma rítmica. Bajo impacto y buen trabajo cardiovascular.' },
  { id:'lib_50', name:'Sentadilla con salto',     muscleGroup:'Cardio',   trackingType:'time',   description:'Hacé una sentadilla y al subir pegá un salto. Combina fuerza y cardio.' },
];

export const LIBRARY_GROUPS = ['Todos', 'Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio'];