const sanitizeKeyBase = (value = '') => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const JORNADAS_DIAS = ['dia1', 'dia2', 'dia3', 'dia4', 'dia5', 'dia6', 'dia7'];

export const JORNADAS_DIAS_LABELS = {
  dia1: 'Lunes',
  dia2: 'Martes',
  dia3: 'Miércoles',
  dia4: 'Jueves',
  dia5: 'Viernes',
  dia6: 'Sábado',
  dia7: 'Domingo',
};

export const JORNADAS_DIAS_LABELS_CORTOS = {
  dia1: 'Lun',
  dia2: 'Mar',
  dia3: 'Mié',
  dia4: 'Jue',
  dia5: 'Vie',
  dia6: 'Sáb',
  dia7: 'Dom',
};

const DEFAULT_DAY_VALUE = {
  tipo: 'descanso',
  horaInicio: '',
  horaFin: '',
  horas: 0,
};

const buildDayValue = (partial = {}) => ({
  ...DEFAULT_DAY_VALUE,
  ...partial,
  horas: Number.isFinite(partial.horas) ? partial.horas : DEFAULT_DAY_VALUE.horas,
});

export const createEmptyJornadaPattern = () => {
  return JORNADAS_DIAS.reduce((accumulator, dia) => {
    accumulator[dia] = buildDayValue();
    return accumulator;
  }, {});
};

export const cloneJornadaPattern = (pattern = createEmptyJornadaPattern()) => {
  return JORNADAS_DIAS.reduce((accumulator, dia) => {
    accumulator[dia] = buildDayValue(pattern?.[dia] || {});
    return accumulator;
  }, {});
};

const calcularHorasRango = (inicio, fin) => {
  if (!inicio || !fin) return 0;

  const [h1, m1] = String(inicio).split(':').map(Number);
  const [h2, m2] = String(fin).split(':').map(Number);

  if ([h1, m1, h2, m2].some((value) => Number.isNaN(value))) {
    return 0;
  }

  if (h1 === h2 && m1 === m2) {
    return 0;
  }

  if (h2 > h1 || (h2 === h1 && m2 > m1)) {
    return (h2 - h1) + ((m2 - m1) / 60);
  }

  return (24 - h1 + h2) + ((m2 - m1) / 60);
};

export const calcularHorasDiaJornada = (dia = {}) => {
  if (!dia || dia.tipo === 'descanso') {
    return 0;
  }

  if (Number.isFinite(dia.horas) && dia.horas >= 0) {
    return dia.horas;
  }

  return Number(calcularHorasRango(dia.horaInicio, dia.horaFin).toFixed(2));
};

export const calcularHorasJornadaTrabajo = (patternSemanal = {}) => {
  return JORNADAS_DIAS.reduce((total, dia) => {
    return total + calcularHorasDiaJornada(patternSemanal?.[dia]);
  }, 0);
};

const buildSignature = (dia = {}) => {
  return [dia.tipo || 'descanso', dia.horaInicio || '', dia.horaFin || '', Number(dia.horas) || 0].join('|');
};

const formatDayRange = (startIndex, endIndex) => {
  const startLabel = JORNADAS_DIAS_LABELS_CORTOS[JORNADAS_DIAS[startIndex]];
  const endLabel = JORNADAS_DIAS_LABELS_CORTOS[JORNADAS_DIAS[endIndex]];
  return startIndex === endIndex ? startLabel : `${startLabel}-${endLabel}`;
};

const formatDayValue = (dia = {}) => {
  if (!dia || dia.tipo === 'descanso') {
    return 'Descanso';
  }

  if (dia.horaInicio && dia.horaFin) {
    return `${dia.horaInicio}-${dia.horaFin}`;
  }

  if (Number.isFinite(dia.horas) && dia.horas > 0) {
    return `${dia.horas}h`;
  }

  return dia.tipo || 'Personalizada';
};

