import React from 'react';
import { Box, Paper, Grid, Typography, IconButton, Chip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { format, addDays } from 'date-fns';
import TurnoUsuario from './TurnoUsuario';
import { obtenerEtiquetaRol, obtenerColorRol } from '../../utils/horariosUtils';

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
    <Box sx={{ p: { xs: 0.5, sm: 2, md: 3 }, overflowX: 'auto' }}>
      {isMobile ? (
        <Box sx={{ px: 1 }}>
          {/* Encabezados móvil */}
          <Grid container spacing={0.5} sx={{ mb: 1 }}>
            <Grid item xs={4}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.75rem', textAlign: 'center' }}>
                Usuario
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.75rem', textAlign: 'center' }}>
                Horarios de la Semana
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', p: 0.5, fontSize: '0.75rem', textAlign: 'center' }}>
                Total
              </Typography>
            </Grid>
          </Grid>

          {/* Filas de usuarios móvil */}
          {usuariosFiltrados.map(usuario => (
            <Paper key={usuario.id} elevation={usuario.id === currentUser?.uid ? 3 : 1} sx={{ mb: 1, p: 1, bgcolor: usuario.id === currentUser?.uid ? '#e3f2fd' : 'white', border: usuario.id === currentUser?.uid ? '2px solid #2196f3' : '1px solid #e0e0e0' }}>
              <Grid container spacing={0.5} alignItems="center">
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: usuario.id === currentUser?.uid ? 'bold' : 'normal', fontSize: '0.7rem', display: 'block', lineHeight: 1.2 }}>
                      {usuario.nombre} {usuario.apellidos}
                    </Typography>
                    <Chip label={obtenerEtiquetaRol(usuario.rol)} color={obtenerColorRol(usuario.rol)} size="small" sx={{ fontSize: '0.6rem', height: 16, mt: 0.5 }} />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Grid container spacing={0.3}>
                    {diasSemana.map((dia, index) => {
                      const diaKey = `dia${index + 1}`;
                      const horariosUsuario = editando ? horariosEditados[usuario.id] : horarios[usuario.id];
                      const horario = horariosUsuario?.[diaKey];
                      const tieneHorario = horario && horario.tipo !== 'libre';

                      return (
                        <Grid item xs={12/7} key={diaKey}>
                          <Box
                            onClick={() => {
                              if (editando) handleCambiarTurno(usuario.id, diaKey);
                              else if (tieneHorario) abrirInfoTurno(usuario, horario, diaKey);
                            }}
                            sx={{
                              height: 28,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderRadius: '4px',
                              position: 'relative',
                              bgcolor: tieneHorario
                                ? NO_SUMAN_HORAS.includes(horario.tipo)
                                  ? 'white'
                                  : horario.tipo === 'teletrabajo'
                                  ? '#2e7d32'
                                  : horario.tipo === 'cambio'
                                  ? '#f57c00'
                                  : usuario.id === currentUser?.uid
                                  ? 'var(--primary-color)'
                                  : 'var(--secondary-color)'
                                : 'transparent',
                              color: tieneHorario
                                ? NO_SUMAN_HORAS.includes(horario.tipo)
                                  ? 'black'
                                  : 'white'
                                : 'text.secondary',
                              '&:hover': editando
                                ? { backgroundColor: '#f0f0f0' }
                                : {}
                            }}
                          >
                            {tieneHorario && editando && (
                              <IconButton size="small" onClick={e => handleCopiarHorario(usuario.id, diaKey, e)} sx={{ position: 'absolute', top: -2, right: -2, backgroundColor: 'transparent', color: '#1976d2', width: 12, height: 12, p: 0, '&:hover': { backgroundColor: 'transparent' } }}>
                                <ContentCopyIcon sx={{ fontSize: 8 }} />
                              </IconButton>
                            )}
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center', lineHeight: 1 }}>
                                {dia.slice(0, 1)}
                              </Typography>
                              {horario && horario.tipo === 'descanso' && horario.nota && (
                                <Typography variant="caption" sx={{ fontSize: '0.55rem', textAlign: 'center', lineHeight: 1, mt: 0.2, color: 'text.secondary' }}>
                                  {horario.nota}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Grid>
                <Grid item xs={2}>
                  <Paper elevation={calcularExceso(usuario.id) > 0 ? 2 : 1} sx={{ textAlign: 'center', p: 0.5, bgcolor: calcularExceso(usuario.id) > 0 ? '#ffebee' : '#e8f5e8', border: calcularExceso(usuario.id) > 0 ? '1px solid #f44336' : '1px solid #4caf50' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {calcularHorasTotales(usuario.id, editando, horariosEditados, horarios, semanaSeleccionada, semanaActual, {}, id => obtenerUsuario(usuariosFiltrados, id), obtenerHorasMaximas, true).toFixed(1)}h
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      ) : (
        <Grid container spacing={1}>
          {/* Encabezados */}
          <Grid item xs={12}>
            <Grid container spacing={1}>
              <Grid item xs={2} md={2}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', p: 1 }}>
                  Usuario
                </Typography>
              </Grid>
              {diasSemana.map((dia, index) => (
                <Grid item xs key={dia}>
                  <Typography variant="subtitle2" align="center" sx={{ fontWeight: 'bold', p: 1 }}>
                    {`${dia} ${format(addDays(semanaSeleccionada, index), 'd')}`}
                  </Typography>
                </Grid>
              ))}
              <Grid item xs={1} md={1}>
                <Typography variant="subtitle2" align="center" sx={{ fontWeight: 'bold', p: 1 }}>
                  Total
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          {/* Filas de usuarios */}
          {usuariosFiltrados.map(usuario => (
            <Grid item xs={12} key={usuario.id}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={2} md={2}>
                  <Paper elevation={usuario.id === currentUser?.uid ? 2 : 0} sx={{ p: 1, textAlign: 'center', bgcolor: usuario.id === currentUser?.uid ? '#e3f2fd' : 'transparent', border: usuario.id === currentUser?.uid ? '2px solid #2196f3' : '1px solid #e0e0e0' }}>
                    <Typography variant="body2" sx={{ fontWeight: usuario.id === currentUser?.uid ? 'bold' : 'normal' }}>
                      {usuario.nombre} {usuario.apellidos}
                    </Typography>
                    <br />
                    <Chip label={obtenerEtiquetaRol(usuario.rol)} color={obtenerColorRol(usuario.rol)} size="small" sx={{ fontSize: '0.6rem', height: 20, mt: 0.5 }} />
                  </Paper>
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
                <Grid item xs={1} md={1}>
                  <Paper elevation={calcularExceso(usuario.id) > 0 ? 2 : 1} sx={{ textAlign: 'center', p: 1, bgcolor: calcularExceso(usuario.id) > 0 ? '#ffebee' : '#e8f5e8', border: calcularExceso(usuario.id) > 0 ? '1px solid #f44336' : '1px solid #4caf50' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {calcularHorasTotales(usuario.id, editando, horariosEditados, horarios, semanaSeleccionada, semanaActual, {}, id => obtenerUsuario(usuariosFiltrados, id), obtenerHorasMaximas, true).toFixed(1)}h
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default HorariosTable;
