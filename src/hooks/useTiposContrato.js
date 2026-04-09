import { useEffect, useState } from 'react';
import {
  DEFAULT_TIPOS_CONTRATO,
  getHorasMaximasTipoContrato,
  getTipoContratoLabel,
  tiposContratoArrayToMap,
} from '../utils/tiposContrato';
import { subscribeTiposContrato } from '../services/tiposContratoService';

export const useTiposContrato = () => {
  const [tipos, setTipos] = useState(DEFAULT_TIPOS_CONTRATO);
  const [tiposMap, setTiposMap] = useState(tiposContratoArrayToMap(DEFAULT_TIPOS_CONTRATO));
  const [loadingTipos, setLoadingTipos] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeTiposContrato(({ tipos: tiposCatalogo, tiposMap: map }) => {
      setTipos(tiposCatalogo);
      setTiposMap(map);
      setLoadingTipos(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    tipos,
    tiposMap,
    loadingTipos,
    getTipoContratoLabel: (tipo) => getTipoContratoLabel(tipo, tiposMap),
    getHorasMaximasTipoContrato: (tipo) => getHorasMaximasTipoContrato(tipo, tiposMap),
  };
};

export default useTiposContrato;
