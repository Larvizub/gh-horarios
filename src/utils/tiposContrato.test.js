import { describe, expect, it } from 'vitest';
import { getTipoContratoColorPalette } from './tiposContrato';

describe('tiposContrato', () => {
  it('usa verde para el tipo confianza', () => {
    const palette = getTipoContratoColorPalette('confianza');

    expect(palette.main).toBe('#16a34a');
    expect(palette.dark).toBe('#15803d');
  });
});