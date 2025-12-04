import React from 'react';
import { Box, Paper, Grid, Typography, IconButton, Chip, alpha } from '@mui/material';
import { styled } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format, addDays } from 'date-fns';
import TurnoUsuario from './TurnoUsuario';
import { obtenerEtiquetaRol, obtenerColorRol } from '../../utils/horariosUtils';

// Styled Components
const TableContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  overflowX: 'auto',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
}));

const HeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1.5),
  background: 'linear-gradient(135deg, rgba(0, 131, 14, 0.08), rgba(76, 175, 80, 0.05))',
  borderRadius: 12,
  marginBottom: theme.spacing(1.5),
}));

const UserCard = styled(Paper)(({ theme, isCurrentUser }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  borderRadius: 12,
  transition: 'all 0.2s ease-in-out',
  border: isCurrentUser 
    ? '2px solid #00830e' 
    : '1px solid rgba(0, 0, 0, 0.08)',
  background: isCurrentUser 
    ? 'linear-gradient(135deg, rgba(0, 131, 14, 0.06), rgba(76, 175, 80, 0.04))' 
    : 'rgba(255, 255, 255, 0.9)',
  '&:hover': {
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    transform: 'translateY(-1px)',
    borderColor: isCurrentUser ? '#00830e' : 'rgba(0, 131, 14, 0.2)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    borderRadius: 10,
  },
}));

const DaySlot = styled(Box)(({ theme, hasSchedule, scheduleType, isCurrentUser }) => ({
  height: 36,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 8,
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  backgroundColor: hasSchedule
    ? scheduleType === 'descanso' || scheduleType === 'vacaciones' || scheduleType === 'feriado' || scheduleType === 'permiso'
      ? 'rgba(158, 158, 158, 0.15)'
      : scheduleType === 'teletrabajo'
      ? '#2e7d32'
      : scheduleType === 'tele-presencial'
      ? 'linear-gradient(135deg, #2e7d32 50%, #00830e 50%)'
      : scheduleType === 'cambio'
      ? '#f57c00'
      : isCurrentUser
      ? '#00830e'
      : '#1976d2'
    : alpha(theme.palette.grey[200], 0.5),
  color: hasSchedule
    ? scheduleType === 'descanso' || scheduleType === 'vacaciones' || scheduleType === 'feriado' || scheduleType === 'permiso'
      ? theme.palette.text.secondary
      : 'white'
    : theme.palette.text.disabled,
  fontWeight: hasSchedule ? 600 : 400,
  fontSize: '0.7rem',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: hasSchedule ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
  },
  [theme.breakpoints.down('sm')]: {
    height: 32,
    borderRadius: 6,
  },
}));

const TotalBadge = styled(Paper)(({ theme, exceeded }) => ({
  textAlign: 'center',
  padding: theme.spacing(0.75),
  borderRadius: 10,
  background: exceeded 
    ? 'linear-gradient(135deg, #ffebee, #ffcdd2)' 
    : 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
  border: exceeded 
    ? '2px solid #f44336' 
    : '2px solid #4caf50',
  boxShadow: exceeded 
    ? '0 2px 8px rgba(244, 67, 54, 0.25)' 
    : '0 2px 8px rgba(76, 175, 80, 0.2)',
}));

const CopyButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: 'white',
  color: '#1976d2',
  width: 18,
  height: 18,
  padding: 0,
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)',
  '&:hover': {
    backgroundColor: '#e3f2fd',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 10,
  },
}));

const RolChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.65rem',
  height: 20,
  fontWeight: 600,
  borderRadius: 6,
}));

