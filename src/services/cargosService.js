import { get, ref, set, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import {
  buildDefaultCargosCatalog,
  cargosArrayToFirebaseObject,
  CARGOS_CATALOGO_PATH,
  mergeCargosCatalog,
} from '../utils/cargos';

export const getCargosCatalogo = async () => {
  const snapshot = await get(ref(database, CARGOS_CATALOGO_PATH));
  if (!snapshot.exists()) {
    const cargos = buildDefaultCargosCatalog();
    return { cargos };
  }

  const cargos = mergeCargosCatalog(snapshot.val() || {});
  return { cargos };
};

export const subscribeCargosCatalogo = (onChange) => {
  const catalogRef = ref(database, CARGOS_CATALOGO_PATH);

  onValue(catalogRef, (snapshot) => {
    const cargos = mergeCargosCatalog(snapshot.exists() ? snapshot.val() : {});
    onChange({ cargos });
  });

  return () => off(catalogRef);
};

export const saveCargosCatalogo = async (cargos) => {
  const payload = cargosArrayToFirebaseObject(cargos);
  await set(ref(database, CARGOS_CATALOGO_PATH), payload);
};