import { format } from 'date-fns';

const FERIADO_FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_FERIADOS = [];

export const sanitizeFeriadoFecha = (value = '') => {
  const fecha = String(value).trim();
  return FERIADO_FECHA_REGEX.test(fecha) ? fecha : '';
};

export const buildFeriadoFallbackLabel = (fecha) => {
  if (!fecha) {
    return '';
  }

  const [year, month, day] = String(fecha).split('-');
  if (!year || !month || !day) {
    return fecha;
  }

  return `${day}/${month}/${year}`;
};

export const normalizeFeriado = (fechaKey, raw = {}, index = 0) => {
  const fecha = sanitizeFeriadoFecha(raw.fecha || fechaKey);
  if (!fecha) {
    return null;
  }

  return {
    fecha,
    label: raw.label || buildFeriadoFallbackLabel(fecha),
    observacion: raw.observacion || '',
    activo: raw.activo !== false,
    orden: Number.isFinite(raw.orden) ? raw.orden : index + 1,
    editable: raw.editable !== false,
  };
};

export const mergeFeriadosCatalog = (remoteFeriados = {}) => {
  return Object.entries(remoteFeriados)
    .map(([fechaKey, raw], index) => normalizeFeriado(fechaKey, raw, index))
    .filter(Boolean)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
};

export const feriadosArrayToMap = (feriados = []) => {
  return feriados.reduce((accumulator, feriado) => {
    if (feriado?.fecha) {
      accumulator[feriado.fecha] = feriado;
    }
    return accumulator;
  }, {});
};

export const feriadosArrayToFirebaseObject = (feriados = []) => {
  return feriados.reduce((accumulator, feriado) => {
    if (!feriado?.fecha) {
      return accumulator;
    }

    accumulator[feriado.fecha] = {
      fecha: feriado.fecha,
      label: feriado.label || buildFeriadoFallbackLabel(feriado.fecha),
      observacion: feriado.observacion || '',
      activo: feriado.activo !== false,
      orden: feriado.orden,
      editable: feriado.editable !== false,
    };

    return accumulator;
  }, {});
};

export const feriadosArrayToDateSet = (feriados = []) => {
  return new Set(
    feriados
      .filter((feriado) => feriado?.activo !== false && Boolean(feriado?.fecha))
      .map((feriado) => feriado.fecha)
  );
};

export const cambiarAnioFeriado = (fecha, anioDestino) => {
  const fechaNormalizada = sanitizeFeriadoFecha(fecha);
  if (!fechaNormalizada) {
    return '';
  }

  const [, month, day] = fechaNormalizada.split('-');
  return `${String(anioDestino).padStart(4, '0')}-${month}-${day}`;
};

export const formatFeriadoFecha = (fecha) => {
  const fechaNormalizada = sanitizeFeriadoFecha(fecha);
  if (!fechaNormalizada) {
    return '';
  }

  const [year, month, day] = fechaNormalizada.split('-');
  return format(new Date(Number(year), Number(month) - 1, Number(day)), 'dd/MM/yyyy');
};