export const formatJornadaTrabajoResumen = (jornada = {}) => {
  const patternSemanal = jornada.patternSemanal || {};
  const grupos = [];

  let currentSignature = null;
  let currentStart = 0;

  JORNADAS_DIAS.forEach((dia, index) => {
    const signature = buildSignature(patternSemanal[dia]);
    if (currentSignature === null) {
      currentSignature = signature;
      currentStart = index;
      return;
    }

    if (signature !== currentSignature) {
      grupos.push({
        range: formatDayRange(currentStart, index - 1),
        value: formatDayValue(patternSemanal[JORNADAS_DIAS[currentStart]]),
      });
      currentSignature = signature;
      currentStart = index;
    }
  });

  if (currentSignature !== null) {
    grupos.push({
      range: formatDayRange(currentStart, JORNADAS_DIAS.length - 1),
      value: formatDayValue(patternSemanal[JORNADAS_DIAS[currentStart]]),
    });
  }

  return grupos.map((grupo) => `${grupo.range} ${grupo.value}`).join(' · ');
};

export const sanitizeJornadaTrabajoKey = (value = '') => {
  return sanitizeKeyBase(value);
};

export const buildJornadaTrabajoFallbackLabel = (value) => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
};

const DEFAULT_JORNADA_MAP = {
  'operativo-48h': {
    key: 'operativo-48h',
    label: 'Jornada Operativa 48h',
    descripcion: 'Plantilla base para jornadas operativas de seis días y 48 horas semanales.',
    horasMinimasSemanales: 48,
    horasMaximasSemanales: 48,
    aplicaAContratos: ['operativo'],
    patternSemanal: {
      dia1: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia2: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia3: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia4: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia5: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia6: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia7: { tipo: 'descanso', horaInicio: '', horaFin: '', horas: 0 },
    },
    orden: 1,
    editable: false,
  },
  'confianza-72h': {
    key: 'confianza-72h',
    label: 'Jornada Confianza 72h',
    descripcion: 'Plantilla base para jornadas extendidas de seis días y 72 horas semanales.',
    horasMinimasSemanales: 72,
    horasMaximasSemanales: 72,
    aplicaAContratos: ['confianza'],
    patternSemanal: {
      dia1: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '20:00', horas: 12 },
      dia2: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '20:00', horas: 12 },
      dia3: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '20:00', horas: 12 },
      dia4: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '20:00', horas: 12 },
      dia5: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '20:00', horas: 12 },
      dia6: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '20:00', horas: 12 },
      dia7: { tipo: 'descanso', horaInicio: '', horaFin: '', horas: 0 },
    },
    orden: 2,
    editable: false,
  },
};

export const DEFAULT_JORNADAS_TRABAJO = Object.values(DEFAULT_JORNADA_MAP);

const DEFAULT_JORNADAS_TRABAJO_MAP = DEFAULT_JORNADAS_TRABAJO.reduce((accumulator, jornada) => {
  accumulator[jornada.key] = jornada;
  return accumulator;
}, {});

let currentJornadasTrabajo = DEFAULT_JORNADAS_TRABAJO;
let currentJornadasTrabajoMap = DEFAULT_JORNADAS_TRABAJO_MAP;

export const normalizeJornadaTrabajo = (key, raw = {}, index = 0) => {
  const base = DEFAULT_JORNADAS_TRABAJO_MAP[key] || {};
  const patternSemanal = cloneJornadaPattern(raw.patternSemanal || base.patternSemanal || createEmptyJornadaPattern());
  const totalHoras = calcularHorasJornadaTrabajo(patternSemanal);

  const horasMinimasSemanales = Number.isFinite(raw.horasMinimasSemanales)
    ? raw.horasMinimasSemanales
    : (Number.isFinite(base.horasMinimasSemanales) ? base.horasMinimasSemanales : totalHoras);

  const horasMaximasSemanales = Number.isFinite(raw.horasMaximasSemanales)
    ? raw.horasMaximasSemanales
    : (Number.isFinite(base.horasMaximasSemanales) ? base.horasMaximasSemanales : totalHoras);

  const aplicaAContratos = Array.isArray(raw.aplicaAContratos)
    ? Array.from(new Set(raw.aplicaAContratos.map((item) => String(item).trim()).filter(Boolean)))
    : Array.isArray(base.aplicaAContratos)
      ? base.aplicaAContratos
      : [];

  return {
    key,
    label: raw.label || base.label || buildJornadaTrabajoFallbackLabel(key),
    descripcion: raw.descripcion || base.descripcion || '',
    horasMinimasSemanales: Math.min(horasMinimasSemanales, horasMaximasSemanales),
    horasMaximasSemanales: Math.max(horasMinimasSemanales, horasMaximasSemanales),
    aplicaAContratos,
    patternSemanal,
    orden: Number.isFinite(raw.orden) ? raw.orden : (base.orden || index + 1),
    editable: Object.prototype.hasOwnProperty.call(DEFAULT_JORNADAS_TRABAJO_MAP, key)
      ? false
      : raw.editable !== false,
  };
};

