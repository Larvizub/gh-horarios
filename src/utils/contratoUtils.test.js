import {
  TIPOS_CONTRATO,
  ROLES,
  obtenerHorasMaximas,
  excedeHorasMaximas,
  puedeModificarHorarios,
  puedeVerHorarios,
  obtenerColorRol
} from './contratoUtils';

describe('contratoUtils', () => {
  it('retorna horas maximas por tipo de contrato y fallback', () => {
    expect(obtenerHorasMaximas(TIPOS_CONTRATO.OPERATIVO)).toBe(48);
    expect(obtenerHorasMaximas(TIPOS_CONTRATO.CONFIANZA)).toBe(72);
    expect(obtenerHorasMaximas('NoExiste')).toBe(48);
  });

  it('valida cuando excede horas maximas', () => {
    expect(excedeHorasMaximas(49, TIPOS_CONTRATO.OPERATIVO)).toBe(true);
    expect(excedeHorasMaximas(48, TIPOS_CONTRATO.OPERATIVO)).toBe(false);
  });

  it('permite modificar horarios segun rol y departamento', () => {
    const admin = { rol: ROLES.ADMINISTRADOR, departamento: 'A' };
    const mod = { rol: ROLES.MODIFICADOR, departamento: 'A' };
    const visor = { rol: ROLES.VISOR, departamento: 'A' };
    const objetivoMismoDep = { departamento: 'A' };
    const objetivoOtroDep = { departamento: 'B' };

    expect(puedeModificarHorarios(admin, objetivoOtroDep)).toBe(true);
    expect(puedeModificarHorarios(mod, objetivoMismoDep)).toBe(true);
    expect(puedeModificarHorarios(mod, objetivoOtroDep)).toBe(false);
    expect(puedeModificarHorarios(visor, objetivoMismoDep)).toBe(false);
  });

  it('permite ver horarios para visor/modificador solo en su departamento', () => {
    const visor = { rol: ROLES.VISOR, departamento: 'A' };
    const objetivoMismoDep = { departamento: 'A' };
    const objetivoOtroDep = { departamento: 'B' };

    expect(puedeVerHorarios(visor, objetivoMismoDep)).toBe(true);
    expect(puedeVerHorarios(visor, objetivoOtroDep)).toBe(false);
  });

  it('retorna color de rol esperado', () => {
    expect(obtenerColorRol(ROLES.ADMINISTRADOR)).toBe('error');
    expect(obtenerColorRol('Otro')).toBe('default');
  });
});
