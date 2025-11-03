import React, { useState, useEffect, useCallback } from 'react';
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
  Divider,
  CircularProgress,
  Avatar
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
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



// Colores para los gráficos
const COLORS = {
  presencial: '#3f51b5',
  teletrabajo: '#2e7d32',
  cambio: '#f57c00',
  descanso: '#9e9e9e',
  vacaciones: '#ff9800',
  feriado: '#f44336',
  permiso: '#9c27b0',
  'tarde-libre': '#607d8b'
};

const CHART_COLORS = ['#3f51b5', '#2e7d32', '#f57c00', '#ff9800', '#9e9e9e', '#f44336', '#9c27b0', '#607d8b'];

const Dashboard = () => {
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
  const navigate = useNavigate();

  // Función para obtener la clave de la semana
  const obtenerClaveSemana = useCallback((fecha) => {
    const year = getYear(fecha);
    const week = getISOWeek(fecha);
    return `${year}-${week}`;
  }, []);

  // Función para procesar estadísticas de horarios
  const procesarEstadisticas = useCallback(async (userId) => {
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
        let horasTotales = 0;

        Object.values(semanaActualData.horarios).forEach(horario => {
          if (horario && horario.tipo) {
            tipos[horario.tipo] = (tipos[horario.tipo] || 0) + (horario.horas || 0);
            if (!['descanso', 'vacaciones', 'feriado', 'permiso', 'tarde-libre'].includes(horario.tipo)) {
              horasTotales += horario.horas || 0;
            }
          }
        });

        estadisticasData.semanaActual = { tipos, horasTotales };
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
            tiposSemana[horario.tipo] = (tiposSemana[horario.tipo] || 0) + (horario.horas || 0);
            
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
  }, [obtenerClaveSemana]);  // useCallback dependencies

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

        if (userSnapshot.exists()) {
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
          setEstadisticas(stats);
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
        setUsuariosNoTrabajan(usuariosFuera);
        setUsuariosTeletrabajo(usuariosTele);

      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate, procesarEstadisticas, obtenerClaveSemana]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom sx={{ mb: 4, color: 'var(--text-secondary)' }}>
        Bienvenido, {userData?.nombre} {userData?.apellidos}
      </Typography>

      <Grid container spacing={4}>
        {/* Información de Departamento - Movido arriba */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
              mb: 3
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: 'var(--primary-color)' }}>
              Información de Departamento
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Departamento: <span style={{ color: 'var(--primary-color)' }}>{userData?.departamento}</span>
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Cargo: <span style={{ color: 'var(--primary-color)' }}>{userData?.cargo}</span>
              </Typography>

              {horasExtras > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#fff9c4', borderRadius: '8px' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                    Horas extras acumuladas: {horasExtras.toFixed(1)}h
                  </Typography>
                  <Typography variant="body2">
                    Horas disponibles para la próxima semana: <strong>{horasDisponibles.toFixed(1)}h</strong> (de las {obtenerHorasMaximas(userData?.tipoContrato || 'Operativo')}h según tu contrato {userData?.tipoContrato || 'Operativo'})
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                    Las horas extras se restarán automáticamente de tu asignación para la próxima semana según las horas de tu tipo de contrato.
                  </Typography>
                </Box>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Accede a los módulos del sistema utilizando el menú de navegación superior.
            </Typography>
          </Paper>
        </Grid>

        {/* Sección: Usuarios sin turno hoy (colocada aquí) */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3, borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
            <CardHeader
              avatar={<WorkIcon color="primary" />}
              title="Usuarios Fuera de Oficina hoy"
              titleTypographyProps={{ variant: 'h6', sx: { color: 'var(--primary-color)' } }}
              sx={{ bgcolor: '#f5f5f5', pb: 0 }}
            />
            <CardContent sx={{ pt: 1 }}>
              {usuariosNoTrabajan.length > 0 ? (
                <Grid container spacing={2}>
                  {usuariosNoTrabajan.map(u => (
                    <Grid item xs={12} sm={6} md={4} key={u.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: '#f9f9f9', borderRadius: '8px' }}>
                        <Avatar sx={{ bgcolor: 'var(--primary-color)', mr: 2 }}>
                          {u.nombre.charAt(0)}
                        </Avatar>
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {`${u.nombre} ${u.apellidos}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {u.departamento}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Ningún usuario está fuera de oficina hoy.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sección: Usuarios en Teletrabajo hoy */}
        <Grid item xs={12}>
          <Card sx={{ mb: 3, borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
            <CardHeader
              avatar={<HomeWorkIcon color="primary" />}
              title="Usuarios en Teletrabajo hoy"
              titleTypographyProps={{ variant: 'h6', sx: { color: 'var(--primary-color)' } }}
              sx={{ bgcolor: '#f5f5f5', pb: 0 }}
            />
            <CardContent sx={{ pt: 1 }}>
              {usuariosTeletrabajo.length > 0 ? (
                <Grid container spacing={2}>
                  {usuariosTeletrabajo.map(u => (
                    <Grid item xs={12} sm={6} md={4} key={u.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, bgcolor: '#f9f9f9', borderRadius: '8px' }}>
                        <Avatar sx={{ bgcolor: 'var(--primary-color)', mr: 2 }}>
                          {u.nombre.charAt(0)}
                        </Avatar>
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {`${u.nombre} ${u.apellidos}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {u.departamento}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Ningún usuario está en teletrabajo hoy.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sección de Estadísticas y Gráficos */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
              mb: 3
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ color: 'var(--primary-color)', mb: 3, display: 'flex', alignItems: 'center' }}>
              <BarChartIcon sx={{ mr: 1 }} />
              Estadísticas de Rendimiento
            </Typography>
            
            <Grid container spacing={3}>
              {/* Gráfico Circular - Distribución de Tipos de Asignación */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '400px', borderRadius: '12px' }}>
                  <CardHeader 
                    title="Distribución de Asignaciones"
                    avatar={<PieChartIcon />}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                  <CardContent sx={{ height: '300px' }}>
                    {estadisticas.distribucionTipos.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={estadisticas.distribucionTipos}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {estadisticas.distribucionTipos.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography color="text.secondary">No hay datos disponibles</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de Barras - Horas por Semana */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '400px', borderRadius: '12px' }}>
                  <CardHeader 
                    title="Horas Trabajadas por Semana"
                    avatar={<TrendingUpIcon />}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                  <CardContent sx={{ height: '300px' }}>
                    {estadisticas.rendimientoSemanal.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={estadisticas.rendimientoSemanal}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semana" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [
                              `${value?.toFixed(1)}h`, 
                              name === 'horas' ? 'Horas Totales' : name.charAt(0).toUpperCase() + name.slice(1)
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="horas" fill="#3f51b5" name="Horas Totales" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography color="text.secondary">No hay datos disponibles</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Gráfico de Líneas - Tendencia de Horas */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '400px', borderRadius: '12px' }}>
                  <CardHeader 
                    title="Tendencia de Horas por Tipo"
                    avatar={<WorkIcon />}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                  <CardContent sx={{ height: '300px' }}>
                    {estadisticas.rendimientoSemanal.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={estadisticas.rendimientoSemanal}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semana" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [
                              `${value?.toFixed(1)}h`, 
                              name.charAt(0).toUpperCase() + name.slice(1)
                            ]}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="personalizado" stroke={COLORS.presencial} name="Presencial" strokeWidth={2} />
                          <Line type="monotone" dataKey="teletrabajo" stroke={COLORS.teletrabajo} name="Teletrabajo" strokeWidth={2} />
                          <Line type="monotone" dataKey="cambio" stroke={COLORS.cambio} name="Cambio" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography color="text.secondary">No hay datos disponibles</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Resumen Semanal Actual */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '400px', borderRadius: '12px' }}>
                  <CardHeader 
                    title="Resumen Semana Actual"
                    avatar={<EventNoteIcon />}
                    sx={{ bgcolor: '#f5f5f5' }}
                  />
                  <CardContent>
                    {estadisticas.semanaActual.tipos && Object.keys(estadisticas.semanaActual.tipos).length > 0 ? (
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="h4" sx={{ color: '#3f51b5', mb: 2, textAlign: 'center' }}>
                          {estadisticas.semanaActual.horasTotales?.toFixed(1) || '0'} horas
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        
                        <Typography variant="h6" gutterBottom>Distribución por tipo:</Typography>
                        
                        {Object.entries(estadisticas.semanaActual.tipos).map(([tipo, horas]) => (
                          <Box key={tipo} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box 
                                sx={{ 
                                  width: 16, 
                                  height: 16, 
                                  bgcolor: COLORS[tipo] || '#9e9e9e', 
                                  borderRadius: '50%', 
                                  mr: 1 
                                }} 
                              />
                              <Typography variant="body2">
                                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {typeof horas === 'number' ? horas.toFixed(1) : horas}h
                            </Typography>
                          </Box>
                        ))}

                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: '8px' }}>
                          <Typography variant="caption" color="text.secondary">
                            Progreso: {((estadisticas.semanaActual.horasTotales || 0) / obtenerHorasMaximas(userData?.tipoContrato || 'Operativo') * 100).toFixed(1)}% de tu jornada semanal
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <WorkIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography color="text.secondary" textAlign="center">
                          No hay asignaciones para esta semana
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;