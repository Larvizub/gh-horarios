import { useState, useEffect, useCallback } from 'react';
import { ref, get, set } from 'firebase/database';
import { database } from '../firebase/config';
import { subscribeHorariosSemana } from '../services/firebaseHorarios';
import { toast } from 'react-toastify';
import { cargarHorariosPorSemana, guardarHorariosSemana } from '../services/firebaseHorarios';
import { obtenerHorasMaximas } from '../utils/contratoUtils';
import { NO_SUMAN_HORAS } from '../utils/horariosConstants';

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

  const cargar = useCallback(async () => {
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
        const clave = obtenerClaveSemana(semanaSeleccionada);
        const data = await cargarHorariosPorSemana(semanaSeleccionada, clave);
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
      try { unsubscribe && unsubscribe(); } catch (e) {}
    };
  }, [currentUser, semanaSeleccionada, obtenerClaveSemana]);

  useEffect(() => {
    cargar();
  }, [cargar]);

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

  const eliminar = useCallback(async (eliminacionSeleccionada) => {
    // TODO: implementar eliminación según tipo...
  }, []);

  const recalcular = useCallback(async () => {
    // TODO: implementar recalculo de horas extras...
  }, [horarios, usuarios, semanaSeleccionada, semanaActual, obtenerClaveSemana]);

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
