import React, { memo } from 'react';
import { Grid, Box, Typography, IconButton } from '@mui/material';
import useTiposHorario from '../../hooks/useTiposHorario';
import { getTipoIconComponent, DEFAULT_TIPOS_HORARIO } from '../../utils/tiposHorario';
import { obtenerColorJornadaOrdinaria, obtenerResumenJornadaLegal } from '../../utils/jornadasOrdinarias';
import { esContratoOperativo, getTipoContratoColorPalette } from '../../utils/tiposContrato';

const TIPOS_SOLO_LABEL = ['descanso', 'vacaciones', 'feriado', 'permiso', 'incapacidad-enfermedad', 'incapacidad-accidente'];

const hexToRgba = (hex = '#000000', alpha = 1) => {
  const sanitized = (hex || '').replace('#', '');
  if (sanitized.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getContrastColor = (hex = '#000000') => {
  const sanitized = (hex || '').replace('#', '');
  if (sanitized.length !== 6) return '#fff';
  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000' : '#fff';
};

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
  const colorTipoDinamico = tipoCatalogo?.color || null;
  const esBeneficio = Boolean(tipoCatalogo?.esBeneficio);
  const IconoTipoHorario = getTipoIconComponent(tipoCatalogo?.icon);
  const horaInicioJornada = horario?.horaInicio || horario?.horaInicioPres || horario?.horaInicioBloque1 || horario?.horaInicioTele || horario?.horaInicioLibre || '';
  const resumenJornada = contratoOperativo && horaInicioJornada ? obtenerResumenJornadaLegal(horaInicioJornada, jornadasOrdinariasMap) : null;
  const colorJornada = contratoOperativo ? obtenerColorJornadaOrdinaria(resumenJornada?.key) : null;
  const esVacaciones = horario?.tipo === 'vacaciones';
  const esDescanso = horario?.tipo === 'descanso';
  const esIncapacidad = horario?.tipo === 'incapacidad-enfermedad' || horario?.tipo === 'incapacidad-accidente';

  // Detecta si la tarjeta muestra contenido presencial (label o bloques presencial)
  const tipoLabel = getTipoLabel(horario?.tipo);
  const esTarjetaPresencial = Boolean(
    (tipoLabel && String(tipoLabel).toLowerCase().includes('presencial')) ||
    horario?.horaInicioPres || horario?.horaInicioBloque1 || horario?.horaInicioBloque2
  );

  // Considerar tipos que muestran bloques presenciales (aunque el label no incluya la palabra)
  const tiposConBloquePresencial = new Set(['tele-presencial', 'horario-dividido']);
  const esTipoConBloquePresencial = Boolean(horario?.tipo && tiposConBloquePresencial.has(horario.tipo));
  const esTarjetaPresencialFinal = esTarjetaPresencial || esTipoConBloquePresencial;

  // Tipos que deben mostrar split (mitad contrato / mitad tipo)
  const tiposConSplit = new Set(['tarde-libre', 'tele-media-libre']);
  const hasMainBlock = Boolean(
    horario?.horaInicio || horario?.horaFin || horario?.horaInicioPres || horario?.horaFinPres || horario?.horaInicioBloque1 || horario?.horaFinBloque1 || horario?.horaInicioTele || horario?.horaFinTele
  );
  const tieneBloqueLibre = Boolean(
    horario?.horaInicioLibre || horario?.horaFinLibre || horario?.horaInicioBloque2 || horario?.horaFinBloque2
  );
  const combinaTeleYLibre = Boolean(hasMainBlock && tieneBloqueLibre);
  const necesitaSplit = Boolean(esBeneficio || tiposConSplit.has(horario?.tipo) || combinaTeleYLibre);

  // Paleta de color según tipo de contrato del usuario
  const contratoPalette = getTipoContratoColorPalette(usuario?.tipoContrato);
  const contratoMain = contratoPalette?.main || '#6c757d';
  const contratoDark = contratoPalette?.dark || contratoMain;

  // Determina si solo se debe mostrar el label
  const soloLabel = tieneHorario && TIPOS_SOLO_LABEL.includes(horario.tipo);

  // Color del icono de copiar
  const copiarColor = soloLabel ? '#222' : '#fff';

  // Colores para split: superior = color por contrato (usar `contratoMain`), inferior = color por tipo (o fallback)
  const topColor = contratoMain;
  // Por defecto priorizamos el color del contrato para tarjetas "presencial"
  // (ej. usuarios con tipoContrato 'operativo' deben verse en azul),
  // salvo cuando el turno es un beneficio o requiere split. En otros casos
  // preferimos el color configurado para el tipo de horario.
  let tipoColorComputed = tieneHorario ? (
    (esTarjetaPresencialFinal && !esBeneficio && !necesitaSplit) ? contratoMain :
    (colorTipoDinamico || (
      horario.tipo === 'viaje-trabajo' ? '#1a237e' :
      horario.tipo === 'visita-comercial' ? '#795548' :
      horario.tipo === 'tele-presencial' ? '#6a1b9a' :
      horario.tipo === 'horario-dividido' ? '#7c3aed' :
      horario.tipo === 'cambio' ? '#f57c00' :
      !contratoOperativo ? '#fff' :
      usuario.id === currentUser?.uid ? '#00830e' : '#6c757d'
    ))
  ) : '#ffffff';

  // Si el turno combina teletrabajo y tiempo libre, preferir el color configurado
  // para la mitad de "tiempo libre" (ej. `tarde-libre` o `tele-media-libre`).
  if (necesitaSplit && combinaTeleYLibre) {
    // Si hay un bloque libre, preferir el color según sea tele+libre o tarde-libre.
    const preferTeleFree = Boolean(
      horario?.horaInicioTele || horario?.horaFinTele || horario?.tipo === 'tele-media-libre' || (horario?.tipo && String(horario.tipo).includes('tele'))
    );
    let freeColor = tipoColorComputed;
    if (preferTeleFree && tiposMap?.['tele-media-libre']?.color) {
      freeColor = tiposMap['tele-media-libre'].color;
    } else if (tiposMap?.['tarde-libre']?.color) {
      freeColor = tiposMap['tarde-libre'].color;
    }
    // Fallback: buscar cualquier tipo que incluya 'libre' en su key/label
    if (!freeColor || (!colorTipoDinamico && freeColor === tipoColorComputed)) {
      const libreTipo = Object.values(tiposMap || {}).find(t => (
        String(t.key || '').toLowerCase().includes('libre') || String(t.label || '').toLowerCase().includes('libre')
      ));
      if (libreTipo?.color) freeColor = libreTipo.color;
      // Si el catálogo remoto no tiene una entrada de 'libre', usar el default embebido
      if ((!freeColor || (!colorTipoDinamico && freeColor === tipoColorComputed)) && Array.isArray(DEFAULT_TIPOS_HORARIO)) {
        const defaultLibre = DEFAULT_TIPOS_HORARIO.find(t => String(t.key || '').toLowerCase().includes('libre'));
        if (defaultLibre?.color) freeColor = defaultLibre.color;
      }
    }
    tipoColorComputed = freeColor || tipoColorComputed;
  }

  // Asegurar: para contratos operativos que tengan un bloque de 'tiempo libre'
  // siempre usar el color asociado a un tipo 'libre' en la mitad inferior.
  if (contratoOperativo && tieneBloqueLibre) {
    const preferTeleFree2 = Boolean(
      horario?.horaInicioTele || horario?.horaFinTele || horario?.tipo === 'tele-media-libre' || (horario?.tipo && String(horario.tipo).includes('tele'))
    );
    let freeColor2 = tipoColorComputed;
    if (preferTeleFree2 && tiposMap?.['tele-media-libre']?.color) {
      freeColor2 = tiposMap['tele-media-libre'].color;
    } else if (tiposMap?.['tarde-libre']?.color) {
      freeColor2 = tiposMap['tarde-libre'].color;
    }
    if (!freeColor2 || (!colorTipoDinamico && freeColor2 === tipoColorComputed)) {
      const libreTipo2 = Object.values(tiposMap || {}).find(t => (
        String(t.key || '').toLowerCase().includes('libre') || String(t.label || '').toLowerCase().includes('libre')
      ));
      if (libreTipo2?.color) freeColor2 = libreTipo2.color;
      if ((!freeColor2 || (!colorTipoDinamico && freeColor2 === tipoColorComputed)) && Array.isArray(DEFAULT_TIPOS_HORARIO)) {
        const defaultLibre2 = DEFAULT_TIPOS_HORARIO.find(t => String(t.key || '').toLowerCase().includes('libre'));
        if (defaultLibre2?.color) freeColor2 = defaultLibre2.color;
      }
    }
    tipoColorComputed = freeColor2 || tipoColorComputed;
  }

  // Heurística adicional: si el label/nota o la estructura del horario sugiere
  // explícitamente "tiempo libre", forzar el color de la mitad inferior
  // a un color de tipo 'libre' (tarde-libre / tele-media-libre / fallback).
  const tipoLabelText = (getTipoLabel(horario?.tipo) || '').toLowerCase();
  const notaText = (horario?.nota || '').toLowerCase();
  const muestraTiempoLibre = Boolean(
    tieneBloqueLibre ||
    tipoLabelText.includes('libre') ||
    notaText.includes('tiempo libre') ||
    notaText.includes('libre')
  );
  if (contratoOperativo && muestraTiempoLibre && !esVacaciones) {
    const preferTele = Boolean(
      horario?.horaInicioTele || horario?.horaFinTele || (horario?.tipo && String(horario.tipo).includes('tele')) || tipoLabelText.includes('tele')
    );
    let freeColor3 = (
      preferTele ? tiposMap?.['tele-media-libre']?.color : tiposMap?.['tarde-libre']?.color
    ) || tiposMap?.['tarde-libre']?.color || tiposMap?.['tele-media-libre']?.color || null;
    if (!freeColor3) {
      const libreTipo3 = Object.values(tiposMap || {}).find(t => (
        String(t.key || '').toLowerCase().includes('libre') || String(t.label || '').toLowerCase().includes('libre')
      ));
      if (libreTipo3?.color) freeColor3 = libreTipo3.color;
    }
    if (!freeColor3 && Array.isArray(DEFAULT_TIPOS_HORARIO)) {
      const defaultLibre3 = DEFAULT_TIPOS_HORARIO.find(t => String(t.key || '').toLowerCase().includes('libre'));
      if (defaultLibre3?.color) freeColor3 = defaultLibre3.color;
    }
    tipoColorComputed = freeColor3 || tipoColorComputed;
  }

  const vacationBg = tipoCatalogo?.color || tipoColorComputed;
  const descansoBg = tipoCatalogo?.color || '#767e89';
  const incapacidadBg = tipoCatalogo?.color || (horario?.tipo === 'incapacidad-enfermedad' ? '#d32f2f' : '#c62828');
  // Determinar color del texto para garantizar contraste cuando hay split
  const textColor = soloLabel
    ? (isFeriado ? '#991b1b' : esVacaciones ? '#fff' : esDescanso ? getContrastColor(descansoBg) : esIncapacidad ? getContrastColor(incapacidadBg) : '#333')
    : (tieneHorario
        ? (esTarjetaPresencialFinal ? '#fff' : (esDescanso ? getContrastColor(descansoBg) : (esVacaciones ? '#fff' : (esIncapacidad ? getContrastColor(incapacidadBg) : (necesitaSplit ? '#fff' : (contratoOperativo ? 'white' : getContrastColor(tipoColorComputed)))))))
        : 'text.secondary');

  // Color y opacidad del icono grande de fondo (heurística simple para asegurar visibilidad
  // incluso en tarjetas de contratos no-operativos como 'pasantes').
  const iconOpacity = soloLabel ? 0.14 : 0.25;
  const iconColor = soloLabel ? 'rgba(0, 0, 0, 0.22)' : 'rgba(255, 255, 255, 0.45)';

  return (
    <Grid item xs={true} key={diaKey}>
      <Box
        data-tipo-color={esDescanso ? (tipoCatalogo?.color || '#767e89') : esIncapacidad ? incapacidadBg : tipoColorComputed}
        data-horario-info={JSON.stringify({
          tipo: horario?.tipo || null,
          horaInicioLibre: horario?.horaInicioLibre || null,
          horaFinLibre: horario?.horaFinLibre || null,
          horaInicioBloque2: horario?.horaInicioBloque2 || null,
          horaFinBloque2: horario?.horaFinBloque2 || null,
        })}
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
              ? `1px solid ${tipoCatalogo?.color || '#2DD4BF'}`
              : esDescanso
                ? '1px solid rgba(214, 201, 182, 0.4)'
                : esIncapacidad
                  ? `1px solid ${incapacidadBg}`
                  : '1px solid #e0e0e0',
          borderLeft: isFeriado
            ? '5px solid rgba(220, 38, 38, 0.8)'
            : !contratoOperativo
              ? '5px solid #cbd5e1'
              : esVacaciones
              ? `5px solid ${tipoCatalogo?.color || '#2DD4BF'}`
              : esDescanso
                ? '5px solid #E7D9BF'
                : esIncapacidad
                  ? `5px solid ${incapacidadBg}`
                  : colorJornada
                  ? `5px solid ${colorJornada}`
                  : undefined,
          cursor: editando ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
          /* Vacaciones/Descanso/Incapacidad: usar fondo sólido con color configurado.
             Si el turno es de tipo que requiere 'split' (p. ej. tele-media-libre, tarde-libre,
             o combina tele + libre), mostrar un gradient (transparent en backgroundColor
             porque el gradient se aplica en backgroundImage). En casillas presenciales
             que no son beneficio ni split, priorizamos el color del contrato (`contratoMain`).
             En el resto se usa el color del tipo cuando exista, o el fallback calculado. */
          backgroundColor: tieneHorario
            ? (esVacaciones
                ? vacationBg
                : esDescanso
                  ? descansoBg
                  : esIncapacidad
                    ? incapacidadBg
                    : (necesitaSplit ? 'transparent' : ((esTarjetaPresencialFinal && !esBeneficio) ? contratoMain : (tipoCatalogo?.color || tipoColorComputed))))
            : 'transparent',
          backgroundImage: (tieneHorario && !esVacaciones && !esDescanso && !esIncapacidad && horario?.tipo !== 'viaje-trabajo')
            ? (!soloLabel && necesitaSplit
                ? `linear-gradient(180deg, ${topColor} 0 50%, ${tipoColorComputed} 50% 100%)`
                : undefined)
            : undefined,
          backgroundRepeat: 'no-repeat',
          color: textColor,
          // Forzar que los Typography internos hereden el color calculado
          '& .MuiTypography-root': {
            color: 'inherit !important'
          },
          '& > :not([aria-hidden="true"])': {
            position: 'relative',
            zIndex: 1
          },
          '&:hover': editando ? {
            backgroundColor: soloLabel
              ? (isFeriado ? '#fff1f1' : esVacaciones ? hexToRgba(vacationBg, 0.12) : esDescanso ? '#F8F6EE' : esIncapacidad ? hexToRgba(incapacidadBg, 0.12) : '#fff')
              : tieneHorario ? (
                  esTarjetaPresencialFinal ? contratoDark :
                  /* Priorizar colores por tipo antes de aplicar fallback por contrato */
                  esVacaciones ? hexToRgba(vacationBg, 0.16) :
                  esIncapacidad ? hexToRgba(incapacidadBg, 0.16) :
                  horario.tipo === 'teletrabajo' ? '#1b5e20' :
                  horario.tipo === 'tele-presencial' ? '#4a148c' :
                  horario.tipo === 'horario-dividido' ? '#6d28d9' :
                  horario.tipo === 'visita-comercial' ? '#5d4037' :
                  horario.tipo === 'tele-media-libre' ? '#1b5e20' :
                  horario.tipo === 'media2-cumple' ? '#455a64' :
                  horario.tipo === 'media-cumple' ? '#455a64' :
                  horario.tipo === 'cambio' ? '#e65100' :
                  colorTipoDinamico ? colorTipoDinamico :
                  /* Por último aplicar el fallback de contrato/no-contrato */
                  (!contratoOperativo ? '#fff' : (usuario.id === currentUser?.uid ? '#303f9f' : '#c51162'))
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
              opacity: iconOpacity,
              color: iconColor,
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