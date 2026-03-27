import { get, ref, set, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import {
  DEPARTAMENTOS_CATALOGO_PATH,
  buildDefaultDepartamentosCatalog,
  departamentosArrayToFirebaseObject,
  mergeDepartamentosCatalog,
} from '../utils/departamentos';

export const getDepartamentosCatalogo = async () => {
  const snapshot = await get(ref(database, DEPARTAMENTOS_CATALOGO_PATH));
  if (!snapshot.exists()) {
    const departamentos = buildDefaultDepartamentosCatalog();
    return { departamentos };
  }

  const departamentos = mergeDepartamentosCatalog(snapshot.val() || {});
  return { departamentos };
};

export const subscribeDepartamentosCatalogo = (onChange) => {
  const catalogRef = ref(database, DEPARTAMENTOS_CATALOGO_PATH);

  onValue(catalogRef, (snapshot) => {
    const departamentos = mergeDepartamentosCatalog(snapshot.exists() ? snapshot.val() : {});
    onChange({ departamentos });
  });

  return () => off(catalogRef);
};

export const saveDepartamentosCatalogo = async (departamentos) => {
  const payload = departamentosArrayToFirebaseObject(departamentos);
  await set(ref(database, DEPARTAMENTOS_CATALOGO_PATH), payload);
};