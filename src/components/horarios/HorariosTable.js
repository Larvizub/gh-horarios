import React, { useState, memo } from 'react';
import { Box, Paper, Grid, Typography, IconButton, Chip, alpha, Button, Stack } from '@mui/material';
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

// Componente de fila móvil memoizado
const MobileUserRow = memo(({ 
  usuario, 
  isCurrentUser, 
  exceso, 
  horasTotales, 
  diasSemana, 
  editando, 
  horariosUsuario, 
  selectedTargets, 
  clipboard, 
  toggleTarget, 
  handleCambiarTurno, 
  abrirInfoTurno, 
  handleCopiarHorario 
}) => {
  return (
    <UserCard elevation={0} isCurrentUser={isCurrentUser}>
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
              const horario = horariosUsuario?.[diaKey];
              const tieneHorario = horario && horario.tipo !== 'libre';
              const isSelected = selectedTargets.has(`${usuario.id}|${diaKey}`);
              
              return (
                <Grid item xs={12/7} key={diaKey}>
                  <DaySlot
                    hasSchedule={tieneHorario}
                    scheduleType={horario?.tipo}
                    isCurrentUser={isCurrentUser}
                    sx={isSelected ? { outline: '3px dashed rgba(25, 118, 210, 0.6)' } : undefined}
                    onClick={() => {
                      if (clipboard && editando) { toggleTarget(usuario.id, diaKey); return; }
                      if (editando) handleCambiarTurno(usuario.id, diaKey);
                      else if (tieneHorario) abrirInfoTurno(usuario, horario, diaKey);
                    }}
                  >
                    {tieneHorario && editando && (
                      <CopyButton 
                        size="small" 
                        onClick={e => {
                          e.stopPropagation();
                          if (handleCopiarHorario) handleCopiarHorario(usuario.id, diaKey, e);
                        }}
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
});

// Componente de fila desktop memoizado
const DesktopUserRow = memo(({
  usuario,
  isCurrentUser,
  exceso,
  horasTotales,
  diasSemana,
  editando,
  horariosUsuario,
  horariosOriginalesUsuario,
  currentUser,
  handleCambiarTurno,
  handleCopiarHorario,
  clipboard,
  toggleTarget,
  selectedTargets,
  NO_SUMAN_HORAS
}) => {
  return (
    <UserCard elevation={0} isCurrentUser={isCurrentUser}>
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
        {diasSemana.map((_, index) => {
          const diaKey = `dia${index + 1}`;
          const isSelected = selectedTargets.has(`${usuario.id}|${diaKey}`);
          return (
            <Grid item key={`${usuario.id}-${index}`} xs>
              <Box
                onClick={() => {
                  if (clipboard && editando) { toggleTarget(usuario.id, diaKey); return; }
                }}
                sx={isSelected ? { outline: '3px dashed rgba(25, 118, 210, 0.6)', borderRadius: 1 } : undefined}
              >
                <TurnoUsuario
                  usuario={usuario}
                  diaKey={diaKey}
                  editando={editando}
                  horariosEditados={{ [usuario.id]: horariosUsuario }}
                  horarios={{ [usuario.id]: horariosOriginalesUsuario }}
                  currentUser={currentUser}
                  handleCambiarTurno={handleCambiarTurno}
                  handleCopiarHorario={handleCopiarHorario}
                  suppressOpen={!!clipboard && editando}
                  NO_SUMAN_HORAS={NO_SUMAN_HORAS}
                />
              </Box>
            </Grid>
          );
        })}
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
});

const HorariosTable = memo(({
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
  clipboard,
  onApplyCopiedHorario,
  NO_SUMAN_HORAS,
  calcularExceso,
  calcularHorasTotales,
  semanaSeleccionada,
  semanaActual,
  obtenerUsuario,
  obtenerHorasMaximas,
  diasSemana
}) => {
  const [selectedTargets, setSelectedTargets] = useState(new Set());
  
  const toggleTarget = (usuarioId, diaKey) => {
    const key = `${usuarioId}|${diaKey}`;
    setSelectedTargets(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelectedTargets(new Set());

  const handlePaste = () => {
    if (!onApplyCopiedHorario || !clipboard) return;
    const targets = Array.from(selectedTargets).map(k => {
      const [usuarioId, diaKey] = k.split('|');
      return { usuarioId, diaKey };
    });
    if (targets.length === 0) return; // nothing to do
    onApplyCopiedHorario(targets);
    clearSelection();
  };

  return (
    <TableContainer>
      {clipboard && (
        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="Horario copiado" color="success" size="small" />
            <Button variant="contained" color="primary" size="small" onClick={handlePaste}>
              Pegar ({selectedTargets.size})
            </Button>
            <Button variant="outlined" color="inherit" size="small" onClick={clearSelection}>
              Cancelar
            </Button>
          </Stack>
        </Box>
      )}
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
            // Optimización: pasar el usuario directamente para evitar .find()
            const horasTotales = calcularHorasTotales(
              usuario.id, 
              editando, 
              horariosEditados, 
              horarios, 
              semanaSeleccionada, 
              semanaActual, 
              {}, 
              () => usuario, 
              obtenerHorasMaximas, 
              true
            );
            
            return (
              <MobileUserRow
                key={usuario.id}
                usuario={usuario}
                isCurrentUser={isCurrentUser}
                exceso={exceso}
                horasTotales={horasTotales}
                diasSemana={diasSemana}
                editando={editando}
                horariosUsuario={editando ? horariosEditados[usuario.id] : horarios[usuario.id]}
                selectedTargets={selectedTargets}
                clipboard={clipboard}
                toggleTarget={toggleTarget}
                handleCambiarTurno={handleCambiarTurno}
                abrirInfoTurno={abrirInfoTurno}
                handleCopiarHorario={handleCopiarHorario}
              />
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
            // Optimización: pasar el usuario directamente para evitar .find()
            const horasTotales = calcularHorasTotales(
              usuario.id, 
              editando, 
              horariosEditados, 
              horarios, 
              semanaSeleccionada, 
              semanaActual, 
              {}, 
              () => usuario, 
              obtenerHorasMaximas, 
              true
            );
            
            return (
              <DesktopUserRow
                key={usuario.id}
                usuario={usuario}
                isCurrentUser={isCurrentUser}
                exceso={exceso}
                horasTotales={horasTotales}
                diasSemana={diasSemana}
                editando={editando}
                horariosUsuario={horariosEditados[usuario.id]}
                horariosOriginalesUsuario={horarios[usuario.id]}
                currentUser={currentUser}
                handleCambiarTurno={handleCambiarTurno}
                handleCopiarHorario={handleCopiarHorario}
                clipboard={clipboard}
                toggleTarget={toggleTarget}
                selectedTargets={selectedTargets}
                NO_SUMAN_HORAS={NO_SUMAN_HORAS}
              />
            );
          })}
        </Box>
      )}
    </TableContainer>
  );
});

export default HorariosTable;
