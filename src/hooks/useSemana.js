import { useState, useCallback } from 'react';
import { startOfWeek, addWeeks, subWeeks, getISOWeek, getYear } from 'date-fns';

/**
 * Hook para manejar la semana seleccionada y utilidades de semana.
 */
export function useSemana() {
  const inicial = startOfWeek(new Date(), { weekStartsOn: 1 });
  const [semanaActual] = useState(inicial);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(inicial);

  const avanzarSemana = useCallback(() => {
    setSemanaSeleccionada(prev => addWeeks(prev, 1));
  }, []);

  const retrocederSemana = useCallback(() => {
    setSemanaSeleccionada(prev => subWeeks(prev, 1));
  }, []);

  const obtenerClaveSemana = useCallback(fecha => {
    const inicio = startOfWeek(fecha, { weekStartsOn: 1 });
    const year = getYear(inicio);
    const week = getISOWeek(inicio);
    return `${year}-${week}`;
  }, []);

  return {
    semanaActual,
    semanaSeleccionada,
    setSemanaSeleccionada,
    avanzarSemana,
    retrocederSemana,
    obtenerClaveSemana
  };
}
