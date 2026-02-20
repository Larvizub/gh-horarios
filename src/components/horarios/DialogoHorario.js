import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Button, 
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
import BusinessIcon from '@mui/icons-material/Business';
import CakeIcon from '@mui/icons-material/Cake';
import WeekendIcon from '@mui/icons-material/Weekend';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import FlightIcon from '@mui/icons-material/Flight';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealingIcon from '@mui/icons-material/Healing';
import SyncAltIcon from '@mui/icons-material/SyncAlt';

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
  obtenerClaveSemana
}) => {
  // Obtener usuario objetivo (el dueño del horario mostrado en el modal)
  const usuarioObjetivo = usuarios.find(u => u.id === horarioPersonalizado.usuarioId) || { id: horarioPersonalizado.usuarioId };
  // Permiso para eliminar/modificar
  const puedeEliminar = puedeModificarHorarios(currentUser, usuarioObjetivo);

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
          nota: horarioActual?.nota || ''
        };
      }
      // No sobrescribir con vacíos si no hay horario previo
      return { ...prev, tipo: prev.tipo || 'personalizado' };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogoHorario, horarioPersonalizado.usuarioId, horarioPersonalizado.diaKey]);

  const handleTimeChange = (field, value) => {
    setHorarioPersonalizado(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tipo = horarioPersonalizado.tipo || 'personalizado';
  const horasLaboradas = (() => {
    if (!horarioPersonalizado.horaInicio || !horarioPersonalizado.horaFin) return 0;
    const [h1, m1] = horarioPersonalizado.horaInicio.split(':').map(Number);
    const [h2, m2] = horarioPersonalizado.horaFin.split(':').map(Number);
    return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
  })();


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
              onChange={(e) => {
                const nuevoTipo = e.target.value;
                // Si selecciona viaje-trabajo, asigna por defecto 08:00-18:00 y 10h
                if (nuevoTipo === 'viaje-trabajo') {
                  setHorarioPersonalizado(prev => ({
                    ...prev,
                    tipo: 'viaje-trabajo',
                    horaInicio: '08:00',
                    horaFin: '18:00',
                    horas: 10
                  }));
                } else {
                  handleTimeChange('tipo', nuevoTipo);
                }
              }}
              size={isMobile ? 'small' : 'medium'}
            >
              <MenuItem value="personalizado">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  Presencial
                </Box>
              </MenuItem>
              <MenuItem value="teletrabajo">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HomeWorkIcon sx={{ fontSize: 18, color: 'info.main' }} />
                  Teletrabajo
                </Box>
              </MenuItem>
              <MenuItem value="tele-presencial">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SyncAltIcon sx={{ fontSize: 18, color: '#6a1b9a' }} />
                  Teletrabajo & Presencial
                </Box>
              </MenuItem>
              <MenuItem value="horario-dividido">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 18, color: '#7c3aed' }} />
                  Horario Dividido
                </Box>
              </MenuItem>
              <MenuItem value="visita-comercial">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon sx={{ fontSize: 18, color: '#795548' }} />
                  Visita Comercial
                </Box>
              </MenuItem>
              <MenuItem value="cambio">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SwapHorizIcon sx={{ fontSize: 18, color: '#f57c00' }} />
                  Cambio
                </Box>
              </MenuItem>
              <MenuItem value="descanso">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventBusyIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  Descanso
                </Box>
              </MenuItem>
              <MenuItem value="vacaciones">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BeachAccessIcon sx={{ fontSize: 18, color: '#f97316' }} />
                  Vacaciones
                </Box>
              </MenuItem>
              <MenuItem value="feriado">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CelebrationIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                  Feriado
                </Box>
              </MenuItem>
              <MenuItem value="permiso">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIndIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
                  Permiso Otorgado por Jefatura
                </Box>
              </MenuItem>
              <MenuItem value="dia-brigada">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HealthAndSafetyIcon sx={{ fontSize: 18, color: '#d32f2f' }} />
                  Día por Brigada
                </Box>
              </MenuItem>
              <MenuItem value="beneficio-operaciones">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEventsIcon sx={{ fontSize: 18, color: '#ffd700' }} />
                  Día libre - beneficio operaciones
                </Box>
              </MenuItem>
              <MenuItem value="tarde-libre">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WeekendIcon sx={{ fontSize: 18, color: '#64748b' }} />
                  Media Jornada Libre
                </Box>
              </MenuItem>
              <MenuItem value="tele-media-libre">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeWorkIcon sx={{ fontSize: 18, color: '#10b981' }} />
                    Teletrabajo & Media Jornada Libre
                  </Box>
              </MenuItem>
              <MenuItem value="media-cumple">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CakeIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
                  Media Jornada Libre & Mes de cumpleaños
                </Box>
              </MenuItem>
              <MenuItem value="fuera-oficina">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOffIcon sx={{ fontSize: 18, color: '#607d8b' }} />
                  Fuera de Oficina
                </Box>
              </MenuItem>
              <MenuItem value="viaje-trabajo">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FlightIcon sx={{ fontSize: 18, color: '#1a237e' }} />
                  Viaje de Trabajo
                </Box>
              </MenuItem>
              <MenuItem value="incapacidad-enfermedad">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalHospitalIcon sx={{ fontSize: 18, color: '#d32f2f' }} />
                  Incapacidad por Enfermedad
                </Box>
              </MenuItem>
              <MenuItem value="incapacidad-accidente">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HealingIcon sx={{ fontSize: 18, color: '#c62828' }} />
                  Incapacidad por Accidente
                </Box>
              </MenuItem>
            </Select>
          </StyledFormControl>

          {tipo === 'viaje-trabajo' ? null
          : tipo === 'tarde-libre' ? (
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
            </>
          ) : tipo === 'tele-media-libre' ? (
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
          ) : tipo === 'tele-presencial' ? (
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
          ) : tipo === 'horario-dividido' ? (
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
          ) : tipo !== 'descanso' && tipo !== 'vacaciones' && tipo !== 'feriado' && tipo !== 'permiso' && tipo !== 'dia-brigada' && tipo !== 'incapacidad-enfermedad' && tipo !== 'incapacidad-accidente' ? (
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
              />
              <HoursDisplay>
                <AccessTimeIcon color="primary" />
                <Typography variant="body2" color="text.secondary">Horas laboradas:</Typography>
                <span className="hours-value">{horasLaboradas.toFixed(1)}h</span>
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
          sx={{
            background: 'linear-gradient(135deg, #00830e 0%, #4caf50 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #006b0b 0%, #388e3c 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(0, 131, 14, 0.3)',
            },
          }}
        >
          Guardar
        </ActionButton>
      </DialogActions>
    </StyledDialog>
  );
};
export default DialogoHorario;
