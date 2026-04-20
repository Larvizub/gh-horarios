export const DEFAULT_DEPARTAMENTOS = [
  'Planeación de Eventos',
  'Gestión de la Protección',
  'Áreas & Sostenibilidad',
  'Gastronomía',
  'Infraestructura',
  'Financiero',
  'Oficina de Atención al Expositor',
  'Practicantes/Crosstraining',
  'Talento Humano',
  'Calidad',
  'Sistemas',
  'Mercadeo y Ventas',
  'Compras',
  'Gerencia de Operaciones',
  'Gerencia General',
  'UDEI'
];

export const DEPARTAMENTOS_CATALOGO_PATH = 'catalogos/departamentos';

export const sanitizeDepartamentoKey = (value = '') => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const buildDepartamentoFallback = (value = '') => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');
};

export const normalizeDepartamentoLabel = (value = '') => value.trim();

export const buildDefaultDepartamentosCatalog = () => {
  return DEFAULT_DEPARTAMENTOS.map((label, index) => ({
    id: sanitizeDepartamentoKey(label) || `depto-${index + 1}`,
    label,
    activo: true,
    editable: false,
    orden: index + 1,
    teleRestricciones: null,
  }));
};

export const departamentosArrayToFirebaseObject = (departamentos = []) => {
  return departamentos.reduce((accumulator, departamento, index) => {
    const id = departamento.id || sanitizeDepartamentoKey(departamento.label) || `depto-${index + 1}`;
    accumulator[id] = {
      label: normalizeDepartamentoLabel(departamento.label),
      activo: departamento.activo !== false,
      editable: Boolean(departamento.editable),
      orden: Number.isFinite(departamento.orden) ? departamento.orden : index + 1,
      teleRestricciones: departamento.teleRestricciones ?? null,
    };
    return accumulator;
  }, {});
};

export const departamentosObjectToArray = (catalogo = {}) => {
  return Object.entries(catalogo).map(([id, value], index) => ({
    id,
    label: normalizeDepartamentoLabel(value?.label || value?.nombre || id),
    activo: value?.activo !== false,
    editable: Boolean(value?.editable),
    orden: Number.isFinite(value?.orden) ? value.orden : index + 1,
    teleRestricciones: value?.teleRestricciones ?? null,
  }));
};

export const mergeDepartamentosCatalog = (remoteCatalogo = {}) => {
  const defaults = buildDefaultDepartamentosCatalog();
  const remoteArray = departamentosObjectToArray(remoteCatalogo);
  const remoteById = remoteArray.reduce((accumulator, departamento) => {
    accumulator[departamento.id] = departamento;
    return accumulator;
  }, {});

  const merged = defaults.map((departamento) => {
    const remoteDepartamento = remoteById[departamento.id];
    if (!remoteDepartamento) {
      return departamento;
    }

    return {
      ...departamento,
      label: remoteDepartamento.label || departamento.label,
      activo: remoteDepartamento.activo !== false,
      editable: Boolean(remoteDepartamento.editable),
      orden: Number.isFinite(remoteDepartamento.orden) ? remoteDepartamento.orden : departamento.orden,
      teleRestricciones: remoteDepartamento.teleRestricciones ?? departamento.teleRestricciones ?? null,
    };
  });

  remoteArray.forEach((departamento) => {
    if (!merged.some((item) => item.id === departamento.id)) {
      merged.push(departamento);
    }
  });

  return merged.sort((a, b) => a.orden - b.orden || a.label.localeCompare(b.label));
};

export const departamentosToLabels = (departamentos = []) => {
  return departamentos.filter((departamento) => departamento.activo !== false).map((departamento) => departamento.label);
};

export const getDepartamentoLabel = (departamento, departamentos = []) => {
  if (!departamento) return '';

  const normalized = normalizeDepartamentoLabel(departamento);
  const found = departamentos.find((item) => item.id === normalized || item.label === normalized);
  if (found?.label) return found.label;

  return buildDepartamentoFallback(normalized);
};