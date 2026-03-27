import { PERMISOS_CARGO } from './cargos';

export const ROLES_CATALOGO_PATH = 'catalogos/roles';

export const buildDefaultRolesCatalog = () => {
  // Default roles with sensible permissions mapping
  const defaultPerms = (keys) =>
    PERMISOS_CARGO.reduce((acc, p) => ({ ...acc, [p.key]: keys.includes(p.key) }), {});

  return [
    {
      id: 'administrador',
      label: 'Administrador',
      permisos: defaultPerms(PERMISOS_CARGO.map((p) => p.key)),
      editable: false,
      orden: 1,
    },
    {
      id: 'modificador',
      label: 'Gestor',
      permisos: defaultPerms(['puedeVerHorarios', 'puedeModificarHorarios', 'puedeAccederPersonal']),
      editable: true,
      orden: 2,
    },
    {
      id: 'visor',
      label: 'Visor',
      permisos: defaultPerms(['puedeVerHorarios']),
      editable: true,
      orden: 3,
    },
  ];
};

export const rolesArrayToFirebaseObject = (roles = []) => {
  return roles.reduce((accumulator, role, index) => {
    const id = role.id || (role.label || `role-${index + 1}`).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    accumulator[id] = {
      label: role.label,
      permisos: role.permisos || {},
      editable: role.editable !== false,
      orden: Number.isFinite(role.orden) ? role.orden : index + 1,
    };
    return accumulator;
  }, {});
};

export const rolesObjectToArray = (catalog = {}) => {
  return Object.entries(catalog).map(([id, value], index) => ({
    id,
    label: value?.label || id,
    permisos: value?.permisos || {},
    editable: value?.editable !== false,
    orden: Number.isFinite(value?.orden) ? value.orden : index + 1,
  }));
};

export const mergeRolesCatalog = (remote = {}) => {
  const roles = rolesObjectToArray(remote);
  return roles.sort((a, b) => a.orden - b.orden);
};

export default {};
