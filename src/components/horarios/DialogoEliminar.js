import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, FormControl, InputLabel, Select, MenuItem, Box, Alert, Grid } from '@mui/material';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

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
        // tipo: prev.tipo // No forzar tipo, mantener el último seleccionado
      }));
    }
    // eslint-disable-next-line
  }, [dialogoEliminar]);

  // Obtener los horarios del usuario actual para mostrar qué días puede eliminar
  const horariosUsuarioActual = horarios[currentUser?.uid] || {};
  const diasConHorarios = Object.keys(horariosUsuarioActual);

  return (
    <Dialog 
      open={dialogoEliminar} 
      onClose={() => setDialogoEliminar(false)}
      fullScreen={isSmallMobile}
      maxWidth={isMobile ? 'sm' : 'md'}
      fullWidth
    >
      <DialogTitle>
        Eliminar Horarios
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth>
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
            >
              <MenuItem value="mis-dias">Mis días específicos</MenuItem>
              {esAdministrador && (
                <>
                  <MenuItem value="todo">Todos los horarios (Solo Admin)</MenuItem>
                  <MenuItem value="usuario">Por usuario (Solo Admin)</MenuItem>
                  <MenuItem value="dia">Por día completo (Solo Admin)</MenuItem>
                </>
              )}
            </Select>
          </FormControl>

          {!esAdministrador && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Solo puedes eliminar tus propios horarios. Los administradores tienen permisos adicionales.
              </Typography>
            </Alert>
          )}

          {eliminacionSeleccionada.tipo === 'mis-dias' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                Selecciona los días que deseas eliminar:
              </Typography>
              
              {diasConHorarios.length === 0 ? (
                <Alert severity="warning">
                  <Typography variant="body2">
                    No tienes horarios asignados en esta semana.
                  </Typography>
                </Alert>
              ) : (
                <Grid container spacing={1}>
                  {diasSemana.map((dia, index) => {
                    const diaKey = `dia${index + 1}`;
                    const tieneHorario = diasConHorarios.includes(diaKey);
                    const estaSeleccionado = eliminacionSeleccionada.diasSeleccionados.includes(diaKey);
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} key={diaKey}>
                        <Button
                          variant={estaSeleccionado ? "contained" : "outlined"}
                          sx={{
                            backgroundColor: estaSeleccionado ? '#d32f2f' : 'transparent',
                            color: estaSeleccionado ? 'white' : 'inherit',
                            borderColor: estaSeleccionado ? '#d32f2f' : 'rgba(0, 0, 0, 0.23)',
                            '&:hover': {
                              backgroundColor: estaSeleccionado ? '#b71c1c' : 'rgba(211, 47, 47, 0.04)',
                              borderColor: '#d32f2f'
                            }
                          }}
                          fullWidth
                          disabled={!tieneHorario}
                          onClick={() => toggleDiaSeleccionado(diaKey)}
                        >
                          {dia} {!tieneHorario && '(Sin horario)'}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>
              )}

              {eliminacionSeleccionada.diasSeleccionados.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Se eliminarán los horarios de: {eliminacionSeleccionada.diasSeleccionados.map(dia => {
                      const diaIndex = parseInt(dia.replace('dia', '')) - 1;
                      return diasSemana[diaIndex];
                    }).join(', ')}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {esAdministrador && eliminacionSeleccionada.tipo === 'usuario' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Usuario</InputLabel>
              <Select
                value={eliminacionSeleccionada.usuarioId || ''}
                onChange={(e) => setEliminacionSeleccionada(prev => ({ ...prev, usuarioId: e.target.value }))}
                size={isMobile ? 'small' : 'medium'}
              >
                {usuarios.map(usuario => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    {usuario.nombre} {usuario.apellidos}
                    {usuario.id === currentUser?.uid && ' (Tú)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {esAdministrador && eliminacionSeleccionada.tipo === 'dia' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Día</InputLabel>
              <Select
                value={eliminacionSeleccionada.dia || ''}
                onChange={(e) => setEliminacionSeleccionada(prev => ({ ...prev, dia: e.target.value }))}
                size={isMobile ? 'small' : 'medium'}
              >
                {diasSemana.map((dia, index) => (
                  <MenuItem key={dia} value={`dia${index + 1}`}>
                    {dia}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {esAdministrador && eliminacionSeleccionada.tipo === 'todo' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ⚠️ Esta acción eliminará TODOS los horarios de TODOS los usuarios para esta semana.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setDialogoEliminar(false)}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleEliminarSeleccionado} 
          variant="contained" 
          sx={{
            backgroundColor: '#d32f2f',
            '&:hover': {
              backgroundColor: '#b71c1c'
            }
          }}
          disabled={
            (eliminacionSeleccionada.tipo === 'mis-dias' && eliminacionSeleccionada.diasSeleccionados.length === 0) ||
            (eliminacionSeleccionada.tipo === 'usuario' && (!eliminacionSeleccionada.usuarioId || eliminacionSeleccionada.usuarioId === '')) ||
            (eliminacionSeleccionada.tipo === 'dia' && (!eliminacionSeleccionada.dia || eliminacionSeleccionada.dia === ''))
          }
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogoEliminar;
