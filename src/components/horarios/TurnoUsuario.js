import React from 'react';
import { Grid, Box, Typography, IconButton } from '@mui/material';
import { TIPO_LABEL } from '../../utils/horariosConstants';

const TIPOS_SOLO_LABEL = ['descanso', 'vacaciones', 'feriado', 'permiso'];

const TurnoUsuario = ({ 
  usuario, 
  diaKey, 
  editando, 
  horariosEditados, 
  horarios, 
  currentUser, 
  handleCambiarTurno, 
  handleCopiarHorario, 
  NO_SUMAN_HORAS
}) => {
  const horariosUsuario = editando ? horariosEditados[usuario.id] : horarios[usuario.id];
  const horario = horariosUsuario?.[diaKey];
  const tieneHorario = horario && horario.tipo !== 'libre';

  // Determina si solo se debe mostrar el label
  const soloLabel = tieneHorario && TIPOS_SOLO_LABEL.includes(horario.tipo);

  // Color del icono de copiar
  const copiarColor = soloLabel ? '#222' : '#fff';

  return (
    <Grid item xs={true} key={diaKey}>
      <Box
        onClick={() => {
          if (editando) {
            handleCambiarTurno(usuario.id, diaKey);
          }
        }}
        sx={{
          minHeight: 80, // Más alto
          minWidth: 110,  // Más ancho
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          cursor: editando ? 'pointer' : 'default',
          position: 'relative',
          bgcolor: soloLabel
            ? '#fff'
            : tieneHorario ? (
                horario.tipo === 'viaje-trabajo' ? '#1a237e' : // azul oscuro
                horario.tipo === 'tele-presencial' ? '#6a1b9a' : // nuevo: morado/berenjena
                horario.tipo === 'teletrabajo' ? '#2e7d32' :
                horario.tipo === 'cambio' ? '#f57c00' :
                usuario.id === currentUser?.uid ? 'var(--primary-color)' : 'var(--secondary-color)'
              ) : 'transparent',
          color: soloLabel
            ? '#333'
            : tieneHorario ? 'white' : 'text.secondary',
          '&:hover': editando ? {
            backgroundColor: soloLabel
              ? '#fff'
              : tieneHorario ? (
                  horario.tipo === 'tele-presencial' ? '#4a148c' : // hover morado más oscuro
                  horario.tipo === 'teletrabajo' ? '#1b5e20' :
                  horario.tipo === 'cambio' ? '#e65100' :
                  usuario.id === currentUser?.uid ? '#303f9f' : '#c51162'
                ) : '#f0f0f0'
          } : {}
        }}
      >
        {/* Icono de copiar para desktop */}
        {tieneHorario && editando && !soloLabel &&
          currentUser &&
          (
            ['Administrador', 'Modificador'].includes(currentUser.rol) ||
            usuario.id === currentUser.uid
          ) ? (
            <IconButton
              size="small"
              onClick={(e) => handleCopiarHorario(usuario.id, diaKey, e)}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                backgroundColor: 'transparent',
                color: copiarColor,
                minWidth: 'auto',
                width: 18,
                height: 18,
                padding: 0,
                border: 'none',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              <span style={{ fontSize: 12, color: copiarColor }}>⧉</span>
            </IconButton>
          ) : null}
        {/* Icono de copiar para fondo blanco */}
        {tieneHorario && editando && soloLabel &&
          currentUser &&
          (
            ['Administrador', 'Modificador'].includes(currentUser.rol) ||
            usuario.id === currentUser.uid
          ) ? (
            <IconButton
              size="small"
              onClick={(e) => handleCopiarHorario(usuario.id, diaKey, e)}
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                backgroundColor: 'transparent',
                color: copiarColor,
                minWidth: 'auto',
                width: 18,
                height: 18,
                padding: 0,
                border: 'none',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              <span style={{ fontSize: 12, color: copiarColor }}>⧉</span>
            </IconButton>
          ) : null}
        {tieneHorario ? (
          soloLabel ? (
            <>
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.2, fontWeight: 'bold' }}
              >
                {TIPO_LABEL[horario.tipo] || horario.tipo}
              </Typography>
              {horario.nota && (
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1, mt: 0.5, color: '#333', fontStyle: 'italic' }}
                >
                  {horario.nota}
                </Typography>
              )}
            </>
          ) : horario.tipo === 'tarde-libre' ? (
            <>
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.2, fontWeight: 'bold' }}
              >
                Presencial
              </Typography>
              {(horario.horaInicio && horario.horaFin) && (
                <Typography 
                  variant="caption" 
                  sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1 }}
                >
                  {horario.horaInicio} - {horario.horaFin}
                </Typography>
              )}
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.2, fontWeight: 'bold', mt: 0.5 }}
              >
                Tiempo Libre
              </Typography>
              {(horario.horaInicioLibre && horario.horaFinLibre) && (
                <Typography 
                  variant="caption" 
                  sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1 }}
                >
                  {horario.horaInicioLibre} - {horario.horaFinLibre}
                </Typography>
              )}
              {horario.nota && (
                <Typography 
                  variant="caption" 
                  sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1, mt: 0.5, fontStyle: 'italic' }}
                >
                  {horario.nota}
                </Typography>
              )}
            </>
          ) : horario.tipo === 'viaje-trabajo' ? (
            <Typography 
              variant="caption" 
              sx={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1, fontWeight: 'bold' }}
            >
              {TIPO_LABEL[horario.tipo] || horario.tipo}
            </Typography>
          ) : horario.tipo === 'tele-presencial' ? (
            <>
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.2, fontWeight: 'bold' }}
              >
                {TIPO_LABEL[horario.tipo] || 'Teletrabajo & Presencial'}
              </Typography>

              {/* Teletrabajo */}
              {(horario.horaInicioTele && horario.horaFinTele) && (
                <>
                  <Typography 
                    variant="caption" 
                    sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1 }}
                  >
                    TT: {horario.horaInicioTele} - {horario.horaFinTele}
                  </Typography>
                </>
              )}

              {/* Presencial */}
              {(horario.horaInicioPres && horario.horaFinPres) && (
                <>
                  <Typography 
                    variant="caption" 
                    sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1, mt: 0.3 }}
                  >
                    Pres: {horario.horaInicioPres} - {horario.horaFinPres}
                  </Typography>
                </>
              )}

              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1, mt: 0.5 }}
              >
                {`${horario.horas?.toFixed(1) || '0.0'}h`}
              </Typography>

              {horario.nota && (
                <Typography 
                  variant="caption" 
                  sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1, mt: 0.5, color: '#fff', fontStyle: 'italic' }}
                >
                  {horario.nota}
                </Typography>
              )}
            </>
          ) : (
            <>
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1, fontWeight: 'bold' }}
              >
                {TIPO_LABEL[horario.tipo] || horario.tipo}
              </Typography>
              {(horario.horaInicio && horario.horaFin) && (
                <Typography 
                  variant="caption" 
                  sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1 }}
                >
                  {horario.horaInicio} - {horario.horaFin}
                </Typography>
              )}
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1 }}
              >
                {NO_SUMAN_HORAS.includes(horario.tipo)
                  ? (horario.tipo === 'teletrabajo' ? 'TT' :
                     horario.tipo === 'descanso' ? 'D' :
                     horario.tipo === 'vacaciones' ? 'V' :
                     horario.tipo === 'feriado' ? 'F' :
                     horario.tipo === 'permiso' ? 'P' : 'X')
                  : `${horario.horas?.toFixed(1) || '0'}h`
                }
              </Typography>
              {horario.nota && (
                    <Typography 
                      variant="caption" 
                      sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1, mt: 0.5, color: '#fff', fontStyle: 'italic' }}
                    >
                      {horario.nota}
                    </Typography>
              )}
            </>
          )
        ) : (
          <Typography 
            variant="caption" 
            sx={{ fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.2, color: '#888' }}
          >
            Sin Turno
          </Typography>
        )}
      </Box>
    </Grid>
  );
};

export default TurnoUsuario;