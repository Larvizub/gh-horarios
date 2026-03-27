import { useEffect, useMemo, useState } from 'react';
import { buildDefaultDepartamentosCatalog, departamentosToLabels } from '../utils/departamentos';
import { subscribeDepartamentosCatalogo } from '../services/departamentosService';

export const useDepartamentos = () => {
  const [departamentos, setDepartamentos] = useState(buildDefaultDepartamentosCatalog());
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeDepartamentosCatalogo(({ departamentos: catalogo }) => {
      setDepartamentos(catalogo);
      setLoadingDepartamentos(false);
    });

    return () => unsubscribe();
  }, []);

  const departamentosActivos = useMemo(() => departamentosToLabels(departamentos), [departamentos]);

  return {
    departamentos,
    departamentosActivos,
    loadingDepartamentos,
  };
};

export default useDepartamentos;