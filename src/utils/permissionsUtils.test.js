import { ROLES } from './contratoUtils';
import {
  puedeEditarHorarios,
  puedeEliminarHorarios,
  puedeModificarHorarios
} from './permissionsUtils';

describe('permissionsUtils', () => {
  it('edicion y eliminacion dependen del rol', () => {
    expect(puedeEditarHorarios({ rol: ROLES.ADMINISTRADOR })).toBe(true);
    expect(puedeEditarHorarios({ rol: ROLES.MODIFICADOR })).toBe(true);
    expect(puedeEditarHorarios({ rol: ROLES.VISOR })).toBe(false);

    expect(puedeEliminarHorarios({ rol: ROLES.ADMINISTRADOR })).toBe(true);
    expect(puedeEliminarHorarios({ rol: ROLES.VISOR })).toBe(false);
  });

  it('modificacion entre usuarios respeta reglas de rol y departamento', () => {
    const admin = { id: '1', rol: ROLES.ADMINISTRADOR, departamento: 'A' };
    const mod = { id: '2', rol: ROLES.MODIFICADOR, departamento: 'A' };
    const objetivoMismoDep = { id: '3', rol: ROLES.VISOR, departamento: 'A' };
    const objetivoOtroDep = { id: '4', rol: ROLES.VISOR, departamento: 'B' };

    expect(puedeModificarHorarios(admin, objetivoOtroDep)).toBe(true);
    expect(puedeModificarHorarios(mod, objetivoMismoDep)).toBe(true);
    expect(puedeModificarHorarios(mod, objetivoOtroDep)).toBe(false);
  });
});
