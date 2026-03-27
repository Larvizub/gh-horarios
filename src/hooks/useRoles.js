import { useEffect, useRef, useState } from 'react';
import { getRolesCatalogo, subscribeRolesCatalogo } from '../services/rolesService';

const useRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingRoles(true);
        const { roles: loaded } = await getRolesCatalogo();
        if (mountedRef.current) setRoles(loaded || []);
      } catch (error) {
        console.error('Error loading roles catalog', error);
      } finally {
        if (mountedRef.current) setLoadingRoles(false);
      }
    };

    const unsubscribe = subscribeRolesCatalogo(({ roles: updated }) => {
      if (mountedRef.current) setRoles(updated || []);
    });

    load();

    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  return { roles, loadingRoles };
};

export default useRoles;
