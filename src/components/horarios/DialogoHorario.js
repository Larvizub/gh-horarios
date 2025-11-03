import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, FormControl, InputLabel, Select, MenuItem, Box, Slide, TextField } from '@mui/material';
import TimeInput from './TimeInput';
import { eliminarHorarioDeUsuario } from '../../services/firebaseHorarios';
import { puedeModificarHorarios } from '../../utils/permissionsUtils';

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
  // DEBUG: Mostrar en consola los datos clave para depuración de permisos
  console.log('DEBUG - currentUser:', currentUser);
  console.log('DEBUG - usuarioObjetivo:', usuarioObjetivo);
  console.log('DEBUG - puedeEliminar:', puedeEliminar);

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
          horaInicioLibre: horarioActual?.horaInicioLibre || '',
          horaFinLibre: horarioActual?.horaFinLibre || '',
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
      horaInicioLibre: '',
      horaFinLibre: '',
      nota: ''
    }));
    // Cerrar el modal después de eliminar
    if (typeof setDialogoHorario === 'function') setDialogoHorario(false);
  };

  return (
    <Dialog 
      open={dialogoHorario} 
      onClose={() => setDialogoHorario(false)}
      fullScreen={isSmallMobile}
      maxWidth={isMobile ? 'sm' : 'md'}
      fullWidth
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
    >
      <DialogTitle sx={{ 
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        pb: isMobile ? 1 : 2
      }}>
        Asignar Horario
      </DialogTitle>
      <DialogContent sx={{ pb: isMobile ? 1 : 2 }}>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
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
              <MenuItem value="personalizado">Presencial</MenuItem>
              <MenuItem value="teletrabajo">Teletrabajo</MenuItem>
              <MenuItem value="tele-presencial">Teletrabajo & Presencial</MenuItem>
              <MenuItem value="cambio">Cambio</MenuItem>
              <MenuItem value="descanso">Descanso</MenuItem>
              <MenuItem value="vacaciones">Vacaciones</MenuItem>
              <MenuItem value="feriado">Feriado</MenuItem>
              <MenuItem value="permiso">Permiso Otorgado por Jefatura</MenuItem>
              <MenuItem value="dia-brigada">Día por Brigada</MenuItem>
              <MenuItem value="tarde-libre">Tarde Libre</MenuItem>
              <MenuItem value="fuera-oficina">Fuera de Oficina</MenuItem>
              <MenuItem value="viaje-trabajo">Viaje de Trabajo</MenuItem>
              <MenuItem value="incapacidad-enfermedad">Incapacidad por Enfermedad</MenuItem>
              <MenuItem value="incapacidad-accidente">Incapacidad por Accidente</MenuItem>
            </Select>
          </FormControl>

          {tipo === 'viaje-trabajo' ? null
          : tipo === 'tarde-libre' ? (
            <>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                Presencial
              </Typography>
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
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Tiempo Libre
              </Typography>
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
              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                Horas laboradas: {horasLaboradas.toFixed(1)}h
              </Typography>
            </>
          ) : tipo === 'tele-presencial' ? (
            <>
              <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                Teletrabajo
              </Typography>
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

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Presencial
              </Typography>
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
              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                Horas Teletrabajo: {(() => {
                  const s = horarioPersonalizado.horaInicioTele;
                  const e = horarioPersonalizado.horaFinTele;
                  if (!s || !e) return '0.0';
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
                  } catch { return '0.0'; }
                })()}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                Horas Presencial: {(() => {
                  const s = horarioPersonalizado.horaInicioPres;
                  const e = horarioPersonalizado.horaFinPres;
                  if (!s || !e) return '0.0';
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
                  } catch { return '0.0'; }
                })()}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                Total: {(() => {
                  // Reusar cálculos anteriores
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
                })()}
              </Typography>
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
              <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                Horas laboradas: {horasLaboradas.toFixed(1)}h
              </Typography>
            </>
          ) : null}

          {/* Campo para nota */}
          <TextField
            label="Nota (opcional)"
            value={horarioPersonalizado.nota || ''}
            onChange={e => setHorarioPersonalizado(prev => ({ ...prev, nota: e.target.value }))}
            fullWidth
            multiline
            minRows={1}
            maxRows={3}
            sx={{ mt: 2 }}
            size={isMobile ? 'small' : 'medium'}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        p: isMobile ? 2 : 3,
        flexDirection: isSmallMobile ? 'column' : 'row',
        gap: isSmallMobile ? 1 : 0
      }}>
        <Button 
          onClick={() => setDialogoHorario(false)}
          fullWidth={isSmallMobile}
          size={isMobile ? 'medium' : 'large'}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleEliminarHorario}
          color="error"
          variant="outlined"
          fullWidth={isSmallMobile}
          size={isMobile ? 'medium' : 'large'}
          sx={{ ml: isSmallMobile ? 0 : 1 }}
          disabled={!puedeEliminar}
        >
          Eliminar
        </Button>
        <Button 
          onClick={guardarHorarioPersonalizado} 
          variant="contained"
          fullWidth={isSmallMobile}
          size={isMobile ? 'medium' : 'large'}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default DialogoHorario;
