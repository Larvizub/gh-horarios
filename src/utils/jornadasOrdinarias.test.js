import { describe, expect, it } from 'vitest';
import { obtenerColorJornadaOrdinaria, obtenerJornadaOrdinariaDetectada, obtenerResumenJornadaLegal, sumarHorasAHora } from './jornadasOrdinarias';

describe('jornadasOrdinarias', () => {
  it('sugiere 22:00 cuando la entrada es 15:00', () => {
    const resumen = obtenerResumenJornadaLegal('15:00');

    expect(resumen?.key).toBe('mixta');
    expect(resumen?.limiteDiario).toBe(7);
    expect(resumen?.salidaSugerida).toBe('22:00');
  });

  it('sugiere 16:00 para una entrada diurna a las 08:00', () => {
    const resumen = obtenerResumenJornadaLegal('08:00');

    expect(resumen?.key).toBe('diurna');
    expect(resumen?.limiteDiario).toBe(8);
    expect(resumen?.salidaSugerida).toBe('16:00');
  });

  it('suma horas cruzando medianoche', () => {
    expect(sumarHorasAHora('22:00', 7)).toBe('05:00');
  });

  it('expone colores de jornada por tipo', () => {
    expect(obtenerColorJornadaOrdinaria('diurna')).toBe('#86efac');
    expect(obtenerColorJornadaOrdinaria('nocturna')).toBe('#fdba74');
    expect(obtenerColorJornadaOrdinaria('mixta')).toBe('#facc15');
  });

  it('solo detecta jornada ordinaria para contratos operativos', () => {
    const horario = {
      tipo: 'personalizado',
      horaInicio: '08:00',
      horaFin: '16:00',
    };

    expect(obtenerJornadaOrdinariaDetectada(horario, {}, 'Operativo')?.key).toBe('diurna');
    expect(obtenerJornadaOrdinariaDetectada(horario, {}, 'Confianza')).toBeNull();
    expect(obtenerJornadaOrdinariaDetectada(horario, {}, 'Pasante')).toBeNull();
  });
});
