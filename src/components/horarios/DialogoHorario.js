import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Button, 
  Alert,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  Slide, 
  TextField,
  Chip
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import TimeInput from './TimeInput';
import { eliminarHorarioDeUsuario } from '../../services/firebaseHorarios';
import { puedeModificarHorarios } from '../../utils/permissionsUtils';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WorkIcon from '@mui/icons-material/Work';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import useTiposHorario from '../../hooks/useTiposHorario';
import { getTipoIconComponent, TIPO_TEMPLATES } from '../../utils/tiposHorario';
import { obtenerResumenJornadaLegal } from '../../utils/jornadasOrdinarias';
import { cargarHorariosUsuarioEnSemanas } from '../../services/firebaseHorarios';
import { debeValidarLimiteUsoHorario, obtenerFechaTurnoDesdeSemana, obtenerSemanasDelPeriodoUso, validarLimiteUsoHorario } from '../../utils/limitesUsoHorarios';

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'linear-gradient(135deg, #00830e 0%, #4caf50 100%)',
  color: 'white',
  padding: theme.spacing(2.5, 3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '& .MuiSvgIcon-root': {
    fontSize: 28,
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: '#fafafa',
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'white',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(0, 131, 14, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'white',
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(0, 131, 14, 0.1)',
    },
  },
}));

const HoursDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2),
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  borderRadius: 12,
  marginTop: theme.spacing(2),
  '& .hours-value': {
    fontWeight: 700,
    fontSize: '1.25rem',
    color: theme.palette.primary.main,
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1.5),
  fontSize: '0.875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease',
}));

