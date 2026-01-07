import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database, auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { obtenerHorasMaximas } from '../../utils/contratoUtils';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Skeleton,
  Dialog,
  DialogContent,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Slide,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import EventNoteIcon from '@mui/icons-material/EventNote';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CloseIcon from '@mui/icons-material/Close';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format, subWeeks, startOfWeek, getISOWeek, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { NO_SUMAN_HORAS } from '../../utils/horariosConstants';

// Styled Components para diseño moderno
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
  [theme.breakpoints.up('md')]: {
    paddingBottom: theme.spacing(4),
  },
}));

const WelcomeCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #00830e 0%, #006c0b 50%, #005a09 100%)',
  color: 'white',
  borderRadius: 24,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 10px 40px rgba(0, 131, 14, 0.3)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-20%',
    width: '60%',
    height: '150%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
    borderRadius: '50%',
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: 20,
    padding: theme.spacing(2.5),
    marginLeft: theme.spacing(-2),
    marginRight: theme.spacing(-2),
    marginTop: theme.spacing(-2),
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  transition: theme.breakpoints.down('sm') ? 'none' : 'transform 0.2s ease',
  height: '100%',
  [theme.breakpoints.up('md')]: {
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
    },
  },
}));

const QuickStatBox = styled(Box)(({ theme, color = '#00830e' }) => ({
  background: alpha(color, 0.08),
  borderRadius: 16,
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  transition: 'all 0.2s ease',
  '&:hover': {
    background: alpha(color, 0.12),
  },
}));

const UserChip = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 1.5),
  backgroundColor: 'white',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
  },
}));

const ChartCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  overflow: 'hidden',
  height: '100%',
}));

const ChartHeader = styled(CardHeader)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
  },
  '& .MuiCardHeader-avatar': {
    color: '#00830e',
  },
}));



