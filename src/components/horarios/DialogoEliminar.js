import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, FormControl, InputLabel, Select, MenuItem, Box, Alert, Grid } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CloseIcon from '@mui/icons-material/Close';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'linear-gradient(135deg, #d32f2f 0%, #ef5350 100%)',
  color: 'white',
  padding: theme.spacing(2.5, 3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '& .MuiSvgIcon-root': {
    fontSize: 28,
  },
}));

const ContentBox = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: '#fafafa',
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(211, 47, 47, 0.1)',
    },
  },
}));

const DayButton = styled(Button)(({ selected, disabled: isDisabled }) => ({
  borderRadius: 12,
  padding: '12px 16px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease',
  ...(selected && {
    background: 'linear-gradient(135deg, #d32f2f 0%, #ef5350 100%)',
    color: 'white',
    '&:hover': {
      background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(211, 47, 47, 0.3)',
    },
  }),
  ...(!selected && !isDisabled && {
    backgroundColor: 'white',
    borderColor: 'rgba(0, 0, 0, 0.15)',
    '&:hover': {
      borderColor: '#d32f2f',
      backgroundColor: alpha('#d32f2f', 0.04),
    },
  }),
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
  borderRadius: 12,
  '& .MuiAlert-icon': {
    alignItems: 'center',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease',
}));

const DeleteButton = styled(ActionButton)(({ theme }) => ({
  background: 'linear-gradient(135deg, #d32f2f 0%, #ef5350 100%)',
  '&:hover': {
    background: 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(211, 47, 47, 0.3)',
  },
  '&:disabled': {
    background: '#e0e0e0',
  },
}));

const DialogoEliminar = ({
  dialogoEliminar,
  setDialogoEliminar,
  eliminacionSeleccionada,
  setEliminacionSeleccionada,
  handleEliminarSeleccionado,
  currentUser,
  usuarios,
  horarios,
  isMobile,
  isSmallMobile
}) => {
  const usuarioActual = usuarios?.find(u => u.id === currentUser?.uid);
  const esAdministrador = usuarioActual?.rol === 'Administrador';

  // Función para manejar selección/deselección de días
  const toggleDiaSeleccionado = (diaKey) => {
    setEliminacionSeleccionada(prev => ({
      ...prev,
      diasSeleccionados: prev.diasSeleccionados.includes(diaKey)
        ? prev.diasSeleccionados.filter(d => d !== diaKey)
        : [...prev.diasSeleccionados, diaKey]
    }));
  };

  // Reset campos relevantes al abrir el diálogo
  React.useEffect(() => {
    if (dialogoEliminar) {
      setEliminacionSeleccionada(prev => ({
        ...prev,
        usuarioId: null,
        dia: null,
        diasSeleccionados: [],
      }));
    }
    // eslint-disable-next-line
  }, [dialogoEliminar]);

  // Obtener los horarios del usuario actual para mostrar qué días puede eliminar
  const horariosUsuarioActual = horarios[currentUser?.uid] || {};
  const diasConHorarios = Object.keys(horariosUsuarioActual);

  return (
    <StyledDialog 
      open={dialogoEliminar} 
      onClose={() => setDialogoEliminar(false)}
      fullScreen={isSmallMobile}
      maxWidth={isMobile ? 'sm' : 'md'}
      fullWidth
    >
      <StyledDialogTitle>
        <DeleteOutlineIcon />
        Eliminar Horarios
      </StyledDialogTitle>
      <ContentBox>
        <StyledFormControl fullWidth>
          <InputLabel>Tipo de eliminación</InputLabel>
          <Select
            value={eliminacionSeleccionada.tipo}
            onChange={(e) => {
              setEliminacionSeleccionada(prev => ({ 
                ...prev, 
                tipo: e.target.value,
                diasSeleccionados: [],
                usuarioId: null,
                dia: null
              }));
            }}
            size={isMobile ? 'small' : 'medium'}
            label="Tipo de eliminación"
          >
            <MenuItem value="mis-dias">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                Mis días específicos
              </Box>
            </MenuItem>
            {esAdministrador && (
              <>
                <MenuItem value="todo">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon sx={{ fontSize: 18, color: 'error.main' }} />
                    Todos los horarios (Solo Admin)
                  </Box>
                </MenuItem>
                <MenuItem value="usuario">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    Por usuario (Solo Admin)
                  </Box>
                </MenuItem>
                <MenuItem value="dia">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarTodayIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    Por día completo (Solo Admin)
                  </Box>
                </MenuItem>
              </>
            )}
          </Select>
        </StyledFormControl>

        {!esAdministrador && (
          <StyledAlert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Solo puedes eliminar tus propios horarios. Los administradores tienen permisos adicionales.
            </Typography>
          </StyledAlert>
        )}

        {eliminacionSeleccionada.tipo === 'mis-dias' && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
              Selecciona los días que deseas eliminar:
            </Typography>
            
            {diasConHorarios.length === 0 ? (
              <StyledAlert severity="warning">
                <Typography variant="body2">
                  No tienes horarios asignados en esta semana.
                </Typography>
              </StyledAlert>
            ) : (
              <Grid container spacing={1.5}>
                {diasSemana.map((dia, index) => {
                  const diaKey = `dia${index + 1}`;
                  const tieneHorario = diasConHorarios.includes(diaKey);
                  const estaSeleccionado = eliminacionSeleccionada.diasSeleccionados.includes(diaKey);
                  
                  return (
                    <Grid item xs={6} sm={4} key={diaKey}>
                      <DayButton
                        variant={estaSeleccionado ? "contained" : "outlined"}
                        fullWidth
                        disabled={!tieneHorario}
                        onClick={() => toggleDiaSeleccionado(diaKey)}
                        selected={estaSeleccionado}
                      >
                        {dia} {!tieneHorario && '•'}
                      </DayButton>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {eliminacionSeleccionada.diasSeleccionados.length > 0 && (
              <StyledAlert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Se eliminarán: {eliminacionSeleccionada.diasSeleccionados.map(dia => {
                    const diaIndex = parseInt(dia.replace('dia', '')) - 1;
                    return diasSemana[diaIndex];
                  }).join(', ')}
                </Typography>
              </StyledAlert>
            )}
          </Box>
        )}

        {esAdministrador && eliminacionSeleccionada.tipo === 'usuario' && (
          <StyledFormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel>Usuario</InputLabel>
            <Select
              value={eliminacionSeleccionada.usuarioId || ''}
              onChange={(e) => setEliminacionSeleccionada(prev => ({ ...prev, usuarioId: e.target.value }))}
              size={isMobile ? 'small' : 'medium'}
              label="Usuario"
            >
              {usuarios.map(usuario => (
                <MenuItem key={usuario.id} value={usuario.id}>
                  {usuario.nombre} {usuario.apellidos}
                  {usuario.id === currentUser?.uid && ' (Tú)'}
                </MenuItem>
              ))}
            </Select>
          </StyledFormControl>
        )}

        {esAdministrador && eliminacionSeleccionada.tipo === 'dia' && (
          <StyledFormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel>Día</InputLabel>
            <Select
              value={eliminacionSeleccionada.dia || ''}
              onChange={(e) => setEliminacionSeleccionada(prev => ({ ...prev, dia: e.target.value }))}
              size={isMobile ? 'small' : 'medium'}
              label="Día"
            >
              {diasSemana.map((dia, index) => (
                <MenuItem key={dia} value={`dia${index + 1}`}>
                  {dia}
                </MenuItem>
              ))}
            </Select>
          </StyledFormControl>
        )}

        {esAdministrador && eliminacionSeleccionada.tipo === 'todo' && (
          <StyledAlert severity="error" sx={{ mt: 3 }} icon={<WarningAmberIcon />}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              ⚠️ Esta acción eliminará TODOS los horarios de TODOS los usuarios para esta semana.
            </Typography>
          </StyledAlert>
        )}
      </ContentBox>
      <DialogActions sx={{ 
        p: 3, 
        gap: 1.5,
        backgroundColor: '#fafafa',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <ActionButton 
          onClick={() => setDialogoEliminar(false)}
          startIcon={<CloseIcon />}
        >
          Cancelar
        </ActionButton>
        <DeleteButton 
          onClick={handleEliminarSeleccionado} 
          variant="contained" 
          startIcon={<DeleteOutlineIcon />}
          disabled={
            (eliminacionSeleccionada.tipo === 'mis-dias' && eliminacionSeleccionada.diasSeleccionados.length === 0) ||
            (eliminacionSeleccionada.tipo === 'usuario' && (!eliminacionSeleccionada.usuarioId || eliminacionSeleccionada.usuarioId === '')) ||
            (eliminacionSeleccionada.tipo === 'dia' && (!eliminacionSeleccionada.dia || eliminacionSeleccionada.dia === ''))
          }
        >
          Eliminar
        </DeleteButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default DialogoEliminar;
