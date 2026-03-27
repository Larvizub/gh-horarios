import { get, ref, set, onValue, off } from 'firebase/database';
import { database } from '../firebase/config';
import { buildDefaultRolesCatalog, rolesArrayToFirebaseObject, mergeRolesCatalog, ROLES_CATALOGO_PATH } from '../utils/roles';

export const getRolesCatalogo = async () => {
  const snapshot = await get(ref(database, ROLES_CATALOGO_PATH));
  if (!snapshot.exists()) {
    const roles = buildDefaultRolesCatalog();
    return { roles };
  }

  const roles = mergeRolesCatalog(snapshot.val() || {});
  return { roles };
};

export const subscribeRolesCatalogo = (onChange) => {
  const catalogRef = ref(database, ROLES_CATALOGO_PATH);

  onValue(catalogRef, (snapshot) => {
    const roles = mergeRolesCatalog(snapshot.exists() ? snapshot.val() : {});
    onChange({ roles });
  });

  return () => off(catalogRef);
};

export const saveRolesCatalogo = async (roles) => {
  const payload = rolesArrayToFirebaseObject(roles);
  await set(ref(database, ROLES_CATALOGO_PATH), payload);
};
