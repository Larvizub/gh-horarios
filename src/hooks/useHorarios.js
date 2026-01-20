import { useState, useEffect, useCallback } from 'react';
import { subscribeHorariosSemana, cargarHorariosPorSemana, guardarHorariosSemana } from '../services/firebaseHorarios';
import { toast } from 'react-toastify';

/**
 * Hook para gestionar la carga, edición, guardado y eliminación de horarios.
 * @param {Object} params
 * @param {Array} params.usuarios
 * @param {Object} params.currentUser
 * @param {Date} params.semanaSeleccionada
 * @param {Date} params.semanaActual
 * @param {Function} params.obtenerClaveSemana
 * @param {Function} params.mostrarModal  // función de hook useModalConfirm
 */
export function useHorarios({ usuarios, currentUser, semanaSeleccionada, semanaActual, obtenerClaveSemana, mostrarModal }) {
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState({});
  const [horariosEditados, setHorariosEditados] = useState({});
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const key = obtenerClaveSemana(semanaSeleccionada);
    setLoading(true);

    // Subscribir en tiempo real
    const unsubscribe = subscribeHorariosSemana(key, (data) => {
      setHorarios(data || {});
      setHorariosEditados({});
      setLoading(false);
    });

    // Fallback: si no hay respuesta en 3s, intentar carga puntual
    const fallback = setTimeout(async () => {
      try {
        const data = await cargarHorariosPorSemana(semanaSeleccionada, key);
        setHorarios(data || {});
      } catch (error) {
        console.error('Error al cargar horarios (fallback):', error);
        toast.error('Error al cargar horarios: ' + error.message);
      } finally {
        setLoading(false);
      }
    }, 3000);

    return () => {
      clearTimeout(fallback);
      if (unsubscribe) {
        try { unsubscribe(); } catch (e) {}
      }
    };
  }, [currentUser, semanaSeleccionada, obtenerClaveSemana]);

  const guardar = useCallback(async () => {
    try {
      setLoading(true);
      const clave = obtenerClaveSemana(semanaSeleccionada);
      // Lógica de permisos y filtro según currentUser y usuarios...
      await guardarHorariosSemana(clave, horariosEditados);
      // No sobrescribir el estado local completo: dejamos que el listener sincronice los cambios.
      setEditando(false);
      mostrarModal({ tipo: 'success', titulo: '✅ Horarios Guardados', mensaje: 'Guardado exitoso.', soloInfo: true });
    } catch (error) {
      console.error('Error al guardar horarios:', error);
      mostrarModal({ tipo: 'error', titulo: '❌ Error', mensaje: error.message, soloInfo: true });
    } finally {
      setLoading(false);
    }
  }, [horariosEditados, semanaSeleccionada, obtenerClaveSemana, mostrarModal]);

  const eliminar = useCallback(async (/* eliminacionSeleccionada */) => {
    // TODO: implementar eliminación según tipo...
  }, []);

  const recalcular = useCallback(async () => {
    // TODO: implementar recalculo de horas extras...
  }, []);

  return {
    loading,
    horarios,
    horariosEditados,
    editando,
    setEditando,
    setHorariosEditados,
    guardar,
    eliminar,
    recalcular
  };
}
