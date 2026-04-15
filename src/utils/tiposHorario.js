import WorkIcon from '@mui/icons-material/Work';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WeekendIcon from '@mui/icons-material/Weekend';
import CakeIcon from '@mui/icons-material/Cake';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import FlightIcon from '@mui/icons-material/Flight';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealingIcon from '@mui/icons-material/Healing';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export const TIPO_TEMPLATES = {
  SIMPLE: 'simple',
  SIN_HORAS: 'sin-horas',
  TARDE_LIBRE: 'tarde-libre',
  TELE_MEDIA_LIBRE: 'tele-media-libre',
  TELE_PRESENCIAL: 'tele-presencial',
  HORARIO_DIVIDIDO: 'horario-dividido',
  VIAJE_TRABAJO: 'viaje-trabajo'
};

export const TIPO_ICON_COMPONENTS = {
  Work: WorkIcon,
  HomeWork: HomeWorkIcon,
  AccessTime: AccessTimeIcon,
  Business: BusinessIcon,
  SwapHoriz: SwapHorizIcon,
  EventBusy: EventBusyIcon,
  BeachAccess: BeachAccessIcon,
  Celebration: CelebrationIcon,
  AssignmentInd: AssignmentIndIcon,
  HealthAndSafety: HealthAndSafetyIcon,
  EmojiEvents: EmojiEventsIcon,
  Weekend: WeekendIcon,
  Cake: CakeIcon,
  LocationOff: LocationOffIcon,
  Flight: FlightIcon,
  LocalHospital: LocalHospitalIcon,
  Healing: HealingIcon,
  SyncAlt: SyncAltIcon,
  CalendarMonth: CalendarMonthIcon
};

export const TIPO_ICON_OPTIONS = [
  { value: 'Work', label: 'Trabajo (Work)' },
  { value: 'HomeWork', label: 'Casa (HomeWork)' },
  { value: 'AccessTime', label: 'Reloj (AccessTime)' },
  { value: 'Business', label: 'Empresa (Business)' },
  { value: 'SwapHoriz', label: 'Cambio (SwapHoriz)' },
  { value: 'EventBusy', label: 'No Disponible (EventBusy)' },
  { value: 'BeachAccess', label: 'Vacaciones (BeachAccess)' },
  { value: 'Celebration', label: 'Celebración (Celebration)' },
  { value: 'AssignmentInd', label: 'Permiso (AssignmentInd)' },
  { value: 'HealthAndSafety', label: 'Salud y Seguridad (HealthAndSafety)' },
  { value: 'EmojiEvents', label: 'Beneficio (EmojiEvents)' },
  { value: 'Weekend', label: 'Media Jornada (Weekend)' },
  { value: 'Cake', label: 'Cumpleaños (Cake)' },
  { value: 'LocationOff', label: 'Fuera Oficina (LocationOff)' },
  { value: 'Flight', label: 'Viaje (Flight)' },
  { value: 'LocalHospital', label: 'Hospital (LocalHospital)' },
  { value: 'Healing', label: 'Curación (Healing)' },
  { value: 'SyncAlt', label: 'Mixto (SyncAlt)' },
  { value: 'CalendarMonth', label: 'Calendario (CalendarMonth)' }
];

