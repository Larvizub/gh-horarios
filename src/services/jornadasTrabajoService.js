import { ref, get, set, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import {
  DEFAULT_JORNADAS_TRABAJO,
  mergeJornadasTrabajoCatalog,
  jornadasTrabajoArrayToFirebaseObject,
  jornadasTrabajoArrayToMap,
  setJornadasTrabajoCatalog,
} from '../utils/jornadasTrabajo';

const JORNADAS_TRABAJO_PATH = 'catalogos/jornadasTrabajo';

export const getJornadasTrabajo = async () => {
  const snapshot = await get(ref(database, JORNADAS_TRABAJO_PATH));
  if (!snapshot.exists()) {
    return {
      jornadas: DEFAULT_JORNADAS_TRABAJO,
      jornadasMap: jornadasTrabajoArrayToMap(DEFAULT_JORNADAS_TRABAJO),
    };
  }

  const jornadas = mergeJornadasTrabajoCatalog(snapshot.val() || {});
  return { jornadas, jornadasMap: jornadasTrabajoArrayToMap(jornadas) };
};

export const subscribeJornadasTrabajo = (onChange) => {
  const reference = ref(database, JORNADAS_TRABAJO_PATH);

  onValue(reference, (snapshot) => {
    const jornadas = mergeJornadasTrabajoCatalog(snapshot.exists() ? snapshot.val() : {});
    setJornadasTrabajoCatalog(jornadas);
    onChange({ jornadas, jornadasMap: jornadasTrabajoArrayToMap(jornadas) });
  });

  return () => off(reference);
};

export const saveJornadasTrabajo = async (jornadas) => {
  const payload = jornadasTrabajoArrayToFirebaseObject(jornadas);
  await set(ref(database, JORNADAS_TRABAJO_PATH), payload);
};