export const mergeJornadasTrabajoCatalog = (remoteJornadas = {}) => {
  const mergedMap = {};

  Object.entries(DEFAULT_JORNADAS_TRABAJO_MAP).forEach(([key, value], index) => {
    mergedMap[key] = normalizeJornadaTrabajo(key, { ...value, ...(remoteJornadas[key] || {}) }, index);
  });

  Object.entries(remoteJornadas).forEach(([key, value], index) => {
    if (!mergedMap[key]) {
      mergedMap[key] = normalizeJornadaTrabajo(key, value, DEFAULT_JORNADAS_TRABAJO.length + index);
    }
  });

  return Object.values(mergedMap).sort((a, b) => a.orden - b.orden || a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
};

export const jornadasTrabajoArrayToMap = (jornadas = []) => {
  return jornadas.reduce((accumulator, jornada) => {
    accumulator[jornada.key] = jornada;
    return accumulator;
  }, {});
};

export const jornadasTrabajoArrayToFirebaseObject = (jornadas = []) => {
  return jornadas.reduce((accumulator, jornada) => {
    accumulator[jornada.key] = {
      label: jornada.label,
      descripcion: jornada.descripcion || '',
      horasMinimasSemanales: Number(jornada.horasMinimasSemanales) || 0,
      horasMaximasSemanales: Number(jornada.horasMaximasSemanales) || 0,
      aplicaAContratos: Array.isArray(jornada.aplicaAContratos) ? jornada.aplicaAContratos : [],
      patternSemanal: cloneJornadaPattern(jornada.patternSemanal || createEmptyJornadaPattern()),
      orden: jornada.orden,
      editable: Boolean(jornada.editable),
    };
    return accumulator;
  }, {});
};

export const setJornadasTrabajoCatalog = (jornadas = DEFAULT_JORNADAS_TRABAJO) => {
  currentJornadasTrabajo = Array.isArray(jornadas) && jornadas.length > 0 ? jornadas : DEFAULT_JORNADAS_TRABAJO;
  currentJornadasTrabajoMap = jornadasTrabajoArrayToMap(currentJornadasTrabajo);
};

export const getJornadasTrabajoCatalog = () => currentJornadasTrabajo;

export const getJornadasTrabajoCatalogMap = () => currentJornadasTrabajoMap;

export const findJornadaTrabajoRecord = (value, jornadasMap = null) => {
  if (!value) return null;

  const activeMap = jornadasMap || currentJornadasTrabajoMap;
  if (activeMap[value]) {
    return activeMap[value];
  }

  const normalizedValue = String(value).trim().toLowerCase();
  return Object.values(activeMap).find((jornada) => {
    return jornada.key.toLowerCase() === normalizedValue || jornada.label.toLowerCase() === normalizedValue;
  }) || null;
};

export const getJornadaTrabajoLabel = (value, jornadasMap = null) => {
  const record = findJornadaTrabajoRecord(value, jornadasMap);
  if (record?.label) {
    return record.label;
  }

  if (DEFAULT_JORNADAS_TRABAJO_MAP[value]?.label) {
    return DEFAULT_JORNADAS_TRABAJO_MAP[value].label;
  }

  return buildJornadaTrabajoFallbackLabel(value);
};
