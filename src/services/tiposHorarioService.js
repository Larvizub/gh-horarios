import { ref, get, set, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import {
  mergeTiposCatalog,
  tiposArrayToFirebaseObject,
  DEFAULT_TIPOS_HORARIO,
  tiposArrayToMap
} from '../utils/tiposHorario';

const TIPOS_HORARIO_PATH = 'catalogos/tiposHorario';

export const getTiposHorario = async () => {
  const snapshot = await get(ref(database, TIPOS_HORARIO_PATH));
  if (!snapshot.exists()) {
    return {
      tipos: DEFAULT_TIPOS_HORARIO,
      tiposMap: tiposArrayToMap(DEFAULT_TIPOS_HORARIO)
    };
  }

  const tipos = mergeTiposCatalog(snapshot.val() || {});
  return { tipos, tiposMap: tiposArrayToMap(tipos) };
};

export const subscribeTiposHorario = (onChange) => {
  const r = ref(database, TIPOS_HORARIO_PATH);
  onValue(r, (snapshot) => {
    const tipos = mergeTiposCatalog(snapshot.exists() ? snapshot.val() : {});
    onChange({ tipos, tiposMap: tiposArrayToMap(tipos) });
  });

  return () => off(r);
};

export const saveTiposHorario = async (tipos) => {
  const payload = tiposArrayToFirebaseObject(tipos);
  await set(ref(database, TIPOS_HORARIO_PATH), payload);
};
