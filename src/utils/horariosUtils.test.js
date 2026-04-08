import {
  convertirA24h,
  calcularHorasTotales,
  calcularHorasExcedentes,
  encontrarPracticantesDisponibles
} from './horariosUtils';
import { DEFAULT_TIPOS_CONTRATO, setTiposContratoCatalog } from './tiposContrato';

const TIPOS_MULTIRANGO = [
  {
    key: 'operativo',
    label: 'Operativo',
    horasMinimas: 36,
    horasMaximas: 48,
    rangosHoras: [{ min: 36, max: 42 }, { min: 48, max: 48 }],
    aplicaHoras: true,
    orden: 1,
    editable: false,
  },
  {
    key: 'confianza',
    label: 'Confianza',
    horasMinimas: 72,
    horasMaximas: 72,
    rangosHoras: [{ min: 72, max: 72 }],
    aplicaHoras: true,
    orden: 2,
    editable: false,
  },
];

beforeEach(() => {
  setTiposContratoCatalog(TIPOS_MULTIRANGO);
});

afterEach(() => {
  setTiposContratoCatalog(DEFAULT_TIPOS_CONTRATO);
});

describe('horariosUtils', () => {
  it('convierte hora string a objeto 24h', () => {
    expect(convertirA24h('08:30')).toEqual({ hora: 8, minutos: 30 });
  });

  it('calcula horas totales en semana actual sin recorte', () => {
    const semana = new Date('2026-03-09T00:00:00.000Z');
    const horarios = {
      u1: {
        lunes: { tipo: 'normal', horaInicio: '08:00', horaFin: '17:00' },
        martes: { tipo: 'descanso' },
        miercoles: { tipo: 'normal', horaInicio: '08:00', horaFin: '12:00' }
      }
    };

    const total = calcularHorasTotales(
      'u1',
      false,
      {},
      horarios,
      semana,
      semana,
      {},
      () => ({ tipoContrato: 'Operativo' }),
      () => 48,
      false
    );

    expect(total).toBe(13);
  });

  it('recorta horas para semana futura usando horas disponibles', () => {
    const horarios = {
      u1: {
        l1: { tipo: 'normal', horaInicio: '08:00', horaFin: '17:00' },
        l2: { tipo: 'normal', horaInicio: '08:00', horaFin: '17:00' },
        l3: { tipo: 'normal', horaInicio: '08:00', horaFin: '17:00' },
        l4: { tipo: 'normal', horaInicio: '08:00', horaFin: '17:00' },
        l5: { tipo: 'normal', horaInicio: '08:00', horaFin: '17:00' }
      }
    };

    const total = calcularHorasTotales(
      'u1',
      false,
      {},
      horarios,
      new Date('2026-03-16T00:00:00.000Z'),
      new Date('2026-03-09T00:00:00.000Z'),
      { u1: 20 },
      () => ({ tipoContrato: 'Operativo' }),
      () => 48,
      false
    );

    expect(total).toBe(40);
  });

  it('calcula horas excedentes sobre maximo permitido', () => {
    const horarios = {
      u1: {
        l1: { tipo: 'normal', horaInicio: '08:00', horaFin: '18:00' },
        l2: { tipo: 'normal', horaInicio: '08:00', horaFin: '18:00' },
        l3: { tipo: 'normal', horaInicio: '08:00', horaFin: '18:00' },
        l4: { tipo: 'normal', horaInicio: '08:00', horaFin: '18:00' },
        l5: { tipo: 'normal', horaInicio: '08:00', horaFin: '18:00' }
      }
    };

    const excedente = calcularHorasExcedentes(
      'u1',
      false,
      {},
      horarios,
      () => ({ tipoContrato: 'Operativo' }),
      () => 48
    );

    expect(excedente).toBe(2);
  });

  it('calcula exceso en huecos entre rangos permitidos', () => {
    const horarios = {
      u1: {
        l1: { tipo: 'normal', horaInicio: '08:00', horaFin: '17:00' },
        l2: { tipo: 'normal', horaInicio: '08:00', horaFin: '17:00' },
        l3: { tipo: 'normal', horaInicio: '08:00', horaFin: '17:00' },
        l4: { tipo: 'normal', horaInicio: '08:00', horaFin: '17:00' },
        l5: { tipo: 'normal', horaInicio: '08:00', horaFin: '15:00' }
      }
    };

    const excedente = calcularHorasExcedentes(
      'u1',
      false,
      {},
      horarios,
      () => ({ tipoContrato: 'Operativo' }),
      () => 48
    );

    expect(excedente).toBe(1);
  });

  it('no sugiere disponibilidad para horas fuera del rango permitido', () => {
    const usuarios = [
      { id: 'u2', nombre: 'Ana', apellidos: 'A', departamento: 'Ventas', tipoContrato: 'Operativo' },
    ];

    const calcularHorasTotalesFn = () => 43;
    const obtenerHorasMaximas = () => 48;

    const resultado = encontrarPracticantesDisponibles(
      1,
      usuarios,
      calcularHorasTotalesFn,
      obtenerHorasMaximas,
      'Ventas',
      'u1'
    );

    expect(resultado).toHaveLength(0);
  });

  it('sugiere primero companeros y luego practicantes con horas suficientes', () => {
    const usuarios = [
      { id: 'u2', nombre: 'Ana', apellidos: 'A', departamento: 'Ventas', tipoContrato: 'Operativo' },
      {
        id: 'u3',
        nombre: 'Pablo',
        apellidos: 'P',
        departamento: 'Practicantes/Crosstraining',
        departamentosAutorizados: ['Ventas'],
        tipoContrato: 'Operativo'
      }
    ];

    const calcularHorasTotalesFn = (id) => (id === 'u2' ? 30 : 20);
    const obtenerHorasMaximas = () => 48;

    const resultado = encontrarPracticantesDisponibles(
      10,
      usuarios,
      calcularHorasTotalesFn,
      obtenerHorasMaximas,
      'Ventas',
      'u1'
    );

    expect(resultado).toHaveLength(2);
    expect(resultado[0].usuario.id).toBe('u2');
    expect(resultado[1].usuario.id).toBe('u3');
  });
});
