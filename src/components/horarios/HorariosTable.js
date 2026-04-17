import React, { useState, memo, useCallback, useMemo } from 'react';
import { Box, Paper, Grid, Typography, IconButton, Chip, alpha, Button, Stack, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format, addDays } from 'date-fns';
import TurnoUsuario from './TurnoUsuario';
import { obtenerEtiquetaRol, obtenerColorRol } from '../../utils/horariosUtils';
import useTiposHorario from '../../hooks/useTiposHorario';
import useTiposContrato from '../../hooks/useTiposContrato';
import { formatTipoContratoHoras } from '../../utils/tiposContrato';
import TipoContratoChip from '../common/TipoContratoChip';

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

const DayHeaderChip = styled(Chip)(({ theme }) => ({
  height: 20,
  fontSize: '0.66rem',
  fontWeight: 700,
  borderRadius: 999,
  backgroundColor: '#fee2e2',
  color: '#991b1b',
  border: '1px solid rgba(220, 38, 38, 0.25)',
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(0.8),
    paddingRight: theme.spacing(0.8),
  },
}));

const UserCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isCurrentUser',
})(({ theme, isCurrentUser }) => ({
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

const DaySlot = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'hasSchedule' && prop !== 'scheduleType' && prop !== 'isCurrentUser' && prop !== 'isFeriado',
})(({ theme, hasSchedule, scheduleType, isCurrentUser }) => ({
  height: 36,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 8,
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  background: hasSchedule
    ? scheduleType === 'descanso' || scheduleType === 'vacaciones' || scheduleType === 'feriado' || scheduleType === 'permiso'
      ? scheduleType === 'vacaciones'
        ? 'rgba(45, 212, 191, 0.18)'
        : scheduleType === 'descanso'
        ? '#FBFAF3'
        : 'rgba(158, 158, 158, 0.15)'
      : scheduleType === 'teletrabajo'
      ? '#2e7d32'
      : scheduleType === 'tele-presencial'
      ? 'linear-gradient(135deg, #2e7d32 50%, #00830e 50%)'
      : scheduleType === 'horario-dividido'
      ? 'linear-gradient(135deg, #7c3aed 50%, #4c1d95 50%)'
      : scheduleType === 'cambio'
      ? '#f57c00'
      : isCurrentUser
      ? '#00830e'
      : '#1976d2'
    : alpha(theme.palette.grey[200], 0.5),
  color: hasSchedule
    ? scheduleType === 'descanso' || scheduleType === 'vacaciones' || scheduleType === 'feriado' || scheduleType === 'permiso'
      ? scheduleType === 'vacaciones'
        ? '#0f766e'
        : scheduleType === 'descanso'
        ? '#7c5b2b'
        : theme.palette.text.secondary
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

const TotalBadge = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'exceeded' && prop !== 'tone',
})(({ theme, exceeded, tone }) => ({
  textAlign: 'center',
  padding: theme.spacing(0.75),
  borderRadius: 10,
  background: tone === 'neutral'
    ? 'linear-gradient(135deg, #f5f5f5, #e5e7eb)'
    : exceeded
      ? 'linear-gradient(135deg, #ffebee, #ffcdd2)'
      : tone === 'blue'
        ? 'linear-gradient(135deg, #ebf8ff, #bfdbfe)'
        : 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
  border: tone === 'neutral'
    ? '2px solid #bdbdbd'
    : exceeded
      ? '2px solid #f44336'
      : tone === 'blue'
        ? '2px solid #3b82f6'
        : '2px solid #4caf50',
  boxShadow: tone === 'neutral'
    ? '0 2px 8px rgba(0, 0, 0, 0.08)'
    : exceeded
      ? '0 2px 8px rgba(244, 67, 54, 0.25)'
      : tone === 'blue'
        ? '0 2px 8px rgba(59,130,246,0.18)'
        : '0 2px 8px rgba(76, 175, 80, 0.2)',
}));

const SummaryMetric = ({ title, value, valueColor, exceeded = false, tone }) => (
  <Tooltip title={title} arrow placement="top">
    <TotalBadge elevation={0} exceeded={exceeded} tone={tone} sx={{ minWidth: 72 }}>
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: valueColor,
        }}
      >
        {value}
      </Typography>
    </TotalBadge>
  </Tooltip>
);

