import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_JORNADAS_ORDINARIAS,
  jornadasOrdinariasArrayToMap,
  formatCoberturaJornadaOrdinaria,
} from '../utils/jornadasOrdinarias';
import { subscribeJornadasOrdinarias } from '../services/jornadasOrdinariasService';

export const useJornadasOrdinarias = () => {
  const [jornadas, setJornadas] = useState(DEFAULT_JORNADAS_ORDINARIAS);
  const [jornadasMap, setJornadasMap] = useState(jornadasOrdinariasArrayToMap(DEFAULT_JORNADAS_ORDINARIAS));
  const [loadingJornadasOrdinarias, setLoadingJornadasOrdinarias] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeJornadasOrdinarias(({ jornadas: catalogo, jornadasMap: map }) => {
      setJornadas(catalogo);
      setJornadasMap(map);
      setLoadingJornadasOrdinarias(false);
    });

    return () => unsubscribe();
  }, []);

  const jornadasOrdenadas = useMemo(() => [...jornadas].sort((a, b) => a.orden - b.orden), [jornadas]);

  return {
    jornadas: jornadasOrdenadas,
    jornadasMap,
    loadingJornadasOrdinarias,
    formatCoberturaJornadaOrdinaria,
  };
};

export default useJornadasOrdinarias;
