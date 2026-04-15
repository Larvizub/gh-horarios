import { get, ref, remove, update } from 'firebase/database';

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const cloneValue = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
};

const findUsuarioByEmail = (usuarios = {}, email = '') => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  return Object.entries(usuarios).find(([, usuario]) => normalizeEmail(usuario?.email) === normalizedEmail) || null;
};

const migrateUsuarioData = async (database, oldId, newId, usuario, email = '') => {
  const updates = {};
  const migratedUsuario = {
    ...cloneValue(usuario),
    email: usuario?.email || email || '',
  };

  updates[`usuarios/${newId}`] = migratedUsuario;
  updates[`usuarios/${oldId}`] = null;

  const horasExtrasSnapshot = await get(ref(database, 'horas_extras'));
  const horasExtras = horasExtrasSnapshot.exists() ? horasExtrasSnapshot.val() : {};

  if (Object.prototype.hasOwnProperty.call(horasExtras, oldId)) {
    updates[`horas_extras/${newId}`] = horasExtras[oldId];
    updates[`horas_extras/${oldId}`] = null;
  }

  const horariosSnapshot = await get(ref(database, 'horarios_registros'));
  const horariosRegistros = horariosSnapshot.exists() ? horariosSnapshot.val() : {};

  Object.entries(horariosRegistros).forEach(([semanaKey, horariosSemana]) => {
    if (!horariosSemana || !Object.prototype.hasOwnProperty.call(horariosSemana, oldId)) {
      return;
    }

    updates[`horarios_registros/${semanaKey}/${newId}`] = cloneValue(horariosSemana[oldId]);
    updates[`horarios_registros/${semanaKey}/${oldId}`] = null;
  });

  await update(ref(database), updates);

  return {
    id: newId,
    ...migratedUsuario,
    migratedFrom: oldId,
  };
};

export const resolveUsuarioRecord = async ({ database, uid, email = '', migrateToUid = false }) => {
  if (!uid) {
    return null;
  }

  const uidSnapshot = await get(ref(database, `usuarios/${uid}`));
  if (uidSnapshot.exists()) {
    return {
      id: uid,
      ...uidSnapshot.val(),
      email: uidSnapshot.val()?.email || email || '',
      matchedBy: 'uid',
    };
  }

  const usuariosSnapshot = await get(ref(database, 'usuarios'));
  if (!usuariosSnapshot.exists()) {
    return email ? { id: uid, email } : null;
  }

  const usuarios = usuariosSnapshot.val() || {};
  const match = findUsuarioByEmail(usuarios, email);

  if (!match) {
    return email ? { id: uid, email } : null;
  }

  const [oldId, usuario] = match;

  if (migrateToUid && oldId !== uid) {
    return migrateUsuarioData(database, oldId, uid, usuario, email);
  }

  return {
    id: oldId,
    ...usuario,
    email: usuario?.email || email || '',
    matchedBy: 'email',
    migratedFrom: oldId,
  };
};