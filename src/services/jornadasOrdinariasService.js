import { ref, get, set, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import {
  DEFAULT_JORNADAS_ORDINARIAS,
  mergeJornadasOrdinariasCatalog,
  jornadasOrdinariasArrayToFirebaseObject,
  jornadasOrdinariasArrayToMap,
} from '../utils/jornadasOrdinarias';

const JORNADAS_ORDINARIAS_PATH = 'catalogos/jornadasOrdinarias';

export const getJornadasOrdinarias = async () => {
  const snapshot = await get(ref(database, JORNADAS_ORDINARIAS_PATH));
  if (!snapshot.exists()) {
    return {
      jornadas: DEFAULT_JORNADAS_ORDINARIAS,
      jornadasMap: jornadasOrdinariasArrayToMap(DEFAULT_JORNADAS_ORDINARIAS),
    };
  }

  const jornadas = mergeJornadasOrdinariasCatalog(snapshot.val() || {});
  return { jornadas, jornadasMap: jornadasOrdinariasArrayToMap(jornadas) };
};

export const subscribeJornadasOrdinarias = (onChange) => {
  const reference = ref(database, JORNADAS_ORDINARIAS_PATH);

  onValue(reference, (snapshot) => {
    const jornadas = mergeJornadasOrdinariasCatalog(snapshot.exists() ? snapshot.val() : {});
    onChange({ jornadas, jornadasMap: jornadasOrdinariasArrayToMap(jornadas) });
  });

  return () => off(reference);
};

export const saveJornadasOrdinarias = async (jornadas) => {
  const payload = jornadasOrdinariasArrayToFirebaseObject(jornadas);
  await set(ref(database, JORNADAS_ORDINARIAS_PATH), payload);
};
