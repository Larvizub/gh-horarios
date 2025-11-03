import React, { useState, useEffect } from 'react';
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
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { format, addDays, startOfWeek, getISOWeek, getYear, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import GetAppIcon from '@mui/icons-material/GetApp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { departamentos } from '../../utils/horariosConstants';
import * as XLSX from 'xlsx';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    borderRadius: '12px',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    borderRadius: '8px',
    margin: theme.spacing(0.5),
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const TimeCell = styled(TableCell)(({ theme, tipo }) => ({
  backgroundColor: tipo === 'teletrabajo' || tipo === 'tele-presencial'
    ? 'rgba(46, 125, 50, 0.06)'
    : (tipo === 'personalizado' ? 'rgba(63, 81, 181, 0.06)' : 'inherit'),
  fontWeight: tipo === 'descanso' ? 'normal' : 'bold',
  color: tipo === 'descanso' ? theme.palette.text.secondary : theme.palette.text.primary,
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
  'dia-brigada': 'Día por Brigada'
};

const ConsultaHorarios = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
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
        if (usuariosSnapshot.exists()) {
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
        setLoading(false);
      }
    };
    
    cargarDatos();
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ 
      mt: { xs: 2, md: 4 }, 
      mb: { xs: 2, md: 4 },
      px: { xs: 1, sm: 2, md: 3 }
    }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: 'var(--primary-color)',
          textAlign: { xs: 'center', md: 'left' },
          mb: { xs: 2, md: 3 },
          fontSize: { xs: '1.5rem', md: '2.125rem' }
        }}
      >
        Consulta de Horarios
      </Typography>
      {/* Botones de exportación visibles solo para administradores */}
      {esAdministrador && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: { xs: 'center', md: 'flex-end' } }}>
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={() => exportToXLSX()}
            size={isMobile ? 'small' : 'medium'}
          >
            Exportar a Excel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => exportToPDF()}
            size={isMobile ? 'small' : 'medium'}
          >
            Exportar a PDF
          </Button>
        </Box>
      )}
      
      <StyledPaper elevation={3} sx={{ mb: { xs: 2, md: 4 }, p: { xs: 1.5, sm: 2, md: 3 } }}>
        {/* Filtros de búsqueda */}
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center" sx={{ mb: { xs: 3, md: 4 } }}>
          <Grid item xs={12} md={4}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={1} 
              alignItems="center"
              sx={{ width: '100%' }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ justifyContent: 'center' }}>
                <IconButton onClick={retrocederSemana} size="small">
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
                
                <CustomDateSelector />
                
                <IconButton onClick={avanzarSemana} size="small">
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              </Stack>
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
        
                        <Typography 
                          variant="h6" 
                          gutterBottom
                          sx={{ 
                            fontSize: { xs: '1rem', md: '1.25rem' },
                            mb: { xs: 2, md: 3 }
                          }}
                        >
                          Semana del {format(semanaSeleccionada, "d 'de' MMMM", { locale: es })} al {format(addDays(semanaSeleccionada, 6), "d 'de' MMMM", { locale: es })}
                        </Typography>
        
        {/* Lista de horarios */}
        {!horariosRegistros[semanaKey] ? (
          <Box sx={{ my: 4, textAlign: 'center' }}>
            <Typography variant="subtitle1" color="text.secondary">
              No hay registros de horarios para esta semana
            </Typography>
          </Box>
        ) : usuariosFiltrados.length === 0 ? (
          <Box sx={{ my: 4, textAlign: 'center' }}>
            <Typography variant="subtitle1" color="text.secondary">
              No se encontraron colaboradores con los filtros aplicados
            </Typography>
          </Box>
        ) : (
          <Box>
            {usuariosFiltrados.map(usuario => {
              const horariosUsuario = horariosRegistros[semanaKey]?.[usuario.id];
              const horasTotales = calcularHorasTotales(usuario.id);
              const expandido = expandidosPorUsuario[usuario.id] || false;
              
              return (
                <Card key={usuario.id} sx={{ 
                  mb: 2, 
                  borderRadius: { xs: '8px', md: '12px' }, 
                  overflow: 'visible' 
                }}>
                  <CardHeader
                    avatar={<PersonIcon />}
                    title={
                      <Typography variant={isMobile ? 'subtitle2' : 'h6'}>
                        {usuario.nombre} {usuario.apellidos}
                      </Typography>
                    }
                    subheader={
                      <Typography variant={isMobile ? 'caption' : 'body2'}>
                        {usuario.cargo} - {usuario.departamento}
                      </Typography>
                    }
                    action={
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 0.5, sm: 1 }
                      }}>
                        <Chip 
                          label={`${horasTotales.toFixed(1)} horas`} 
                          color={horasTotales > 48 ? "error" : "default"}
                          size="small"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            const infraccion = verificarInfracciones(usuario.id);
                            if (infraccion.tieneInfraccion) {
                              abrirModalSugerencias(usuario);
                            }
                          }}
                        />
                        {verificarDescansoEntreTurnos(usuario.id).tieneInfraccion && (
                          <Chip 
                            label={isMobile ? 'Descanso ↓' : 'Descanso insuficiente'}
                            color="warning"
                            size="small"
                            sx={{ cursor: 'pointer' }}
                            onClick={() => abrirModalSugerencias(usuario)}
                          />
                        )}
                        <IconButton 
                          onClick={() => toggleExpandirUsuario(usuario.id)}
                          aria-expanded={expandido}
                          aria-label="mostrar más"
                          size={isMobile ? 'small' : 'medium'}
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
                    <CardContent sx={{ p: { xs: 1, md: 2 } }}>
                      <Box sx={{ 
                        display: { xs: 'none', md: 'block' } 
                      }}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Día</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Horario</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {diasSemana.map((dia, index) => {
                                const diaKey = `dia${index + 1}`;
                                const fecha = format(addDays(semanaSeleccionada, index), "d MMM", { locale: es });
                                const horario = formatearHorario(horariosUsuario, diaKey);
                                
                                return (
                                  <StyledTableRow key={diaKey}>
                                    <TableCell>{dia}</TableCell>
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
                      <Box sx={{ 
                        display: { xs: 'block', md: 'none' } 
                      }}>
                        <List dense>
                          {diasSemana.map((dia, index) => {
                            const diaKey = `dia${index + 1}`;
                            const fecha = format(addDays(semanaSeleccionada, index), "d MMM", { locale: es });
                            const horario = formatearHorario(horariosUsuario, diaKey);
                            
                            return (
                              <ListItem key={diaKey} divider>
                                <ListItemAvatar>
                                  <Avatar 
                                    sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      fontSize: '0.75rem',
                                      bgcolor: horario.tipo === 'teletrabajo' 
                                        ? '#2e7d32' 
                                        : horario.tipo === 'personalizado' 
                                        ? 'primary.main' 
                                        : 'grey.500'
                                    }}
                                  >
                                    {dia.slice(0, 1)}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                      {dia} - {fecha}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: horario.tipo === 'descanso' 
                                          ? 'text.secondary' 
                                          : 'text.primary',
                                        fontWeight: horario.tipo === 'descanso' ? 'normal' : 'medium'
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
                </Card>
              );
            })}
          </Box>
        )}
      </StyledPaper>
      
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
    </Container>
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

