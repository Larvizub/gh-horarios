const sanitizeKeyBase = (value = '') => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const normalizeRangoHoras = (rango = {}) => {
  const min = Number(rango.min ?? rango.horasMinimas ?? rango.desde ?? rango.inicio);
  const max = Number(rango.max ?? rango.horasMaximas ?? rango.hasta ?? rango.fin);

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }

  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
  };
};

const normalizeRangosHoras = (raw = {}, base = {}) => {
  if (raw.aplicaHoras === false) {
    return [];
  }

  const incomingRangos = Array.isArray(raw.rangosHoras) ? raw.rangosHoras : [];
  const rangos = incomingRangos
    .map((rango) => normalizeRangoHoras(rango))
    .filter(Boolean)
    .sort((a, b) => a.min - b.min || a.max - b.max);

  if (rangos.length > 0) {
    return rangos;
  }

  const minFallback = Number.isFinite(raw.horasMinimas)
    ? raw.horasMinimas
    : (Number.isFinite(base.horasMinimas) ? base.horasMinimas : 48);
  const maxFallback = Number.isFinite(raw.horasMaximas)
    ? raw.horasMaximas
    : (Number.isFinite(base.horasMaximas) ? base.horasMaximas : minFallback);

  const fallbackRange = normalizeRangoHoras({ min: minFallback, max: maxFallback });
  return fallbackRange ? [fallbackRange] : [];
};

const getRangosBoundaries = (rangos = []) => {
  if (!Array.isArray(rangos) || rangos.length === 0) {
    return { min: 0, max: 0 };
  }

  return rangos.reduce((accumulator, rango) => {
    const min = Number.isFinite(rango?.min) ? rango.min : accumulator.min;
    const max = Number.isFinite(rango?.max) ? rango.max : accumulator.max;

    return {
      min: Math.min(accumulator.min, min),
      max: Math.max(accumulator.max, max),
    };
  }, { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY });
};

const formatRangoHoras = (rango) => {
  if (!rango) {
    return '';
  }

  if (rango.min === rango.max) {
    return `${rango.max}h`;
  }

  return `${rango.min} a ${rango.max}h`;
};

const formatRangosHoras = (rangos = []) => {
  if (!Array.isArray(rangos) || rangos.length === 0) {
    return '';
  }

  return rangos.map((rango) => formatRangoHoras(rango)).filter(Boolean).join(' o ');
};

export const DEFAULT_TIPOS_CONTRATO = [
  { key: 'operativo', label: 'Operativo', horasMinimas: 48, horasMaximas: 48, rangosHoras: [{ min: 48, max: 48 }], aplicaHoras: true, orden: 1, editable: false },
  { key: 'confianza', label: 'Confianza', horasMinimas: 72, horasMaximas: 72, rangosHoras: [{ min: 72, max: 72 }], aplicaHoras: true, orden: 2, editable: false },
];

const DEFAULT_TIPOS_CONTRATO_MAP = DEFAULT_TIPOS_CONTRATO.reduce((accumulator, tipo) => {
  accumulator[tipo.key] = tipo;
  return accumulator;
}, {});

let currentTiposContrato = DEFAULT_TIPOS_CONTRATO;
let currentTiposContratoMap = DEFAULT_TIPOS_CONTRATO.reduce((accumulator, tipo) => {
  accumulator[tipo.key] = tipo;
  return accumulator;
}, {});

export const sanitizeTipoContratoKey = (value = '') => {
  return sanitizeKeyBase(value);
};

export const buildTipoContratoFallbackLabel = (value) => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
};

