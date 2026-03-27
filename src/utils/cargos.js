export const CARGOS_CATALOGO_PATH = 'catalogos/cargos';

export const PERMISOS_CARGO = [
  { key: 'puedeVerHorarios', label: 'Ver horarios' },
  { key: 'puedeModificarHorarios', label: 'Modificar horarios' },
  { key: 'puedeEliminarHorarios', label: 'Eliminar horarios' },
  { key: 'puedeAccederPersonal', label: 'Acceder a personal' },
  { key: 'puedeAsignarRoles', label: 'Asignar roles' },
  { key: 'puedeModificarTipoContrato', label: 'Modificar tipo de contrato' },
];

export const buildDefaultCargoPermissions = () => {
  return PERMISOS_CARGO.reduce((accumulator, permiso) => {
    accumulator[permiso.key] = false;
    return accumulator;
  }, {});
};

export const normalizeCargoPermissions = (permisos = {}) => {
  const defaults = buildDefaultCargoPermissions();

  return PERMISOS_CARGO.reduce((accumulator, permiso) => {
    accumulator[permiso.key] = Boolean(permisos?.[permiso.key]);
    return accumulator;
  }, defaults);
};

export const normalizeCargoDepartamentoId = (value = '') => sanitizeCargoKey(value);

export const normalizeCargoLabel = (value = '') => value.trim();

export const sanitizeCargoKey = (value = '') => {
  return normalizeCargoLabel(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const buildCargoIdFromLabel = (value = '') => sanitizeCargoKey(value);

export const buildDefaultCargosCatalog = () => [];

export const cargosArrayToFirebaseObject = (cargos = []) => {
  return cargos.reduce((accumulator, cargo, index) => {
    const id = cargo.id || sanitizeCargoKey(cargo.label) || `cargo-${index + 1}`;
    accumulator[id] = {
      label: normalizeCargoLabel(cargo.label),
      activo: cargo.activo !== false,
      editable: Boolean(cargo.editable),
      orden: Number.isFinite(cargo.orden) ? cargo.orden : index + 1,
      permisos: normalizeCargoPermissions(cargo.permisos),
      aprobador: Boolean(cargo.aprobador),
      roleId: cargo.roleId || null,
      departamentoId: normalizeCargoDepartamentoId(cargo.departamentoId || cargo.departamento || ''),
    };
    return accumulator;
  }, {});
};

export const cargosObjectToArray = (catalogo = {}) => {
  return Object.entries(catalogo).map(([id, value], index) => ({
    id,
    label: normalizeCargoLabel(value?.label || value?.nombre || id),
    activo: value?.activo !== false,
    editable: Boolean(value?.editable),
    orden: Number.isFinite(value?.orden) ? value.orden : index + 1,
    permisos: normalizeCargoPermissions(value?.permisos),
    aprobador: Boolean(value?.aprobador),
    roleId: value?.roleId || null,
    departamentoId: normalizeCargoDepartamentoId(value?.departamentoId || value?.departamento || ''),
  }));
};

export const mergeCargosCatalog = (remoteCatalogo = {}) => {
  const cargos = cargosObjectToArray(remoteCatalogo);
  return cargos.sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
};

export const groupCargosByDepartamento = (cargos = []) => {
  return cargos.reduce((accumulator, cargo) => {
    const key = cargo.departamentoId || 'sin-departamento';
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(cargo);
    return accumulator;
  }, {});
};

export const cargosToLabels = (cargos = []) => {
  return cargos.filter((cargo) => cargo.activo !== false).map((cargo) => cargo.label);
};

export const getCargoLabel = (cargo, cargos = []) => {
  if (!cargo) return '';

  const normalized = normalizeCargoLabel(cargo);
  const found = cargos.find((item) => item.id === normalized || item.label === normalized);
  if (found?.label) return found.label;

  return normalized;
};

export const resolveCargoRecord = (value = '') => {
  const label = normalizeCargoLabel(value);
  return {
    cargo: label,
    cargoId: buildCargoIdFromLabel(label),
  };
};