export const DEFAULT_TIPOS_HORARIO = [
  { key: 'personalizado', label: 'Presencial', icon: 'Work', color: '#00830e', template: TIPO_TEMPLATES.SIMPLE, noSumaHoras: false, esBeneficio: false, orden: 1, editable: false },
  { key: 'teletrabajo', label: 'Teletrabajo', icon: 'HomeWork', color: '#2e7d32', template: TIPO_TEMPLATES.SIMPLE, noSumaHoras: false, esBeneficio: false, orden: 2, editable: false },
  { key: 'tele-presencial', label: 'Teletrabajo & Presencial', icon: 'SyncAlt', color: '#6a1b9a', template: TIPO_TEMPLATES.TELE_PRESENCIAL, noSumaHoras: false, esBeneficio: false, orden: 3, editable: false },
  { key: 'horario-dividido', label: 'Horario Dividido', icon: 'AccessTime', color: '#7c3aed', template: TIPO_TEMPLATES.HORARIO_DIVIDIDO, noSumaHoras: false, esBeneficio: false, orden: 4, editable: false },
  { key: 'visita-comercial', label: 'Visita Comercial', icon: 'Business', color: '#795548', template: TIPO_TEMPLATES.SIMPLE, noSumaHoras: false, esBeneficio: false, orden: 5, editable: false },
  { key: 'cambio', label: 'Cambio', icon: 'SwapHoriz', color: '#f57c00', template: TIPO_TEMPLATES.SIMPLE, noSumaHoras: false, esBeneficio: false, orden: 6, editable: false },
  { key: 'descanso', label: 'Descanso', icon: 'EventBusy', color: '#64748b', template: TIPO_TEMPLATES.SIN_HORAS, noSumaHoras: true, esBeneficio: false, orden: 7, editable: false },
  { key: 'vacaciones', label: 'Vacaciones', icon: 'BeachAccess', color: '#f97316', template: TIPO_TEMPLATES.SIN_HORAS, noSumaHoras: true, esBeneficio: false, orden: 8, editable: false },
  { key: 'feriado', label: 'Feriado', icon: 'Celebration', color: '#ef4444', template: TIPO_TEMPLATES.SIN_HORAS, noSumaHoras: true, esBeneficio: false, orden: 9, editable: false },
  { key: 'permiso', label: 'Permiso Otorgado por Jefatura', icon: 'AssignmentInd', color: '#8b5cf6', template: TIPO_TEMPLATES.SIN_HORAS, noSumaHoras: true, esBeneficio: false, orden: 10, editable: false },
  { key: 'dia-brigada', label: 'Día por Brigada', icon: 'HealthAndSafety', color: '#d32f2f', template: TIPO_TEMPLATES.SIN_HORAS, noSumaHoras: true, esBeneficio: false, orden: 11, editable: false },
  { key: 'beneficio-operaciones', label: 'Día libre - beneficio operaciones', icon: 'EmojiEvents', color: '#ffd700', template: TIPO_TEMPLATES.SIN_HORAS, noSumaHoras: false, esBeneficio: true, horasCredito: 8, orden: 12, editable: false },
  { key: 'tarde-libre', label: 'Media Jornada Libre', icon: 'Weekend', color: '#64748b', template: TIPO_TEMPLATES.TARDE_LIBRE, noSumaHoras: false, esBeneficio: false, orden: 13, editable: false },
  { key: 'tele-media-libre', label: 'Teletrabajo & Media Jornada Libre', icon: 'HomeWork', color: '#10b981', template: TIPO_TEMPLATES.TELE_MEDIA_LIBRE, noSumaHoras: false, esBeneficio: false, orden: 14, editable: false },
  { key: 'media-cumple', label: 'Media Jornada Libre & Mes de cumpleaños', icon: 'Cake', color: '#607d8b', template: TIPO_TEMPLATES.SIN_HORAS, noSumaHoras: true, esBeneficio: false, orden: 15, editable: false },
  { key: 'fuera-oficina', label: 'Fuera de Oficina', icon: 'LocationOff', color: '#607d8b', template: TIPO_TEMPLATES.SIN_HORAS, noSumaHoras: true, esBeneficio: false, orden: 16, editable: false },
  { key: 'viaje-trabajo', label: 'Viaje de Trabajo', icon: 'Flight', color: '#1a237e', template: TIPO_TEMPLATES.VIAJE_TRABAJO, noSumaHoras: false, esBeneficio: false, orden: 17, editable: false },
  { key: 'incapacidad-enfermedad', label: 'Incapacidad por Enfermedad', icon: 'LocalHospital', color: '#d32f2f', template: TIPO_TEMPLATES.SIN_HORAS, noSumaHoras: true, esBeneficio: false, orden: 18, editable: false },
  { key: 'incapacidad-accidente', label: 'Incapacidad por Accidente', icon: 'Healing', color: '#c62828', template: TIPO_TEMPLATES.SIN_HORAS, noSumaHoras: true, esBeneficio: false, orden: 19, editable: false }
];