export const normalizeTipoContrato = (key, raw = {}, index = 0) => {
  const base = DEFAULT_TIPOS_CONTRATO_MAP[key] || {};
  const aplicaHoras = raw.aplicaHoras !== undefined ? Boolean(raw.aplicaHoras) : (base.aplicaHoras !== false);
  const rangosHoras = normalizeRangosHoras(raw, base);
  const boundaries = getRangosBoundaries(rangosHoras);
  const horasMinimas = boundaries.min === Number.POSITIVE_INFINITY ? 0 : boundaries.min;
  const horasMaximas = boundaries.max === Number.NEGATIVE_INFINITY ? 0 : boundaries.max;

  return {
    key,
    label: raw.label || base.label || buildTipoContratoFallbackLabel(key),
    horasMinimas: Math.min(horasMinimas, horasMaximas),
    horasMaximas,
    rangosHoras,
    aplicaHoras,
    orden: Number.isFinite(raw.orden) ? raw.orden : (base.orden || index + 1),
    editable: Object.prototype.hasOwnProperty.call(DEFAULT_TIPOS_CONTRATO_MAP, key)
      ? false
      : raw.editable !== false,
  };
};

export const mergeTiposContratoCatalog = (remoteTipos = {}) => {
  const mergedMap = {};

  Object.entries(DEFAULT_TIPOS_CONTRATO_MAP).forEach(([key, value], index) => {
    mergedMap[key] = normalizeTipoContrato(key, { ...value, ...(remoteTipos[key] || {}) }, index);
  });

  Object.entries(remoteTipos).forEach(([key, value], index) => {
    if (!mergedMap[key]) {
      mergedMap[key] = normalizeTipoContrato(key, value, DEFAULT_TIPOS_CONTRATO.length + index);
    }
  });

  return Object.values(mergedMap).sort((a, b) => a.orden - b.orden || a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
};

export const tiposContratoArrayToMap = (tipos = []) => {
  return tipos.reduce((accumulator, tipo) => {
    accumulator[tipo.key] = tipo;
    return accumulator;
  }, {});
};

export const getRangosHorasTipoContrato = (value, tiposMap = null) => {
  const record = findTipoContratoRecord(value, tiposMap);
  if (record?.aplicaHoras === false) {
    return [];
  }

  if (Array.isArray(record?.rangosHoras) && record.rangosHoras.length > 0) {
    return record.rangosHoras.map((rango) => normalizeRangoHoras(rango)).filter(Boolean).sort((a, b) => a.min - b.min || a.max - b.max);
  }

  const horasMinimas = Number.isFinite(record?.horasMinimas) ? record.horasMinimas : getHorasMinimasTipoContrato(value, tiposMap);
  const horasMaximas = Number.isFinite(record?.horasMaximas) ? record.horasMaximas : getHorasMaximasTipoContrato(value, tiposMap);
  const fallback = normalizeRangoHoras({ min: horasMinimas, max: horasMaximas });
  return fallback ? [fallback] : [];
};

export const tiposContratoArrayToFirebaseObject = (tipos = []) => {
  return tipos.reduce((accumulator, tipo) => {
    accumulator[tipo.key] = {
      label: tipo.label,
      horasMinimas: Number(tipo.horasMinimas) || 0,
      horasMaximas: Number(tipo.horasMaximas) || 0,
      rangosHoras: Array.isArray(tipo.rangosHoras)
        ? tipo.rangosHoras.map((rango) => normalizeRangoHoras(rango)).filter(Boolean)
        : [],
      aplicaHoras: tipo.aplicaHoras !== false,
      orden: tipo.orden,
      editable: Boolean(tipo.editable),
    };
    return accumulator;
  }, {});
};

export const setTiposContratoCatalog = (tipos = DEFAULT_TIPOS_CONTRATO) => {
  currentTiposContrato = Array.isArray(tipos) && tipos.length > 0 ? tipos : DEFAULT_TIPOS_CONTRATO;
  currentTiposContratoMap = tiposContratoArrayToMap(currentTiposContrato);
};

export const getTiposContratoCatalog = () => currentTiposContrato;

export const getTiposContratoCatalogMap = () => currentTiposContratoMap;

export const findTipoContratoRecord = (value, tiposMap = null) => {
  if (!value) {
    return null;
  }

  const activeMap = tiposMap || currentTiposContratoMap;
  if (activeMap[value]) {
    return activeMap[value];
  }

  const normalizedValue = String(value).trim().toLowerCase();
  return Object.values(activeMap).find((tipo) => {
    return tipo.key.toLowerCase() === normalizedValue || tipo.label.toLowerCase() === normalizedValue;
  }) || null;
};

export const getTipoContratoLabel = (value, tiposMap = null) => {
  const record = findTipoContratoRecord(value, tiposMap);
  if (record?.label) {
    return record.label;
  }

  if (DEFAULT_TIPOS_CONTRATO_MAP[value]?.label) {
    return DEFAULT_TIPOS_CONTRATO_MAP[value].label;
  }

  return buildTipoContratoFallbackLabel(value);
};

export const getHorasMaximasTipoContrato = (value, tiposMap = null) => {
  const record = findTipoContratoRecord(value, tiposMap);
  if (record?.aplicaHoras === false) {
    return Number.POSITIVE_INFINITY;
  }

  if (Array.isArray(record?.rangosHoras) && record.rangosHoras.length > 0) {
    return Math.max(...record.rangosHoras.map((rango) => Number(rango?.max) || 0));
  }

  if (Number.isFinite(record?.horasMaximas)) {
    return record.horasMaximas;
  }

  if (DEFAULT_TIPOS_CONTRATO_MAP[value]?.horasMaximas) {
    return DEFAULT_TIPOS_CONTRATO_MAP[value].horasMaximas;
  }

  return DEFAULT_TIPOS_CONTRATO_MAP.operativo.horasMaximas;
};

export const getHorasMinimasTipoContrato = (value, tiposMap = null) => {
  const record = findTipoContratoRecord(value, tiposMap);
  if (record?.aplicaHoras === false) {
    return 0;
  }

  if (Array.isArray(record?.rangosHoras) && record.rangosHoras.length > 0) {
    return Math.min(...record.rangosHoras.map((rango) => Number(rango?.min) || 0));
  }

  if (Number.isFinite(record?.horasMinimas)) {
    return record.horasMinimas;
  }

  if (DEFAULT_TIPOS_CONTRATO_MAP[value]?.horasMinimas) {
    return DEFAULT_TIPOS_CONTRATO_MAP[value].horasMinimas;
  }

  return DEFAULT_TIPOS_CONTRATO_MAP.operativo.horasMinimas;
};

export const formatTipoContratoHoras = (value, tiposMap = null) => {
  const record = findTipoContratoRecord(value, tiposMap);
  if (record?.aplicaHoras === false) {
    return 'Sin límite';
  }

  const rangosHoras = getRangosHorasTipoContrato(value, tiposMap);
  if (rangosHoras.length > 0) {
    return formatRangosHoras(rangosHoras);
  }

  const horasMinimas = getHorasMinimasTipoContrato(value, tiposMap);
  const horasMaximas = getHorasMaximasTipoContrato(value, tiposMap);

  if (horasMinimas === horasMaximas) {
    return `${horasMaximas}h`;
  }

  return `${horasMinimas} a ${horasMaximas}h`;
};

export const esHorasPermitidasTipoContrato = (value, horas, tiposMap = null) => {
  const record = findTipoContratoRecord(value, tiposMap);
  if (record?.aplicaHoras === false) {
    return true;
  }

  const horasNumericas = Number(horas);
  if (!Number.isFinite(horasNumericas)) {
    return false;
  }

  const rangosHoras = getRangosHorasTipoContrato(value, tiposMap);
  if (rangosHoras.length === 0) {
    const horasMaximas = getHorasMaximasTipoContrato(value, tiposMap);
    return horasNumericas <= horasMaximas;
  }

  return rangosHoras.some((rango) => horasNumericas >= rango.min && horasNumericas <= rango.max);
};
