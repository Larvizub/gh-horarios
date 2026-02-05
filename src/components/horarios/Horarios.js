import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ref, get, set } from 'firebase/database';
import { database } from '../../firebase/config';
import { Container, Paper, Typography, Box, Button, useMediaQuery, useTheme, Alert, Fade, Skeleton } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { format, getYear } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import HeaderSemana from './HeaderSemana';
import RecomendacionesPracticantes from './RecomendacionesPracticantes';
import DialogoHorario from './DialogoHorario';
import DialogoEliminar from './DialogoEliminar';
import DialogoCopiar from './DialogoCopiar';
import ModalConfirmacion from './ModalConfirmacion';
import InfoTurnoModal from './InfoTurnoModal';
import { 
  calcularHorasTotales, 
  calcularHorasExcedentes, 
  convertirA24h, 
  encontrarPracticantesDisponibles, 
  generarRecomendacionPracticantes 
} from '../../utils/horariosUtils';
import { 
  puedeEditarHorarios, 
  puedeEliminarHorarios, 
  puedeModificarHorarios 
} from '../../utils/permissionsUtils';
import { obtenerHorasMaximas } from '../../utils/contratoUtils';
import { 
  departamentos, 
  diasSemana, 
  NO_SUMAN_HORAS, 
  DIAS_LABELS 
} from '../../utils/horariosConstants';
import { obtenerUsuario } from '../../utils/horariosHelpers';
import { useUsuariosFiltrados } from '../../hooks/useUsuariosFiltrados';
import HorariosTable from './HorariosTable';
import { guardarBatchHorarios, guardarHorariosUsuarioSemana, subscribeHorariosUsuarios, cargarHorariosUsuarios } from '../../services/firebaseHorarios';
import { puedeVerHorarios } from '../../utils/contratoUtils';
import { useUsuariosYHorarios } from '../../hooks/useUsuariosYHorarios';
import { useSemana } from '../../hooks/useSemana';
import { useModalConfirm } from '../../hooks/useModalConfirm';

// Styled Components modernos
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
  background: '#f8fafc',
  [theme.breakpoints.down('md')]: {
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
  },
}));

const ContentContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(1.5),
    paddingRight: theme.spacing(1.5),
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 20,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  border: '1px solid rgba(0, 131, 14, 0.08)',
  background: '#ffffff',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #00830e, #4caf50, #81c784)',
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    borderRadius: 12,
    margin: 0,
  },
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.75rem',
  color: '#1a1a2e',
  marginBottom: theme.spacing(3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '& .icon': {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #00830e, #4caf50)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '1.25rem',
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.35rem',
    marginBottom: theme.spacing(2),
    '& .icon': {
      width: 36,
      height: 36,
      borderRadius: 10,
    },
  },
}));

const ModernAlert = styled(Alert)(({ theme }) => ({
  borderRadius: 12,
  border: 'none',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
  '& .MuiAlert-icon': {
    fontSize: '1.5rem',
  },
  '& .MuiAlert-message': {
    width: '100%',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '0.95rem',
  boxShadow: 'none',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0, 131, 14, 0.25)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '10px 16px',
    fontSize: '0.875rem',
  },
}));

const ActionButtonsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderTop: '1px solid',
  borderColor: alpha(theme.palette.divider, 0.5),
  display: 'flex',
  gap: theme.spacing(2),
  justifyContent: 'center',
  alignItems: 'stretch',
  background: 'linear-gradient(180deg, transparent, rgba(0, 131, 14, 0.02))',
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    gap: theme.spacing(1.5),
    flexDirection: 'column',
  },
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  gap: theme.spacing(2),
}));

// Objeto estable para evitar re-renders innecesarios
const EMPTY_HORAS_EXTRAS = {};

