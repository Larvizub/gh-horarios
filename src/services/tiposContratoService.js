import { ref, get, set, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import {
  DEFAULT_TIPOS_CONTRATO,
  mergeTiposContratoCatalog,
  setTiposContratoCatalog,
  tiposContratoArrayToFirebaseObject,
  tiposContratoArrayToMap,
} from '../utils/tiposContrato';

const TIPOS_CONTRATO_PATH = 'catalogos/tiposContrato';

export const getTiposContrato = async () => {
  const snapshot = await get(ref(database, TIPOS_CONTRATO_PATH));
  if (!snapshot.exists()) {
    return {
      tipos: DEFAULT_TIPOS_CONTRATO,
      tiposMap: tiposContratoArrayToMap(DEFAULT_TIPOS_CONTRATO),
    };
  }

  const tipos = mergeTiposContratoCatalog(snapshot.val() || {});
  return { tipos, tiposMap: tiposContratoArrayToMap(tipos) };
};

export const subscribeTiposContrato = (onChange) => {
  const reference = ref(database, TIPOS_CONTRATO_PATH);

  onValue(reference, (snapshot) => {
    const tipos = mergeTiposContratoCatalog(snapshot.exists() ? snapshot.val() : {});
    setTiposContratoCatalog(tipos);
    onChange({ tipos, tiposMap: tiposContratoArrayToMap(tipos) });
  });

  return () => off(reference);
};

export const saveTiposContrato = async (tipos) => {
  const payload = tiposContratoArrayToFirebaseObject(tipos);
  await set(ref(database, TIPOS_CONTRATO_PATH), payload);
};
