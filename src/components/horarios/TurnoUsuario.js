import React, { memo } from 'react';
import { Grid, Box, Typography, IconButton } from '@mui/material';
import useTiposHorario from '../../hooks/useTiposHorario';
import { getTipoIconComponent } from '../../utils/tiposHorario';
import { obtenerColorJornadaOrdinaria, obtenerResumenJornadaLegal } from '../../utils/jornadasOrdinarias';
import { esContratoOperativo, getTipoContratoColorPalette } from '../../utils/tiposContrato';

const TIPOS_SOLO_LABEL = ['descanso', 'vacaciones', 'feriado', 'permiso'];

const TurnoUsuario = memo(({ 
  usuario, 
  diaKey, 
  editando, 
  horariosEditados, 
  horarios, 
  currentUser, 
  handleCambiarTurno, 
  handleCopiarHorario, 
  NO_SUMAN_HORAS,
  jornadasOrdinariasMap = {},
  suppressOpen, // when true, clicking the slot should not open the edit dialog (used during multi-target selection)
  isFeriado,
}) => {
  const { getTipoLabel, tiposMap } = useTiposHorario();
  const horariosUsuario = editando
    ? (horariosEditados[usuario.id] || horarios[usuario.id] || {})
    : (horarios[usuario.id] || {});
  const horario = horariosUsuario?.[diaKey];
  const tieneHorario = horario && horario.tipo !== 'libre';
  const contratoOperativo = esContratoOperativo(usuario?.tipoContrato);
  const tipoCatalogo = horario?.tipo ? tiposMap[horario.tipo] : null;
  const colorTipoDinamico = tipoCatalogo?.editable ? tipoCatalogo?.color : null;
  const IconoTipoHorario = getTipoIconComponent(tipoCatalogo?.icon);
  const horaInicioJornada = horario?.horaInicio || horario?.horaInicioPres || horario?.horaInicioBloque1 || horario?.horaInicioTele || horario?.horaInicioLibre || '';
  const resumenJornada = contratoOperativo && horaInicioJornada ? obtenerResumenJornadaLegal(horaInicioJornada, jornadasOrdinariasMap) : null;
  const colorJornada = contratoOperativo ? obtenerColorJornadaOrdinaria(resumenJornada?.key) : null;
  const esVacaciones = horario?.tipo === 'vacaciones';
  const esDescanso = horario?.tipo === 'descanso';

  // Detecta si la tarjeta muestra contenido presencial (label o bloques presencial)
  const tipoLabel = getTipoLabel(horario?.tipo);
  const esTarjetaPresencial = Boolean(
    (tipoLabel && String(tipoLabel).toLowerCase().includes('presencial')) ||
    horario?.horaInicioPres || horario?.horaInicioBloque1 || horario?.horaInicioBloque2
  );

  // Paleta de color según tipo de contrato del usuario
  const contratoPalette = getTipoContratoColorPalette(usuario?.tipoContrato);
  const contratoMain = contratoPalette?.main || '#6c757d';
  const contratoDark = contratoPalette?.dark || contratoMain;

  // Determina si solo se debe mostrar el label
  const soloLabel = tieneHorario && TIPOS_SOLO_LABEL.includes(horario.tipo);

  // Color del icono de copiar
  const copiarColor = soloLabel ? '#222' : '#fff';

  return (
    <Grid item xs={true} key={diaKey}>
      <Box
        onClick={() => {
          if (editando && !suppressOpen) {
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
          border: isFeriado
            ? '1px solid rgba(220, 38, 38, 0.35)'
            : !contratoOperativo
              ? '1px solid #e0e0e0'
              : esVacaciones
              ? '1px solid rgba(45, 212, 191, 0.55)'
              : esDescanso
                ? '1px solid rgba(214, 201, 182, 0.4)'
              : '1px solid #e0e0e0',
          borderLeft: isFeriado
            ? '5px solid rgba(220, 38, 38, 0.8)'
            : !contratoOperativo
              ? '5px solid #cbd5e1'
              : esVacaciones
              ? '5px solid #2DD4BF'
              : esDescanso
                ? '5px solid #E7D9BF'
            : colorJornada
              ? `5px solid ${colorJornada}`
              : undefined,
          cursor: editando ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: soloLabel
            ? (isFeriado ? '#fff7f7' : esVacaciones ? 'rgba(45, 212, 191, 0.14)' : esDescanso ? '#FBFAF3' : '#fff')
            : tieneHorario ? (
                esTarjetaPresencial ? contratoMain :
                !contratoOperativo ? '#fff' :
                horario.tipo === 'viaje-trabajo' ? '#1a237e' : // azul oscuro
                horario.tipo === 'tele-presencial' ? '#6a1b9a' : // nuevo: morado/berenjena
                horario.tipo === 'horario-dividido' ? '#7c3aed' :
                horario.tipo === 'visita-comercial' ? '#795548' :
                horario.tipo === 'tele-media-libre' ? '#2e7d32' :
                horario.tipo === 'media2-cumple' ? '#607d8b' :
                horario.tipo === 'media-cumple' ? '#607d8b' :
                horario.tipo === 'teletrabajo' ? '#2e7d32' :
                horario.tipo === 'cambio' ? '#f57c00' :
                colorTipoDinamico ? colorTipoDinamico :
                usuario.id === currentUser?.uid ? '#00830e' : '#6c757d'
              ) : 'transparent',
          color: soloLabel
            ? (isFeriado ? '#991b1b' : esVacaciones ? '#0f766e' : esDescanso ? '#92400e' : '#333')
            : tieneHorario ? (esTarjetaPresencial ? '#fff' : (contratoOperativo ? 'white' : '#334155')) : 'text.secondary',
          '& > :not([aria-hidden="true"])': {
            position: 'relative',
            zIndex: 1
          },
          '&:hover': editando ? {
            backgroundColor: soloLabel
              ? (isFeriado ? '#fff1f1' : esVacaciones ? 'rgba(45, 212, 191, 0.2)' : esDescanso ? '#F8F6EE' : '#fff')
              : tieneHorario ? (
                  esTarjetaPresencial ? contratoDark :
                  !contratoOperativo ? '#fff' :
                  horario.tipo === 'tele-presencial' ? '#4a148c' : // hover morado más oscuro
                  horario.tipo === 'horario-dividido' ? '#6d28d9' :
                  horario.tipo === 'visita-comercial' ? '#5d4037' :
                  horario.tipo === 'tele-media-libre' ? '#1b5e20' :
                  horario.tipo === 'media2-cumple' ? '#455a64' :
                  horario.tipo === 'media-cumple' ? '#455a64' :
                  horario.tipo === 'teletrabajo' ? '#1b5e20' :
                  horario.tipo === 'cambio' ? '#e65100' :
                  colorTipoDinamico ? colorTipoDinamico :
                  usuario.id === currentUser?.uid ? '#303f9f' : '#c51162'
                ) : '#f0f0f0'
          } : {}
        }}
      >
        {tieneHorario && (
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              right: -10,
              top: '50%',
              transform: 'translateY(-50%) rotate(-14deg)',
              opacity: contratoOperativo ? (soloLabel ? 0.14 : 0.25) : 0.08,
              color: contratoOperativo
                ? (soloLabel ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.45)')
                : 'rgba(100, 116, 139, 0.35)',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 0
            }}
          >
            <IconoTipoHorario sx={{ fontSize: '3.8rem' }} />
          </Box>
        )}
        {resumenJornada && colorJornada && (
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow: `inset 0 0 0 1px ${colorJornada}`,
              zIndex: 0,
            }}
          />
        )}
        {isFeriado && (
          <Box
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(254, 242, 242, 0.22), rgba(255, 255, 255, 0.04))',
              borderTop: '4px solid rgba(220, 38, 38, 0.75)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
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
                zIndex: 2,
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
                zIndex: 2,
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
                {getTipoLabel(horario.tipo)}
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
            ) : horario.tipo === 'tele-media-libre' ? (
              <>
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.2, fontWeight: 'bold' }}
              >
                Teletrabajo
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
              {getTipoLabel(horario.tipo)}
            </Typography>
            ) : horario.tipo === 'tele-presencial' ? (
              <>
              <Typography 
                variant="caption" 
                sx={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.2, fontWeight: 'bold' }}
              >
                {getTipoLabel(horario.tipo)}
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
                    Presencial: {horario.horaInicioPres} - {horario.horaFinPres}
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
            ) : horario.tipo === 'horario-dividido' ? (
              <>
              <Typography
                variant="caption"
                sx={{ fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.2, fontWeight: 'bold' }}
              >
                {getTipoLabel(horario.tipo)}
              </Typography>

              {(horario.horaInicioBloque1 && horario.horaFinBloque1) && (
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1 }}
                >
                  Presencial B1: {horario.horaInicioBloque1} - {horario.horaFinBloque1}
                </Typography>
              )}

              {(horario.horaInicioBloque2 && horario.horaFinBloque2) && (
                <Typography
                  variant="caption"
                  sx={{ fontSize: '0.75rem', textAlign: 'center', lineHeight: 1, mt: 0.3 }}
                >
                  Presencial B2: {horario.horaInicioBloque2} - {horario.horaFinBloque2}
                </Typography>
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
                {getTipoLabel(horario.tipo)}
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
                     horario.tipo === 'media2-cumple' ? '🎂' :
                     horario.tipo === 'media-cumple' ? '🎂' :
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
          <>
            <Typography 
              variant="caption" 
              sx={{ fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.2, color: isFeriado ? '#991b1b' : '#888', fontWeight: isFeriado ? 700 : 400 }}
            >
              {isFeriado ? 'Feriado' : 'Sin Turno'}
            </Typography>
          </>
          )}
      </Box>
    </Grid>
  );
});

export default TurnoUsuario;