const Horarios = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Flag para prevenir actualizaciones después de desmontar
  const mountedRef = useRef(true);

  // Reemplazar estados de usuarios por el hook (Optimizado para carga por depto)
  const { usuarios, departamentoSeleccionado, setDepartamentoSeleccionado, currentUser, userData } = useUsuariosYHorarios();
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState({});
  const { semanaActual, semanaSeleccionada, setSemanaSeleccionada, avanzarSemana, retrocederSemana, obtenerClaveSemana } = useSemana();
  const [editando, setEditando] = useState(false);
  const [horariosEditados, setHorariosEditados] = useState({});
  // Buffer de ediciones por semana: { [semanaKey]: { ...horariosEditadosSemana } }
  const [bufferEditSemanas, setBufferEditSemanas] = useState({});

  // Refs para acceso estable en callbacks sin disparar re-renders de efectos o ciclos
  const horariosRef = useRef(horarios);
  const horariosEditadosRef = useRef(horariosEditados);
  const bufferEditSemanasRef = useRef(bufferEditSemanas);

  useEffect(() => {
    horariosRef.current = horarios;
  }, [horarios]);

  useEffect(() => {
    horariosEditadosRef.current = horariosEditados;
  }, [horariosEditados]);

  useEffect(() => {
    bufferEditSemanasRef.current = bufferEditSemanas;
  }, [bufferEditSemanas]);
  // Clave de la semana más recientemente cargada desde backend
  const [lastLoadedWeekKey, setLastLoadedWeekKey] = useState(null);
  const [dialogoHorario, setDialogoHorario] = useState(false);
  const [horarioPersonalizado, setHorarioPersonalizado] = useState({
    horaInicio: '',
    horaFin: '',
    usuarioId: null,
    diaKey: null,
    tipo: 'personalizado'
  });
  const [dialogoEliminar, setDialogoEliminar] = useState(false);
  const [eliminacionSeleccionada, setEliminacionSeleccionada] = useState({
    tipo: 'mis-dias', // 'todo', 'usuario', 'dia', 'mis-dias'
    usuarioId: null,
    dia: null,
    diasSeleccionados: []
  });
  const [anchorEl, setAnchorEl] = useState(null); // Para el menú de selección de fecha
  const [yearSelected, setYearSelected] = useState(getYear(new Date()));
  const [monthSelected, setMonthSelected] = useState(new Date().getMonth());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Estados para copiar horario
  const [dialogoCopiar, setDialogoCopiar] = useState(false);
  const [horarioACopiar, setHorarioACopiar] = useState(null);
  // Portapapeles local para copiar/pegar horarios
  const [clipboard, setClipboard] = useState(null);

  // Estados para modales de confirmación modernos
  const { modalConfirmacion, mostrarModal, cerrarModal } = useModalConfirm();

  // Estado y handlers para el InfoTurnoModal
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [modalUsuario, setModalUsuario] = useState(null);
  const [modalTurno, setModalTurno] = useState(null);
  const [modalDiaKey, setModalDiaKey] = useState(null);
  const abrirInfoTurno = (usuario, turno, diaKey) => {
    setModalUsuario(usuario);
    setModalTurno(turno);
    setModalDiaKey(diaKey);
    setInfoModalOpen(true);
  };
  const cerrarInfoTurno = () => {
    setInfoModalOpen(false);
    setModalUsuario(null);
    setModalTurno(null);
  };

  const usuariosFiltrados = useUsuariosFiltrados(usuarios, departamentoSeleccionado);
  
  // Memoizar los IDs de los usuarios filtrados para evitar re-suscripciones innecesarias
  const usuariosFiltradosIds = useMemo(() => 
    usuariosFiltrados.map(u => u.id).sort().join(','),
    [usuariosFiltrados]
  );
  
  // Función helper para actualizar horarios editados Y el buffer simultáneamente
  const actualizarHorariosEditados = useCallback((nuevoValor) => {
    setHorariosEditados(nuevoValor);
    const key = obtenerClaveSemana(semanaSeleccionada);
    setBufferEditSemanas(prev => ({ ...prev, [key]: typeof nuevoValor === 'function' ? nuevoValor(horariosEditadosRef.current) : nuevoValor }));
  }, [semanaSeleccionada, obtenerClaveSemana]);
  
  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Usar el usuario actual del hook (ya cargado individualmente)
  const currentUserData = userData;

  // Copiar un horario al portapapeles (invocado por HorariosTable)
  const handleCopiarHorario = useCallback((usuarioId, diaKey, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const source = editando ? (horariosEditados[usuarioId] || {}) : (horarios[usuarioId] || {});
    const horario = source?.[diaKey];
    if (!horario) {
      mostrarModal({ tipo: 'warning', titulo: 'Sin horario', mensaje: 'El día seleccionado no tiene un horario válido para copiar.', soloInfo: true });
      return;
    }
    // Guardar copia profunda para evitar referencias compartidas
    setClipboard({ origen: { usuarioId, diaKey }, horario: JSON.parse(JSON.stringify(horario)) });
    mostrarModal({ tipo: 'success', titulo: 'Horario copiado', mensaje: 'Selecciona los días destino y presiona "Pegar".', soloInfo: true });
  }, [editando, horarios, horariosEditados, mostrarModal]);

  // Aplicar el horario copiado a múltiples destinos
  const applyCopiedHorario = useCallback((targets = []) => {
    if (!clipboard || !clipboard.horario) return;
    actualizarHorariosEditados(prev => {
      const next = { ...prev };
      targets.forEach(({ usuarioId, diaKey }) => {
        if (!next[usuarioId]) next[usuarioId] = {};
        next[usuarioId] = { ...next[usuarioId], [diaKey]: JSON.parse(JSON.stringify(clipboard.horario)) };
      });
      return next;
    });
    // limpiar el portapapeles
    setClipboard(null);
    mostrarModal({ tipo: 'success', titulo: 'Pegado completo', mensaje: `Se pegaron ${targets.length} destinos.`, soloInfo: true });
  }, [clipboard, mostrarModal, actualizarHorariosEditados]);

  // Iniciar edición según permisos (evita cargar datos de otros usuarios para no admins)
  const iniciarEdicion = useCallback(() => {
    setEditando(true);
    const usuarioActual = currentUserData;
    const puedeGuardarTodos = usuarioActual && (
      usuarioActual.rol === 'Administrador' || usuarioActual.rol === 'Modificador'
    );
    const datosIniciales = puedeGuardarTodos ? { ...(horarios || {}) } : { [currentUser.uid]: (horarios?.[currentUser.uid] || {}) };
    setHorariosEditados(datosIniciales);
    // Inicializar el buffer también
    const key = obtenerClaveSemana(semanaSeleccionada);
    setBufferEditSemanas({ [key]: datosIniciales });
  }, [currentUserData, currentUser, horarios, semanaSeleccionada, obtenerClaveSemana]);

  // Suscribirse en tiempo real a los horarios de la semana seleccionada por departamento (Optimizado)
  useEffect(() => {
    if (!currentUser) return;
    
    // Al cambiar de departamento o semana, limpiar datos anteriores para evitar "flashes" de info vieja
    setLoading(true);
    setHorarios({});
    
    const key = obtenerClaveSemana(semanaSeleccionada);
    const ids = usuariosFiltrados.map(u => u.id);

    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    // subscribeHorariosUsuarios invoca onChange con el objeto agrupado de los usuarios especificados
    const unsubscribe = subscribeHorariosUsuarios(key, ids, (data) => {
      if (mountedRef.current) {
        setHorarios(data || {});
        setLastLoadedWeekKey(key);
        setLoading(false);
      }
    });

    // En caso de error o timeout, intentamos una carga puntual como fallback granular
    const fallback = setTimeout(async () => {
      if (!mountedRef.current) return;
      try {
        const data = await cargarHorariosUsuarios(key, ids);
        if (mountedRef.current) {
          setHorarios(prev => ({ ...prev, ...data }));
          setLastLoadedWeekKey(key);
        }
      } catch (e) {
        console.error('Fallback cargarHorariosUsuarios falló:', e);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    }, 4000);

    return () => {
      clearTimeout(fallback);
      try {
        unsubscribe && unsubscribe();
      } catch (e) {
        // no-op
      }
    };
  }, [semanaSeleccionada, currentUser, obtenerClaveSemana, usuariosFiltrados, usuariosFiltradosIds]);

  // Al cambiar de semana durante edición: restaurar del buffer o inicializar desde los horarios cargados
  useEffect(() => {
    if (!editando) return;
    const key = obtenerClaveSemana(semanaSeleccionada);
    // Usar el ref del buffer para evitar bucles infinitos de re-renderizado
    const existente = bufferEditSemanasRef.current[key];
    if (existente) {
      setHorariosEditados(existente);
      return;
    }
    // Evita inicializar con horarios de otra semana o durante la carga
    if (loading || lastLoadedWeekKey !== key) {
      // Para no mostrar datos de otra semana, limpia mientras llega la data correcta
      setHorariosEditados({});
      return;
    }
    const usuarioActual = currentUserData;
    const esAdmin = usuarioActual && (usuarioActual.rol === 'Administrador' || usuarioActual.rol === 'Modificador');
    const init = esAdmin ? { ...(horarios || {}) } : { [currentUser?.uid]: (horarios?.[currentUser?.uid] || {}) };
    setHorariosEditados(init);
    // Actualizar buffer manualmente al inicializar nueva semana
    setBufferEditSemanas(prev => ({ ...prev, [key]: init }));
  }, [editando, semanaSeleccionada, loading, lastLoadedWeekKey, horarios, currentUserData, currentUser, obtenerClaveSemana]);

  // ELIMINADO: Efecto de sincronización automática que causaba bucles infinitos
  // El buffer ahora se actualiza solo con acciones manuales del usuario

  // Función para recalcular horas extras después de modificaciones (Optimizado para depto)
  const recalcularHorasExtras = useCallback(async () => {
    try {
      // Solo recalcular si estamos en la semana actual
      const esSemanaActual = format(semanaSeleccionada, 'yyyy-MM-dd') === format(semanaActual, 'yyyy-MM-dd');
      
      if (!esSemanaActual) {
        return;
      }

      const snapshots = await get(ref(database, 'horas_extras'));
      const todasExtras = snapshots.exists() ? snapshots.val() : {};

      // Calcular solo para los usuarios del departamento actual (los cargados en el estado 'usuarios')
      usuarios.forEach(usuario => {
        const horariosUsuario = horarios[usuario.id];
        if (!horariosUsuario) {
          delete todasExtras[usuario.id];
          return;
        }

        const horasMaximas = obtenerHorasMaximas(usuario?.tipoContrato || 'Operativo');
        const horasTotales = Object.values(horariosUsuario).reduce((total, turno) => {
          if (!turno || NO_SUMAN_HORAS.includes(turno.tipo)) return total;
          return total + (turno.horas || 0);
        }, 0);

        const horasExcedentes = Math.max(horasTotales - horasMaximas, 0);
        if (horasExcedentes > 0) {
          todasExtras[usuario.id] = horasExcedentes;
        } else {
          delete todasExtras[usuario.id];
        }
      });

      // Actualizar el nodo global con los valores actualizados
      await set(ref(database, 'horas_extras'), todasExtras);
      
    } catch (error) {
      console.error('Error al recalcular horas extras:', error);
    }
  }, [semanaSeleccionada, semanaActual, usuarios, horarios]);

  const handleGuardarHorarios = useCallback(async () => {
    try {
      setLoading(true);
      // Consolidar buffer usando el estado actual de la semana visible
      const currentWeekKey = obtenerClaveSemana(semanaSeleccionada);
      const buffers = { ...bufferEditSemanas };
      // No sobrescribir el buffer de la semana actual con vacío
      if (horariosEditados && Object.keys(horariosEditados).length > 0) {
        buffers[currentWeekKey] = horariosEditados;
      }

      const usuarioActual = currentUserData;
      const esAdmin = usuarioActual && (usuarioActual.rol === 'Administrador' || usuarioActual.rol === 'Modificador');
      let operaciones = 0;

      // Construir un update en lote para minimizar roundtrips
      const updates = {};
      if (!esAdmin) {
        for (const [weekKey, data] of Object.entries(buffers)) {
          const propios = data?.[currentUser?.uid];
          if (propios && Object.keys(propios).length > 0) {
            updates[`horarios_registros/${weekKey}/${currentUser.uid}`] = propios;
            operaciones += 1;
          }
        }
      } else {
        for (const [weekKey, data] of Object.entries(buffers)) {
          if (!data || Object.keys(data).length === 0) continue;
          for (const [uid, horariosUsuario] of Object.entries(data)) {
            updates[`horarios_registros/${weekKey}/${uid}`] = horariosUsuario || {};
            operaciones += 1;
          }
        }
      }

  if (operaciones > 0) {
        // Si el número de operaciones es pequeño (p. ej. solo un usuario), usar la API granular por usuario
        const paths = Object.keys(updates);
        if (paths.length <= 10) {
          // Intentar escribir por usuario/semana individualmente para evitar sobrescrituras
          for (const p of paths) {
            // p tiene el formato 'horarios_registros/${weekKey}/${uid}'
            const parts = p.split('/');
            const weekKey = parts[1];
            const uid = parts[2];
            try {
              await guardarHorariosUsuarioSemana(weekKey, uid, updates[p]);
            } catch (err) {
              console.warn('Fallo al guardar usuario individualmente, se acumula para batch:', err);
              // Si falla, lo dejamos en mergedBatch
            }
          }
        } else {
          // Para muchos cambios, usar el batch con merge interno
          await guardarBatchHorarios(updates);
        }
      }

      if (operaciones === 0) {
        mostrarModal({
          tipo: 'warning',
          titulo: 'Sin cambios para guardar',
          mensaje: 'No se detectaron modificaciones pendientes. Verifica que los horarios editados aparezcan en pantalla antes de guardar.',
          soloInfo: true
        });
        setLoading(false);
        return;
      }

    // Finalizar edición. Con la suscripción en tiempo real el estado se actualizará desde Firebase.
    setEditando(false);
    // Limpiar buffer después de guardar exitosamente
      // Recalcular horas extras solo para la semana actual
      await recalcularHorasExtras();

      mostrarModal({
        tipo: 'success',
        titulo: '✅ Horarios Guardados',
        mensaje: 'Los horarios se han guardado correctamente.',
        soloInfo: true
      });
    } catch (error) {
      console.error('Error al guardar horarios:', error);
      mostrarModal({
        tipo: 'error',
        titulo: '❌ Error al Guardar',
        mensaje: `Ocurrió un error al guardar los horarios:\n\n${error.message}`,
        soloInfo: true
      });
    } finally {
      setLoading(false);
    }
  }, [bufferEditSemanas, horariosEditados, semanaSeleccionada, obtenerClaveSemana, currentUserData, currentUser, mostrarModal, recalcularHorasExtras]);

  const handleEliminarSeleccionado = async () => {
    try {
      setLoading(true);
  const semanaKey = obtenerClaveSemana(semanaSeleccionada);
  const refPath = `horarios_registros/${semanaKey}`;
  const { tipo, usuarioId, dia, diasSeleccionados } = eliminacionSeleccionada;

      // Verificar permisos
      // Aseguramos que usuarioActual sea el objeto completo
      let usuarioActual = currentUserData;
      
      if (!usuarioActual) {
        mostrarModal({
          tipo: 'error',
          titulo: '🚫 Usuario no encontrado',
          mensaje: 'No se pudo verificar tu identidad. Por favor, inicia sesión nuevamente.',
          soloInfo: true
        });
        return;
      }

      let updates = { ...horarios };

      switch (tipo) {
        case 'todo':
          // Solo administradores pueden eliminar todos los horarios
          if (usuarioActual.rol !== 'Administrador') {
            mostrarModal({
              tipo: 'error',
              titulo: '🚫 Permisos Insuficientes',
              mensaje: 'Solo los administradores pueden eliminar todos los horarios.',
              soloInfo: true
            });
            return;
          }
          // Elimina todos los horarios de la semana seleccionada
          await set(ref(database, refPath), {});
          setHorarios({});
          setHorariosEditados({});
          break;

  case 'usuario':
          // Validar que se haya seleccionado un usuario
          if (!usuarioId) {
            mostrarModal({
              tipo: 'warning',
              titulo: '👤 Usuario no seleccionado',
              mensaje: 'Debes seleccionar un usuario para eliminar sus horarios.',
              soloInfo: true
            });
            setLoading(false);
            setDialogoEliminar(false);
            return;
          }
          // Permitir que el administrador elimine horarios de cualquier usuario
          // Los usuarios normales solo pueden eliminar sus propios horarios
          if (usuarioActual.rol !== 'Administrador' && usuarioId !== currentUser.uid) {
            mostrarModal({
              tipo: 'error',
              titulo: '🚫 Acceso Denegado',
              mensaje: 'Solo puedes eliminar tus propios horarios.\n\nLos administradores pueden eliminar horarios de cualquier usuario.',
              soloInfo: true
            });
            return;
          }
          // Si es admin o es el propio usuario, permite borrar
          if (updates[usuarioId]) {
            delete updates[usuarioId];
            // Eliminar solo el nodo del usuario en la semana, sin tocar otros usuarios
            await set(ref(database, `${refPath}/${usuarioId}`), null);
            // Actualizar estado local en memoria
            setHorarios(prev => {
              const nuevo = { ...prev };
              delete nuevo[usuarioId];
              return nuevo;
            });
            setHorariosEditados(prev => {
              const newState = { ...prev };
              delete newState[usuarioId];
              return newState;
            });
          } else {
            mostrarModal({
              tipo: 'warning',
              titulo: '📅 Sin Horarios',
              mensaje: 'El usuario seleccionado no tiene horarios asignados para eliminar.',
              soloInfo: true
            });
            setLoading(false);
            setDialogoEliminar(false);
            return;
          }
          break;

        case 'dia':
          // Solo administradores pueden eliminar un día completo para todos
          if (usuarioActual.rol !== 'Administrador') {
            mostrarModal({
              tipo: 'error',
              titulo: '🚫 Permisos Insuficientes',
              mensaje: 'Solo los administradores pueden eliminar horarios de un día completo para todos los usuarios.',
              soloInfo: true
            });
            return;
          }
          let huboEliminacion = false;
          Object.keys(updates).forEach(uid => {
            if (updates[uid] && updates[uid][dia]) {
              delete updates[uid][dia];
              huboEliminacion = true;
            }
          });
          if (huboEliminacion) {
            await set(ref(database, refPath), updates);
            // No sobrescribimos el estado local completamente: limpiar buffer de edición y dejar que el listener sincronice
            setHorariosEditados({});
            setBufferEditSemanas({});
          } else {
            mostrarModal({
              tipo: 'warning',
              titulo: '📅 Sin Horarios',
              mensaje: 'No se encontraron horarios para ese día en ningún usuario.',
              soloInfo: true
            });
            setLoading(false);
            setDialogoEliminar(false);
            return;
          }
          break;

        case 'mis-dias':
          // Eliminar días específicos del usuario actual
          if (!currentUser?.uid) {
            mostrarModal({
              tipo: 'error',
              titulo: '🚫 Usuario no encontrado',
              mensaje: 'No se pudo verificar tu identidad. Por favor, inicia sesión nuevamente.',
              soloInfo: true
            });
            return;
          }

          if (!updates[currentUser.uid]) {
            mostrarModal({
              tipo: 'warning',
              titulo: '📅 Sin Horarios',
              mensaje: 'No tienes horarios asignados para eliminar.',
              soloInfo: true
            });
            return;
          }

          if (!diasSeleccionados || diasSeleccionados.length === 0) {
            mostrarModal({
              tipo: 'warning',
              titulo: '📅 Días no Seleccionados',
              mensaje: 'Debes seleccionar al menos un día para eliminar.',
              soloInfo: true
            });
            return;
          }

          diasSeleccionados.forEach(diaKey => {
            if (updates[currentUser.uid] && updates[currentUser.uid][diaKey]) {
              delete updates[currentUser.uid][diaKey];
            }
          });

          await set(ref(database, refPath), updates);
          // Limpiar buffer de edición y dejar que el listener actualice el estado
          setHorariosEditados({});
          setBufferEditSemanas({});
          break;

        default:
          console.log('Tipo de eliminación no reconocido:', tipo);
          break;
      }
      
      mostrarModal({
        tipo: 'success',
        titulo: '✅ Horarios Eliminados',
        mensaje: 'Los horarios seleccionados se han eliminado correctamente.',
        soloInfo: true
      });

      // Recalcular horas extras después de la eliminación
      await recalcularHorasExtras();
      
    } catch (error) {
      console.error('Error al eliminar horarios:', error);
      mostrarModal({
        tipo: 'error',
        titulo: '❌ Error al Eliminar',
        mensaje: `Ocurrió un error al eliminar los horarios:\n\n${error.message}`,
        soloInfo: true
      });
    } finally {
      setLoading(false);
      setDialogoEliminar(false);
    }
  };

  const abrirDialogoHorario = useCallback((usuarioId, diaKey) => {
    // Buscar datos actuales del horario usando los refs estables
    const currentEdits = horariosEditadosRef.current || {};
    const currentHorarios = horariosRef.current || {};
    const horarioActual = (currentEdits[usuarioId]?.[diaKey]) || (currentHorarios[usuarioId]?.[diaKey]);
    
    setHorarioPersonalizado({
      usuarioId,
      diaKey,
      tipo: horarioActual?.tipo || 'personalizado',
      horaInicio: horarioActual?.horaInicio || '',
      horaFin: horarioActual?.horaFin || '',
      horaInicioLibre: horarioActual?.horaInicioLibre || '',
      horaFinLibre: horarioActual?.horaFinLibre || '',
      nota: horarioActual?.nota || '',
      // Asegurar que se incluyan campos de tipos compuestos si existen
      horaInicioTele: horarioActual?.horaInicioTele || '',
      horaFinTele: horarioActual?.horaFinTele || '',
      horaInicioPres: horarioActual?.horaInicioPres || '',
      horaFinPres: horarioActual?.horaFinPres || ''
    });
    setDialogoHorario(true);
  }, []);

  // (El diálogo de copia utiliza `horarioACopiar` y `ejecutarCopiarHorario` directamente)

  // Función para ejecutar la copia del horario
  const ejecutarCopiarHorario = useCallback(async (diaDestino) => {
    if (!horarioACopiar || !diaDestino) return;

    try {
      const nuevoHorario = {
        tipo: horarioACopiar.tipo,
        horaInicio: horarioACopiar.horaInicio || '',
        horaFin: horarioACopiar.horaFin || '',
        horas: horarioACopiar.horas || 0
      };

      if (editando) {
        // Si estamos editando, actualizar el estado temporal
        setHorariosEditados(prev => ({
          ...prev,
          [horarioACopiar.usuarioId]: {
            ...prev[horarioACopiar.usuarioId],
            [diaDestino]: nuevoHorario
          }
        }));
      } else {
        // Si no estamos editando, guardar directamente en Firebase
        const semanaKey = obtenerClaveSemana(semanaSeleccionada);
        const horariosRef = ref(database, `horarios_registros/${semanaKey}/${horarioACopiar.usuarioId}/${diaDestino}`);
        await set(horariosRef, nuevoHorario);
        
        // Actualizar el estado local
        setHorarios(prev => ({
          ...prev,
          [horarioACopiar.usuarioId]: {
            ...prev[horarioACopiar.usuarioId],
            [diaDestino]: nuevoHorario
          }
        }));
      }

      mostrarModal({
        tipo: 'success',
        titulo: '✅ Horario Copiado',
        mensaje: `El horario se ha copiado exitosamente de ${DIAS_LABELS[horarioACopiar.diaOriginal]} a ${DIAS_LABELS[diaDestino]}.`,
        soloInfo: true
      });

      setDialogoCopiar(false);
      setHorarioACopiar(null);
    } catch (error) {
      console.error('Error al copiar horario:', error);
      mostrarModal({
        tipo: 'error',
        titulo: '❌ Error al Copiar',
        mensaje: `Ocurrió un error al copiar el horario:\n\n${error.message}`,
        soloInfo: true
      });
    }
  }, [horarioACopiar, editando, semanaSeleccionada, obtenerClaveSemana, mostrarModal]);

  const handleCambiarTurno = useCallback((usuarioId, diaKey) => {
    if (!editando) return;

    const usuarioActual = currentUserData;
    const usuarioObjetivo = usuarios.find(u => u.id === usuarioId);

    if (!usuarioActual || !usuarioObjetivo) return;

    // Verificar permisos usando el nuevo sistema de roles
    if (!puedeModificarHorarios(usuarioActual, usuarioObjetivo)) {
      mostrarModal({
        tipo: 'error',
        titulo: '🚫 Acceso Denegado',
        mensaje: 'No tienes permisos para modificar este horario.\n\nConsulta con un administrador si necesitas acceso.',
        soloInfo: true
      });
      return;
    }

    abrirDialogoHorario(usuarioId, diaKey);
  }, [editando, usuarios, currentUserData, abrirDialogoHorario, mostrarModal]);

  const guardarHorarioPersonalizado = () => {
    const {
      horaInicio,
      horaFin,
      horaInicioLibre,
      horaFinLibre,
      usuarioId,
      diaKey,
      tipo,
      nota,
      // nuevos campos para tele-presencial
      horaInicioTele,
      horaFinTele,
      horaInicioPres,
      horaFinPres
    } = horarioPersonalizado;

    const nuevosHorarios = { ...horariosEditados };

    if (!nuevosHorarios[usuarioId]) {
      nuevosHorarios[usuarioId] = {};
    }

    // Si es un tipo que no suma horas
    if (NO_SUMAN_HORAS.includes(tipo)) {
      nuevosHorarios[usuarioId][diaKey] = {
        tipo,
        horaInicio: '00:00',
        horaFin: '00:00',
        horas: 0,
        nota: nota || ''
      };
      actualizarHorariosEditados(nuevosHorarios);
      setDialogoHorario(false);
      return;
    }

    // Helper: validar formato HH:mm
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const validarHora = (h) => horaRegex.test(h);

    // Helper: calcular horas entre dos HH:mm (soporta cruce de medianoche)
    const calcHoras = (s, e) => {
      const [h1, m1] = s.split(':').map(Number);
      const [h2, m2] = e.split(':').map(Number);
      if (h2 > h1 || (h2 === h1 && m2 > m1)) {
        return (h2 - h1) + (m2 - m1) / 60;
      } else {
        return (24 - h1 + h2) + (m2 - m1) / 60;
      }
    };

    // Rama para el nuevo tipo "tele-presencial"
    if (tipo === 'tele-presencial') {
      // Ambas parejas son obligatorias
      if (!horaInicioTele || !horaFinTele || !horaInicioPres || !horaFinPres) {
        mostrarModal({
          tipo: 'error',
          titulo: '⏰ Horario obligatorio',
          mensaje: 'Debes ingresar los horarios de Teletrabajo y Presencial para guardar la asignación.',
          soloInfo: true
        });
        return;
      }
      // Validar formatos
      if (!validarHora(horaInicioTele) || !validarHora(horaFinTele) || !validarHora(horaInicioPres) || !validarHora(horaFinPres)) {
        mostrarModal({
          tipo: 'error',
          titulo: '⏰ Formato de Hora Inválido',
          mensaje: 'El formato de hora debe ser HH:mm (24 horas).',
          soloInfo: true
        });
        return;
      }

      const horasTele = Number(calcHoras(horaInicioTele, horaFinTele).toFixed(1));
      const horasPres = Number(calcHoras(horaInicioPres, horaFinPres).toFixed(1));
      const horasTrabajadas = Number((horasTele + horasPres).toFixed(1));

      // Verificar exceso como en los demás tipos
      const horasActuales = calcularHorasTotales(
        usuarioId,
        editando,
        horariosEditados,
        horarios,
        semanaSeleccionada,
        semanaActual,
        EMPTY_HORAS_EXTRAS,
        (id) => obtenerUsuario(usuarios, id),
        obtenerHorasMaximas
      );
      const usuario = obtenerUsuario(usuarios, usuarioId);
      const horasMaximas = obtenerHorasMaximas(usuario?.tipoContrato || 'Operativo');

      if (horasActuales + horasTrabajadas > horasMaximas) {
        const exceso = ((horasActuales + horasTrabajadas) - horasMaximas);
        const recomendacion = generarRecomendacionPracticantes(
          usuario,
          exceso,
          (horasExceso, departamentoDestino, usuarioExcedidoId) => encontrarPracticantesDisponibles(
            horasExceso,
            usuarios,
            (id, edit) => calcularHorasTotales(
              id,
              edit,
              horariosEditados,
              horarios,
              semanaSeleccionada,
              semanaActual,
              EMPTY_HORAS_EXTRAS,
              (uid) => obtenerUsuario(usuarios, uid),
              obtenerHorasMaximas
            ),
            obtenerHorasMaximas,
            departamentoDestino,
            usuarioExcedidoId
          )
        );

        mostrarModal({
          tipo: 'warning',
          titulo: '⚠️ Exceso de Horas Detectado',
          mensaje: `${recomendacion}\n\n¿Desea continuar asignando estas horas?`,
          textoConfirmar: 'Continuar de todas formas',
          textoCancelar: 'Cancelar',
          onConfirmar: () => {
            nuevosHorarios[usuarioId][diaKey] = {
              tipo,
              horaInicioTele,
              horaFinTele,
              horasTele,
              horaInicioPres,
              horaFinPres,
              horasPres,
              horas: horasTrabajadas,
              nota: nota || ''
            };
            actualizarHorariosEditados(nuevosHorarios);
            setDialogoHorario(false);
            cerrarModal();
          },
          onCancelar: cerrarModal
        });
        return;
      }

      // Si no excede, guardar normalmente
      nuevosHorarios[usuarioId][diaKey] = {
        tipo,
        horaInicioTele,
        horaFinTele,
        horasTele,
        horaInicioPres,
        horaFinPres,
        horasPres,
        horas: horasTrabajadas,
        nota: nota || ''
      };

      actualizarHorariosEditados(nuevosHorarios);
      setDialogoHorario(false);
      return;
    }

    // Validación general para tipos que requieren horaInicio/horaFin
    if (!horaInicio || !horaFin) {
      mostrarModal({
        tipo: 'error',
        titulo: '⏰ Horario obligatorio',
        mensaje: 'Debes ingresar la hora de inicio y la hora de fin para guardar el horario.',
        soloInfo: true
      });
      return;
    }

    if (!validarHora(horaInicio) || !validarHora(horaFin)) {
      mostrarModal({
        tipo: 'error',
        titulo: '⏰ Formato de Hora Inválido',
        mensaje: 'El formato de hora debe ser HH:mm (24 horas).\n\nEjemplos válidos:\n• 08:30\n• 14:45\n• 23:00',
        soloInfo: true
      });
      return;
    }

    const inicio = convertirA24h(horaInicio);
    const fin = convertirA24h(horaFin);

    let horasTrabajadas = 0;
    if (fin.hora > inicio.hora || (fin.hora === inicio.hora && fin.minutos > inicio.minutos)) {
      horasTrabajadas = (fin.hora - inicio.hora) + (fin.minutos - inicio.minutos) / 60;
    } else {
      horasTrabajadas = (24 - inicio.hora + fin.hora) + (fin.minutos - inicio.minutos) / 60;
    }

    // Exceso chequeo (reutiliza la lógica ya existente)
    const horasActuales = calcularHorasTotales(
      usuarioId,
      editando,
      horariosEditados,
      horarios,
      semanaSeleccionada,
      semanaActual,
      EMPTY_HORAS_EXTRAS,
      (id) => obtenerUsuario(usuarios, id),
      obtenerHorasMaximas
    );
    const usuario = obtenerUsuario(usuarios, usuarioId);
    const horasMaximas = obtenerHorasMaximas(usuario?.tipoContrato || 'Operativo');

    if (horasActuales + horasTrabajadas > horasMaximas) {
      const exceso = ((horasActuales + horasTrabajadas) - horasMaximas);
      const recomendacion = generarRecomendacionPracticantes(
        usuario,
        exceso,
        (horasExceso, departamentoDestino, usuarioExcedidoId) => encontrarPracticantesDisponibles(
          horasExceso,
          usuarios,
          (id, edit) => calcularHorasTotales(
            id,
            edit,
            horariosEditados,
            horarios,
            semanaSeleccionada,
            semanaActual,
            EMPTY_HORAS_EXTRAS,
            (uid) => obtenerUsuario(usuarios, uid),
            obtenerHorasMaximas
          ),
          obtenerHorasMaximas,
          departamentoDestino,
          usuarioExcedidoId
        )
      );

      mostrarModal({
        tipo: 'warning',
        titulo: '⚠️ Exceso de Horas Detectado',
        mensaje: `${recomendacion}\n\n¿Desea continuar asignando estas horas?`,
        textoConfirmar: 'Continuar de todas formas',
        textoCancelar: 'Cancelar',
        onConfirmar: () => {
          if (tipo === 'tarde-libre') {
            nuevosHorarios[usuarioId][diaKey] = {
              tipo,
              horaInicio,
              horaFin,
              horaInicioLibre: horaInicioLibre || '',
              horaFinLibre: horaFinLibre || '',
              horas: horasTrabajadas,
              nota: nota || ''
            };
          } else {
            nuevosHorarios[usuarioId][diaKey] = {
              tipo,
              horaInicio,
              horaFin,
              horas: horasTrabajadas,
              nota: nota || ''
            };
          }
          actualizarHorariosEditados(nuevosHorarios);
          setDialogoHorario(false);
          cerrarModal();
        },
        onCancelar: cerrarModal
      });
      return;
    }

    // Guardado normal para resto de tipos
    if (tipo === 'tarde-libre') {
      nuevosHorarios[usuarioId][diaKey] = {
        tipo,
        horaInicio,
        horaFin,
        horaInicioLibre: horaInicioLibre || '',
        horaFinLibre: horaFinLibre || '',
        horas: horasTrabajadas,
        nota: nota || ''
      };
    } else {
      nuevosHorarios[usuarioId][diaKey] = {
        tipo,
        horaInicio,
        horaFin,
        horas: horasTrabajadas,
        nota: nota || ''
      };
    }

    actualizarHorariosEditados(nuevosHorarios);
    setDialogoHorario(false);
  };

  // Función helper optimizada con memoización de resultados
  const calcularExceso = useMemo(() => {
    const cache = new Map();
    return (usuarioId) => {
      if (cache.has(usuarioId)) return cache.get(usuarioId);
      const resultado = calcularHorasExcedentes(
        usuarioId,
        editando,
        horariosEditados,
        horarios,
        (id) => obtenerUsuario(usuarios, id),
        obtenerHorasMaximas
      );
      cache.set(usuarioId, resultado);
      return resultado;
    };
  }, [editando, horariosEditados, horarios, usuarios]);

  // Callback estable de practicantes con cache de resultados
  const handleEncontrarPracticantes = useMemo(() => {
    const cache = new Map();
    return (horasExceso, departamento, usuarioExcedidoId) => {
      const cacheKey = `${horasExceso}-${departamento}-${usuarioExcedidoId}`;
      if (cache.has(cacheKey)) return cache.get(cacheKey);
      
      const resultado = encontrarPracticantesDisponibles(
        horasExceso,
        usuarios,
        (id, edit) => calcularHorasTotales(
          id,
          edit,
          horariosEditados,
          horarios,
          semanaSeleccionada,
          semanaActual,
          EMPTY_HORAS_EXTRAS,
          (uid) => obtenerUsuario(usuarios, uid),
          obtenerHorasMaximas,
          true
        ),
        obtenerHorasMaximas,
        departamento || departamentoSeleccionado,
        usuarioExcedidoId
      );
      
      cache.set(cacheKey, resultado);
      return resultado;
    };
  }, [usuarios, horariosEditados, horarios, semanaSeleccionada, semanaActual, departamentoSeleccionado]);

  // Control de acceso visual: solo usuarios con permiso pueden ver el módulo
  const usuarioActual = currentUserData;
  if (loading) {
    return (
      <PageContainer>
        <ContentContainer maxWidth="xl">
          <StyledPaper elevation={0}>
            <LoadingContainer>
              <Box sx={{ width: '100%', maxWidth: 600 }}>
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 2 }} />
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              </Box>
            </LoadingContainer>
          </StyledPaper>
        </ContentContainer>
      </PageContainer>
    );
  }
  if (!usuarioActual || !puedeVerHorarios(usuarioActual)) {
    return null;
  }

  // Renderizado principal del componente
  return (
    <PageContainer>
      <ContentContainer maxWidth="xl">
        <Fade in timeout={400}>
          <StyledPaper elevation={0}>
            <PageTitle>
              <span className="icon">📅</span>
              Gestión de Horarios
            </PageTitle>

            <HeaderSemana
              departamentos={departamentos}
              departamentoSeleccionado={departamentoSeleccionado}
              setDepartamentoSeleccionado={setDepartamentoSeleccionado}
              loading={loading}
              semanaSeleccionada={semanaSeleccionada}
              setSemanaSeleccionada={setSemanaSeleccionada}
              yearSelected={yearSelected}
              setYearSelected={setYearSelected}
              monthSelected={monthSelected}
              setMonthSelected={setMonthSelected}
              datePickerOpen={datePickerOpen}
              setDatePickerOpen={setDatePickerOpen}
              anchorEl={anchorEl}
              setAnchorEl={setAnchorEl}
              avanzarSemana={avanzarSemana}
              retrocederSemana={retrocederSemana}
            />

            {/* Recomendaciones de practicantes */}
            {editando && <RecomendacionesPracticantes 
              usuariosFiltrados={usuariosFiltrados}
              calcularHorasExcedentes={calcularExceso}
              encontrarPracticantesDisponibles={handleEncontrarPracticantes}
            />}

            {/* Mensaje informativo sobre consideraciones */}
            <ModernAlert 
              severity="info" 
              sx={{ 
                mx: { xs: 1, sm: 2, md: 3 }, 
                mb: 2, 
                mt: 2,
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 2, md: 4 },
              }}>
                {/* Columna izquierda - Antes de asignar */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}>
                    ℹ️ Antes de asignar:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      • Verificar tipo de jornada según contrato
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      • Verificar disponibilidad antes de asignar
                    </Typography>
                  </Box>
                </Box>

                {/* Columna derecha - Consideraciones importantes */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600, 
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}>
                    📋 Consideraciones importantes:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      • Descanso mínimo entre jornadas: 12 horas
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      • Compensar horas acumuladas la semana siguiente
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </ModernAlert>

            {/* Tabla de horarios */}
            <HorariosTable
              isMobile={isMobile}
              isSmallMobile={isSmallMobile}
              usuariosFiltrados={usuariosFiltrados}
              editando={editando}
              horarios={horarios}
              horariosEditados={horariosEditados}
              currentUser={currentUserData}
              handleCambiarTurno={handleCambiarTurno}
              abrirInfoTurno={abrirInfoTurno}
              handleCopiarHorario={handleCopiarHorario}
              clipboard={clipboard}
              onApplyCopiedHorario={applyCopiedHorario}
              NO_SUMAN_HORAS={NO_SUMAN_HORAS}
              calcularExceso={calcularExceso}
              calcularHorasTotales={calcularHorasTotales}
              semanaSeleccionada={semanaSeleccionada}
              semanaActual={semanaActual}
              obtenerUsuario={obtenerUsuario}
              obtenerHorasMaximas={obtenerHorasMaximas}
              diasSemana={diasSemana}
            />

            {/* Botones de acción */}
            <ActionButtonsContainer>
              {loading && (
                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(255,255,255,0.8)',
                  borderRadius: 1,
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }} />
              )}
              {!editando ? (
                <>
                  <ActionButton 
                    variant="contained" 
                    color="primary"
                    onClick={iniciarEdicion}
                    disabled={loading || !puedeEditarHorarios(currentUserData)}
                    startIcon={<EditIcon />}
                    sx={{
                      flex: { xs: 1, sm: 'none' },
                      minWidth: { sm: 180 },
                    }}
                  >
                    Editar Horarios
                  </ActionButton>
                  
                  <ActionButton 
                    variant="outlined" 
                    sx={{
                      borderColor: '#d32f2f',
                      color: '#d32f2f',
                      borderWidth: 2,
                      '&:hover': {
                        borderColor: '#b71c1c',
                        backgroundColor: 'rgba(211, 47, 47, 0.04)',
                        borderWidth: 2,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(211, 47, 47, 0.2)',
                      },
                      flex: { xs: 1, sm: 'none' },
                      minWidth: { sm: 180 },
                    }}
                    onClick={() => setDialogoEliminar(true)}
                    disabled={loading || !puedeEliminarHorarios(currentUserData)}
                    startIcon={<DeleteOutlineIcon />}
                  >
                    Eliminar Horarios
                  </ActionButton>
                </>
              ) : (
                <>
                  <ActionButton 
                    variant="outlined" 
                    onClick={() => {
                      setEditando(false);
                      setHorariosEditados({});
                    }}
                    disabled={loading}
                    startIcon={<CloseIcon />}
                    sx={{
                      flex: { xs: 1, sm: 'none' },
                      minWidth: { sm: 150 },
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                      },
                    }}
                  >
                    Cancelar
                  </ActionButton>
                  
                  <ActionButton 
                    variant="contained" 
                    color="primary"
                    onClick={handleGuardarHorarios}
                    disabled={loading}
                    startIcon={<SaveIcon />}
                    sx={{
                      flex: { xs: 1, sm: 'none' },
                      minWidth: { sm: 180 },
                      background: 'linear-gradient(135deg, #00830e 0%, #4caf50 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #006b0b 0%, #388e3c 100%)',
                      },
                    }}
                  >
                    Guardar Horarios
                  </ActionButton>
                </>
              )}
            </ActionButtonsContainer>
          </StyledPaper>
        </Fade>
      </ContentContainer>

      {/* Diálogos */}
      <DialogoHorario 
        dialogoHorario={dialogoHorario}
        setDialogoHorario={setDialogoHorario}
        horarioPersonalizado={horarioPersonalizado}
        setHorarioPersonalizado={setHorarioPersonalizado}
        guardarHorarioPersonalizado={guardarHorarioPersonalizado}
        isMobile={isMobile}
        isSmallMobile={isSmallMobile}
        currentUser={currentUserData || null}
        usuarios={usuarios}
        editando={editando}
        horariosEditados={horariosEditados}
        setHorariosEditados={setHorariosEditados}
        horarios={horarios}
        setHorarios={setHorarios}
        semanaSeleccionada={semanaSeleccionada}
        obtenerClaveSemana={obtenerClaveSemana}
      />
      <DialogoEliminar 
        dialogoEliminar={dialogoEliminar}
        setDialogoEliminar={setDialogoEliminar}
        eliminacionSeleccionada={eliminacionSeleccionada}
        setEliminacionSeleccionada={setEliminacionSeleccionada}
        handleEliminarSeleccionado={handleEliminarSeleccionado}
        currentUser={currentUser}
        usuarios={usuarios}
        horarios={horarios}
        isMobile={isMobile}
        isSmallMobile={isSmallMobile}
      />
      <DialogoCopiar 
        dialogoCopiar={dialogoCopiar}
        setDialogoCopiar={setDialogoCopiar}
        horarioACopiar={horarioACopiar}
        setHorarioACopiar={setHorarioACopiar}
        ejecutarCopiarHorario={ejecutarCopiarHorario}
        editando={editando}
        horariosEditados={horariosEditados}
        horarios={horarios}
      />
      <ModalConfirmacion modalConfirmacion={modalConfirmacion} cerrarModalConfirmacion={cerrarModal} />
      <InfoTurnoModal
        open={infoModalOpen}
        onClose={() => { cerrarInfoTurno(); setModalDiaKey(null); }}
        usuario={modalUsuario}
        turno={modalTurno}
        diaKey={modalDiaKey}
        semanaSeleccionada={semanaSeleccionada}
      />
    </PageContainer>
  );
};

export default Horarios;