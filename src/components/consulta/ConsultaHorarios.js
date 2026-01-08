import React, { useState, useEffect, useRef } from 'react';
import { ref, get } from 'firebase/database';
import { database, auth } from '../../firebase/config';
import { toast } from 'react-toastify';
import { obtenerHorasMaximas } from '../../utils/contratoUtils';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  Collapse,
  Autocomplete,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  Fade
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { format, addDays, startOfWeek, getISOWeek, getYear, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GetAppIcon from '@mui/icons-material/GetApp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { departamentos } from '../../utils/horariosConstants';
import * as XLSX from 'xlsx';

// Styled Components modernos
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
  background: '#f8fafc',
  [theme.breakpoints.down('md')]: {
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
  },
}));

const ContentContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 20,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(0, 131, 14, 0.08)',
  background: '#ffffff',
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    borderRadius: 12,
  },
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.75rem',
  color: '#1a1a2e',
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '& .icon': {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #00830e, #4caf50)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '1.25rem',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.35rem',
    marginBottom: theme.spacing(2),
    justifyContent: 'center',
    '& .icon': {
      width: 36,
      height: 36,
      borderRadius: 10,
    },
  },
}));

const FilterCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  borderRadius: 16,
  background: 'linear-gradient(135deg, rgba(0, 131, 14, 0.03), rgba(76, 175, 80, 0.05))',
  border: '1px solid rgba(0, 131, 14, 0.1)',
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    borderRadius: 12,
  },
}));

const WeekHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  background: 'linear-gradient(135deg, #00830e, #4caf50)',
  borderRadius: 12,
  color: 'white',
  marginBottom: theme.spacing(3),
  boxShadow: '0 4px 15px rgba(0, 131, 14, 0.3)',
  '& .MuiIconButton-root': {
    color: 'white',
    background: 'rgba(255, 255, 255, 0.15)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.25)',
    },
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    gap: theme.spacing(1),
    borderRadius: 10,
  },
}));

const UserCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 16,
  overflow: 'visible',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  transition: 'all 0.25s ease-in-out',
  '&:hover': {
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
    borderColor: 'rgba(0, 131, 14, 0.2)',
    transform: 'translateY(-2px)',
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: 12,
    marginBottom: theme.spacing(1.5),
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'background-color 0.15s ease',
  '&:nth-of-type(odd)': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.06),
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const TimeCell = styled(TableCell)(({ theme, tipo }) => ({
  backgroundColor: tipo === 'teletrabajo' || tipo === 'tele-presencial'
    ? alpha('#2e7d32', 0.06)
    : (tipo === 'personalizado' ? alpha('#3f51b5', 0.06) : 'inherit'),
  fontWeight: tipo === 'descanso' ? 'normal' : 600,
  color: tipo === 'descanso' ? theme.palette.text.secondary : theme.palette.text.primary,
  borderRadius: 8,
}));

const HoursChip = styled(Chip)(({ theme, exceeded }) => ({
  fontWeight: 600,
  borderRadius: 8,
  ...(exceeded && {
    background: 'linear-gradient(135deg, #f44336, #e91e63)',
    color: 'white',
    animation: 'pulse 2s infinite',
  }),
}));

const ExportButton = styled(Button)(({ theme }) => ({
  borderRadius: 10,
  textTransform: 'none',
  fontWeight: 600,
  padding: '8px 16px',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  gap: theme.spacing(3),
}));

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const TIPO_LABEL = {
  personalizado: 'Presencial',
  teletrabajo: 'Teletrabajo',
  descanso: 'Descanso',
  vacaciones: 'Vacaciones',
  feriado: 'Feriado',
  permiso: 'Permiso Otorgado por Jefatura',
  'tarde-libre': 'Tarde Libre',
  'dia-brigada': 'Día por Brigada',
  'beneficio-operaciones': 'Día libre - beneficio operaciones'
};

