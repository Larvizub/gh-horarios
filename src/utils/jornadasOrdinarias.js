const sanitizeHora = (value = '') => {
  const hora = String(value).trim();
  return /^\d{2}:\d{2}$/.test(hora) ? hora : '';
};

const toMinutes = (hora = '') => {
  const [hours, minutes] = String(hora).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const calcularMinutosIntervalo = (inicio, fin) => {
  const start = toMinutes(inicio);
  const end = toMinutes(fin);
  if (start === null || end === null) {
    return 0;
  }

  if (start === end) {
    return 0;
  }

  if (end > start) {
    return end - start;
  }

  return (1440 - start) + end;
};

const buildRangeSegments = (inicio, fin) => {
  const start = toMinutes(inicio);
  const end = toMinutes(fin);

  if (start === null || end === null || start === end) {
    return [];
  }

  if (end > start) {
    return [{ inicio: start, fin: end }];
  }

  return [
    { inicio: start, fin: 1440 },
    { inicio: 0, fin: end },
  ];
};

const calcularInterseccionMinutos = (inicio, fin, coberturaInicio, coberturaFin) => {
  const coberturaStart = toMinutes(coberturaInicio);
  const coberturaEnd = toMinutes(coberturaFin);

  if (coberturaStart === null || coberturaEnd === null || inicio === null || fin === null) {
    return 0;
  }

  if (coberturaStart < coberturaEnd) {
    const overlapStart = Math.max(inicio, coberturaStart);
    const overlapEnd = Math.min(fin, coberturaEnd);
    return Math.max(overlapEnd - overlapStart, 0);
  }

  const overlapAtEndOfDay = Math.max(Math.min(fin, 1440) - Math.max(inicio, coberturaStart), 0);
  const overlapAtStartOfDay = Math.max(Math.min(fin, coberturaEnd) - Math.max(inicio, 0), 0);
  return overlapAtEndOfDay + overlapAtStartOfDay;
};

export const calcularHorasRangoJornadaOrdinaria = (inicio, fin) => {
  return Number((calcularMinutosIntervalo(inicio, fin) / 60).toFixed(2));
};

export const DEFAULT_JORNADAS_ORDINARIAS = [
  {
    key: 'diurna',
    tipo: 'Diurna',
    coberturaInicio: '05:00',
    coberturaFin: '19:00',
    limiteDiario: 8,
    limiteSemanal: 48,
    orden: 1,
    editable: true,
  },
  {
    key: 'nocturna',
    tipo: 'Nocturna',
    coberturaInicio: '19:00',
    coberturaFin: '05:00',
    limiteDiario: 6,
    limiteSemanal: 36,
    orden: 2,
    editable: true,
  },
  {
    key: 'mixta',
    tipo: 'Mixta',
    coberturaInicio: '05:00',
    coberturaFin: '05:00',
    limiteDiario: 7,
    limiteSemanal: 42,
    orden: 3,
    editable: true,
  },
];

export const normalizeJornadaOrdinaria = (key, raw = {}, index = 0) => {
  const base = DEFAULT_JORNADAS_ORDINARIAS.find((item) => item.key === key) || {};

  return {
    key,
    tipo: raw.tipo || base.tipo || key,
    coberturaInicio: sanitizeHora(raw.coberturaInicio || base.coberturaInicio),
    coberturaFin: sanitizeHora(raw.coberturaFin || base.coberturaFin),
    limiteDiario: Number.isFinite(raw.limiteDiario) ? raw.limiteDiario : (Number.isFinite(base.limiteDiario) ? base.limiteDiario : 0),
    limiteSemanal: Number.isFinite(raw.limiteSemanal) ? raw.limiteSemanal : (Number.isFinite(base.limiteSemanal) ? base.limiteSemanal : 0),
    orden: Number.isFinite(raw.orden) ? raw.orden : (base.orden || index + 1),
    editable: raw.editable !== false,
  };
};

export const mergeJornadasOrdinariasCatalog = (remoteCatalog = {}) => {
  const merged = [];
  const byKey = new Map();

  DEFAULT_JORNADAS_ORDINARIAS.forEach((item, index) => {
    const record = normalizeJornadaOrdinaria(item.key, { ...item, ...(remoteCatalog[item.key] || {}) }, index);
    byKey.set(record.key, record);
    merged.push(record);
  });

  Object.entries(remoteCatalog).forEach(([key, value], index) => {
    if (!byKey.has(key)) {
      merged.push(normalizeJornadaOrdinaria(key, value, DEFAULT_JORNADAS_ORDINARIAS.length + index));
    }
  });

  return merged.sort((a, b) => a.orden - b.orden || a.tipo.localeCompare(b.tipo, 'es', { sensitivity: 'base' }));
};

export const jornadasOrdinariasArrayToFirebaseObject = (jornadas = []) => {
  return jornadas.reduce((accumulator, jornada) => {
    accumulator[jornada.key] = {
      tipo: jornada.tipo,
      coberturaInicio: sanitizeHora(jornada.coberturaInicio),
      coberturaFin: sanitizeHora(jornada.coberturaFin),
      limiteDiario: Number(jornada.limiteDiario) || 0,
      limiteSemanal: Number(jornada.limiteSemanal) || 0,
      orden: jornada.orden,
      editable: Boolean(jornada.editable),
    };
    return accumulator;
  }, {});
};

export const jornadasOrdinariasArrayToMap = (jornadas = []) => {
  return jornadas.reduce((accumulator, jornada) => {
    accumulator[jornada.key] = jornada;
    return accumulator;
  }, {});
};

export const formatCoberturaJornadaOrdinaria = (jornada = {}) => {
  const inicio = jornada.coberturaInicio || '';
  const fin = jornada.coberturaFin || '';
  if (!inicio && !fin) {
    return '';
  }

  const inicioLabel = inicio ? `${Number(inicio.split(':')[0])}:${inicio.split(':')[1]} a.m.` : '';
  const finLabel = fin ? `${Number(fin.split(':')[0])}:${fin.split(':')[1]} p.m.` : '';

  if (jornada.key === 'nocturna') {
    return 'Entre 7:00 p.m. y 5:00 a.m.';
  }

  if (jornada.key === 'mixta') {
    return 'Combina periodos diurnos y nocturnos';
  }

  return `Entre ${inicioLabel || inicio} y ${finLabel || fin}`;
};

export const obtenerJornadaOrdinariaDetectada = (horario = {}, jornadasMap = {}) => {
  const diurna = jornadasMap.diurna;
  const nocturna = jornadasMap.nocturna;
  const mixta = jornadasMap.mixta;

  const segmentos = (() => {
    if (horario.tipo === 'tele-presencial') {
      return [
        ...buildRangeSegments(horario.horaInicioTele, horario.horaFinTele),
        ...buildRangeSegments(horario.horaInicioPres, horario.horaFinPres),
      ];
    }

    if (horario.tipo === 'horario-dividido') {
      return [
        ...buildRangeSegments(horario.horaInicioBloque1, horario.horaFinBloque1),
        ...buildRangeSegments(horario.horaInicioBloque2, horario.horaFinBloque2),
      ];
    }

    if (horario.tipo === 'tarde-libre' || horario.tipo === 'tele-media-libre') {
      return buildRangeSegments(horario.horaInicio, horario.horaFin);
    }

    return buildRangeSegments(horario.horaInicio, horario.horaFin);
  })();

  const totalHoras = segmentos.reduce((total, segmento) => total + ((segmento.fin - segmento.inicio) / 60), 0);
  if (!segmentos.length || totalHoras <= 0) {
    return null;
  }

  const jornadaDiurna = diurna || DEFAULT_JORNADAS_ORDINARIAS.find((item) => item.key === 'diurna');
  const jornadaNocturna = nocturna || DEFAULT_JORNADAS_ORDINARIAS.find((item) => item.key === 'nocturna');
  const jornadaMixta = mixta || DEFAULT_JORNADAS_ORDINARIAS.find((item) => item.key === 'mixta');

  const horasDiurnas = segmentos.reduce((total, segmento) => {
    return total + calcularInterseccionMinutos(segmento.inicio, segmento.fin, jornadaDiurna?.coberturaInicio, jornadaDiurna?.coberturaFin);
  }, 0) / 60;

  const horasNocturnas = segmentos.reduce((total, segmento) => {
    return total + (calcularMinutosIntervalo(segmento.inicio, segmento.fin) - calcularInterseccionMinutos(segmento.inicio, segmento.fin, jornadaDiurna?.coberturaInicio, jornadaDiurna?.coberturaFin));
  }, 0) / 60;

  let jornadaDetectada = jornadaMixta;
  if (horasNocturnas <= 0.01) {
    jornadaDetectada = jornadaDiurna;
  } else if (horasDiurnas <= 0.01) {
    jornadaDetectada = jornadaNocturna;
  }

  const horas = Number(totalHoras.toFixed(2));

  return {
    key: jornadaDetectada?.key || 'mixta',
    label: jornadaDetectada?.tipo || 'Mixta',
    limiteDiario: Number(jornadaDetectada?.limiteDiario) || 0,
    limiteSemanal: Number(jornadaDetectada?.limiteSemanal) || 0,
    coberturaInicio: jornadaDetectada?.coberturaInicio || '',
    coberturaFin: jornadaDetectada?.coberturaFin || '',
    horas,
    excedeLimite: Number(jornadaDetectada?.limiteDiario) > 0 ? horas > Number(jornadaDetectada.limiteDiario) : false,
    horasExcedentes: Number(jornadaDetectada?.limiteDiario) > 0 ? Number(Math.max(horas - Number(jornadaDetectada.limiteDiario), 0).toFixed(2)) : 0,
  };
};

