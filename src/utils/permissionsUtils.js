import { ROLES } from './contratoUtils';

export function puedeEditarHorarios(usuario) {
  if (!usuario) return false;
  return [ROLES.ADMINISTRADOR, ROLES.MODIFICADOR].includes(usuario.rol);
}

export function puedeEliminarHorarios(usuario) {
  if (!usuario) return false;
  return [ROLES.ADMINISTRADOR, ROLES.MODIFICADOR].includes(usuario.rol);
}

export function puedeModificarHorarios(usuarioActual, usuarioObjetivo) {
  if (!usuarioActual || !usuarioObjetivo) return false;
  // Admin puede modificar todos, Modificador solo su propio y su departamento
  if (usuarioActual.rol === ROLES.ADMINISTRADOR) return true;
  if (usuarioActual.rol === ROLES.MODIFICADOR) {
    return usuarioActual.id === usuarioObjetivo.id ||
      usuarioActual.departamento === usuarioObjetivo.departamento;
  }
  return usuarioActual.id === usuarioObjetivo.id;
}