const calcularHorasBeneficioConfiguradas = (horariosUsuario = {}, tiposMap = {}) => {
  return Object.values(horariosUsuario).reduce((total, turno) => {
    if (!turno?.tipo) return total;

    const tipoConfig = tiposMap[turno.tipo];
    if (!tipoConfig?.esBeneficio) return total;

    const horasTurno = Number(turno.horas);
    const horasBeneficio = Number.isFinite(horasTurno) && horasTurno > 0
      ? horasTurno
      : Number(tipoConfig.horasCredito ?? 0);

    return total + (Number.isFinite(horasBeneficio) && horasBeneficio > 0 ? horasBeneficio : 0);
  }, 0);
};

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
  fontSize: '0.72rem',
  height: 24,
  fontWeight: 600,
  borderRadius: 8,
  '& .MuiChip-label': {
    paddingLeft: theme.spacing(0.75),
    paddingRight: theme.spacing(0.75),
  },
}));

// Componente de fila móvil memoizado
const MobileUserRow = memo(({ 
  usuario, 
  tipoContratoLabel,
  tipoContratoHoras,
  isCurrentUser, 
  exceso, 
  horasTotales, 
  horasBeneficio,
  diasSemana, 
  semanaSeleccionada,
  editando, 
  horariosUsuario, 
  selectedTargets, 
  clipboard, 
  toggleTarget, 
  handleCambiarTurno, 
  handleCopiarHorario,
  jornadasOrdinariasMap,
  feriadosPorFecha,
  feriadosMap
}) => {
  const horasSumaSemanal = horasTotales + horasBeneficio;

  return (
    <UserCard elevation={0} isCurrentUser={isCurrentUser}>
      <Grid container spacing={0.5} alignItems="center">
        <Grid item xs={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.35, minWidth: 0 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: isCurrentUser ? 700 : 500, 
                fontSize: '0.7rem', 
                lineHeight: 1.3,
                color: isCurrentUser ? '#00830e' : 'text.primary',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
            >
              {usuario.nombre} {usuario.apellidos.split(' ')[0]}
            </Typography>
            <TipoContratoChip
              value={usuario.tipoContrato}
              label={tipoContratoLabel}
              showRange
              sx={{
                width: '100%',
                maxWidth: 170,
                '& .MuiChip-label': {
                  whiteSpace: 'normal',
                  textAlign: 'center',
                  lineHeight: 1.1,
                },
              }}
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
              const fecha = addDays(semanaSeleccionada, index);
              const fechaKey = format(fecha, 'yyyy-MM-dd');
              const esFeriado = feriadosPorFecha?.has?.(fechaKey);
              const feriadoLabel = feriadosMap?.[fechaKey]?.label || 'Feriado';
              const tooltipTitle = esFeriado ? `${dia} ${format(fecha, 'dd/MM')} · ${feriadoLabel}` : `${dia} ${format(fecha, 'dd/MM')}`;
              
              return (
                <Grid item sx={{ width: '14.28%', flexBasis: '14.28%' }} key={diaKey}>
                  <Tooltip title={tooltipTitle} arrow placement="top">
                    <DaySlot
                      data-dia-key={diaKey}
                      hasSchedule={tieneHorario}
                      scheduleType={horario?.tipo}
                      isCurrentUser={isCurrentUser}
                      isFeriado={esFeriado}
                      sx={isSelected ? { outline: '3px dashed rgba(25, 118, 210, 0.6)' } : undefined}
                      onClick={() => {
                        if (clipboard && editando) { toggleTarget(usuario.id, diaKey); return; }
                        if (editando) handleCambiarTurno(usuario.id, diaKey);
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
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, lineHeight: 1, color: esFeriado ? '#991b1b' : 'inherit' }}>
                          {dia.slice(0, 1)}
                        </Typography>
                        {esFeriado && (
                          <Typography variant="caption" sx={{ fontSize: '0.53rem', lineHeight: 1, mt: 0.1, fontWeight: 700, color: '#991b1b' }}>
                            F
                          </Typography>
                        )}
                        {horario && horario.tipo === 'descanso' && (
                          <Typography variant="caption" sx={{ fontSize: '0.5rem', lineHeight: 1, mt: 0.2 }}>
                            D
                          </Typography>
                        )}
                      </Box>
                    </DaySlot>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
        <Grid item xs={2}>
          <Stack spacing={0.5} alignItems="center">
            <SummaryMetric
              title="Horas trabajadas"
              value={`${horasTotales.toFixed(1)}h`}
              valueColor="#2e7d32"
              exceeded={exceso > 0}
            />
            <SummaryMetric
              title="Horas de beneficio"
              value={`${horasBeneficio.toFixed(1)}h`}
              valueColor="#2e7d32"
              tone="neutral"
            />
            <SummaryMetric
              title="Suma semanal"
              value={`${horasSumaSemanal.toFixed(1)}h`}
              valueColor="#2e7d32"
              tone="blue"
            />
          </Stack>
        </Grid>
      </Grid>
    </UserCard>
  );
});

// Componente de fila desktop memoizado
const DesktopUserRow = memo(({
  usuario,
  tipoContratoLabel,
  tipoContratoHoras,
  isCurrentUser,
  exceso,
  horasTotales,
  horasBeneficio,
  diasSemana,
  semanaSeleccionada,
  editando,
  horariosUsuario,
  horariosOriginalesUsuario,
  currentUser,
  handleCambiarTurno,
  abrirInfoTurno,
  handleCopiarHorario,
  clipboard,
  toggleTarget,
  selectedTargets,
  NO_SUMAN_HORAS,
  feriadosPorFecha,
  feriadosMap,
  jornadasOrdinariasMap
}) => {
  const horasSumaSemanal = horasTotales + horasBeneficio;

  return (
    <UserCard elevation={0} isCurrentUser={isCurrentUser}>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.35, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: isCurrentUser ? 700 : 500,
                color: isCurrentUser ? '#00830e' : 'text.primary',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
              }}
            >
              {usuario.nombre} {usuario.apellidos}
            </Typography>
            <TipoContratoChip
              value={usuario.tipoContrato}
              label={tipoContratoLabel}
              showRange
              sx={{
                width: '100%',
                maxWidth: 170,
                '& .MuiChip-label': {
                  whiteSpace: 'normal',
                  textAlign: 'center',
                  lineHeight: 1.1,
                },
              }}
            />
          </Box>
        </Grid>
        {diasSemana.map((dia, index) => {
          const diaKey = `dia${index + 1}`;
          const isSelected = selectedTargets.has(`${usuario.id}|${diaKey}`);
          const fecha = addDays(semanaSeleccionada, index);
          const fechaKey = format(fecha, 'yyyy-MM-dd');
          const esFeriado = feriadosPorFecha?.has?.(fechaKey);
          const feriadoLabel = feriadosMap?.[fechaKey]?.label || 'Feriado';
          const tooltipTitle = esFeriado ? `${dia} ${format(fecha, 'dd/MM')} · ${feriadoLabel}` : `${dia} ${format(fecha, 'dd/MM')}`;
          const puedeAbrirInfo = !editando && Boolean(horariosUsuario?.[diaKey]);
          return (
            <Grid item key={`${usuario.id}-${index}`} xs>
              <Tooltip title={tooltipTitle} arrow placement="top">
                <Box
                  data-dia-key={diaKey}
                  onClick={() => {
                    if (puedeAbrirInfo) {
                      abrirInfoTurno(usuario, horariosUsuario[diaKey], diaKey);
                    }
                  }}
                  sx={{
                    ...(isSelected ? { outline: '3px dashed rgba(25, 118, 210, 0.6)' } : {}),
                    borderRadius: 1,
                    background: esFeriado ? 'linear-gradient(180deg, rgba(254, 242, 242, 0.9), rgba(255,255,255,0.95))' : undefined,
                    boxShadow: esFeriado ? 'inset 0 0 0 1px rgba(220, 38, 38, 0.12)' : undefined,
                    cursor: puedeAbrirInfo ? 'pointer' : 'default',
                  }}
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
                    jornadasOrdinariasMap={jornadasOrdinariasMap}
                    suppressOpen={!!clipboard && editando}
                    NO_SUMAN_HORAS={NO_SUMAN_HORAS}
                    isFeriado={esFeriado}
                  />
                </Box>
              </Tooltip>
            </Grid>
          );
        })}
        <Grid item xs={1}>
          <Stack spacing={0.5} alignItems="center">
            <SummaryMetric
              title="Horas trabajadas"
              value={`${horasTotales.toFixed(1)}h`}
              valueColor="#2e7d32"
              exceeded={exceso > 0}
            />
            <SummaryMetric
              title="Horas de beneficio"
              value={`${horasBeneficio.toFixed(1)}h`}
              valueColor="#2e7d32"
              tone="neutral"
            />
            <SummaryMetric
              title="Suma semanal"
              value={`${horasSumaSemanal.toFixed(1)}h`}
              valueColor="#2e7d32"
              tone="blue"
            />
          </Stack>
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
  diasSemana,
  feriadosPorFecha,
  feriadosMap,
  jornadasOrdinariasMap
}) => {
  const [selectedTargets, setSelectedTargets] = useState(new Set());
  const { getTipoContratoLabel } = useTiposContrato();
  const { tiposMap: tiposHorarioMap } = useTiposHorario();

  const horariosEditadosVista = useMemo(() => {
    if (!editando) {
      return horariosEditados || {};
    }

    const merged = { ...(horarios || {}) };
    Object.entries(horariosEditados || {}).forEach(([usuarioId, horariosUsuario]) => {
      merged[usuarioId] = {
        ...(horarios?.[usuarioId] || {}),
        ...(horariosUsuario || {}),
      };
    });

    return merged;
  }, [editando, horarios, horariosEditados]);
  
  const toggleTarget = useCallback((usuarioId, diaKey) => {
    const key = `${usuarioId}|${diaKey}`;
    setSelectedTargets(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedTargets(new Set()), []);

  const handlePaste = useCallback(async () => {
    if (!onApplyCopiedHorario || !clipboard) return;
    const targets = Array.from(selectedTargets).map(k => {
      const [usuarioId, diaKey] = k.split('|');
      return { usuarioId, diaKey };
    });
    if (targets.length === 0) return; // nothing to do
    const saved = await onApplyCopiedHorario(targets);
    if (saved) {
      clearSelection();
    }
  }, [onApplyCopiedHorario, clipboard, selectedTargets, clearSelection]);

  const EMPTY_EXTRAS = useMemo(() => ({}), []);

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
            const tipoContratoLabel = getTipoContratoLabel(usuario.tipoContrato);
            const tipoContratoHoras = formatTipoContratoHoras(usuario.tipoContrato);
            const horariosUsuarioVista = editando
              ? (horariosEditadosVista[usuario.id] || horarios[usuario.id] || {})
              : (horarios[usuario.id] || {});
            // Optimización: pasar el usuario directamente para evitar .find()
            const horasTotales = calcularHorasTotales(
              usuario.id, 
              editando, 
              horariosEditadosVista, 
              horarios, 
              semanaSeleccionada, 
              semanaActual, 
              EMPTY_EXTRAS, 
              () => usuario, 
              obtenerHorasMaximas, 
              true
            );
            const horasBeneficio = calcularHorasBeneficioConfiguradas(horariosUsuarioVista, tiposHorarioMap);
            
            return (
              <Box
                key={usuario.id}
                onClick={(event) => {
                  if (clipboard && editando) {
                    return;
                  }

                  if (!editando) {
                    const target = event.target.closest?.('[data-dia-key]');
                    if (!target) {
                      return;
                    }

                    const diaKey = target.getAttribute('data-dia-key');
                    const horario = horariosUsuarioVista?.[diaKey];
                    if (horario) {
                      abrirInfoTurno(usuario, horario, diaKey);
                    }
                  }
                }}
                sx={{ cursor: editando ? 'default' : 'pointer' }}
              >
                <MobileUserRow
                  usuario={usuario}
                  tipoContratoLabel={tipoContratoLabel}
                  tipoContratoHoras={tipoContratoHoras}
                  isCurrentUser={isCurrentUser}
                  exceso={exceso}
                  horasTotales={horasTotales}
                  horasBeneficio={horasBeneficio}
                  diasSemana={diasSemana}
                  semanaSeleccionada={semanaSeleccionada}
                  editando={editando}
                  horariosUsuario={horariosUsuarioVista}
                  selectedTargets={selectedTargets}
                  clipboard={clipboard}
                  toggleTarget={toggleTarget}
                  handleCambiarTurno={handleCambiarTurno}
                  handleCopiarHorario={handleCopiarHorario}
                  jornadasOrdinariasMap={jornadasOrdinariasMap}
                  feriadosPorFecha={feriadosPorFecha}
                  feriadosMap={feriadosMap}
                />
              </Box>
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
              {diasSemana.map((dia, index) => {
                const fecha = addDays(semanaSeleccionada, index);
                const fechaKey = format(fecha, 'yyyy-MM-dd');
                const esFeriado = feriadosPorFecha?.has?.(fechaKey);
                const feriadoLabel = feriadosMap?.[fechaKey]?.label || 'Feriado';

                return (
                  <Grid item xs key={dia}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        borderRadius: 2,
                        px: 1,
                        py: 0.75,
                        border: esFeriado ? '1px solid rgba(220, 38, 38, 0.25)' : '1px solid transparent',
                        background: esFeriado ? 'linear-gradient(180deg, rgba(254, 242, 242, 0.95), rgba(255, 255, 255, 0.98))' : 'transparent',
                      }}
                    >
                      <Typography 
                        variant="subtitle2" 
                        align="center" 
                        sx={{ 
                          fontWeight: 700,
                          color: esFeriado ? '#991b1b' : '#1a1a2e',
                          fontSize: '0.85rem',
                        }}
                      >
                        {dia}
                        <Typography 
                          component="span" 
                          sx={{ 
                            display: 'block', 
                            fontSize: '0.75rem', 
                            color: esFeriado ? '#b91c1c' : 'text.secondary',
                            fontWeight: 600,
                          }}
                        >
                          {format(fecha, 'd')}
                        </Typography>
                      </Typography>
                      {esFeriado && (
                        <DayHeaderChip size="small" label={feriadoLabel} sx={{ mt: 0.6 }} />
                      )}
                    </Box>
                  </Grid>
                );
              })}
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
            const tipoContratoLabel = getTipoContratoLabel(usuario.tipoContrato);
            const tipoContratoHoras = formatTipoContratoHoras(usuario.tipoContrato);
            const horariosUsuarioVista = editando
              ? (horariosEditadosVista[usuario.id] || horarios[usuario.id] || {})
              : (horarios[usuario.id] || {});
            // Optimización: pasar el usuario directamente para evitar .find()
            const horasTotales = calcularHorasTotales(
              usuario.id, 
              editando, 
              horariosEditadosVista, 
              horarios, 
              semanaSeleccionada, 
              semanaActual, 
              EMPTY_EXTRAS, 
              () => usuario, 
              obtenerHorasMaximas, 
              true
            );
            const horasBeneficio = calcularHorasBeneficioConfiguradas(horariosUsuarioVista, tiposHorarioMap);
            
            return (
              <DesktopUserRow
                key={usuario.id}
                usuario={usuario}
                tipoContratoLabel={tipoContratoLabel}
                tipoContratoHoras={tipoContratoHoras}
                isCurrentUser={isCurrentUser}
                exceso={exceso}
                horasTotales={horasTotales}
                horasBeneficio={horasBeneficio}
                diasSemana={diasSemana}
                semanaSeleccionada={semanaSeleccionada}
                editando={editando}
                horariosUsuario={horariosUsuarioVista}
                horariosOriginalesUsuario={horarios[usuario.id]}
                currentUser={currentUser}
                handleCambiarTurno={handleCambiarTurno}
                abrirInfoTurno={abrirInfoTurno}
                handleCopiarHorario={handleCopiarHorario}
                clipboard={clipboard}
                toggleTarget={toggleTarget}
                selectedTargets={selectedTargets}
                NO_SUMAN_HORAS={NO_SUMAN_HORAS}
                feriadosPorFecha={feriadosPorFecha}
                feriadosMap={feriadosMap}
              />
            );
          })}
        </Box>
      )}
    </TableContainer>
  );
});

export default HorariosTable;