const HorariosTable = ({
  isMobile,
  isSmallMobile,
  usuariosFiltrados,
  editando,
  horarios,
  horariosEditados,
  currentUser,
  handleCambiarTurno,
  abrirInfoTurno,
  handleCopiarHorario,
  NO_SUMAN_HORAS,
  calcularExceso,
  calcularHorasTotales,
  semanaSeleccionada,
  semanaActual,
  obtenerUsuario,
  obtenerHorasMaximas,
  diasSemana
}) => {
  return (
    <TableContainer>
      {isMobile ? (
        <Box>
          {/* Encabezados móvil */}
          <HeaderRow>
            <Grid container spacing={0.5} alignItems="center">
              <Grid item xs={3}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#00830e', fontSize: '0.7rem' }}>
                  👤 Usuario
                </Typography>
              </Grid>
              <Grid item xs={7}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#00830e', fontSize: '0.7rem', textAlign: 'center', display: 'block' }}>
                  📅 Horarios de la Semana
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#00830e', fontSize: '0.7rem', textAlign: 'center', display: 'block' }}>
                  ⏱️
                </Typography>
              </Grid>
            </Grid>
          </HeaderRow>

          {/* Filas de usuarios móvil */}
          {usuariosFiltrados.map(usuario => {
            const isCurrentUser = usuario.id === currentUser?.uid;
            const exceso = calcularExceso(usuario.id);
            const horasTotales = calcularHorasTotales(usuario.id, editando, horariosEditados, horarios, semanaSeleccionada, semanaActual, {}, id => obtenerUsuario(usuariosFiltrados, id), obtenerHorasMaximas, true);
            
            return (
              <UserCard key={usuario.id} elevation={0} isCurrentUser={isCurrentUser}>
                <Grid container spacing={0.5} alignItems="center">
                  <Grid item xs={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: isCurrentUser ? 700 : 500, 
                          fontSize: '0.7rem', 
                          display: 'block', 
                          lineHeight: 1.3,
                          color: isCurrentUser ? '#00830e' : 'text.primary',
                        }}
                      >
                        {usuario.nombre} {usuario.apellidos.split(' ')[0]}
                      </Typography>
                      <RolChip 
                        label={obtenerEtiquetaRol(usuario.rol)} 
                        color={obtenerColorRol(usuario.rol)} 
                        size="small" 
                        sx={{ mt: 0.5 }} 
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={7}>
                    <Grid container spacing={0.5}>
                      {diasSemana.map((dia, index) => {
                        const diaKey = `dia${index + 1}`;
                        const horariosUsuario = editando ? horariosEditados[usuario.id] : horarios[usuario.id];
                        const horario = horariosUsuario?.[diaKey];
                        const tieneHorario = horario && horario.tipo !== 'libre';

                        return (
                          <Grid item xs={12/7} key={diaKey}>
                            <DaySlot
                              hasSchedule={tieneHorario}
                              scheduleType={horario?.tipo}
                              isCurrentUser={isCurrentUser}
                              onClick={() => {
                                if (editando) handleCambiarTurno(usuario.id, diaKey);
                                else if (tieneHorario) abrirInfoTurno(usuario, horario, diaKey);
                              }}
                            >
                              {tieneHorario && editando && (
                                <CopyButton 
                                  size="small" 
                                  onClick={e => handleCopiarHorario(usuario.id, diaKey, e)}
                                >
                                  <ContentCopyIcon />
                                </CopyButton>
                              )}
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, lineHeight: 1 }}>
                                  {dia.slice(0, 1)}
                                </Typography>
                                {horario && horario.tipo === 'descanso' && (
                                  <Typography variant="caption" sx={{ fontSize: '0.5rem', lineHeight: 1, mt: 0.2 }}>
                                    D
                                  </Typography>
                                )}
                              </Box>
                            </DaySlot>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Grid>
                  <Grid item xs={2}>
                    <TotalBadge elevation={0} exceeded={exceso > 0}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          color: exceso > 0 ? '#d32f2f' : '#2e7d32',
                        }}
                      >
                        {horasTotales.toFixed(1)}h
                      </Typography>
                    </TotalBadge>
                  </Grid>
                </Grid>
              </UserCard>
            );
          })}
        </Box>
      ) : (
        <Box>
          {/* Encabezados Desktop */}
          <HeaderRow>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00830e' }}>
                  👤 Usuario
                </Typography>
              </Grid>
              {diasSemana.map((dia, index) => (
                <Grid item xs key={dia}>
                  <Typography 
                    variant="subtitle2" 
                    align="center" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#1a1a2e',
                      fontSize: '0.85rem',
                    }}
                  >
                    {dia}
                    <Typography 
                      component="span" 
                      sx={{ 
                        display: 'block', 
                        fontSize: '0.75rem', 
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      {format(addDays(semanaSeleccionada, index), 'd')}
                    </Typography>
                  </Typography>
                </Grid>
              ))}
              <Grid item xs={1}>
                <Typography variant="subtitle2" align="center" sx={{ fontWeight: 700, color: '#00830e' }}>
                  ⏱️ Total
                </Typography>
              </Grid>
            </Grid>
          </HeaderRow>

          {/* Filas de usuarios Desktop */}
          {usuariosFiltrados.map(usuario => {
            const isCurrentUser = usuario.id === currentUser?.uid;
            const exceso = calcularExceso(usuario.id);
            const horasTotales = calcularHorasTotales(usuario.id, editando, horariosEditados, horarios, semanaSeleccionada, semanaActual, {}, id => obtenerUsuario(usuariosFiltrados, id), obtenerHorasMaximas, true);
            
            return (
              <UserCard key={usuario.id} elevation={0} isCurrentUser={isCurrentUser}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={2}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: isCurrentUser ? 700 : 500,
                          color: isCurrentUser ? '#00830e' : 'text.primary',
                        }}
                      >
                        {usuario.nombre} {usuario.apellidos}
                      </Typography>
                      <RolChip 
                        label={obtenerEtiquetaRol(usuario.rol)} 
                        color={obtenerColorRol(usuario.rol)} 
                        size="small" 
                        sx={{ mt: 0.5 }} 
                      />
                    </Box>
                  </Grid>
                  {diasSemana.map((_, index) => (
                    <Grid item key={`${usuario.id}-${index}`} xs>
                      <TurnoUsuario
                        usuario={usuario}
                        diaKey={`dia${index + 1}`}
                        editando={editando}
                        horariosEditados={horariosEditados}
                        horarios={horarios}
                        currentUser={currentUser}
                        handleCambiarTurno={handleCambiarTurno}
                        handleCopiarHorario={handleCopiarHorario}
                        NO_SUMAN_HORAS={NO_SUMAN_HORAS}
                      />
                    </Grid>
                  ))}
                  <Grid item xs={1}>
                    <TotalBadge elevation={0} exceeded={exceso > 0}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700,
                          color: exceso > 0 ? '#d32f2f' : '#2e7d32',
                        }}
                      >
                        {horasTotales.toFixed(1)}h
                      </Typography>
                    </TotalBadge>
                  </Grid>
                </Grid>
              </UserCard>
            );
          })}
        </Box>
      )}
    </TableContainer>
  );
};

export default HorariosTable;