// Colores para los gráficos - Paleta moderna
const COLORS = {
  presencial: '#3b82f6',
  teletrabajo: '#10b981',
  cambio: '#f59e0b',
  descanso: '#94a3b8',
  vacaciones: '#f97316',
  feriado: '#ef4444',
  permiso: '#8b5cf6',
  'tarde-libre': '#64748b',
  personalizado: '#3b82f6',
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f97316', '#94a3b8', '#ef4444', '#8b5cf6', '#64748b'];

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [horasExtras, setHorasExtras] = useState(0);
  const [horasDisponibles, setHorasDisponibles] = useState(40);
  const [estadisticas, setEstadisticas] = useState({
    semanaActual: {},
    ultimasSemanas: [],
    distribucionTipos: [],
    rendimientoSemanal: []
  });
  const [usuariosNoTrabajan, setUsuariosNoTrabajan] = useState([]);
  const [usuariosTeletrabajo, setUsuariosTeletrabajo] = useState([]);
  const [modalUsuarios, setModalUsuarios] = useState({ open: false, tipo: '', usuarios: [] });
  const navigate = useNavigate();
  
  // Flag para prevenir actualizaciones de estado después de desmontar
  const mountedRef = React.useRef(true);
  
  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Función para obtener la clave de la semana
  const obtenerClaveSemana = (fecha) => {
    const year = getYear(fecha);
    const week = getISOWeek(fecha);
    return `${year}-${week}`;
  };

  // Función para procesar estadísticas de horarios
  const procesarEstadisticas = async (userId) => {
    try {
      const semanaActual = startOfWeek(new Date(), { weekStartsOn: 1 });
      const estadisticasData = {
        semanaActual: {},
        ultimasSemanas: [],
        distribucionTipos: [],
        rendimientoSemanal: []
      };

      // Obtener datos de las últimas 8 semanas
      const semanas = [];
      for (let i = 0; i < 8; i++) {
        const fecha = subWeeks(semanaActual, i);
        const claveSemana = obtenerClaveSemana(fecha);
        semanas.push({ fecha, claveSemana });
      }

      // Obtener horarios de todas las semanas
      const promesasHorarios = semanas.map(async ({ fecha, claveSemana }) => {
        const horariosRef = ref(database, `horarios_registros/${claveSemana}/${userId}`);
        const snapshot = await get(horariosRef);
        return {
          fecha,
          claveSemana,
          horarios: snapshot.exists() ? snapshot.val() : {}
        };
      });

      const resultados = await Promise.all(promesasHorarios);

      // Procesar datos de la semana actual
      const semanaActualData = resultados[0];
      if (semanaActualData.horarios) {
        const tipos = {};
        let horasTotalesSemana = 0;
        let horasTranscurridas = 0;
        
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const currentDayIndex = dayOfWeek === 0 ? 7 : dayOfWeek;

        Object.entries(semanaActualData.horarios).forEach(([diaKey, horario]) => {
          if (horario && horario.tipo) {
            // Si es descanso, contamos 24 horas por día
            if (horario.tipo === 'descanso') {
              tipos['descanso'] = (tipos['descanso'] || 0) + 24;
            } else {
              tipos[horario.tipo] = (tipos[horario.tipo] || 0) + (horario.horas || 0);
            }

            if (!['descanso', 'vacaciones', 'feriado', 'permiso', 'tarde-libre'].includes(horario.tipo)) {
              const horas = horario.horas || 0;
              horasTotalesSemana += horas;
              
              // El diaKey suele ser 'dia1', 'dia2', etc.
              const diaNum = parseInt(diaKey.replace('dia', ''));
              if (!isNaN(diaNum) && diaNum <= currentDayIndex) {
                horasTranscurridas += horas;
              }
            }
          }
        });

        estadisticasData.semanaActual = { 
          tipos, 
          horasTotales: horasTranscurridas,
          horasPlanificadas: horasTotalesSemana 
        };
      }

      // Procesar distribución de tipos de asignación
      const contadorTipos = {};
      const rendimientoPorSemana = [];

      resultados.forEach(({ fecha, horarios }) => {
        let horasSemanales = 0;
        const tiposSemana = {};

        Object.values(horarios).forEach(horario => {
          if (horario && horario.tipo) {
            contadorTipos[horario.tipo] = (contadorTipos[horario.tipo] || 0) + 1;
            
            // Contar 24h para días de descanso, de lo contrario usar horas del registro
            if (horario.tipo === 'descanso') {
              tiposSemana['descanso'] = (tiposSemana['descanso'] || 0) + 24;
            } else {
              tiposSemana[horario.tipo] = (tiposSemana[horario.tipo] || 0) + (horario.horas || 0);
            }
            
            if (!['descanso', 'vacaciones', 'feriado', 'permiso', 'tarde-libre'].includes(horario.tipo)) {
              horasSemanales += horario.horas || 0;
            }
          }
        });

        rendimientoPorSemana.push({
          semana: format(fecha, 'dd/MM', { locale: es }),
          horas: horasSemanales,
          ...tiposSemana
        });
      });

      // Convertir contadores a formato para gráfico circular
      estadisticasData.distribucionTipos = Object.entries(contadorTipos).map(([tipo, cantidad]) => ({
        name: tipo.charAt(0).toUpperCase() + tipo.slice(1),
        value: cantidad,
        color: COLORS[tipo] || CHART_COLORS[Object.keys(contadorTipos).indexOf(tipo) % CHART_COLORS.length]
      }));

      estadisticasData.rendimientoSemanal = rendimientoPorSemana.reverse(); // Mostrar en orden cronológico

      return estadisticasData;
    } catch (error) {
      console.error('Error al procesar estadísticas:', error);
      return {
        semanaActual: {},
        ultimasSemanas: [],
        distribucionTipos: [],
        rendimientoSemanal: []
      };
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/');
          return;
        }

        const userRef = ref(database, `usuarios/${user.uid}`);
        const horasExtrasRef = ref(database, 'horas_extras');

        const [userSnapshot, horasExtrasSnapshot] = await Promise.all([
          get(userRef),
          get(horasExtrasRef)
        ]);

        if (userSnapshot.exists() && mountedRef.current) {
          const userData = userSnapshot.val();
          setUserData(userData);

          // Las horas extras se guardan en un objeto con todos los usuarios
          const todasLasHorasExtras = horasExtrasSnapshot.exists() ? horasExtrasSnapshot.val() : {};
          const horasExtrasUsuario = todasLasHorasExtras[user.uid] || 0;
          
          setHorasExtras(horasExtrasUsuario);
          
          // Obtener las horas máximas según el tipo de contrato del usuario
          const horasMaximas = obtenerHorasMaximas(userData?.tipoContrato || 'Operativo');
          const horasMinimas = Math.max(horasMaximas * 0.8, 30); // Mínimo 80% de las horas del contrato o 30 horas
          setHorasDisponibles(Math.max(horasMaximas - horasExtrasUsuario, horasMinimas));

          // Procesar estadísticas
          const stats = await procesarEstadisticas(user.uid);
          if (mountedRef.current) {
            setEstadisticas(stats);
          }
        } else {
          console.log('No se encontraron datos del usuario');
        }

        // Obtener usuarios y horarios de esta semana para identificar quiénes no trabajan hoy
        const usuariosRef = ref(database, 'usuarios');
        const usuariosSnap = await get(usuariosRef);
        const usuariosArray = usuariosSnap.exists()
          ? Object.entries(usuariosSnap.val()).map(([id, data]) => ({ id, ...data }))
          : [];
        const today = new Date();
        const weekKey = obtenerClaveSemana(today);
        const diaIndex = today.getDay() === 0 ? 7 : today.getDay(); // Domingo=7
        const horariosSemRef = ref(database, `horarios_registros/${weekKey}`);
        const horariosSemSnap = await get(horariosSemRef);
        const horariosSemana = horariosSemSnap.exists() ? horariosSemSnap.val() : {};
        const usuariosFuera = usuariosArray.filter(u => {
          const userHorarios = horariosSemana[u.id] || {};
          const turnoHoy = userHorarios[`dia${diaIndex}`];
          // Usuarios fuera de oficina hoy (no suman horas)
          return turnoHoy && NO_SUMAN_HORAS.includes(turnoHoy.tipo);
        });
        const usuariosTele = usuariosArray.filter(u => {
          const userHorarios = horariosSemana[u.id] || {};
          const turnoHoy = userHorarios[`dia${diaIndex}`];
          // Usuarios en teletrabajo hoy
          return turnoHoy && turnoHoy.tipo === 'teletrabajo';
        });
        if (mountedRef.current) {
          setUsuariosNoTrabajan(usuariosFuera);
          setUsuariosTeletrabajo(usuariosTele);
        }

      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  if (loading) {
    return (
      <PageContainer>
        <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
          <Skeleton variant="rounded" height={180} sx={{ borderRadius: 5, mb: 3 }} />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={6} md={3} key={i}>
                <Skeleton variant="rounded" height={100} sx={{ borderRadius: 4 }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </PageContainer>
    );
  }

  const horasMaximas = obtenerHorasMaximas(userData?.tipoContrato || 'Operativo');
  const horasPlanificadas = estadisticas.semanaActual.horasPlanificadas || 0;
  const progresoHoras = horasPlanificadas > 0 
    ? ((estadisticas.semanaActual.horasTotales || 0) / horasPlanificadas * 100)
    : 0;

  return (
    <PageContainer>
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        {/* Welcome Card */}
        <WelcomeCard elevation={0}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography 
              variant={isMobile ? 'h5' : 'h4'} 
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              ¡Hola, {userData?.nombre}! 👋
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ opacity: 0.9, mb: 3 }}
            >
              {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </Typography>
            
            {/* Quick Stats */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ 
                  bgcolor: { xs: 'rgba(255,255,255,0.25)', sm: 'rgba(255,255,255,0.15)' }, 
                  borderRadius: 3, 
                  p: 1.5,
                  backdropFilter: { xs: 'none', sm: 'blur(10px)' },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 18 }} />
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Horas Semana</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {estadisticas.semanaActual.horasPlanificadas?.toFixed(0) || '0'}h
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ 
                  bgcolor: { xs: 'rgba(255,255,255,0.25)', sm: 'rgba(255,255,255,0.15)' }, 
                  borderRadius: 3, 
                  p: 1.5,
                  backdropFilter: { xs: 'none', sm: 'blur(10px)' },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 18 }} />
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Progreso</Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {progresoHoras.toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ 
                  bgcolor: { xs: 'rgba(255,255,255,0.25)', sm: 'rgba(255,255,255,0.15)' }, 
                  borderRadius: 3, 
                  p: 1.5,
                  backdropFilter: { xs: 'none', sm: 'blur(10px)' },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <BusinessIcon sx={{ fontSize: 18 }} />
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Departamento</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {userData?.departamento || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ 
                  bgcolor: { xs: 'rgba(255,255,255,0.25)', sm: 'rgba(255,255,255,0.15)' }, 
                  borderRadius: 3, 
                  p: 1.5,
                  backdropFilter: { xs: 'none', sm: 'blur(10px)' },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <BadgeIcon sx={{ fontSize: 18 }} />
                    <Typography variant="caption" sx={{ opacity: 0.9 }}>Cargo</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600,
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}>
                    {userData?.cargo || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </WelcomeCard>

        {/* Horas extras alert */}
        {horasExtras > 0 && (
          <Paper sx={{ 
            p: 2.5, 
            mb: 3, 
            borderRadius: 4, 
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fbbf24',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ScheduleIcon sx={{ color: '#d97706', fontSize: 28 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#92400e' }}>
                  Tienes {horasExtras.toFixed(1)} horas extras acumuladas
                </Typography>
                <Typography variant="caption" sx={{ color: '#a16207' }}>
                  Horas disponibles próxima semana: {horasDisponibles.toFixed(1)}h de {horasMaximas}h
                </Typography>
              </Box>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((horasExtras / 10) * 100, 100)} 
              sx={{ 
                mt: 1.5, 
                height: 6, 
                borderRadius: 3,
                bgcolor: 'rgba(217, 119, 6, 0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#d97706',
                  borderRadius: 3,
                }
              }} 
            />
          </Paper>
        )}

        {/* Usuarios Fuera de Oficina y Teletrabajo */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <StatsCard>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: alpha('#ef4444', 0.1) 
                  }}>
                    <WorkIcon sx={{ color: '#ef4444' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Fuera de Oficina
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {usuariosNoTrabajan.length} personas hoy
                    </Typography>
                  </Box>
                </Box>
                
                {usuariosNoTrabajan.length > 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1,
                    maxHeight: 180,
                    overflowY: 'auto',
                    pr: 1,
                  }}>
                    {usuariosNoTrabajan.slice(0, isMobile ? 4 : 8).map(u => (
                      <UserChip key={u.id}>
                        <Avatar 
                          sx={{ 
                            width: 28, 
                            height: 28, 
                            fontSize: 12,
                            bgcolor: '#ef4444' 
                          }}
                        >
                          {u.nombre.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                            {u.nombre}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
                            {u.departamento}
                          </Typography>
                        </Box>
                      </UserChip>
                    ))}
                    {usuariosNoTrabajan.length > (isMobile ? 4 : 8) && (
                      <Chip 
                        label={`+${usuariosNoTrabajan.length - (isMobile ? 4 : 8)} más`} 
                        size="small"
                        onClick={() => setModalUsuarios({ 
                          open: true, 
                          tipo: 'fuera', 
                          usuarios: usuariosNoTrabajan 
                        })}
                        sx={{ 
                          bgcolor: alpha('#ef4444', 0.1), 
                          color: '#ef4444',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: alpha('#ef4444', 0.2),
                          }
                        }}
                      />
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    ✓ Todos en oficina hoy
                  </Typography>
                )}
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <StatsCard>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: alpha('#10b981', 0.1) 
                  }}>
                    <HomeWorkIcon sx={{ color: '#10b981' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Teletrabajo
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {usuariosTeletrabajo.length} personas hoy
                    </Typography>
                  </Box>
                </Box>
                
                {usuariosTeletrabajo.length > 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1,
                    maxHeight: 180,
                    overflowY: 'auto',
                    pr: 1,
                  }}>
                    {usuariosTeletrabajo.slice(0, isMobile ? 4 : 8).map(u => (
                      <UserChip key={u.id}>
                        <Avatar 
                          sx={{ 
                            width: 28, 
                            height: 28, 
                            fontSize: 12,
                            bgcolor: '#10b981' 
                          }}
                        >
                          {u.nombre.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                            {u.nombre}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
                            {u.departamento}
                          </Typography>
                        </Box>
                      </UserChip>
                    ))}
                    {usuariosTeletrabajo.length > (isMobile ? 4 : 8) && (
                      <Chip 
                        label={`+${usuariosTeletrabajo.length - (isMobile ? 4 : 8)} más`} 
                        size="small"
                        onClick={() => setModalUsuarios({ 
                          open: true, 
                          tipo: 'teletrabajo', 
                          usuarios: usuariosTeletrabajo 
                        })}
                        sx={{ 
                          bgcolor: alpha('#10b981', 0.1), 
                          color: '#10b981',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: alpha('#10b981', 0.2),
                          }
                        }}
                      />
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    Nadie en teletrabajo hoy
                  </Typography>
                )}
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>

        {/* Gráficos Section */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
          📊 Estadísticas de Rendimiento
        </Typography>
        
        <Grid container spacing={2}>
          {/* Resumen Semanal - Mobile First */}
          <Grid item xs={12} md={6}>
            <ChartCard>
              <ChartHeader 
                title="Resumen Semana Actual"
                avatar={<EventNoteIcon />}
              />
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                {estadisticas.semanaActual.tipos && Object.keys(estadisticas.semanaActual.tipos).length > 0 ? (
                  <Box>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Typography variant="h3" sx={{ color: '#00830e', fontWeight: 700 }}>
                        {estadisticas.semanaActual.horasTotales?.toFixed(0) || '0'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        horas trabajadas
                      </Typography>
                    </Box>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(progresoHoras, 100)} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 5, 
                        mb: 3,
                        bgcolor: alpha('#00830e', 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#00830e',
                          borderRadius: 5,
                        }
                      }} 
                    />
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(estadisticas.semanaActual.tipos).map(([tipo, horas]) => (
                        <QuickStatBox key={tipo} color={COLORS[tipo] || '#94a3b8'} sx={{ flex: '1 1 45%', minWidth: 120 }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              bgcolor: COLORS[tipo] || '#94a3b8', 
                              borderRadius: '50%',
                              flexShrink: 0,
                            }} 
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" sx={{ 
                              color: 'text.secondary',
                              display: 'block',
                              textTransform: 'capitalize',
                            }}>
                              {tipo}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {typeof horas === 'number' ? horas.toFixed(1) : horas}h
                            </Typography>
                          </Box>
                        </QuickStatBox>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <WorkIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                    <Typography color="text.secondary">
                      No hay asignaciones esta semana
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </ChartCard>
          </Grid>

          {/* Gráfico Circular */}
          <Grid item xs={12} md={6}>
            <ChartCard>
              <ChartHeader 
                title="Distribución de Asignaciones"
                avatar={<PieChartIcon />}
              />
              <CardContent sx={{ height: isMobile ? 260 : 300 }}>
                {estadisticas.distribucionTipos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadisticas.distribucionTipos}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={isMobile ? 70 : 90}
                        innerRadius={isMobile ? 35 : 45}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {estadisticas.distribucionTipos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [value, name]}
                        contentStyle={{ 
                          borderRadius: 12, 
                          border: 'none', 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)' 
                        }}
                      />
                      {isMobile && <Legend />}
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                )}
              </CardContent>
            </ChartCard>
          </Grid>

          {/* Gráfico de Barras */}
          <Grid item xs={12} md={6}>
            <ChartCard>
              <ChartHeader 
                title="Horas por Semana"
                avatar={<BarChartIcon />}
              />
              <CardContent sx={{ height: isMobile ? 260 : 300 }}>
                {estadisticas.rendimientoSemanal.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={estadisticas.rendimientoSemanal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="semana" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value?.toFixed(1)}h`, 'Horas']}
                        contentStyle={{ 
                          borderRadius: 12, 
                          border: 'none', 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)' 
                        }}
                      />
                      <Bar 
                        dataKey="horas" 
                        fill="#00830e" 
                        radius={[6, 6, 0, 0]}
                        name="Horas"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                )}
              </CardContent>
            </ChartCard>
          </Grid>

          {/* Gráfico de Líneas */}
          <Grid item xs={12} md={6}>
            <ChartCard>
              <ChartHeader 
                title="Tendencia por Tipo"
                avatar={<TrendingUpIcon />}
              />
              <CardContent sx={{ height: isMobile ? 260 : 300 }}>
                {estadisticas.rendimientoSemanal.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={estadisticas.rendimientoSemanal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="semana" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value?.toFixed(1)}h`, 
                          name.charAt(0).toUpperCase() + name.slice(1)
                        ]}
                        contentStyle={{ 
                          borderRadius: 12, 
                          border: 'none', 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)' 
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="personalizado" 
                        stroke={COLORS.presencial} 
                        name="Presencial" 
                        strokeWidth={2.5}
                        dot={{ strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="teletrabajo" 
                        stroke={COLORS.teletrabajo} 
                        name="Teletrabajo" 
                        strokeWidth={2.5}
                        dot={{ strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cambio" 
                        stroke={COLORS.cambio} 
                        name="Cambio" 
                        strokeWidth={2.5}
                        dot={{ strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                )}
              </CardContent>
            </ChartCard>
          </Grid>
        </Grid>
      </Container>

      {/* Modal de Usuarios */}
      <Dialog
        open={modalUsuarios.open}
        onClose={() => setModalUsuarios({ open: false, tipo: '', usuarios: [] })}
        fullWidth
        maxWidth="xs"
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
        PaperProps={{
          sx: {
            borderRadius: { xs: '20px 20px 0 0', sm: 3 },
            position: { xs: 'fixed', sm: 'relative' },
            bottom: { xs: 0, sm: 'auto' },
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '80vh', sm: '70vh' },
          }
        }}
      >
        {/* Header del Modal */}
        <Box sx={{ 
          background: modalUsuarios.tipo === 'fuera' 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {modalUsuarios.tipo === 'fuera' ? (
              <WorkIcon />
            ) : (
              <HomeWorkIcon />
            )}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {modalUsuarios.tipo === 'fuera' ? 'Fuera de Oficina' : 'Teletrabajo'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {modalUsuarios.usuarios.length} personas hoy
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={() => setModalUsuarios({ open: false, tipo: '', usuarios: [] })}
            sx={{ color: 'white' }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          <List sx={{ py: 0 }}>
            {modalUsuarios.usuarios.map((usuario, index) => (
              <ListItem
                key={usuario.id}
                sx={{
                  borderBottom: index < modalUsuarios.usuarios.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  py: 1.5,
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: modalUsuarios.tipo === 'fuera' ? '#ef4444' : '#10b981',
                      width: 40,
                      height: 40,
                    }}
                  >
                    {usuario.nombre?.charAt(0) || '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {usuario.nombre} {usuario.apellidos || ''}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <BusinessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {usuario.departamento || 'Sin departamento'}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default Dashboard;