const DialogoHorario = ({
  dialogoHorario,
  setDialogoHorario,
  horarioPersonalizado,
  setHorarioPersonalizado,
  guardarHorarioPersonalizado,
  guardandoHorario = false,
  isMobile,
  isSmallMobile,
  currentUser,
  usuarios = [],
  editando = false,
  horariosEditados,
  setHorariosEditados,
  horarios,
  setHorarios,
  semanaSeleccionada,
  obtenerClaveSemana,
  jornadasOrdinariasMap = {},
}) => {
  // Obtener usuario objetivo (el dueño del horario mostrado en el modal)
  const usuarioObjetivo = usuarios.find(u => u.id === horarioPersonalizado.usuarioId) || { id: horarioPersonalizado.usuarioId };
  // Permiso para eliminar/modificar
  const puedeEliminar = puedeModificarHorarios(currentUser, usuarioObjetivo);
  const { tipos, tiposMap } = useTiposHorario();
  const [disponibilidadTipos, setDisponibilidadTipos] = React.useState({});
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = React.useState(false);
  const horarioActualSeleccionado = editando && horariosEditados
    ? horariosEditados[horarioPersonalizado.usuarioId]?.[horarioPersonalizado.diaKey]
    : horarios?.[horarioPersonalizado.usuarioId]?.[horarioPersonalizado.diaKey];

  // Al abrir el modal o cambiar de usuario/día, inicializa desde datos existentes pero no borres lo ya tipeado
  React.useEffect(() => {
    if (!(dialogoHorario && horarioPersonalizado.usuarioId && horarioPersonalizado.diaKey)) return;
    const usuarioId = horarioPersonalizado.usuarioId;
    const diaKey = horarioPersonalizado.diaKey;
    let horarioActual = null;
    if (editando && horariosEditados) {
      horarioActual = horariosEditados[usuarioId]?.[diaKey];
    } else if (horarios) {
      horarioActual = horarios[usuarioId]?.[diaKey];
    }
    setHorarioPersonalizado(prev => {
      // Si hay un horario guardado, úsalo como base; si no, respeta lo que el usuario ya escribió
      if (horarioActual) {
        return {
          ...prev,
          tipo: horarioActual?.tipo || 'personalizado',
          horaInicio: horarioActual?.horaInicio || '',
          horaFin: horarioActual?.horaFin || '',
          horaInicioBloque1: horarioActual?.horaInicioBloque1 || '',
          horaFinBloque1: horarioActual?.horaFinBloque1 || '',
          horaInicioBloque2: horarioActual?.horaInicioBloque2 || '',
          horaFinBloque2: horarioActual?.horaFinBloque2 || '',
          horaInicioLibre: horarioActual?.horaInicioLibre || '',
          horaFinLibre: horarioActual?.horaFinLibre || '',
          horaInicioTele: horarioActual?.horaInicioTele || '',
          horaFinTele: horarioActual?.horaFinTele || '',
          horaInicioPres: horarioActual?.horaInicioPres || '',
          horaFinPres: horarioActual?.horaFinPres || '',
          horas: horarioActual?.horas ?? '',
          nota: horarioActual?.nota || ''
        };
      }
      // No sobrescribir con vacíos si no hay horario previo
      return { ...prev, tipo: prev.tipo || 'personalizado' };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogoHorario, horarioPersonalizado.usuarioId, horarioPersonalizado.diaKey]);

  React.useEffect(() => {
    let cancelled = false;

    const cargarDisponibilidad = async () => {
      if (!dialogoHorario || !horarioPersonalizado.usuarioId || !horarioPersonalizado.diaKey || !semanaSeleccionada) {
        setDisponibilidadTipos({});
        return;
      }

      const fechaTurno = obtenerFechaTurnoDesdeSemana(semanaSeleccionada, horarioPersonalizado.diaKey);
      if (!fechaTurno) {
        setDisponibilidadTipos({});
        return;
      }

      const tiposConLimite = tipos.filter((tipoItem) => debeValidarLimiteUsoHorario(tipoItem));
      const semanasNecesarias = new Set();
      tiposConLimite.forEach((tipoItem) => {
        const periodosNecesarios = tipoItem.key === 'media-cumple' || tipoItem.key === 'media2-cumple'
          ? ['mes', tipoItem.limiteUsoPeriodo]
          : tipoItem.limiteUsoPeriodo
          ? [tipoItem.limiteUsoPeriodo]
          : ['mes'];

        periodosNecesarios.filter(Boolean).forEach((periodo) => {
          obtenerSemanasDelPeriodoUso(fechaTurno, periodo).forEach((weekKey) => semanasNecesarias.add(weekKey));
        });
      });

      setCargandoDisponibilidad(true);
      try {
        const historialHorarios = await cargarHorariosUsuarioEnSemanas(horarioPersonalizado.usuarioId, Array.from(semanasNecesarias));
        const semanaKeyActual = obtenerClaveSemana?.(semanaSeleccionada) || null;
        const horariosLocalesSemana = (editando ? horariosEditados : horarios)?.[horarioPersonalizado.usuarioId] || {};

        if (semanaKeyActual && Object.keys(horariosLocalesSemana).length > 0) {
          historialHorarios[semanaKeyActual] = {
            ...(historialHorarios[semanaKeyActual] || {}),
            [horarioPersonalizado.usuarioId]: {
              ...(historialHorarios[semanaKeyActual]?.[horarioPersonalizado.usuarioId] || {}),
              ...horariosLocalesSemana,
            },
          };
        }

        const siguienteDisponibilidad = {};

        tipos.forEach((tipoItem) => {
          const tipoConfig = tiposMap[tipoItem.key] || tipoItem;
          if (!debeValidarLimiteUsoHorario(tipoConfig)) {
            siguienteDisponibilidad[tipoItem.key] = { disponible: true };
            return;
          }

          const validacion = validarLimiteUsoHorario({
            tipoConfig: { ...tipoConfig, key: tipoItem.key },
            usuario: usuarioObjetivo,
            fechaTurno,
            historialHorarios,
            horarioExistente: horarioActualSeleccionado?.tipo === tipoItem.key ? horarioActualSeleccionado : null,
          });

          siguienteDisponibilidad[tipoItem.key] = validacion.permitido
            ? { disponible: true }
            : { disponible: false, motivo: validacion.mensaje };
        });

        if (!cancelled) {
          setDisponibilidadTipos(siguienteDisponibilidad);
        }
      } finally {
        if (!cancelled) {
          setCargandoDisponibilidad(false);
        }
      }
    };

    void cargarDisponibilidad();

    return () => {
      cancelled = true;
    };
  }, [dialogoHorario, horarioPersonalizado.usuarioId, horarioPersonalizado.diaKey, semanaSeleccionada, tipos, tiposMap, usuarioObjetivo, horarioActualSeleccionado, editando, horariosEditados, horarios, obtenerClaveSemana]);

  const handleTimeChange = (field, value) => {
    setHorarioPersonalizado((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (
        field === 'horaInicio' &&
        tipoTemplate === TIPO_TEMPLATES.SIMPLE &&
        resumenJornadaLegal?.salidaSugerida
      ) {
        const puedeAutocompletarSalida = !prev.horaFin || prev.horaFin === ultimoFinSugeridoRef.current;
        if (puedeAutocompletarSalida) {
          next.horaFin = resumenJornadaLegal.salidaSugerida;
          ultimoFinSugeridoRef.current = resumenJornadaLegal.salidaSugerida;
        }
      }

      return next;
    });
  };

  const tipo = horarioPersonalizado.tipo || 'personalizado';
  const tipoConfig = tiposMap[tipo] || {};
  const tipoTemplate = tipoConfig.template || TIPO_TEMPLATES.SIMPLE;
  const esBeneficio = Boolean(tipoConfig.esBeneficio);
  const ultimoFinSugeridoRef = React.useRef('');
  const resumenJornadaLegal = React.useMemo(() => {
    if (!horarioPersonalizado.horaInicio) {
      return null;
    }

    return obtenerResumenJornadaLegal(horarioPersonalizado.horaInicio, jornadasOrdinariasMap);
  }, [horarioPersonalizado.horaInicio, jornadasOrdinariasMap]);

  React.useEffect(() => {
    if (tipoTemplate !== TIPO_TEMPLATES.SIMPLE || !resumenJornadaLegal?.salidaSugerida) {
      return;
    }

    setHorarioPersonalizado((prev) => {
      const puedeAutocompletar = !prev.horaFin || prev.horaFin === ultimoFinSugeridoRef.current;
      if (!puedeAutocompletar || prev.horaInicio !== horarioPersonalizado.horaInicio) {
        return prev;
      }

      ultimoFinSugeridoRef.current = resumenJornadaLegal.salidaSugerida;
      return {
        ...prev,
        horaFin: resumenJornadaLegal.salidaSugerida,
      };
    });
  }, [horarioPersonalizado.horaInicio, resumenJornadaLegal, setHorarioPersonalizado, tipoTemplate]);
  const horasLaboradas = (() => {
    if (!horarioPersonalizado.horaInicio || !horarioPersonalizado.horaFin) return 0;
    const [h1, m1] = horarioPersonalizado.horaInicio.split(':').map(Number);
    const [h2, m2] = horarioPersonalizado.horaFin.split(':').map(Number);
    const inicio = h1 * 60 + m1;
    const fin = h2 * 60 + m2;
    const minutos = fin >= inicio ? (fin - inicio) : ((24 * 60 - inicio) + fin);
    return minutos / 60;
  })();
  const horasExcedentesDiarias = resumenJornadaLegal
    ? Math.max(horasLaboradas - resumenJornadaLegal.limiteDiario, 0)
    : 0;


  // Eliminar horario: limpia los campos y elimina en la base de datos
  const handleEliminarHorario = async () => {
    // Eliminar en la base de datos si hay usuario y día
    if (horarioPersonalizado.usuarioId && horarioPersonalizado.diaKey && semanaSeleccionada && obtenerClaveSemana) {
      try {
        const semanaKey = obtenerClaveSemana(semanaSeleccionada);
        await eliminarHorarioDeUsuario(semanaKey, horarioPersonalizado.usuarioId, horarioPersonalizado.diaKey);
        // Actualizar el estado local según si está editando o no
        if (editando && setHorariosEditados) {
          setHorariosEditados(prev => {
            const nuevos = { ...prev };
            if (nuevos[horarioPersonalizado.usuarioId]) {
              delete nuevos[horarioPersonalizado.usuarioId][horarioPersonalizado.diaKey];
              // Si el usuario ya no tiene días, elimina la clave del usuario
              if (Object.keys(nuevos[horarioPersonalizado.usuarioId]).length === 0) {
                delete nuevos[horarioPersonalizado.usuarioId];
              }
            }
            return { ...nuevos };
          });
        } else if (setHorarios) {
          setHorarios(prev => {
            const nuevos = { ...prev };
            if (nuevos[horarioPersonalizado.usuarioId]) {
              delete nuevos[horarioPersonalizado.usuarioId][horarioPersonalizado.diaKey];
              if (Object.keys(nuevos[horarioPersonalizado.usuarioId]).length === 0) {
                delete nuevos[horarioPersonalizado.usuarioId];
              }
            }
            return { ...nuevos };
          });
        }
      } catch (error) {
        // Puedes mostrar un mensaje de error si lo deseas
        // console.error('Error eliminando horario en la base de datos:', error);
      }
    }
    // Limpiar campos del modal
    setHorarioPersonalizado(prev => ({
      ...prev,
      tipo: 'personalizado',
      horaInicio: '',
      horaFin: '',
      horaInicioBloque1: '',
      horaFinBloque1: '',
      horaInicioBloque2: '',
      horaFinBloque2: '',
      horaInicioLibre: '',
      horaFinLibre: '',
      horaInicioTele: '',
      horaFinTele: '',
      horaInicioPres: '',
      horaFinPres: '',
      nota: ''
    }));
    // Cerrar el modal después de eliminar
    if (typeof setDialogoHorario === 'function') setDialogoHorario(false);
  };

  return (
    <StyledDialog 
      open={dialogoHorario} 
      onClose={() => setDialogoHorario(false)}
      fullScreen={isSmallMobile}
      maxWidth={isMobile ? 'sm' : 'md'}
      fullWidth
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
    >
      <StyledDialogTitle>
        <AccessTimeIcon />
        Asignar Horario
      </StyledDialogTitle>
      <StyledDialogContent>
        <Box sx={{ mt: 2 }}>
          <StyledFormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de asignación</InputLabel>
            <Select
              value={tipo}
              disabled={cargandoDisponibilidad}
              onChange={(e) => {
                const nuevoTipo = e.target.value;
                const newTemplate = tiposMap[nuevoTipo]?.template || TIPO_TEMPLATES.SIMPLE;
                const nuevoTipoConfig = tiposMap[nuevoTipo] || {};
                // Para viaje-trabajo mantenemos los valores por defecto históricos.
                if (newTemplate === TIPO_TEMPLATES.VIAJE_TRABAJO) {
                  setHorarioPersonalizado(prev => ({
                    ...prev,
                    tipo: nuevoTipo,
                    horaInicio: '08:00',
                    horaFin: '18:00',
                    horas: 10
                  }));
                } else if (nuevoTipoConfig.esBeneficio && newTemplate === TIPO_TEMPLATES.SIN_HORAS) {
                  setHorarioPersonalizado(prev => ({
                    ...prev,
                    tipo: nuevoTipo,
                    horas: prev.horas || nuevoTipoConfig.horasCredito || 8
                  }));
                } else {
                  handleTimeChange('tipo', nuevoTipo);
                }
              }}
              size={isMobile ? 'small' : 'medium'}
            >
              {tipos.map((tipoItem) => {
                const Icon = getTipoIconComponent(tipoItem.icon);
                const disponibilidad = disponibilidadTipos[tipoItem.key];
                const esTipoActual = horarioActualSeleccionado?.tipo === tipoItem.key;
                const deshabilitado = Boolean(disponibilidad && !disponibilidad.disponible && !esTipoActual);
                const motivo = disponibilidad?.motivo || 'Sin cupo disponible';
                const etiquetaDisponibilidad = deshabilitado ? 'Agotado' : (tipoItem.limiteUsoPeriodo ? 'Disponible' : null);
                return (
                  <MenuItem
                    key={tipoItem.key}
                    value={tipoItem.key}
                    disabled={deshabilitado}
                    sx={{
                      borderLeft: deshabilitado ? '4px solid rgba(220, 38, 38, 0.8)' : '4px solid transparent',
                      '&.Mui-disabled': {
                        opacity: 1,
                        backgroundColor: deshabilitado ? 'rgba(248, 113, 113, 0.08)' : undefined,
                      },
                    }}
                    title={deshabilitado ? motivo : ''}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Icon sx={{ fontSize: 18, color: tipoItem.color || 'primary.main' }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {tipoItem.label}
                        </Typography>
                        {tipoItem.limiteUsoPeriodo && (
                          <Chip
                            size="small"
                            label={tipoItem.limiteUsoPeriodo === 'mes' ? '1 vez/mes' : '1 vez/año'}
                            color={deshabilitado ? 'error' : 'info'}
                            variant="outlined"
                          />
                        )}
                        {etiquetaDisponibilidad && (
                          <Chip
                            size="small"
                            label={etiquetaDisponibilidad}
                            color={deshabilitado ? 'error' : 'success'}
                            variant="filled"
                            sx={{ fontWeight: 700 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </StyledFormControl>

          {cargandoDisponibilidad && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              Verificando disponibilidad de tipos...
            </Alert>
          )}

          {tipoTemplate === TIPO_TEMPLATES.VIAJE_TRABAJO ? null
          : tipoTemplate === TIPO_TEMPLATES.TARDE_LIBRE ? (
            <>
              <SectionTitle>
                <WorkIcon sx={{ fontSize: 18 }} />
                Presencial
              </SectionTitle>
              <TimeInput
                label="Hora de inicio trabajo"
                value={horarioPersonalizado.horaInicio}
                onChange={(e) => handleTimeChange('horaInicio', e.target.value)}
                isMobile={isMobile}
              />
              <TimeInput
                label="Hora de fin trabajo"
                value={horarioPersonalizado.horaFin}
                onChange={(e) => handleTimeChange('horaFin', e.target.value)}
                isMobile={isMobile}
              />
              <SectionTitle>
                <EventBusyIcon sx={{ fontSize: 18 }} />
                Tiempo Libre
              </SectionTitle>
              <TimeInput
                label="Inicio tarde libre"
                value={horarioPersonalizado.horaInicioLibre}
                onChange={(e) => handleTimeChange('horaInicioLibre', e.target.value)}
                isMobile={isMobile}
              />
              <TimeInput
                label="Fin tarde libre"
                value={horarioPersonalizado.horaFinLibre}
                onChange={(e) => handleTimeChange('horaFinLibre', e.target.value)}
                isMobile={isMobile}
              />
              <HoursDisplay>
                <AccessTimeIcon color="primary" />
                <Typography variant="body2" color="text.secondary">Horas laboradas:</Typography>
                <span className="hours-value">{horasLaboradas.toFixed(1)}h</span>
              </HoursDisplay>
              {resumenJornadaLegal && (
                <Alert
                  severity={horarioPersonalizado.horaFin && horasExcedentesDiarias > 0 ? 'warning' : 'info'}
                  sx={{ mt: 1.5, borderRadius: 2 }}
                >
                  {horarioPersonalizado.horaFin
                    ? `Jornada ${resumenJornadaLegal.label}: límite diario ${resumenJornadaLegal.limiteDiario}h. ${horasExcedentesDiarias > 0 ? `Excede por ${horasExcedentesDiarias.toFixed(1)}h.` : 'Dentro del rango legal diario.'}`
                    : `Si entras a las ${horarioPersonalizado.horaInicio}, la salida máxima sugerida es ${resumenJornadaLegal.salidaSugerida} para una jornada ${resumenJornadaLegal.label.toLowerCase()} de ${resumenJornadaLegal.limiteDiario}h.`}
                </Alert>
              )}
            </>
          ) : tipoTemplate === TIPO_TEMPLATES.TELE_MEDIA_LIBRE ? (
            <>
              <SectionTitle>
                <HomeWorkIcon sx={{ fontSize: 18 }} />
                Teletrabajo
              </SectionTitle>
              <TimeInput
                label="Inicio teletrabajo"
                value={horarioPersonalizado.horaInicio || ''}
                onChange={(e) => handleTimeChange('horaInicio', e.target.value)}
                isMobile={isMobile}
              />
              <TimeInput
                label="Fin teletrabajo"
                value={horarioPersonalizado.horaFin || ''}
                onChange={(e) => handleTimeChange('horaFin', e.target.value)}
                isMobile={isMobile}
              />
              <SectionTitle>
                <EventBusyIcon sx={{ fontSize: 18 }} />
                Tiempo Libre
              </SectionTitle>
              <TimeInput
                label="Inicio tiempo libre"
                value={horarioPersonalizado.horaInicioLibre || ''}
                onChange={(e) => handleTimeChange('horaInicioLibre', e.target.value)}
                isMobile={isMobile}
              />
              <TimeInput
                label="Fin tiempo libre"
                value={horarioPersonalizado.horaFinLibre || ''}
                onChange={(e) => handleTimeChange('horaFinLibre', e.target.value)}
                isMobile={isMobile}
              />
              <HoursDisplay>
                <AccessTimeIcon color="primary" />
                <Typography variant="body2" color="text.secondary">Horas laboradas:</Typography>
                <span className="hours-value">{horasLaboradas.toFixed(1)}h</span>
              </HoursDisplay>
            </>
          ) : tipoTemplate === TIPO_TEMPLATES.TELE_PRESENCIAL ? (
            <>
              <SectionTitle>
                <HomeWorkIcon sx={{ fontSize: 18 }} />
                Teletrabajo
              </SectionTitle>
              <TimeInput
                label="Inicio Teletrabajo"
                value={horarioPersonalizado.horaInicioTele || ''}
                onChange={(e) => handleTimeChange('horaInicioTele', e.target.value)}
                isMobile={isMobile}
              />
              <TimeInput
                label="Fin Teletrabajo"
                value={horarioPersonalizado.horaFinTele || ''}
                onChange={(e) => handleTimeChange('horaFinTele', e.target.value)}
                isMobile={isMobile}
              />

              <SectionTitle>
                <WorkIcon sx={{ fontSize: 18 }} />
                Presencial
              </SectionTitle>
              <TimeInput
                label="Inicio Presencial"
                value={horarioPersonalizado.horaInicioPres || ''}
                onChange={(e) => handleTimeChange('horaInicioPres', e.target.value)}
                isMobile={isMobile}
              />
              <TimeInput
                label="Fin Presencial"
                value={horarioPersonalizado.horaFinPres || ''}
                onChange={(e) => handleTimeChange('horaFinPres', e.target.value)}
                isMobile={isMobile}
              />

              {/* Mostrar horas calculadas */}
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  icon={<HomeWorkIcon />}
                  label={`Teletrabajo: ${(() => {
                    const s = horarioPersonalizado.horaInicioTele;
                    const e = horarioPersonalizado.horaFinTele;
                    if (!s || !e) return '0.0h';
                    try {
                      const [h1, m1] = s.split(':').map(Number);
                      const [h2, m2] = e.split(':').map(Number);
                      let v = 0;
                      if (h2 > h1 || (h2 === h1 && m2 > m1)) {
                        v = (h2 - h1) + (m2 - m1) / 60;
                      } else {
                        v = (24 - h1 + h2) + (m2 - m1) / 60;
                      }
                      return v.toFixed(1) + 'h';
                    } catch { return '0.0h'; }
                  })()}`}
                  color="info"
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start' }}
                />
                <Chip 
                  icon={<WorkIcon />}
                  label={`Presencial: ${(() => {
                    const s = horarioPersonalizado.horaInicioPres;
                    const e = horarioPersonalizado.horaFinPres;
                    if (!s || !e) return '0.0h';
                    try {
                      const [h1, m1] = s.split(':').map(Number);
                      const [h2, m2] = e.split(':').map(Number);
                      let v = 0;
                      if (h2 > h1 || (h2 === h1 && m2 > m1)) {
                        v = (h2 - h1) + (m2 - m1) / 60;
                      } else {
                        v = (24 - h1 + h2) + (m2 - m1) / 60;
                      }
                      return v.toFixed(1) + 'h';
                    } catch { return '0.0h'; }
                  })()}`}
                  color="success"
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start' }}
                />
                <HoursDisplay>
                  <AccessTimeIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">Total:</Typography>
                  <span className="hours-value">{(() => {
                    const calc = (s, e) => {
                      if (!s || !e) return 0;
                      const [h1, m1] = s.split(':').map(Number);
                      const [h2, m2] = e.split(':').map(Number);
                      let v = 0;
                      if (h2 > h1 || (h2 === h1 && m2 > m1)) {
                        v = (h2 - h1) + (m2 - m1) / 60;
                      } else {
                        v = (24 - h1 + h2) + (m2 - m1) / 60;
                      }
                      return v;
                    };
                    const tele = calc(horarioPersonalizado.horaInicioTele, horarioPersonalizado.horaFinTele);
                    const pres = calc(horarioPersonalizado.horaInicioPres, horarioPersonalizado.horaFinPres);
                    return (tele + pres).toFixed(1) + 'h';
                  })()}</span>
                </HoursDisplay>
              </Box>
            </>
          ) : tipoTemplate === TIPO_TEMPLATES.HORARIO_DIVIDIDO ? (
            <>
              <SectionTitle>
                <AccessTimeIcon sx={{ fontSize: 18 }} />
                Bloque 1
              </SectionTitle>
              <TimeInput
                label="Inicio Bloque 1"
                value={horarioPersonalizado.horaInicioBloque1 || ''}
                onChange={(e) => handleTimeChange('horaInicioBloque1', e.target.value)}
                isMobile={isMobile}
              />
              <TimeInput
                label="Fin Bloque 1"
                value={horarioPersonalizado.horaFinBloque1 || ''}
                onChange={(e) => handleTimeChange('horaFinBloque1', e.target.value)}
                isMobile={isMobile}
              />

              <SectionTitle>
                <AccessTimeIcon sx={{ fontSize: 18 }} />
                Bloque 2
              </SectionTitle>
              <TimeInput
                label="Inicio Bloque 2"
                value={horarioPersonalizado.horaInicioBloque2 || ''}
                onChange={(e) => handleTimeChange('horaInicioBloque2', e.target.value)}
                isMobile={isMobile}
              />
              <TimeInput
                label="Fin Bloque 2"
                value={horarioPersonalizado.horaFinBloque2 || ''}
                onChange={(e) => handleTimeChange('horaFinBloque2', e.target.value)}
                isMobile={isMobile}
              />

              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip
                  icon={<AccessTimeIcon />}
                  label={`Bloque 1: ${(() => {
                    const s = horarioPersonalizado.horaInicioBloque1;
                    const e = horarioPersonalizado.horaFinBloque1;
                    if (!s || !e) return '0.0h';
                    try {
                      const [h1, m1] = s.split(':').map(Number);
                      const [h2, m2] = e.split(':').map(Number);
                      let v = 0;
                      if (h2 > h1 || (h2 === h1 && m2 > m1)) {
                        v = (h2 - h1) + (m2 - m1) / 60;
                      } else {
                        v = (24 - h1 + h2) + (m2 - m1) / 60;
                      }
                      return v.toFixed(1) + 'h';
                    } catch { return '0.0h'; }
                  })()}`}
                  color="primary"
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start' }}
                />
                <Chip
                  icon={<AccessTimeIcon />}
                  label={`Bloque 2: ${(() => {
                    const s = horarioPersonalizado.horaInicioBloque2;
                    const e = horarioPersonalizado.horaFinBloque2;
                    if (!s || !e) return '0.0h';
                    try {
                      const [h1, m1] = s.split(':').map(Number);
                      const [h2, m2] = e.split(':').map(Number);
                      let v = 0;
                      if (h2 > h1 || (h2 === h1 && m2 > m1)) {
                        v = (h2 - h1) + (m2 - m1) / 60;
                      } else {
                        v = (24 - h1 + h2) + (m2 - m1) / 60;
                      }
                      return v.toFixed(1) + 'h';
                    } catch { return '0.0h'; }
                  })()}`}
                  color="secondary"
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start' }}
                />
                <HoursDisplay>
                  <AccessTimeIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">Total:</Typography>
                  <span className="hours-value">{(() => {
                    const calc = (s, e) => {
                      if (!s || !e) return 0;
                      const [h1, m1] = s.split(':').map(Number);
                      const [h2, m2] = e.split(':').map(Number);
                      let v = 0;
                      if (h2 > h1 || (h2 === h1 && m2 > m1)) {
                        v = (h2 - h1) + (m2 - m1) / 60;
                      } else {
                        v = (24 - h1 + h2) + (m2 - m1) / 60;
                      }
                      return v;
                    };
                    const b1 = calc(horarioPersonalizado.horaInicioBloque1, horarioPersonalizado.horaFinBloque1);
                    const b2 = calc(horarioPersonalizado.horaInicioBloque2, horarioPersonalizado.horaFinBloque2);
                    return (b1 + b2).toFixed(1) + 'h';
                  })()}</span>
                </HoursDisplay>
              </Box>
            </>
          ) : tipoTemplate !== TIPO_TEMPLATES.SIN_HORAS ? (
            <>
              <TimeInput
                label="Hora de inicio"
                value={horarioPersonalizado.horaInicio}
                onChange={(e) => handleTimeChange('horaInicio', e.target.value)}
                isMobile={isMobile}
              />
              <TimeInput
                label="Hora de fin"
                value={horarioPersonalizado.horaFin}
                onChange={(e) => handleTimeChange('horaFin', e.target.value)}
                isMobile={isMobile}
                helperText={resumenJornadaLegal?.salidaSugerida ? `Salida sugerida: ${resumenJornadaLegal.salidaSugerida}` : ''}
              />
              <HoursDisplay>
                <AccessTimeIcon color="primary" />
                <Typography variant="body2" color="text.secondary">Horas laboradas:</Typography>
                <span className="hours-value">{horasLaboradas.toFixed(1)}h</span>
              </HoursDisplay>
              {resumenJornadaLegal && (
                <Alert
                  severity={horarioPersonalizado.horaFin && horasExcedentesDiarias > 0 ? 'warning' : 'info'}
                  sx={{ mt: 1.5, borderRadius: 2 }}
                >
                  {horarioPersonalizado.horaFin
                    ? `Jornada ${resumenJornadaLegal.label}: límite diario ${resumenJornadaLegal.limiteDiario}h. ${horasExcedentesDiarias > 0 ? `Excede por ${horasExcedentesDiarias.toFixed(1)}h.` : 'Dentro del rango legal diario.'}`
                    : `Si entras a las ${horarioPersonalizado.horaInicio}, la salida máxima sugerida es ${resumenJornadaLegal.salidaSugerida} para una jornada ${resumenJornadaLegal.label.toLowerCase()} de ${resumenJornadaLegal.limiteDiario}h.`}
                </Alert>
              )}
            </>
          ) : esBeneficio ? (
            <>
              <StyledTextField
                label="Horas acreditadas"
                type="number"
                value={horarioPersonalizado.horas ?? ''}
                onChange={(e) => handleTimeChange('horas', e.target.value)}
                fullWidth
                inputProps={{ min: 0, step: 0.1 }}
                sx={{ mt: 1 }}
                size={isMobile ? 'small' : 'medium'}
                helperText="Horas que sumará este beneficio"
              />
              <HoursDisplay>
                <AccessTimeIcon color="primary" />
                <Typography variant="body2" color="text.secondary">Horas acreditadas:</Typography>
                <span className="hours-value">{Number(horarioPersonalizado.horas || 0).toFixed(1)}h</span>
              </HoursDisplay>
            </>
          ) : null}

          {/* Campo para nota */}
          <StyledTextField
            label="Nota (opcional)"
            value={horarioPersonalizado.nota || ''}
            onChange={e => setHorarioPersonalizado(prev => ({ ...prev, nota: e.target.value }))}
            fullWidth
            multiline
            minRows={1}
            maxRows={3}
            sx={{ mt: 3 }}
            size={isMobile ? 'small' : 'medium'}
            placeholder="Agrega una nota o comentario..."
          />
        </Box>
      </StyledDialogContent>
      <DialogActions sx={{ 
        p: isMobile ? 2 : 3,
        flexDirection: isSmallMobile ? 'column' : 'row',
        gap: 1.5,
        backgroundColor: '#fafafa',
        borderTop: '1px solid rgba(0, 0, 0, 0.08)'
      }}>
        <ActionButton 
          onClick={() => setDialogoHorario(false)}
          fullWidth={isSmallMobile}
          size={isMobile ? 'medium' : 'large'}
          startIcon={<CloseIcon />}
          sx={{ color: 'text.secondary' }}
        >
          Cancelar
        </ActionButton>
        <ActionButton
          onClick={handleEliminarHorario}
          color="error"
          variant="outlined"
          fullWidth={isSmallMobile}
          size={isMobile ? 'medium' : 'large'}
          startIcon={<DeleteOutlineIcon />}
          disabled={!puedeEliminar}
          sx={{ 
            borderWidth: 2,
            '&:hover': { borderWidth: 2 }
          }}
        >
          Eliminar
        </ActionButton>
        <ActionButton 
          onClick={guardarHorarioPersonalizado} 
          variant="contained"
          fullWidth={isSmallMobile}
          size={isMobile ? 'medium' : 'large'}
          startIcon={<SaveIcon />}
          disabled={guardandoHorario}
          sx={{
            background: 'linear-gradient(135deg, #00830e 0%, #4caf50 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #006b0b 0%, #388e3c 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(0, 131, 14, 0.3)',
            },
          }}
        >
          {guardandoHorario ? 'Guardando...' : 'Guardar'}
        </ActionButton>
      </DialogActions>
    </StyledDialog>
  );
};
export default DialogoHorario;
