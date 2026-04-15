import { ref, get, set, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import { DEFAULT_FERIADOS, mergeFeriadosCatalog, feriadosArrayToFirebaseObject, feriadosArrayToMap } from '../utils/feriados';

const FERIADOS_PATH = 'catalogos/feriados';

const getFeriadosPath = (anio) => `${FERIADOS_PATH}/${anio}`;

export const getFeriadosAnio = async (anio) => {
  const snapshot = await get(ref(database, getFeriadosPath(anio)));
  if (!snapshot.exists()) {
    return {
      feriados: DEFAULT_FERIADOS,
      feriadosMap: feriadosArrayToMap(DEFAULT_FERIADOS),
    };
  }

  const feriados = mergeFeriadosCatalog(snapshot.val() || {});
  return { feriados, feriadosMap: feriadosArrayToMap(feriados) };
};

export const subscribeFeriadosAnio = (anio, onChange) => {
  const feriadosRef = ref(database, getFeriadosPath(anio));

  onValue(feriadosRef, (snapshot) => {
    const feriados = mergeFeriadosCatalog(snapshot.exists() ? snapshot.val() : {});
    onChange({ feriados, feriadosMap: feriadosArrayToMap(feriados) });
  });

  return () => off(feriadosRef);
};

export const saveFeriadosAnio = async (anio, feriados) => {
  const payload = feriadosArrayToFirebaseObject(feriados);
  await set(ref(database, getFeriadosPath(anio)), payload);
};
