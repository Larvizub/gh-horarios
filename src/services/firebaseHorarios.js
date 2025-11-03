import { ref, get, set, update, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// NUEVA FUNCION: Eliminar horario de un usuario en un día específico
export async function eliminarHorarioDeUsuario(semanaKey, usuarioId, diaKey) {
  const refPath = `horarios_registros/${semanaKey}/${usuarioId}/${diaKey}`;
  await set(ref(database, refPath), null);
}

export async function cargarHorariosPorSemana(fechaSemana, obtenerClaveSemana) {
  const semanaKey = obtenerClaveSemana(fechaSemana);
  const horariosRef = ref(database, `horarios_registros/${semanaKey}`);
  const horariosSnapshot = await get(horariosRef);
  return horariosSnapshot.exists() ? horariosSnapshot.val() : {};
}

// Suscripción en tiempo real para una semana concreta. Devuelve una función de unsubscribe.
export function subscribeHorariosSemana(semanaKey, onChange) {
  if (!semanaKey) return () => {};
  const r = ref(database, `horarios_registros/${semanaKey}`);
  onValue(r, (snapshot) => {
    try {
      const val = snapshot.exists() ? snapshot.val() : {};
      onChange(val);
    } catch (e) {
      console.error('Error en subscribeHorariosSemana onValue:', e);
    }
  });
  // onValue already returns an unsubscribe function when passed to off; normal pattern is to return () => off(r)
  return () => off(r);
}

// Suscripción para horas extras
export function subscribeHorasExtras(onChange) {
  const r = ref(database, 'horas_extras');
  onValue(r, (snapshot) => {
    try {
      const val = snapshot.exists() ? snapshot.val() : {};
      onChange(val);
    } catch (e) {
      console.error('Error en subscribeHorasExtras onValue:', e);
    }
  });
  return () => off(r);
}

export async function guardarHorariosSemana(semanaKey, horariosEditados) {
  // Usa update para hacer merge de los usuarios provistos sin borrar los que no vienen en el payload
  // Si se pasa un objeto por usuario, convertimos a actualizaciones por día para evitar sobrescribir sub-keys de otros clientes
  if (!horariosEditados || Object.keys(horariosEditados).length === 0) return;
  const mergedUpdates = {};
  for (const [usuarioId, horariosUsuario] of Object.entries(horariosEditados)) {
    const basePath = `horarios_registros/${semanaKey}/${usuarioId}`;
    if (!horariosUsuario || typeof horariosUsuario !== 'object') continue;
    // Para cada día dentro del objeto (dia1..dia7) escribimos por path individual
    for (const [diaKey, valor] of Object.entries(horariosUsuario)) {
      mergedUpdates[`${basePath}/${diaKey}`] = valor || null;
    }
  }
  if (Object.keys(mergedUpdates).length > 0) {
    await update(ref(database), mergedUpdates);
  }
}

export async function guardarHorasExtras(horasExtras) {
  // Intentos con reintento simple
  const maxRetries = 3;
  let attempt = 0;
  let lastErr = null;
  while (attempt < maxRetries) {
    try {
      await set(ref(database, 'horas_extras'), horasExtras);
      return;
    } catch (e) {
      lastErr = e;
      attempt += 1;
      // backoff
      const delay = 200 * attempt;
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw lastErr;
}

// Guarda solo los horarios de un usuario dentro de una semana, sin afectar a los demás
export async function guardarHorariosUsuarioSemana(semanaKey, usuarioId, horariosUsuario) {
  // Usar update granular por dia para evitar sobrescribir datos concurrentes
  if (!horariosUsuario || Object.keys(horariosUsuario).length === 0) {
    // Si viene vacío, borramos el nodo del usuario
    await set(ref(database, `horarios_registros/${semanaKey}/${usuarioId}`), {});
    return;
  }
  const updates = {};
  for (const [diaKey, valor] of Object.entries(horariosUsuario)) {
    updates[`horarios_registros/${semanaKey}/${usuarioId}/${diaKey}`] = valor || null;
  }
  if (Object.keys(updates).length > 0) {
    // Reintentos para escrituras
    const maxRetries = 3;
    let attempt = 0;
    let lastErr = null;
    while (attempt < maxRetries) {
      try {
        await update(ref(database), updates);
        return;
      } catch (e) {
        lastErr = e;
        attempt += 1;
        const delay = 150 * attempt;
        await new Promise(res => setTimeout(res, delay));
      }
    }
    throw lastErr;
  }
}

// Guardado en lote: recibe un objeto con paths absolutos y valores, y hace un update único
// Ejemplo de updates: { 'horarios_registros/2025-32/uid123': { ... }, 'horarios_registros/2025-33/uid456': { ... } }
export async function guardarBatchHorarios(updatesObject) {
  if (!updatesObject || Object.keys(updatesObject).length === 0) return;

  // Preparar updates granulares: si el valor es un objeto (por ejemplo el objeto del usuario para una semana),
  // lo desglosamos en paths por día. Además guardamos un backup mínimo para auditoría/recuperación.
  const mergedUpdates = {};
  const backup = {
    id: uuidv4(),
    timestamp: Date.now(),
    payload: {}
  };

  for (const [pathKey, value] of Object.entries(updatesObject)) {
    // Si value es un objeto, asumimos que representa un conjunto de días o usuarios
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Desglosar en child keys
      for (const [childKey, childVal] of Object.entries(value)) {
        mergedUpdates[`${pathKey}/${childKey}`] = childVal || null;
      }
      backup.payload[pathKey] = value;
    } else {
      // Valor escalar o nulo, lo aplicamos directamente
      mergedUpdates[pathKey] = value;
      backup.payload[pathKey] = value;
    }
  }

  // Escribir backup para poder recuperar en caso de sobrescritura accidental
  try {
    await set(ref(database, `horarios_backups/${backup.id}`), backup);
  } catch (e) {
    console.warn('No se pudo guardar backup de horarios:', e);
  }

  // Escribir todos los updates en una sola operación atómica con reintentos
  const maxRetries = 3;
  let attempt = 0;
  let lastErr = null;
  while (attempt < maxRetries) {
    try {
      await update(ref(database), mergedUpdates);
      return;
    } catch (e) {
      lastErr = e;
    attempt += 1;
    const delay = 200 * attempt;
    await new Promise(res => setTimeout(res, delay));
    }
  }
  throw lastErr;
}