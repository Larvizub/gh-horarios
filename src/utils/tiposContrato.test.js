import { describe, expect, it } from 'vitest';
import { esContratoOperativo, getTipoContratoColorPalette } from './tiposContrato';

describe('tiposContrato', () => {
  it('usa verde para el tipo confianza', () => {
    const palette = getTipoContratoColorPalette('confianza');

    expect(palette.main).toBe('#16a34a');
    expect(palette.dark).toBe('#15803d');
  });

  it('identifica solo operativo como contrato operativo', () => {
    expect(esContratoOperativo('Operativo')).toBe(true);
    expect(esContratoOperativo('Confianza')).toBe(false);
    expect(esContratoOperativo('Pasante')).toBe(false);
  });
});