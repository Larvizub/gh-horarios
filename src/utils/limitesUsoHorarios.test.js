import { describe, expect, it } from 'vitest';
import { contarUsosTipoEnHistorial, obtenerSemanasDelPeriodoUso, validarLimiteUsoHorario } from './limitesUsoHorarios';

describe('limitesUsoHorarios', () => {
  it('cuenta usos excluyendo el turno actual', () => {
    const historial = {
      '2026-15': {
        u1: {
          dia1: { tipo: 'beneficio-operaciones' },
          dia2: { tipo: 'beneficio-operaciones' },
        }
      }
    };

    const usos = contarUsosTipoEnHistorial({
      historialHorarios: historial,
      usuarioId: 'u1',
      tipo: 'beneficio-operaciones',
      rangoInicio: new Date('2026-04-01T00:00:00'),
      rangoFin: new Date('2026-04-30T23:59:59'),
      fechaExcluirISO: '2026-04-06',
    });

    expect(usos).toBe(1);
  });

  it('valida el mes de cumpleaños y el limite anual', () => {
    const resultado = validarLimiteUsoHorario({
      tipoConfig: {
        key: 'media-cumple',
        label: 'Media Jornada Libre & Mes de cumpleaños',
        limiteUsoPeriodo: 'anio',
        limiteUsoCantidad: 1,
        requiereMesNacimiento: true,
      },
      usuario: {
        id: 'u1',
        fechaNacimiento: '1990-04-10',
      },
      fechaTurno: new Date('2026-04-20T12:00:00'),
      historialHorarios: {},
      horarioExistente: null,
    });

    expect(resultado.permitido).toBe(true);
  });

  it('rechaza cumpleaños fuera del mes de nacimiento', () => {
    const resultado = validarLimiteUsoHorario({
      tipoConfig: {
        key: 'media-cumple',
        label: 'Media Jornada Libre & Mes de cumpleaños',
        limiteUsoPeriodo: 'anio',
        limiteUsoCantidad: 1,
        requiereMesNacimiento: true,
      },
      usuario: {
        id: 'u1',
        fechaNacimiento: '1990-04-10',
      },
      fechaTurno: new Date('2026-05-20T12:00:00'),
      historialHorarios: {},
      horarioExistente: null,
    });

    expect(resultado.permitido).toBe(false);
  });

  it('bloquea variantes hermanas de media jornada en el mismo mes', () => {
    const resultado = validarLimiteUsoHorario({
      tipoConfig: {
        key: 'media-cumple',
        label: 'Media Jornada Libre & Mes de cumpleaños',
        limiteUsoPeriodo: 'anio',
        limiteUsoCantidad: 1,
        requiereMesNacimiento: true,
      },
      usuario: {
        id: 'u1',
        fechaNacimiento: '1990-04-10',
      },
      fechaTurno: new Date('2026-04-20T12:00:00'),
      historialHorarios: {
        '2026-16': {
          u1: {
            dia3: { tipo: 'tarde-libre' },
          },
        },
      },
      horarioExistente: null,
    });

    expect(resultado.permitido).toBe(false);
  });

  it('genera las semanas del periodo', () => {
    const semanas = obtenerSemanasDelPeriodoUso(new Date('2026-04-10T12:00:00'), 'mes');
    expect(semanas.length).toBeGreaterThan(0);
  });
});