import { addDays, eachWeekOfInterval, differenceInCalendarDays, endOfMonth, format, getDaysInMonth, getISOWeek, getYear, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { getHorasMaximasTipoContrato } from './tiposContrato';

const DIAS_LABORALES_SEMANA_BASE = 6;
const TIPOS_AJUSTE_META = new Set([
  'feriado',
  'vacaciones',
  'permiso',
  'dia-brigada',
  'beneficio-operaciones',
  'media-cumple',
  'media2-cumple',
  'fuera-oficina',
  'incapacidad-enfermedad',
  'incapacidad-accidente',
]);

const calcularHorasRango = (inicio, fin) => {
  if (!inicio || !fin) return 0;

  const [h1, m1] = String(inicio).split(':').map(Number);
  const [h2, m2] = String(fin).split(':').map(Number);

  if ([h1, m1, h2, m2].some((valor) => Number.isNaN(valor))) {
    return 0;
  }

  if (h1 === h2 && m1 === m2) {
    return 0;
  }

  if (h2 > h1 || (h2 === h1 && m2 > m1)) {
    return (h2 - h1) + ((m2 - m1) / 60);
  }

  return (24 - h1 + h2) + ((m2 - m1) / 60);
};

const calcularHorasTurno = (turno = {}) => {
  if (!turno || !turno.tipo) {
    return 0;
  }

  if (typeof turno.horas === 'number' && Number.isFinite(turno.horas) && turno.horas > 0) {
    return turno.horas;
  }

  if (turno.tipo === 'tele-presencial') {
    return calcularHorasRango(turno.horaInicioTele, turno.horaFinTele) + calcularHorasRango(turno.horaInicioPres, turno.horaFinPres);
  }

  if (turno.tipo === 'horario-dividido') {
    return calcularHorasRango(turno.horaInicioBloque1, turno.horaFinBloque1) + calcularHorasRango(turno.horaInicioBloque2, turno.horaFinBloque2);
  }

  return calcularHorasRango(turno.horaInicio, turno.horaFin);
};

const calcularHorasTurnoMensual = (turno = {}, tiposHorarioMap = {}) => {
  if (!turno || !turno.tipo) {
    return 0;
  }

  const tipoConfig = tiposHorarioMap?.[turno.tipo];
  const esBeneficio = Boolean(tipoConfig?.esBeneficio || turno.esBeneficio);

  if (esBeneficio) {
    const horasTurno = Number(turno.horas);
    const horasBeneficio = Number.isFinite(horasTurno) && horasTurno > 0
      ? horasTurno
      : Number(tipoConfig?.horasCredito ?? 0);
    return Number.isFinite(horasBeneficio) && horasBeneficio > 0 ? horasBeneficio : 0;
  }

  return calcularHorasTurno(turno);
};

export const obtenerClaveSemanaMes = (fecha) => {
  return `${getYear(fecha)}-${getISOWeek(fecha)}`;
};

export const obtenerSemanasDelMes = (fechaBase = new Date()) => {
  return eachWeekOfInterval(
    {
      start: startOfMonth(fechaBase),
      end: endOfMonth(fechaBase),
    },
    { weekStartsOn: 1 }
  ).map((weekStart) => ({
    weekStart,
    weekKey: obtenerClaveSemanaMes(weekStart),
  }));
};

export const calcularResumenMensualHoras = ({
  tipoContrato,
  horariosPorSemana = {},
  fechaBase = new Date(),
  tiposNoSumaHoras = new Set(),
  tiposHorarioMap = {},
  feriadosPorFecha = new Set(),
}) => {
  const semanasDelMes = obtenerSemanasDelMes(fechaBase);
  const semanaActual = startOfWeek(fechaBase, { weekStartsOn: 1 });
  const totalSemanasMes = semanasDelMes.length;
  const diasMes = getDaysInMonth(fechaBase);
  const diasRestantesMes = Math.max(differenceInCalendarDays(endOfMonth(fechaBase), fechaBase), 0);
  const horasMaximasSemana = getHorasMaximasTipoContrato(tipoContrato);
  const sinLimite = !Number.isFinite(horasMaximasSemana);

  let horasPlanificadasMes = 0;
  let horasTrabajadasMes = 0;
  let horasBeneficioMes = 0;
  let horasHastaHoy = 0;
  let horasTrabajadasHastaHoy = 0;
  let horasBeneficioHastaHoy = 0;
  let diasNoLaborablesMes = 0;
  const feriadosActivos = feriadosPorFecha instanceof Set
    ? feriadosPorFecha
    : new Set(Array.isArray(feriadosPorFecha) ? feriadosPorFecha.filter(Boolean) : []);

  const detalleSemanal = semanasDelMes.map(({ weekStart, weekKey }) => {
    const horariosSemana = horariosPorSemana?.[weekKey] || {};
    let horasSemana = 0;
    let horasSemanaTrabajadas = 0;
    let horasSemanaBeneficio = 0;
    let horasSemanaHastaHoy = 0;
    let horasSemanaTrabajadasHastaHoy = 0;
    let horasSemanaBeneficioHastaHoy = 0;

    for (let index = 0; index < 7; index += 1) {
      const diaKey = `dia${index + 1}`;
      const turno = horariosSemana[diaKey];
      if (!turno || tiposNoSumaHoras.has(turno.tipo)) {
        continue;
      }

      const fechaDia = addDays(weekStart, index);
      const horasTurno = calcularHorasTurnoMensual(turno, tiposHorarioMap);
      const tipoConfig = tiposHorarioMap?.[turno.tipo];
      const esBeneficio = Boolean(tipoConfig?.esBeneficio || turno.esBeneficio);
      const fechaKey = format(fechaDia, 'yyyy-MM-dd');
      const esFeriadoConfigurado = fechaDia.getDay() !== 0 && feriadosActivos.has(fechaKey);

      horasSemana += horasTurno;
      if (esBeneficio) {
        horasSemanaBeneficio += horasTurno;
      } else {
        horasSemanaTrabajadas += horasTurno;
      }
      if (isSameMonth(fechaDia, fechaBase)) {
        if (TIPOS_AJUSTE_META.has(turno.tipo) || esFeriadoConfigurado) {
          diasNoLaborablesMes += 1;
        }

        horasPlanificadasMes += horasTurno;
        if (esBeneficio) {
          horasBeneficioMes += horasTurno;
        } else {
          horasTrabajadasMes += horasTurno;
        }
      }

      if (fechaDia <= fechaBase && isSameMonth(fechaDia, fechaBase)) {
        horasSemanaHastaHoy += horasTurno;
        horasHastaHoy += horasTurno;
        if (esBeneficio) {
          horasSemanaBeneficioHastaHoy += horasTurno;
          horasBeneficioHastaHoy += horasTurno;
        } else {
          horasSemanaTrabajadasHastaHoy += horasTurno;
          horasTrabajadasHastaHoy += horasTurno;
        }
      }
    }

    return {
      weekKey,
      weekStart,
      horasSemana: Number(horasSemana.toFixed(1)),
      horasSemanaTrabajadas: Number(horasSemanaTrabajadas.toFixed(1)),
      horasSemanaBeneficio: Number(horasSemanaBeneficio.toFixed(1)),
      horasSemanaHastaHoy: Number(horasSemanaHastaHoy.toFixed(1)),
      horasSemanaTrabajadasHastaHoy: Number(horasSemanaTrabajadasHastaHoy.toFixed(1)),
      horasSemanaBeneficioHastaHoy: Number(horasSemanaBeneficioHastaHoy.toFixed(1)),
    };
  });

  const metaMensual = sinLimite ? null : Number(((horasMaximasSemana * diasMes) / 7).toFixed(1));
  const ajusteNoLaborablesMes = sinLimite || metaMensual === null
    ? 0
    : Number(((horasMaximasSemana / DIAS_LABORALES_SEMANA_BASE) * diasNoLaborablesMes).toFixed(1));
  const metaMensualAjustada = sinLimite || metaMensual === null
    ? null
    : Number(Math.max(metaMensual - ajusteNoLaborablesMes, 0).toFixed(1));
  const saldoMensual = sinLimite || metaMensualAjustada === null ? null : Number((metaMensualAjustada - horasPlanificadasMes).toFixed(1));
  const excesoMensual = sinLimite || metaMensualAjustada === null ? 0 : Math.max(Number((horasPlanificadasMes - metaMensualAjustada).toFixed(1)), 0);
  const semanasRestantes = semanasDelMes.filter(({ weekStart }) => weekStart >= semanaActual).length;
  const reduccionSugeridaSemanal = excesoMensual > 0 ? Number((excesoMensual / Math.max(diasRestantesMes / 7, 1)).toFixed(1)) : 0;
  const promedioSemanalPlanificado = totalSemanasMes > 0 ? Number((horasPlanificadasMes / totalSemanasMes).toFixed(1)) : 0;

  return {
    sinLimite,
    tipoContrato,
    horasMaximasSemana: sinLimite ? null : horasMaximasSemana,
    totalSemanasMes,
    diasMes,
    diasRestantesMes,
    diasNoLaborablesMes,
    ajusteNoLaborablesMes,
    horasTrabajadasMes: Number(horasTrabajadasMes.toFixed(1)),
    horasBeneficioMes: Number(horasBeneficioMes.toFixed(1)),
    horasPlanificadasMes: Number(horasPlanificadasMes.toFixed(1)),
    horasHastaHoy: Number(horasHastaHoy.toFixed(1)),
    horasTrabajadasHastaHoy: Number(horasTrabajadasHastaHoy.toFixed(1)),
    horasBeneficioHastaHoy: Number(horasBeneficioHastaHoy.toFixed(1)),
    metaMensual: metaMensualAjustada,
    metaMensualBase: metaMensual,
    saldoMensual,
    excesoMensual,
    semanasRestantes,
    reduccionSugeridaSemanal,
    promedioSemanalPlanificado,
    detalleSemanal,
  };
};