const ConsultaHorarios = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Flag para prevenir actualizaciones después de desmontar
  const mountedRef = useRef(true);
  
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [horariosRegistros, setHorariosRegistros] = useState({});
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState('');
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
  const [expandidosPorUsuario, setExpandidosPorUsuario] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [yearSelected, setYearSelected] = useState(getYear(new Date()));
  const [monthSelected, setMonthSelected] = useState(new Date().getMonth());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Nuevos estados para el modal de sugerencias
  const [sugerenciasModalOpen, setSugerenciasModalOpen] = useState(false);
  const [usuarioInfractor, setUsuarioInfractor] = useState(null);
  const [usuariosSugeridos, setUsuariosSugeridos] = useState([]);
  const [tipoInfraccion, setTipoInfraccion] = useState('');
  const [detalleInfraccion, setDetalleInfraccion] = useState('');

  // Función para obtener la clave del registro de la semana (año-numeroSemana)
  const obtenerClaveSemana = (fecha) => {
    const year = getYear(fecha);
    const week = getISOWeek(fecha);
    return `${year}-${week}`;
  };

  // Clave de la semana seleccionada
  const semanaKey = obtenerClaveSemana(semanaSeleccionada);

  // Usuario actual y permisos
  const usuarioActual = auth.currentUser ? usuarios.find(u => u.id === auth.currentUser.uid) : null;
  const esAdministrador = usuarioActual?.rol === 'Administrador';
  
  // Función para avanzar una semana
  const avanzarSemana = () => {
    const nuevaSemana = addWeeks(semanaSeleccionada, 1);
    setSemanaSeleccionada(nuevaSemana);
  };
  
  // Función para retroceder una semana
  const retrocederSemana = () => {
    const nuevaSemana = subWeeks(semanaSeleccionada, 1);
    setSemanaSeleccionada(nuevaSemana);
  };

  // Función para manejar la selección de fecha
  const handleDateSelect = (day) => {
    const newDate = new Date(yearSelected, monthSelected, day);
    const weekStart = startOfWeek(newDate, { weekStartsOn: 1 });
    setSemanaSeleccionada(weekStart);
    setDatePickerOpen(false);
    setAnchorEl(null);
  };

  // Cargar todos los datos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) return;

        // Cargar usuarios
        const usuariosRef = ref(database, 'usuarios');
        const usuariosSnapshot = await get(usuariosRef);
        if (usuariosSnapshot.exists() && mountedRef.current) {
          const usuariosData = usuariosSnapshot.val();
          const usuariosArray = Object.entries(usuariosData).map(([id, data]) => ({
            id,
            ...data
          }));
          setUsuarios(usuariosArray);
        }

        // Cargar registros de horarios disponibles
        const registrosRef = ref(database, 'horarios_registros');
        const registrosSnapshot = await get(registrosRef);
        
        if (registrosSnapshot.exists()) {
          const registros = registrosSnapshot.val();
          setHorariosRegistros(registros);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar datos: ' + error.message);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };
    
    cargarDatos();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Componente personalizado para seleccionar fecha
  const CustomDateSelector = () => {
    const handleMenuOpen = (event) => {
      setAnchorEl(event.currentTarget);
      setDatePickerOpen(true);
    };
  
    const handleMenuClose = () => {
      setAnchorEl(null);
      setDatePickerOpen(false);
    };
    
    // Obtener días del mes actual
    const daysInMonth = new Date(yearSelected, monthSelected + 1, 0).getDate();
    const firstDayOfMonth = new Date(yearSelected, monthSelected, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 7 : firstDayOfMonth;
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    const handlePrevMonth = () => {
      if (monthSelected === 0) {
        setMonthSelected(11);
        setYearSelected(yearSelected - 1);
      } else {
        setMonthSelected(monthSelected - 1);
      }
    };
    
    const handleNextMonth = () => {
      if (monthSelected === 11) {
        setMonthSelected(0);
        setYearSelected(yearSelected + 1);
      } else {
        setMonthSelected(monthSelected + 1);
      }
    };
    
    return (
      <>
        <Button 
          variant="outlined" 
          startIcon={<CalendarTodayIcon />}
          onClick={handleMenuOpen}
          fullWidth
        >
          Semana {getISOWeek(semanaSeleccionada)} - {getYear(semanaSeleccionada)}
        </Button>
        
        <Popover
          open={datePickerOpen}
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          sx={{
            '& .MuiPopover-paper': {
              position: 'fixed !important',
              top: '50% !important',
              left: '50% !important',
              transform: 'translate(-50%, -50%) !important',
              maxWidth: '90vw',
              maxHeight: '80vh',
              zIndex: 9999,
            }
          }}
        >
          <Box sx={{ p: 2, width: 280 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={handlePrevMonth} size="small">
                <ArrowBackIosNewIcon fontSize="small" />
              </IconButton>
              <Typography variant="subtitle1">
                {format(new Date(yearSelected, monthSelected, 1), 'MMMM yyyy', { locale: es })}
              </Typography>
              <IconButton onClick={handleNextMonth} size="small">
                <ArrowForwardIosIcon fontSize="small" />
              </IconButton>
            </Box>
            
            <Grid container spacing={1}>
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
                <Grid item key={index} xs={12/7}>
                  <Typography variant="caption" align="center" sx={{ display: 'block' }}>
                    {day}
                  </Typography>
                </Grid>
              ))}
              
              {Array(adjustedFirstDay - 1).fill(null).map((_, index) => (
                <Grid item key={`empty-${index}`} xs={12/7} />
              ))}
              
              {days.map(day => (
                <Grid item key={day} xs={12/7}>
                  <Button 
                    variant="text" 
                    sx={{ 
                      minWidth: 0, 
                      width: '100%',
                      borderRadius: '50%'
                    }}
                    onClick={() => handleDateSelect(day)}
                  >
                    {day}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Popover>
      </>
    );
  };

  // Filtrar usuarios por departamento y búsqueda
  const usuariosFiltrados = usuarios.filter(usuario => {
    // Filtro por departamento
    if (departamentoSeleccionado && usuario.departamento !== departamentoSeleccionado) {
      return false;
    }
    
    // Filtro por colaborador seleccionado
    if (colaboradorSeleccionado) {
      return usuario.id === colaboradorSeleccionado.id;
    }
    
    return true;
  });

  // Guardar un snapshot en localStorage para las funciones de exportación
  useEffect(() => {
    try {
      localStorage.setItem('usuarios_export', JSON.stringify(usuariosFiltrados));
      localStorage.setItem('horariosRegistros_export', JSON.stringify(horariosRegistros));
      localStorage.setItem('semanaSeleccionada_export', semanaSeleccionada.toISOString());
    } catch (e) {
      // No crítico
    }
  }, [usuariosFiltrados, horariosRegistros, semanaSeleccionada]);

  // Función para formatear los horarios
  const formatearHorario = (horarioUsuario, diaKey) => {
    if (!horarioUsuario || !horarioUsuario[diaKey]) {
      return { texto: 'Sin horario', tipo: null };
    }

    const turno = horarioUsuario[diaKey];

    if (!turno) {
      return { texto: 'Sin horario', tipo: null };
    }

    if (turno.tipo === 'descanso') {
      return { texto: 'Descanso', tipo: 'descanso' };
    }

    const tipoTexto = TIPO_LABEL[turno.tipo] || turno.tipo;

    // Nuevo manejo para tele-presencial (dos franjas: tele y presencial)
    if (turno.tipo === 'tele-presencial') {
      const teleInicio = turno.horaInicioTele || '';
      const teleFin = turno.horaFinTele || '';
      const presInicio = turno.horaInicioPres || '';
      const presFin = turno.horaFinPres || '';

      const horasTele = Number.isFinite(turno.horasTele) ? turno.horasTele : (turno.horasTele ? Number(turno.horasTele) : 0);
      const horasPres = Number.isFinite(turno.horasPres) ? turno.horasPres : (turno.horasPres ? Number(turno.horasPres) : 0);
      const total = Number.isFinite(turno.horas) ? turno.horas : (horasTele + horasPres);

      const partes = [];
      if (teleInicio && teleFin) {
        partes.push(`Teletrabajo: ${teleInicio} - ${teleFin} (${horasTele.toFixed(1)}h)`);
      } else if (horasTele > 0) {
        partes.push(`Teletrabajo: ${horasTele.toFixed(1)}h`);
      }

      if (presInicio && presFin) {
        partes.push(`Presencial: ${presInicio} - ${presFin} (${horasPres.toFixed(1)}h)`);
      } else if (horasPres > 0) {
        partes.push(`Presencial: ${horasPres.toFixed(1)}h`);
      }

      const textoPartes = partes.length > 0 ? partes.join(' / ') : 'Teletrabajo & Presencial';
      return {
        texto: `${tipoTexto}: ${textoPartes} (Total: ${Number(total || 0).toFixed(1)}h)`,
        tipo: turno.tipo
      };
    }

    // Manejo genérico para turnos con un solo bloque (incluye "personalizado" => Presencial)
    const horaInicio = turno.horaInicio || '';
    const horaFin = turno.horaFin || '';
    const horas = Number.isFinite(turno.horas) ? turno.horas : (turno.horas ? Number(turno.horas) : 0);

    if (horaInicio && horaFin) {
      return {
        texto: `${tipoTexto}: ${horaInicio} - ${horaFin} (${horas.toFixed(1)}h)`,
        tipo: turno.tipo
      };
    }

    // Fallback: mostrar la etiqueta y horas si existen
    if (horas > 0) {
      return {
        texto: `${tipoTexto}: ${horas.toFixed(1)}h`,
        tipo: turno.tipo
      };
    }

    return {
      texto: tipoTexto,
      tipo: turno.tipo
    };
  };

  // Toggle expandir/colapsar usuario
  const toggleExpandirUsuario = (usuarioId) => {
    setExpandidosPorUsuario(prev => ({
      ...prev,
      [usuarioId]: !prev[usuarioId]
    }));
  };

  // Calcular horas totales del usuario en la semana
  const calcularHorasTotales = (usuarioId) => {
    const horariosSemana = horariosRegistros[semanaKey] || {};
    const horariosUsuario = horariosSemana[usuarioId];

    if (!horariosUsuario) return 0;

    return Object.values(horariosUsuario).reduce((total, turno) => {
      if (!turno || turno.tipo === 'descanso') return total;

      // Si el turno tiene 'horas' explícitas, usarlo
      if (Number.isFinite(turno.horas)) {
        return total + (turno.horas || 0);
      }

      // Para 'tele-presencial' sumar horasTele + horasPres si están presentes
      if (turno.tipo === 'tele-presencial') {
        const horasTele = Number.isFinite(turno.horasTele) ? turno.horasTele : (turno.horasTele ? Number(turno.horasTele) : 0);
        const horasPres = Number.isFinite(turno.horasPres) ? turno.horasPres : (turno.horasPres ? Number(turno.horasPres) : 0);
        return total + horasTele + horasPres;
      }

      // Para otros tipos, intentar sumar campo 'horas' o 0
      return total + (turno.horas || 0);
    }, 0);
  };

  // Función para verificar si hay menos de 12 horas entre turnos
  const verificarDescansoEntreTurnos = (usuarioId) => {
    const horariosSemana = horariosRegistros[semanaKey] || {};
    const horariosUsuario = horariosSemana[usuarioId];
    
    if (!horariosUsuario) return { tieneInfraccion: false };
    
    const turnosLaborales = [];
    
    // Recopilar todos los turnos laborales con su día correspondiente
    for (let i = 1; i <= 7; i++) {
      const diaKey = `dia${i}`;
      const turno = horariosUsuario[diaKey];
      
      if (turno && turno.tipo !== 'descanso' && 
          turno.tipo !== 'vacaciones' && turno.tipo !== 'feriado' &&
          turno.tipo !== 'permiso' && turno.horaInicio && turno.horaFin) {
        turnosLaborales.push({
          dia: i,
          horaInicio: turno.horaInicio,
          horaFin: turno.horaFin,
          tipo: turno.tipo
        });
      }
    }
    
    // Verificar descanso entre turnos consecutivos
    for (let i = 0; i < turnosLaborales.length - 1; i++) {
      const turnoActual = turnosLaborales[i];
      const turnoSiguiente = turnosLaborales[i + 1];
      
      // Solo verificar si son días consecutivos (el siguiente día es el día actual + 1)
      if (turnoSiguiente.dia === turnoActual.dia + 1) {
        const [horaFinActual, minFinActual] = turnoActual.horaFin.split(':').map(Number);
        const [horaInicioSiguiente, minInicioSiguiente] = turnoSiguiente.horaInicio.split(':').map(Number);
        
        // Convertir todo a minutos desde el inicio del día
        const finActualEnMinutos = horaFinActual * 60 + minFinActual;
        const inicioSiguienteEnMinutos = horaInicioSiguiente * 60 + minInicioSiguiente;
        
        // Calcular las horas de descanso: desde fin del turno hasta inicio del siguiente día
        // Si termina a las 17:00 y empieza al día siguiente a las 7:00, hay 14 horas de descanso
        const minutosHasta24 = (24 * 60) - finActualEnMinutos; // Minutos desde fin turno hasta medianoche
        const descansoTotalMinutos = minutosHasta24 + inicioSiguienteEnMinutos; // Más minutos desde medianoche hasta inicio
        const descansoEnHoras = descansoTotalMinutos / 60;
        
        if (descansoEnHoras < 12) {
          return {
            tieneInfraccion: true,
            tipo: 'descanso',
            detalle: `Solo hay ${descansoEnHoras.toFixed(1)} horas de descanso entre el turno del ${diasSemana[turnoActual.dia - 1]} (termina ${turnoActual.horaFin}) y el ${diasSemana[turnoSiguiente.dia - 1]} (inicia ${turnoSiguiente.horaInicio})`
          };
        }
      }
    }
    
    return { tieneInfraccion: false };
  };
  
  // Verificar todas las posibles infracciones
  const verificarInfracciones = (usuarioId) => {
    // Obtener datos del usuario para saber su tipo de contrato
    const usuario = usuariosFiltrados.find(u => u.id === usuarioId);
    const horasMaximas = obtenerHorasMaximas(usuario?.tipoContrato || 'Operativo');
    
    // Verificar horas máximas según el tipo de contrato
    const horasTotales = calcularHorasTotales(usuarioId);
    if (horasTotales > horasMaximas) {
      return {
        tieneInfraccion: true,
        tipo: 'horas',
        detalle: `El colaborador excede el límite de ${horasMaximas} horas semanales según su contrato ${usuario?.tipoContrato || 'Operativo'} (${horasTotales.toFixed(1)} horas asignadas)`
      };
    }
    
    // Verificar descanso entre turnos (12 horas mínimo)
    const resultadoDescanso = verificarDescansoEntreTurnos(usuarioId);
    if (resultadoDescanso.tieneInfraccion) {
      return resultadoDescanso;
    }
    
    return { tieneInfraccion: false };
  };
  
  // Buscar usuarios alternativos
  const buscarUsuariosAlternativos = (usuarioInfractor) => {
    if (!usuarioInfractor) return [];
    
    // Primero buscar en el mismo departamento
    let usuariosMismoDepartamento = usuarios.filter(u => 
      u.id !== usuarioInfractor.id && 
      u.departamento === usuarioInfractor.departamento
    );
    
    // Verificar si tienen menos de las horas máximas permitidas y respetan descanso
    const usuariosValidos = usuariosMismoDepartamento.filter(u => {
      const horasTotales = calcularHorasTotales(u.id);
      const resultadoDescanso = verificarDescansoEntreTurnos(u.id);
      const horasMaximas = obtenerHorasMaximas(u.tipoContrato || 'Operativo');
      return horasTotales < (horasMaximas - 8) && !resultadoDescanso.tieneInfraccion; // Dejar margen de 8 horas para el nuevo turno
    });
    
    // Si no hay usuarios válidos, buscar en "Practicantes/Crosstraining" QUE ESTÉN AUTORIZADOS
    if (usuariosValidos.length === 0) {
      const practicantes = usuarios.filter(u => 
        u.departamento === 'Practicantes/Crosstraining' &&
        u.departamentosAutorizados && 
        Array.isArray(u.departamentosAutorizados) &&
        u.departamentosAutorizados.includes(usuarioInfractor.departamento) // Verificar autorización específica
      );
      
      return practicantes.filter(u => {
        const horasTotales = calcularHorasTotales(u.id);
        const resultadoDescanso = verificarDescansoEntreTurnos(u.id);
        const horasMaximas = obtenerHorasMaximas(u.tipoContrato || 'Operativo');
        return horasTotales < (horasMaximas - 8) && !resultadoDescanso.tieneInfraccion; // Dejar margen de 8 horas para el nuevo turno
      });
    }
    
    return usuariosValidos;
  };
  
  // Abrir modal de sugerencias
  const abrirModalSugerencias = (usuario) => {
    const infraccion = verificarInfracciones(usuario.id);
    
    if (infraccion.tieneInfraccion) {
      setUsuarioInfractor(usuario);
      setTipoInfraccion(infraccion.tipo);
      setDetalleInfraccion(infraccion.detalle);
      
      const sugerencias = buscarUsuariosAlternativos(usuario);
      setUsuariosSugeridos(sugerencias);
      
      setSugerenciasModalOpen(true);
    }
  };
  
  // Cerrar modal de sugerencias
  const cerrarModalSugerencias = () => {
    setSugerenciasModalOpen(false);
    setUsuarioInfractor(null);
    setUsuariosSugeridos([]);
    setTipoInfraccion('');
    setDetalleInfraccion('');
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentContainer maxWidth="lg">
          <StyledPaper>
            <LoadingContainer>
              <CircularProgress size={48} sx={{ color: '#00830e' }} />
              <Typography variant="h6" color="text.secondary">
                Cargando horarios...
              </Typography>
            </LoadingContainer>
          </StyledPaper>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer maxWidth="lg">
        <Fade in timeout={400}>
          <Box>
            <PageTitle>
              <span className="icon">🔍</span>
              Consulta de Horarios
            </PageTitle>

            {/* Botones de exportación visibles solo para administradores */}
            {esAdministrador && (
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5, 
                mb: 3, 
                justifyContent: { xs: 'center', md: 'flex-end' },
                flexWrap: 'wrap'
              }}>
                <ExportButton
                  variant="outlined"
                  startIcon={<GetAppIcon />}
                  onClick={() => exportToXLSX()}
                  size={isMobile ? 'small' : 'medium'}
                >
                  Exportar Excel
                </ExportButton>
                <ExportButton
                  variant="contained"
                  color="primary"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={() => exportToPDF()}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    background: 'linear-gradient(135deg, #00830e, #4caf50)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #006b0b, #388e3c)',
                    },
                  }}
                >
                  Exportar PDF
                </ExportButton>
              </Box>
            )}
            
            <StyledPaper elevation={0}>
              {/* Filtros de búsqueda */}
              <FilterCard>
                <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      alignItems="center"
                      justifyContent="center"
                    >
                      <IconButton 
                        onClick={retrocederSemana} 
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0, 131, 14, 0.1)',
                          '&:hover': { bgcolor: 'rgba(0, 131, 14, 0.2)' },
                        }}
                      >
                        <ArrowBackIosNewIcon fontSize="small" />
                      </IconButton>
                      
                      <CustomDateSelector />
                      
                      <IconButton 
                        onClick={avanzarSemana} 
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0, 131, 14, 0.1)',
                          '&:hover': { bgcolor: 'rgba(0, 131, 14, 0.2)' },
                        }}
                      >
                        <ArrowForwardIosIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                      <InputLabel id="departamento-select-label">Departamento</InputLabel>
                      <Select
                        labelId="departamento-select-label"
                        value={departamentoSeleccionado}
                        label="Departamento"
                        onChange={(e) => {
                          setDepartamentoSeleccionado(e.target.value);
                          setColaboradorSeleccionado(null);
                        }}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {departamentos.map((depto) => (
                          <MenuItem key={depto} value={depto}>{depto}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      options={usuarios}
                      getOptionLabel={(option) => `${option.nombre} ${option.apellidos}`}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Buscar colaborador"
                          size={isMobile ? 'small' : 'medium'}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {params.InputProps.endAdornment}
                                <SearchIcon color="action" />
                              </>
                            ),
                            sx: { borderRadius: 2 }
                          }}
                        />
                      )}
                      value={colaboradorSeleccionado}
                      onChange={(event, newValue) => {
                        setColaboradorSeleccionado(newValue);
                        if (newValue) {
                          setDepartamentoSeleccionado(newValue.departamento);
                        }
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                    />
                  </Grid>
                </Grid>
              </FilterCard>

              {/* Header de la semana */}
              <WeekHeader>
                <AccessTimeIcon />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', md: '1.15rem' } }}>
                  Semana del {format(semanaSeleccionada, "d 'de' MMMM", { locale: es })} al {format(addDays(semanaSeleccionada, 6), "d 'de' MMMM yyyy", { locale: es })}
                </Typography>
              </WeekHeader>
        
              {/* Lista de horarios */}
              {!horariosRegistros[semanaKey] ? (
                <Box sx={{ 
                  my: 6, 
                  textAlign: 'center',
                  py: 4,
                  px: 2,
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 3,
                }}>
                  <AccessTimeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay registros de horarios para esta semana
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                    Selecciona otra semana o espera a que se asignen horarios
                  </Typography>
                </Box>
              ) : usuariosFiltrados.length === 0 ? (
                <Box sx={{ 
                  my: 6, 
                  textAlign: 'center',
                  py: 4,
                  px: 2,
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: 3,
                }}>
                  <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No se encontraron colaboradores
                  </Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                    Ajusta los filtros de búsqueda para ver resultados
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {usuariosFiltrados.map(usuario => {
                    const horariosUsuario = horariosRegistros[semanaKey]?.[usuario.id];
                    const horasTotales = calcularHorasTotales(usuario.id);
                    const expandido = expandidosPorUsuario[usuario.id] || false;
                    const horasExcedidas = horasTotales > 48;
                    const descansoInsuficiente = verificarDescansoEntreTurnos(usuario.id).tieneInfraccion;
                    
                    return (
                      <UserCard key={usuario.id}>
                        <CardHeader
                          avatar={
                            <Avatar 
                              sx={{ 
                                bgcolor: horasExcedidas ? 'error.main' : 'primary.main',
                                width: { xs: 40, md: 48 },
                                height: { xs: 40, md: 48 },
                              }}
                            >
                              {usuario.nombre.charAt(0)}{usuario.apellidos.charAt(0)}
                            </Avatar>
                          }
                          title={
                            <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 600 }}>
                              {usuario.nombre} {usuario.apellidos}
                            </Typography>
                          }
                          subheader={
                            <Typography variant="body2" color="text.secondary">
                              {usuario.cargo} • {usuario.departamento}
                            </Typography>
                          }
                          action={
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: 1
                            }}>
                              <HoursChip 
                                label={`${horasTotales.toFixed(1)}h`}
                                exceeded={horasExcedidas}
                                color={horasExcedidas ? "error" : "default"}
                                size="small"
                                icon={<AccessTimeIcon />}
                                onClick={() => {
                                  const infraccion = verificarInfracciones(usuario.id);
                                  if (infraccion.tieneInfraccion) {
                                    abrirModalSugerencias(usuario);
                                  }
                                }}
                                sx={{ cursor: 'pointer' }}
                              />
                              {descansoInsuficiente && (
                                <Chip 
                                  label={isMobile ? '⚠️' : 'Descanso ↓'}
                                  color="warning"
                                  size="small"
                                  icon={!isMobile && <WarningAmberIcon />}
                                  onClick={() => abrirModalSugerencias(usuario)}
                                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                                />
                              )}
                              <IconButton 
                                onClick={() => toggleExpandirUsuario(usuario.id)}
                                aria-expanded={expandido}
                                aria-label="mostrar más"
                                size={isMobile ? 'small' : 'medium'}
                                sx={{
                                  bgcolor: expandido ? 'rgba(0, 131, 14, 0.1)' : 'transparent',
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                {expandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </Box>
                          }
                          sx={{
                            '& .MuiCardHeader-content': {
                              overflow: 'hidden'
                            }
                          }}
                        />
                        <Collapse in={expandido} timeout="auto" unmountOnExit>
                          <CardContent sx={{ p: { xs: 1.5, md: 2.5 }, pt: { xs: 0, md: 0 } }}>
                            <Box sx={{ 
                              display: { xs: 'none', md: 'block' } 
                            }}>
                              <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: 'rgba(0, 131, 14, 0.05)' }}>
                                      <TableCell sx={{ fontWeight: 600 }}>Día</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                                      <TableCell sx={{ fontWeight: 600 }}>Horario</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {diasSemana.map((dia, index) => {
                                      const diaKey = `dia${index + 1}`;
                                      const fecha = format(addDays(semanaSeleccionada, index), "d MMM", { locale: es });
                                      const horario = formatearHorario(horariosUsuario, diaKey);
                                      
                                      return (
                                        <StyledTableRow key={diaKey}>
                                          <TableCell sx={{ fontWeight: 500 }}>{dia}</TableCell>
                                          <TableCell>{fecha}</TableCell>
                                          <TimeCell tipo={horario.tipo}>
                                            {horario.texto}
                                          </TimeCell>
                                        </StyledTableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>

                            {/* Vista móvil con lista */}
                            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                              <List dense sx={{ py: 0 }}>
                                {diasSemana.map((dia, index) => {
                                  const diaKey = `dia${index + 1}`;
                                  const fecha = format(addDays(semanaSeleccionada, index), "d MMM", { locale: es });
                                  const horario = formatearHorario(horariosUsuario, diaKey);
                                  
                                  return (
                                    <ListItem 
                                      key={diaKey} 
                                      divider
                                      sx={{ 
                                        py: 1.5,
                                        borderRadius: 2,
                                        mb: 0.5,
                                        bgcolor: horario.tipo === 'descanso' ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                                      }}
                                    >
                                      <ListItemAvatar>
                                        <Avatar 
                                          sx={{ 
                                            width: 36, 
                                            height: 36, 
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            bgcolor: horario.tipo === 'teletrabajo' 
                                              ? '#2e7d32' 
                                              : horario.tipo === 'personalizado' 
                                              ? 'primary.main' 
                                              : horario.tipo === 'descanso'
                                              ? 'grey.400'
                                              : 'grey.500'
                                          }}
                                        >
                                          {dia.slice(0, 2)}
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                        primary={
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {dia} • {fecha}
                                          </Typography>
                                        }
                                        secondary={
                                          <Typography 
                                            variant="body2" 
                                            sx={{ 
                                              color: horario.tipo === 'descanso' 
                                                ? 'text.secondary' 
                                                : 'text.primary',
                                              fontWeight: horario.tipo === 'descanso' ? 400 : 500,
                                              mt: 0.5
                                            }}
                                          >
                                            {horario.texto}
                                          </Typography>
                                        }
                                      />
                                    </ListItem>
                                  );
                                })}
                              </List>
                            </Box>
                          </CardContent>
                        </Collapse>
                      </UserCard>
                    );
                  })}
                </Box>
              )}
            </StyledPaper>
          </Box>
        </Fade>
        
        {/* Modal de sugerencias */}
        <ModalSugerencias 
          open={sugerenciasModalOpen}
          onClose={cerrarModalSugerencias}
          usuarioInfractor={usuarioInfractor}
          usuariosSugeridos={usuariosSugeridos}
          tipoInfraccion={tipoInfraccion}
          detalleInfraccion={detalleInfraccion}
          calcularHorasTotales={calcularHorasTotales}
        />
      </ContentContainer>
    </PageContainer>
  );
};

// Modal de sugerencias de usuarios alternativos
const ModalSugerencias = ({ 
  open, 
  onClose, 
  usuarioInfractor, 
  usuariosSugeridos, 
  tipoInfraccion, 
  detalleInfraccion,
  calcularHorasTotales
}) => {
  if (!usuarioInfractor) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Alerta de Infracción de Reglas
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          <strong>{usuarioInfractor.nombre} {usuarioInfractor.apellidos}</strong> - {usuarioInfractor.departamento}
        </DialogContentText>
        
        <Typography variant="body1" color="error" gutterBottom>
          <strong>Problema detectado:</strong> {detalleInfraccion}
        </Typography>
        
        {usuariosSugeridos.length > 0 ? (
          <>
            <Typography variant="body1" sx={{ mt: 3, mb: 2 }}>
              <strong>Sugerencias de colaboradores alternativos:</strong>
            </Typography>
            
            <List sx={{ bgcolor: 'background.paper' }}>
              {usuariosSugeridos.map((usuario, index) => (
                <React.Fragment key={usuario.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>{usuario.nombre.charAt(0)}{usuario.apellidos.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${usuario.nombre} ${usuario.apellidos}`}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {usuario.cargo} - {usuario.departamento}
                          </Typography>
                          <br />
                          {`Horas asignadas: ${calcularHorasTotales(usuario.id).toFixed(1)} de 48 horas`}
                        </>
                      }
                    />
                  </ListItem>
                  {index < usuariosSugeridos.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </>
        ) : (
          <Typography variant="body1" sx={{ mt: 3, color: 'warning.main' }}>
            No se encontraron colaboradores disponibles que puedan sustituir a este usuario sin infringir las reglas.
            Se recomienda considerar la contratación de personal temporal o ajustar los horarios.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConsultaHorarios;

// --- Helpers de exportación ---
// Nota: la antigua función buildTableHtml fue eliminada porque ya no se usa (generaba un warning de ESLint).

const exportToXLSX = () => {
  // Intenta usar snapshots en localStorage si las variables locales no están disponibles
  const usuariosLocal = JSON.parse(localStorage.getItem('usuarios_export')) || [];
  const registrosLocal = JSON.parse(localStorage.getItem('horariosRegistros_export')) || {};
  const semanaLocal = new Date(localStorage.getItem('semanaSeleccionada_export') || Date.now());

  // Preferir datos en memoria si estamos en el componente (window scope)
  const usuariosData = (typeof window !== 'undefined' && window.__usuarios_export__) ? window.__usuarios_export__ : usuariosLocal;
  const registrosData = (typeof window !== 'undefined' && window.__registros_export__) ? window.__registros_export__ : registrosLocal;
  const semanaData = (typeof window !== 'undefined' && window.__semana_export__) ? new Date(window.__semana_export__) : semanaLocal;

  const semanaKey = (() => { const y = getYear(semanaData); const w = getISOWeek(semanaData); return `${y}-${w}`; })();

  // Construir filas
  const rows = [];
  // Usar nombres reales de días en español
  const header = ['Colaborador', 'Departamento', ...diasSemana];
  rows.push(header);

  usuariosData.forEach(u => {
    const row = [`${u.nombre} ${u.apellidos}`, u.departamento || ''];
    for (let i = 1; i <= 7; i++) {
      const diaKey = `dia${i}`;
      const turno = registrosData[semanaKey] && registrosData[semanaKey][u.id] && registrosData[semanaKey][u.id][diaKey];
      if (!turno) row.push('Sin horario');
      else if (turno.tipo === 'descanso') row.push('Descanso');
      else row.push(`${turno.horaInicio} - ${turno.horaFin} (${(turno.horas||0).toFixed(1)}h)`);
    }
    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Ajustes de ancho de columnas
  ws['!cols'] = [{ wch: 30 }, { wch: 20 }].concat(new Array(7).fill({ wch: 24 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Semana ${semanaKey}`);
  XLSX.writeFile(wb, `reporte_horarios_${semanaKey}.xlsx`);
};

// Actualizar exportToPDF para agrupar por departamento
const exportToPDF = () => {
  const usuariosLocal = JSON.parse(localStorage.getItem('usuarios_export')) || [];
  const registrosLocal = JSON.parse(localStorage.getItem('horariosRegistros_export')) || {};
  const semanaLocal = new Date(localStorage.getItem('semanaSeleccionada_export') || Date.now());

  const usuariosData = (typeof window !== 'undefined' && window.__usuarios_export__) ? window.__usuarios_export__ : usuariosLocal;
  const registrosData = (typeof window !== 'undefined' && window.__registros_export__) ? window.__registros_export__ : registrosLocal;
  const semanaData = (typeof window !== 'undefined' && window.__semana_export__) ? new Date(window.__semana_export__) : semanaLocal;

  // Agrupar por departamento
  const grupos = {};
  usuariosData.forEach(u => {
    const dept = u.departamento || 'Sin Departamento';
    if (!grupos[dept]) grupos[dept] = [];
    grupos[dept].push(u);
  });

  let html = `<!doctype html><html><head><meta charset="utf-8"><title>Reporte de Horarios</title>`;
  html += `<style>
    body{font-family: Arial, sans-serif; color:#333}
    .header{background:#00830e;color:#fff;padding:12px 16px;border-radius:6px}
    .title{font-size:18px;margin:0}
    table{width:100%;border-collapse:collapse;margin-top:8px;margin-bottom:16px}
    th{background:#f0f0f0;text-align:left;padding:8px;border-bottom:1px solid #ddd}
    td{padding:8px;border-bottom:1px solid #eee}
    .dept{background:#f5f5f5;padding:8px;margin-top:12px;border-left:6px solid #00830e}
  </style>`;
  html += `</head><body>`;
  html += `<div class="header"><h2 class="title">Reporte de Horarios - Semana desde ${format(semanaData, "d 'de' MMMM yyyy", { locale: es })}</h2></div>`;

  Object.keys(grupos).forEach(dept => {
    html += `<div class="dept"><strong>${dept}</strong></div>`;
  html += `<table><thead><tr><th>Colaborador</th>`;
  diasSemana.forEach(d => { html += `<th>${d}</th>`; });
  html += `</tr></thead><tbody>`;
    grupos[dept].forEach(u => {
      html += `<tr><td>${u.nombre} ${u.apellidos}</td>`;
      const semanaKey = (() => { const y = getYear(semanaData); const w = getISOWeek(semanaData); return `${y}-${w}`; })();
      for (let i=1;i<=7;i++){
        const diaKey = `dia${i}`;
        const turno = registrosData[semanaKey] && registrosData[semanaKey][u.id] && registrosData[semanaKey][u.id][diaKey];
        if (!turno) html += `<td>Sin horario</td>`;
        else if (turno.tipo === 'descanso') html += `<td>Descanso</td>`;
        else html += `<td>${turno.horaInicio} - ${turno.horaFin} (${(turno.horas||0).toFixed(1)}h)</td>`;
      }
      html += `</tr>`;
    });
    html += `</tbody></table>`;
  });

  html += `</body></html>`;

  const w = window.open('', '_blank');
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.print(); }, 500);
};

