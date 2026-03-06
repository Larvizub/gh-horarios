import { useEffect, useState } from 'react';
import { getTipoLabel } from '../utils/tiposHorario';
import { subscribeTiposHorario } from '../services/tiposHorarioService';
import { DEFAULT_TIPOS_HORARIO, tiposArrayToMap } from '../utils/tiposHorario';

export const useTiposHorario = () => {
  const [tipos, setTipos] = useState(DEFAULT_TIPOS_HORARIO);
  const [tiposMap, setTiposMap] = useState(tiposArrayToMap(DEFAULT_TIPOS_HORARIO));
  const [loadingTipos, setLoadingTipos] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeTiposHorario(({ tipos: tiposCatalogo, tiposMap: map }) => {
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
    getTipoLabel: (tipo) => getTipoLabel(tipo, tiposMap)
  };
};

export default useTiposHorario;
