import { describe, expect, it } from 'vitest';
import { calcularResumenMensualHoras, obtenerSemanasDelMes } from './controlHorasMensuales';

describe('calcularResumenMensualHoras', () => {
  it('calcula la meta mensual usando los dias reales del mes', () => {
    const resumen = calcularResumenMensualHoras({
      tipoContrato: 'Operativo',
      fechaBase: new Date('2026-04-09T12:00:00'),
      horariosPorSemana: {
        '2026-14': {
          dia1: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
          dia2: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
          dia3: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
          dia4: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
          dia5: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
          dia6: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
          dia7: { tipo: 'descanso', horas: 0 },
        },
      },
      tiposNoSumaHoras: new Set(['descanso']),
    });

    expect(resumen.sinLimite).toBe(false);
    expect(resumen.horasPlanificadasMes).toBeGreaterThan(0);
    expect(resumen.diasMes).toBe(30);
    expect(resumen.metaMensual).toBeCloseTo(205.7, 1);
    expect(resumen.saldoMensual).toBeCloseTo(173.7, 1);
    expect(typeof resumen.reduccionSugeridaSemanal).toBe('number');
  });

  it('incluye horas de beneficio configuradas en el resumen mensual', () => {
    const resumen = calcularResumenMensualHoras({
      tipoContrato: 'Operativo',
      fechaBase: new Date('2026-04-09T12:00:00'),
      horariosPorSemana: {
        '2026-14': {
          dia3: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
          dia4: { tipo: 'beneficio-operaciones', horas: 0 },
          dia5: { tipo: 'descanso', horas: 0 },
          dia6: { tipo: 'descanso', horas: 0 },
          dia7: { tipo: 'descanso', horas: 0 },
        },
      },
      tiposNoSumaHoras: new Set(['descanso']),
      tiposHorarioMap: {
        'beneficio-operaciones': {
          esBeneficio: true,
          horasCredito: 4,
        },
      },
    });

    expect(resumen.horasTrabajadasMes).toBe(8);
    expect(resumen.horasBeneficioMes).toBe(4);
    expect(resumen.horasPlanificadasMes).toBe(12);
    expect(resumen.saldoMensual).toBeCloseTo(resumen.metaMensual - 12, 1);
  });

  it('sugiere compensacion cuando el mes ya excede la meta estimada', () => {
    const fechaBase = new Date('2026-04-09T12:00:00');
    const plantillaBase = {
      dia1: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia2: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia3: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia4: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia5: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia6: { tipo: 'personalizado', horaInicio: '08:00', horaFin: '16:00', horas: 8 },
      dia7: { tipo: 'descanso', horas: 0 },
    };

    const semanasDelMes = obtenerSemanasDelMes(fechaBase);
    const horariosPorSemana = Object.fromEntries(
      semanasDelMes.map(({ weekKey }) => [weekKey, plantillaBase])
    );

    const resumen = calcularResumenMensualHoras({
      tipoContrato: 'Operativo',
      fechaBase,
      horariosPorSemana,
      tiposNoSumaHoras: new Set(['descanso']),
      feriadosPorFecha: new Set(['2026-04-09', '2026-04-10']),
    });

    expect(resumen.excesoMensual).toBeGreaterThan(0);
    expect(resumen.diasNoLaborablesMes).toBe(2);
    expect(resumen.ajusteNoLaborablesMes).toBeCloseTo(16, 1);
    expect(resumen.metaMensual).toBeCloseTo(189.7, 1);
    expect(resumen.reduccionSugeridaSemanal).toBeGreaterThan(0);
  });
});
