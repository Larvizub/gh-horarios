const sanitizeKeyBase = (value = '') => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const DEFAULT_TIPOS_CONTRATO = [
  { key: 'operativo', label: 'Operativo', horasMinimas: 48, horasMaximas: 48, aplicaHoras: true, orden: 1, editable: false },
  { key: 'confianza', label: 'Confianza', horasMinimas: 72, horasMaximas: 72, aplicaHoras: true, orden: 2, editable: false },
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
  const horasMinimas = Number.isFinite(raw.horasMinimas)
    ? raw.horasMinimas
    : (Number.isFinite(base.horasMinimas) ? base.horasMinimas : (Number.isFinite(raw.horasMaximas) ? raw.horasMaximas : 48));
  const horasMaximas = Number.isFinite(raw.horasMaximas)
    ? raw.horasMaximas
    : (Number.isFinite(base.horasMaximas) ? base.horasMaximas : horasMinimas);

  return {
    key,
    label: raw.label || base.label || buildTipoContratoFallbackLabel(key),
    horasMinimas: Math.min(horasMinimas, horasMaximas),
    horasMaximas,
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

export const tiposContratoArrayToFirebaseObject = (tipos = []) => {
  return tipos.reduce((accumulator, tipo) => {
    accumulator[tipo.key] = {
      label: tipo.label,
      horasMinimas: Number(tipo.horasMinimas) || 0,
      horasMaximas: Number(tipo.horasMaximas) || 0,
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

  if (Number.isFinite(record?.horasMaximas)) {
    return record.horasMaximas;
  }

  if (DEFAULT_TIPOS_CONTRATO_MAP[value]?.horasMaximas) {
    return DEFAULT_TIPOS_CONTRATO_MAP[value].horasMaximas;
  }

  return DEFAULT_TIPOS_CONTRATO_MAP.operativo.horasMaximas;
};

export const getRangosHorasTipoContrato = (value, tiposMap = null) => {
  const record = findTipoContratoRecord(value, tiposMap);
  if (record?.aplicaHoras === false) {
    return [];
  }

  const horasMinimas = getHorasMinimasTipoContrato(value, tiposMap);
  const horasMaximas = getHorasMaximasTipoContrato(value, tiposMap);

  if (!Number.isFinite(horasMinimas) || !Number.isFinite(horasMaximas)) {
    return [];
  }

  return [{ min: horasMinimas, max: horasMaximas }];
};

export const getHorasMinimasTipoContrato = (value, tiposMap = null) => {
  const record = findTipoContratoRecord(value, tiposMap);
  if (record?.aplicaHoras === false) {
    return 0;
  }

  if (Number.isFinite(record?.horasMinimas)) {
    return record.horasMinimas;
  }

  if (DEFAULT_TIPOS_CONTRATO_MAP[value]?.horasMinimas) {
    return DEFAULT_TIPOS_CONTRATO_MAP[value].horasMinimas;
  }

  return DEFAULT_TIPOS_CONTRATO_MAP.operativo.horasMinimas;
};

export const esHorasPermitidasTipoContrato = (value, horas, tiposMap = null) => {
  const horasNumericas = Number(horas);
  if (!Number.isFinite(horasNumericas)) {
    return false;
  }

  const record = findTipoContratoRecord(value, tiposMap);
  if (record?.aplicaHoras === false) {
    return true;
  }

  const rangosHoras = getRangosHorasTipoContrato(value, tiposMap);
  return rangosHoras.some((rango) => horasNumericas >= rango.min && horasNumericas <= rango.max);
};

export const formatTipoContratoHoras = (value, tiposMap = null) => {
  const record = findTipoContratoRecord(value, tiposMap);
  if (record?.aplicaHoras === false) {
    return 'Sin límite';
  }

  const horasMinimas = getHorasMinimasTipoContrato(value, tiposMap);
  const horasMaximas = getHorasMaximasTipoContrato(value, tiposMap);

  if (horasMinimas === horasMaximas) {
    return `${horasMaximas}h`;
  }

  return `${horasMinimas} a ${horasMaximas}h`;
};
