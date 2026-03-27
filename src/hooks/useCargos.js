import { useEffect, useMemo, useRef, useState } from 'react';
import { get, ref } from 'firebase/database';
import { database } from '../firebase/config';
import { buildDefaultCargosCatalog, resolveCargoRecord, cargosToLabels, mergeCargosCatalog, normalizeCargoDepartamentoId } from '../utils/cargos';
import { subscribeCargosCatalogo } from '../services/cargosService';
import { sanitizeDepartamentoKey } from '../utils/departamentos';

export const useCargos = () => {
  const [cargos, setCargos] = useState(buildDefaultCargosCatalog());
  const [loadingCargos, setLoadingCargos] = useState(true);
  const cargosFromUsuariosRef = useRef([]);

  const mergeCargos = (catalogo = [], cargosUsuarios = []) => {
    const merged = [...catalogo];
    const existingIds = new Set(merged.map((cargo) => cargo.id));

    cargosUsuarios.forEach((cargo) => {
      if (existingIds.has(cargo.id)) {
        return;
      }

      existingIds.add(cargo.id);
      merged.push(cargo);
    });

    return merged.sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
  };

  const buildCargosFromUsuarios = (usuariosData = {}) => {
    const cargosVistos = new Map();

    Object.values(usuariosData || {}).forEach((usuario) => {
      const cargoRecord = resolveCargoRecord(usuario?.cargo || '');
      if (!cargoRecord.cargo || cargosVistos.has(cargoRecord.cargoId)) {
        return;
      }

      const departamentoId = normalizeCargoDepartamentoId(sanitizeDepartamentoKey(usuario?.departamento || ''));

      cargosVistos.set(cargoRecord.cargoId, {
        id: cargoRecord.cargoId,
        label: cargoRecord.cargo,
        activo: true,
        editable: false,
        orden: cargosVistos.size + 1,
        departamentoId,
      });
    });

    return Array.from(cargosVistos.values());
  };

  useEffect(() => {
    let active = true;

    const hydrateCargos = async () => {
      try {
        const [catalogSnapshot, usuariosSnapshot] = await Promise.all([
          get(ref(database, 'catalogos/cargos')),
          get(ref(database, 'usuarios')),
        ]);

        const cargosCatalogo = catalogSnapshot.exists() ? catalogSnapshot.val() || {} : {};
        cargosFromUsuariosRef.current = buildCargosFromUsuarios(usuariosSnapshot.exists() ? usuariosSnapshot.val() : {});

        if (active) {
          const remoteCatalogo = mergeCargosCatalog(cargosCatalogo);
          setCargos(mergeCargos(remoteCatalogo, cargosFromUsuariosRef.current));
          setLoadingCargos(false);
        }
      } catch (error) {
        console.error('Error al cargar cargos:', error);
        if (active) {
          setLoadingCargos(false);
        }
      }
    };

    hydrateCargos();

    const unsubscribe = subscribeCargosCatalogo(({ cargos: catalogo }) => {
      setCargos(mergeCargos(catalogo, cargosFromUsuariosRef.current));
      setLoadingCargos(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const cargosActivos = useMemo(() => cargosToLabels(cargos), [cargos]);

  return {
    cargos,
    cargosActivos,
    loadingCargos,
  };
};

export default useCargos;