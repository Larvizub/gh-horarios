const sanitizeKeyBase = (value = '') => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const DEFAULT_TIPOS_CONTRATO = [
  { key: 'operativo', label: 'Operativo', horasMaximas: 48, orden: 1, editable: false },
  { key: 'confianza', label: 'Confianza', horasMaximas: 72, orden: 2, editable: false },
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
  const horasMaximas = Number.isFinite(raw.horasMaximas)
    ? raw.horasMaximas
    : (Number.isFinite(base.horasMaximas) ? base.horasMaximas : 48);

  return {
    key,
    label: raw.label || base.label || buildTipoContratoFallbackLabel(key),
    horasMaximas,
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

export const tiposContratoArrayToFirebaseObject = (tipos = []) => {
  return tipos.reduce((accumulator, tipo) => {
    accumulator[tipo.key] = {
      label: tipo.label,
      horasMaximas: Number(tipo.horasMaximas) || 0,
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
  if (Number.isFinite(record?.horasMaximas)) {
    return record.horasMaximas;
  }

  if (DEFAULT_TIPOS_CONTRATO_MAP[value]?.horasMaximas) {
    return DEFAULT_TIPOS_CONTRATO_MAP[value].horasMaximas;
  }

  return DEFAULT_TIPOS_CONTRATO_MAP.operativo.horasMaximas;
};