const DEFAULT_TIPOS_MAP = DEFAULT_TIPOS_HORARIO.reduce((acc, tipo) => {
  acc[tipo.key] = tipo;
  return acc;
}, {});

export const DEFAULT_TIPOS_LABEL = DEFAULT_TIPOS_HORARIO.reduce((acc, tipo) => {
  acc[tipo.key] = tipo.label;
  return acc;
}, {});

export const buildTipoFallbackLabel = (tipo) => {
  if (!tipo) return '';
  return tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/-/g, ' ');
};

export const sanitizeTipoKey = (value = '') => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const normalizeTipo = (key, raw = {}, index = 0) => {
  const base = DEFAULT_TIPOS_MAP[key] || {};
  const isBuiltIn = Object.prototype.hasOwnProperty.call(DEFAULT_TIPOS_MAP, key);
  const iconName = raw.icon || base.icon || 'Work';
  const template = raw.template || base.template || TIPO_TEMPLATES.SIMPLE;
  const esBeneficio = typeof raw.esBeneficio === 'boolean'
    ? raw.esBeneficio
    : Boolean(base.esBeneficio);
  const horasCreditoValue = esBeneficio
    ? (raw.horasCredito ?? base.horasCredito ?? 8)
    : null;
  const horasCredito = horasCreditoValue === undefined || horasCreditoValue === null || horasCreditoValue === ''
    ? null
    : Number(horasCreditoValue);
  return {
    key,
    label: raw.label || base.label || buildTipoFallbackLabel(key),
    icon: TIPO_ICON_COMPONENTS[iconName] ? iconName : 'Work',
    color: raw.color || base.color || '#00830e',
    template,
    noSumaHoras: esBeneficio
      ? false
      : (isBuiltIn
        ? Boolean(base.noSumaHoras)
        : (typeof raw.noSumaHoras === 'boolean' ? raw.noSumaHoras : Boolean(base.noSumaHoras))),
    esBeneficio,
    horasCredito,
    orden: Number.isFinite(raw.orden) ? raw.orden : (base.orden || index + 1),
    editable: isBuiltIn ? false : true
  };
};

export const mergeTiposCatalog = (remoteTipos = {}) => {
  const mergedMap = {};

  Object.entries(DEFAULT_TIPOS_MAP).forEach(([key, value], index) => {
    mergedMap[key] = normalizeTipo(key, { ...value, ...(remoteTipos[key] || {}) }, index);
  });

  Object.entries(remoteTipos).forEach(([key, value], index) => {
    if (!mergedMap[key]) {
      mergedMap[key] = normalizeTipo(key, value, DEFAULT_TIPOS_HORARIO.length + index);
    }
  });

  return Object.values(mergedMap).sort((a, b) => a.orden - b.orden || a.label.localeCompare(b.label));
};

export const tiposArrayToMap = (tipos = []) => {
  return tipos.reduce((acc, tipo) => {
    acc[tipo.key] = tipo;
    return acc;
  }, {});
};

export const tiposArrayToFirebaseObject = (tipos = []) => {
  return tipos.reduce((acc, tipo) => {
    const horasCredito = Number(tipo.horasCredito);
    acc[tipo.key] = {
      label: tipo.label,
      icon: tipo.icon,
      color: tipo.color,
      template: tipo.template,
      noSumaHoras: Boolean(tipo.noSumaHoras),
      esBeneficio: Boolean(tipo.esBeneficio),
      horasCredito: Number.isFinite(horasCredito) ? horasCredito : null,
      orden: tipo.orden
    };
    return acc;
  }, {});
};

export const getTipoLabel = (tipo, tiposMap = null) => {
  if (!tipo) return '';
  if (tiposMap?.[tipo]?.label) return tiposMap[tipo].label;
  if (DEFAULT_TIPOS_LABEL[tipo]) return DEFAULT_TIPOS_LABEL[tipo];
  return buildTipoFallbackLabel(tipo);
};

export const getTipoIconComponent = (iconName = 'Work') => {
  return TIPO_ICON_COMPONENTS[iconName] || WorkIcon;
};
