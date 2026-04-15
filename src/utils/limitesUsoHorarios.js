import { addDays, eachWeekOfInterval, endOfMonth, endOfYear, format, getISOWeek, getYear, isValid, startOfMonth, startOfWeek, startOfYear, setISOWeek, setISOWeekYear } from 'date-fns';
import { VARIANTES_MEDIA_JORNADA_COMPARTIDA } from './tiposHorario';

export const obtenerFechaTurnoDesdeSemana = (semanaSeleccionada, diaKey) => {
  if (!semanaSeleccionada || !diaKey) {
    return null;
  }

  const diaIndex = Number(String(diaKey).replace('dia', '')) - 1;
  if (!Number.isFinite(diaIndex) || diaIndex < 0 || diaIndex > 6) {
    return null;
  }

  return addDays(startOfWeek(semanaSeleccionada, { weekStartsOn: 1 }), diaIndex);
};

export const obtenerRangoPeriodoUso = (fechaBase, periodo) => {
  if (!fechaBase || !isValid(fechaBase)) {
    return null;
  }

  if (periodo === 'mes') {
    return {
      inicio: startOfMonth(fechaBase),
      fin: endOfMonth(fechaBase),
      etiqueta: format(fechaBase, 'yyyy-MM'),
    };
  }

  if (periodo === 'anio') {
    return {
      inicio: startOfYear(fechaBase),
      fin: endOfYear(fechaBase),
      etiqueta: format(fechaBase, 'yyyy'),
    };
  }

  return null;
};

export const obtenerSemanasDelPeriodoUso = (fechaBase, periodo) => {
  const rango = obtenerRangoPeriodoUso(fechaBase, periodo);
  if (!rango) {
    return [];
  }

  return eachWeekOfInterval(
    { start: rango.inicio, end: rango.fin },
    { weekStartsOn: 1 }
  ).map((weekStart) => `${getYear(weekStart)}-${getISOWeek(weekStart)}`);
};

export const debeValidarLimiteUsoHorario = (tipoConfig = {}) => {
  if (VARIANTES_MEDIA_JORNADA_COMPARTIDA.has(tipoConfig.key)) {
    return true;
  }

  const limiteCantidad = Number(tipoConfig.limiteUsoCantidad ?? 0);
  return Boolean(tipoConfig.limiteUsoPeriodo) && Number.isFinite(limiteCantidad) && limiteCantidad > 0;
};

export const obtenerPeriodosUsoHorario = (tipoConfig = {}) => {
  const periodos = new Set();

  if (VARIANTES_MEDIA_JORNADA_COMPARTIDA.has(tipoConfig.key)) {
    periodos.add('mes');
  }

  if (tipoConfig.limiteUsoPeriodo && Number.isFinite(Number(tipoConfig.limiteUsoCantidad)) && Number(tipoConfig.limiteUsoCantidad) > 0) {
    periodos.add(tipoConfig.limiteUsoPeriodo);
  }

  return Array.from(periodos);
};

const obtenerInicioSemanaDesdeKey = (semanaKey) => {
  const [yearRaw, weekRaw] = String(semanaKey || '').split('-');
  const year = Number(yearRaw);
  const week = Number(weekRaw);

  if (!Number.isFinite(year) || !Number.isFinite(week)) {
    return null;
  }

  const base = new Date(year, 0, 4);
  return startOfWeek(setISOWeek(setISOWeekYear(base, year), week), { weekStartsOn: 1 });
};

export const contarUsosTipoEnHistorial = ({
  historialHorarios = {},
  usuarioId,
  tipo,
  rangoInicio,
  rangoFin,
  fechaExcluirISO = null,
  tiposPermitidos = null,
}) => {
  if (!usuarioId || !tipo || !rangoInicio || !rangoFin) {
    return 0;
  }

  return Object.entries(historialHorarios).reduce((total, [semanaKey, horariosSemana]) => {
    const horariosUsuario = horariosSemana?.[usuarioId];
    if (!horariosUsuario) {
      return total;
    }

    const inicioSemana = obtenerInicioSemanaDesdeKey(semanaKey);
    if (!inicioSemana) {
      return total;
    }

    return total + Object.entries(horariosUsuario).reduce((subtotal, [diaKey, turno]) => {
      if (!turno || (tiposPermitidos ? !tiposPermitidos.has(turno.tipo) : turno.tipo !== tipo)) {
        return subtotal;
      }

      const diaIndex = Number(String(diaKey).replace('dia', '')) - 1;
      if (!Number.isFinite(diaIndex) || diaIndex < 0 || diaIndex > 6) {
        return subtotal;
      }

      const fechaTurno = addDays(inicioSemana, diaIndex);
      const fechaISO = format(fechaTurno, 'yyyy-MM-dd');

      if (fechaTurno < rangoInicio || fechaTurno > rangoFin) {
        return subtotal;
      }

      if (fechaExcluirISO && fechaISO === fechaExcluirISO) {
        return subtotal;
      }

      return subtotal + 1;
    }, 0);
  }, 0);
};

