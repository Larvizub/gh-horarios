import { useEffect, useState } from 'react';
import {
  DEFAULT_JORNADAS_TRABAJO,
  calcularHorasJornadaTrabajo,
  formatJornadaTrabajoResumen,
  getJornadaTrabajoLabel,
  jornadasTrabajoArrayToMap,
} from '../utils/jornadasTrabajo';
import { subscribeJornadasTrabajo } from '../services/jornadasTrabajoService';

export const useJornadasTrabajo = () => {
  const [jornadas, setJornadas] = useState(DEFAULT_JORNADAS_TRABAJO);
  const [jornadasMap, setJornadasMap] = useState(jornadasTrabajoArrayToMap(DEFAULT_JORNADAS_TRABAJO));
  const [loadingJornadas, setLoadingJornadas] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeJornadasTrabajo(({ jornadas: catalogo, jornadasMap: map }) => {
      setJornadas(catalogo);
      setJornadasMap(map);
      setLoadingJornadas(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    jornadas,
    jornadasMap,
    loadingJornadas,
    getJornadaTrabajoLabel: (jornada) => getJornadaTrabajoLabel(jornada, jornadasMap),
    getJornadaTrabajoResumen: (jornada) => {
      const record = jornadasMap?.[jornada] || jornada;
      return formatJornadaTrabajoResumen(record);
    },
    calcularHorasJornadaTrabajo,
  };
};

export default useJornadasTrabajo;
