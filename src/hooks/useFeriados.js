import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_FERIADOS, feriadosArrayToDateSet, feriadosArrayToMap } from '../utils/feriados';
import { subscribeFeriadosAnio } from '../services/feriadosService';

export const useFeriados = (anio = new Date().getFullYear()) => {
  const [feriados, setFeriados] = useState(DEFAULT_FERIADOS);
  const [feriadosMap, setFeriadosMap] = useState(feriadosArrayToMap(DEFAULT_FERIADOS));
  const [loadingFeriados, setLoadingFeriados] = useState(true);

  useEffect(() => {
    setLoadingFeriados(true);
    const unsubscribe = subscribeFeriadosAnio(anio, ({ feriados: catalogo, feriadosMap: map }) => {
      setFeriados(catalogo);
      setFeriadosMap(map);
      setLoadingFeriados(false);
    });

    return () => unsubscribe();
  }, [anio]);

  const feriadosPorFecha = useMemo(() => feriadosArrayToDateSet(feriados), [feriados]);

  return {
    feriados,
    feriadosMap,
    feriadosPorFecha,
    loadingFeriados,
  };
};

export default useFeriados;