export const validarLimiteUsoHorario = ({
  tipoConfig = {},
  usuario,
  fechaTurno,
  historialHorarios = {},
  horarioExistente = null,
}) => {
  const periodo = tipoConfig.limiteUsoPeriodo || null;
  const limiteCantidad = Number(tipoConfig.limiteUsoCantidad ?? 0);
  const esFamiliaMediaJornada = VARIANTES_MEDIA_JORNADA_COMPARTIDA.has(tipoConfig.key);

  if (!esFamiliaMediaJornada && (!periodo || !Number.isFinite(limiteCantidad) || limiteCantidad <= 0)) {
    return { permitido: true, usosPrevios: 0 };
  }

  if (!fechaTurno || !isValid(fechaTurno)) {
    return {
      permitido: false,
      titulo: 'Fecha inválida',
      mensaje: 'No se pudo validar la fecha del turno.',
    };
  }

  if (tipoConfig.requiereMesNacimiento) {
    const fechaNacimiento = usuario?.fechaNacimiento ? new Date(usuario.fechaNacimiento) : null;
    if (!fechaNacimiento || !isValid(fechaNacimiento)) {
      return {
        permitido: false,
        titulo: 'Fecha de nacimiento obligatoria',
        mensaje: `El usuario no tiene fecha de nacimiento registrada. Debes agregarla para usar ${tipoConfig.label || 'este beneficio'}.`,
      };
    }

    if (fechaNacimiento.getMonth() !== fechaTurno.getMonth()) {
      return {
        permitido: false,
        titulo: 'Mes de cumpleaños no válido',
        mensaje: `El beneficio ${tipoConfig.label || 'cumpleaños'} solo puede usarse en el mes de nacimiento del usuario.`,
      };
    }
  }

  const fechaExcluirISO = horarioExistente ? format(fechaTurno, 'yyyy-MM-dd') : null;

  if (esFamiliaMediaJornada) {
    const rangoFamilia = obtenerRangoPeriodoUso(fechaTurno, 'mes');
    if (!rangoFamilia) {
      return {
        permitido: false,
        titulo: 'Periodo inválido',
        mensaje: 'No se pudo determinar el periodo de uso del beneficio.',
      };
    }

    const usosFamilia = contarUsosTipoEnHistorial({
      historialHorarios,
      usuarioId: usuario?.id,
      tipo: tipoConfig.key,
      rangoInicio: rangoFamilia.inicio,
      rangoFin: rangoFamilia.fin,
      fechaExcluirISO,
      tiposPermitidos: VARIANTES_MEDIA_JORNADA_COMPARTIDA,
    });

    if (usosFamilia >= 1) {
      return {
        permitido: false,
        titulo: 'Límite de grupo superado',
        mensaje: 'Solo puedes usar una vez por mes cualquiera de las variantes de Media Jornada Libre.',
        usosPrevios: usosFamilia,
      };
    }
  }

  if (!periodo || !Number.isFinite(limiteCantidad) || limiteCantidad <= 0) {
    return { permitido: true, usosPrevios: 0 };
  }

  const rango = obtenerRangoPeriodoUso(fechaTurno, periodo);
  if (!rango) {
    return {
      permitido: false,
      titulo: 'Periodo inválido',
      mensaje: 'No se pudo determinar el periodo de uso del beneficio.',
    };
  }

  const usosPrevios = contarUsosTipoEnHistorial({
    historialHorarios,
    usuarioId: usuario?.id,
    tipo: tipoConfig.key,
    rangoInicio: rango.inicio,
    rangoFin: rango.fin,
    fechaExcluirISO,
  });

  if (usosPrevios >= limiteCantidad) {
    const periodoTexto = periodo === 'mes' ? 'mes' : 'año';
    return {
      permitido: false,
      titulo: 'Límite de uso superado',
      mensaje: `${tipoConfig.label || 'Este beneficio'} solo se puede usar ${limiteCantidad} vez${limiteCantidad === 1 ? '' : 'es'} por ${periodoTexto}.`,
      usosPrevios,
    };
  }

  return { permitido: true, usosPrevios };
};