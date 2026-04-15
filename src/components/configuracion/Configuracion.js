import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ref, get, update, remove } from 'firebase/database';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { database, auth } from '../../firebase/config';
import { useNavigate, useLocation } from 'react-router-dom';
import { notify as toast } from '../../services/notify';
import { puedeModificarTipoContrato, puedeAsignarRoles, ROLES } from '../../utils/contratoUtils';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Checkbox,
  Button,
  ButtonBase,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Avatar,
  Collapse,
  Skeleton,
  IconButton,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import useDepartamentos from '../../hooks/useDepartamentos';
import { saveDepartamentosCatalogo } from '../../services/departamentosService';
import { DEFAULT_DEPARTAMENTOS, normalizeDepartamentoLabel } from '../../utils/departamentos';
import useCargos from '../../hooks/useCargos';
import useRoles from '../../hooks/useRoles';
import useTiposContrato from '../../hooks/useTiposContrato';
import useJornadasTrabajo from '../../hooks/useJornadasTrabajo';
import { formatTipoContratoHoras } from '../../utils/tiposContrato';
import TipoContratoChip from '../common/TipoContratoChip';
import TiposHorarioManager from './TiposHorarioManager';
import TiposContratoManager from './TiposContratoManager';
import JornadasManager from './JornadasManager';
import FeriadosManager from './FeriadosManager';
import { saveCargosCatalogo } from '../../services/cargosService';
import { saveRolesCatalogo } from '../../services/rolesService';
import { buildCargoIdFromLabel, buildDefaultCargoPermissions, normalizeCargoDepartamentoId, normalizeCargoLabel, normalizeCargoPermissions, PERMISOS_CARGO, resolveCargoRecord } from '../../utils/cargos';

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: '#f8fafc',
  paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
  [theme.breakpoints.up('md')]: {
    paddingBottom: theme.spacing(4),
  },
}));

const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  overflow: 'hidden',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 14,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#ffffff',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 3px rgba(0, 131, 14, 0.1)',
    },
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0, 131, 14, 0.3)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#00830e',
      borderWidth: 2,
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: 14,
  backgroundColor: 'rgba(248, 250, 252, 0.8)',
  '&:hover': {
    backgroundColor: '#ffffff',
  },
  '&.Mui-focused': {
    backgroundColor: '#ffffff',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 131, 14, 0.3)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#00830e',
    borderWidth: 2,
  },
}));

const PrimaryButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  borderRadius: 14,
  background: 'linear-gradient(135deg, #00830e 0%, #006c0b 100%)',
  color: '#ffffff',
  fontSize: '0.95rem',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 4px 14px rgba(0, 131, 14, 0.35)',
  transition: 'all 0.25s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #006c0b 0%, #005a09 100%)',
    boxShadow: '0 6px 20px rgba(0, 131, 14, 0.45)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: 'rgba(0, 0, 0, 0.12)',
    color: 'rgba(0, 0, 0, 0.26)',
    boxShadow: 'none',
  },
}));

const AdminModuleCard = styled(Paper)(() => ({
  borderRadius: 24,
  border: '1px solid rgba(0, 131, 14, 0.10)',
  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
  overflow: 'hidden',
}));

const AdminModuleHeader = styled(ButtonBase)(() => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  textAlign: 'left',
  padding: '18px 20px',
  background: 'linear-gradient(135deg, rgba(0, 131, 14, 0.08) 0%, rgba(0, 131, 14, 0.03) 100%)',
  transition: 'background 180ms ease, transform 180ms ease',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(0, 131, 14, 0.12) 0%, rgba(0, 131, 14, 0.05) 100%)',
  },
}));

const Configuracion = () => {
  const { departamentos, departamentosActivos, loadingDepartamentos } = useDepartamentos();
  const { cargos, loadingCargos } = useCargos();
  const { roles, loadingRoles } = useRoles();
  const { tipos: tiposContrato, tiposMap: tiposContratoMap } = useTiposContrato();
  const { jornadas } = useJornadasTrabajo();
  const [busquedaCargo, setBusquedaCargo] = useState('');
  const [permisosModuleOpen, setPermisosModuleOpen] = useState(false);
  const [roleSeleccionadoId, setRoleSeleccionadoId] = useState('');
  const [permisosRolForm, setPermisosRolForm] = useState(buildDefaultCargoPermissions());
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [ordenUsuarios, setOrdenUsuarios] = useState({ campo: 'nombre', direccion: 'asc' });
  const [busquedaDepartamentos, setBusquedaDepartamentos] = useState('');
  const [cargoNuevoAbierto, setCargoNuevoAbierto] = useState(false);
  const [nuevoCargoDepartamentoId, setNuevoCargoDepartamentoId] = useState('');
  const [departamentoEdicionAbierto, setDepartamentoEdicionAbierto] = useState(false);
  const [departamentoEnEdicion, setDepartamentoEnEdicion] = useState(null);
  const [departamentoEdicionForm, setDepartamentoEdicionForm] = useState({
    label: '',
  });
  const [cargoEdicionAbierto, setCargoEdicionAbierto] = useState(false);
  const [cargoEnEdicion, setCargoEnEdicion] = useState(null);
  const [cargoEdicionForm, setCargoEdicionForm] = useState({
    label: '',
    departamentoId: '',
    roleId: null,
  });

  const mountedRef = useRef(true);
  
  const [loading, setLoading] = useState(true);
  const [, setTabIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [usuarioEdicionAbierto, setUsuarioEdicionAbierto] = useState(false);
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState(null);
  const [usuarioEdicionForm, setUsuarioEdicionForm] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    cargo: '',
    departamento: '',
    tipoContrato: '',
    rol: null,
    activo: true,
  });
  const [usuarioEliminarAbierto, setUsuarioEliminarAbierto] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [adminModuleOpen, setAdminModuleOpen] = useState(false);
  const [catalogModuleOpen, setCatalogModuleOpen] = useState(false);
  const [cargoModuleOpen, setCargoModuleOpen] = useState(false);
  const [tiposModuleOpen, setTiposModuleOpen] = useState(false);
  const [tiposContratoModuleOpen, setTiposContratoModuleOpen] = useState(false);
  const [jornadasModuleOpen, setJornadasModuleOpen] = useState(false);
  const [feriadosModuleOpen, setFeriadosModuleOpen] = useState(false);
  const [nuevoDepartamento, setNuevoDepartamento] = useState('');
  const [nuevoCargo, setNuevoCargo] = useState('');
  const [nuevoRolLabel, setNuevoRolLabel] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    cargo: '',
    departamento: '',
    tipoContrato: '',
    rol: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [dialogoReautenticacion, setDialogoReautenticacion] = useState(false);
  const [reautenticacionPassword, setReautenticacionPassword] = useState('');
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const userId = queryParams.get('userId');

  const departamentosEnUso = useMemo(() => {
    return usuarios.reduce((accumulator, usuario) => {
      const label = normalizeDepartamentoLabel(usuario.departamento || '').toLowerCase();
      if (!label) {
        return accumulator;
      }

      accumulator[label] = (accumulator[label] || 0) + 1;
      return accumulator;
    }, {});
  }, [usuarios]);

  const cargosEnUso = useMemo(() => {
    return usuarios.reduce((accumulator, usuario) => {
      const id = usuario.cargoId || buildCargoIdFromLabel(usuario.cargo || '');
      if (!id) {
        return accumulator;
      }

      accumulator[id] = (accumulator[id] || 0) + 1;
      return accumulator;
    }, {});
  }, [usuarios]);

  const cargosOrdenados = useMemo(() => {
    return [...cargos].sort((a, b) => {
      return a.label.localeCompare(b.label, 'es', { sensitivity: 'base' });
    });
  }, [cargos]);

  const tiposContratoOrdenados = useMemo(() => {
    return [...tiposContrato].sort((a, b) => a.orden - b.orden);
  }, [tiposContrato]);

  const cargoOptions = useMemo(() => cargosOrdenados.filter((cargo) => cargo.activo !== false).map((cargo) => cargo.label), [cargosOrdenados]);

  const departamentosPorId = useMemo(() => {
    return departamentos.reduce((accumulator, departamento) => {
      accumulator[departamento.id] = departamento.label;
      return accumulator;
    }, {});
  }, [departamentos]);

  const usuariosFiltrados = useMemo(() => {
    const termino = normalizeCargoLabel(busquedaUsuarios).toLowerCase();
    if (!termino) {
      return usuarios;
    }

    return usuarios.filter((usuario) => {
      const campos = [
        usuario.nombre,
        usuario.apellidos,
        usuario.email,
        usuario.cargo,
        usuario.departamento,
        usuario.rol,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return campos.includes(termino);
    });
  }, [busquedaUsuarios, usuarios]);

  const usuariosOrdenados = useMemo(() => {
    const factor = ordenUsuarios.direccion === 'asc' ? 1 : -1;

    const getValorOrden = (usuario) => {
      switch (ordenUsuarios.campo) {
        case 'nombre':
          return `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim();
        case 'cargo':
          return usuario.cargo || '';
        case 'departamento':
          return usuario.departamento || '';
        case 'tipoContrato':
          return usuario.tipoContrato || '';
        default:
          return '';
      }
    };

    return [...usuariosFiltrados].sort((a, b) => {
      const valorA = getValorOrden(a).toString();
      const valorB = getValorOrden(b).toString();
      return valorA.localeCompare(valorB, 'es', { sensitivity: 'base' }) * factor;
    });
  }, [ordenUsuarios, usuariosFiltrados]);

  const handleOrdenUsuarios = useCallback((campo) => {
    setOrdenUsuarios((current) => ({
      campo,
      direccion: current.campo === campo && current.direccion === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const renderSortableHeader = useCallback((label, campo, align = 'left') => {
    const isActive = ordenUsuarios.campo === campo;
    const SortIcon = isActive
      ? (ordenUsuarios.direccion === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon)
      : SwapVertIcon;

    return (
      <ButtonBase
        type="button"
        onClick={() => handleOrdenUsuarios(campo)}
        sx={{
          width: '100%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: align === 'right' ? 'flex-end' : 'center',
          gap: 0.5,
          px: 0.5,
          py: 0.25,
          borderRadius: 1.5,
          color: isActive ? '#00830e' : '#475569',
          transition: 'color 160ms ease, background-color 160ms ease',
          '&:hover': {
            bgcolor: 'rgba(0, 131, 14, 0.06)',
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: 'inherit',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            textAlign: align,
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
        <SortIcon sx={{ fontSize: 14, opacity: isActive ? 1 : 0.55, flexShrink: 0 }} />
      </ButtonBase>
    );
  }, [handleOrdenUsuarios, ordenUsuarios]);

  const departamentosFiltrados = useMemo(() => {
    const termino = normalizeCargoLabel(busquedaDepartamentos).toLowerCase();
    if (!termino) {
      return departamentos;
    }

    return departamentos.filter((departamento) => departamento.label.toLowerCase().includes(termino));
  }, [busquedaDepartamentos, departamentos]);

  const cargosFiltrados = useMemo(() => {
    const termino = normalizeCargoLabel(busquedaCargo).toLowerCase();
    if (!termino) {
      return cargosOrdenados;
    }

    return cargosOrdenados.filter((cargo) => cargo.label.toLowerCase().includes(termino));
  }, [busquedaCargo, cargosOrdenados]);

  useEffect(() => {
    if (!roleSeleccionadoId && roles.length > 0) {
      setRoleSeleccionadoId(roles[0].id);
    }
  }, [roles, roleSeleccionadoId]);

  useEffect(() => {
    if (!nuevoCargoDepartamentoId && departamentos.length > 0) {
      setNuevoCargoDepartamentoId(departamentos[0].id);
    }
  }, [departamentos, nuevoCargoDepartamentoId]);

  useEffect(() => {
    const rolSeleccionado = roles.find((r) => r.id === roleSeleccionadoId);
    setPermisosRolForm(normalizeCargoPermissions(rolSeleccionado?.permisos));
  }, [roleSeleccionadoId, roles]);

  const rolSeleccionado = useMemo(() => {
    return roles.find((r) => r.id === roleSeleccionadoId) || null;
  }, [roles, roleSeleccionadoId]);

  const cargosSugeridosDesdeUsuarios = useMemo(() => {
    const vistos = new Map();

    usuarios.forEach((usuario) => {
      const cargoRecord = resolveCargoRecord(usuario.cargo || '');
      if (!cargoRecord.cargo || vistos.has(cargoRecord.cargoId)) {
        return;
      }

      vistos.set(cargoRecord.cargoId, {
        id: cargoRecord.cargoId,
        label: cargoRecord.cargo,
        activo: true,
        editable: false,
        orden: vistos.size + 1,
      });
    });

    return Array.from(vistos.values());
  }, [usuarios]);

  const esDepartamentoBase = (label) => {
    const normalized = normalizeDepartamentoLabel(label).toLowerCase();
    return DEFAULT_DEPARTAMENTOS.some((defaultLabel) => defaultLabel.toLowerCase() === normalized);
  };

  const handleAgregarDepartamento = async () => {
    const label = normalizeDepartamentoLabel(nuevoDepartamento);

    if (!label) {
      toast.error('Escribe un nombre de departamento.');
      return;
    }

    const existente = departamentos.some((item) => item.label.toLowerCase() === label.toLowerCase());
    if (existente) {
      toast.error('Ese departamento ya existe en el catálogo.');
      return;
    }

    try {
      setLoading(true);
      const nextOrden = departamentos.length > 0 ? Math.max(...departamentos.map((item) => item.orden || 0)) + 1 : 1;
      await saveDepartamentosCatalogo([
        ...departamentos,
        {
          id: label.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-'),
          label,
          activo: true,
          editable: true,
          orden: nextOrden,
        },
      ]);
      setNuevoDepartamento('');
      toast.success('Departamento creado correctamente.');
    } catch (error) {
      console.error('Error al crear departamento:', error);
      toast.error('No se pudo crear el departamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarDepartamento = async (departamento) => {
    const usos = departamentosEnUso[normalizeDepartamentoLabel(departamento.label).toLowerCase()] || 0;

    if (esDepartamentoBase(departamento.label)) {
      toast.error('Los departamentos base no se pueden eliminar.');
      return;
    }

    if (usos > 0) {
      toast.error('No puedes eliminar un departamento que ya tiene usuarios asignados.');
      return;
    }

    try {
      setLoading(true);
      await saveDepartamentosCatalogo(departamentos.filter((item) => item.id !== departamento.id));
      toast.success('Departamento eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar departamento:', error);
      toast.error('No se pudo eliminar el departamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirEdicionDepartamento = (departamento) => {
    setDepartamentoEnEdicion(departamento);
    setDepartamentoEdicionForm({
      label: departamento.label || '',
    });
    setDepartamentoEdicionAbierto(true);
  };

  const cerrarEdicionDepartamento = () => {
    setDepartamentoEdicionAbierto(false);
    setDepartamentoEnEdicion(null);
    setDepartamentoEdicionForm({ label: '' });
  };

  const handleDepartamentoEdicionChange = (event) => {
    const { name, value } = event.target;
    setDepartamentoEdicionForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleGuardarEdicionDepartamento = async () => {
    if (!departamentoEnEdicion) {
      return;
    }

    const label = normalizeDepartamentoLabel(departamentoEdicionForm.label);
    const labelAnterior = normalizeDepartamentoLabel(departamentoEnEdicion.label);
    const usos = departamentosEnUso[labelAnterior.toLowerCase()] || 0;

    if (!label) {
      toast.error('Escribe un nombre de departamento.');
      return;
    }

    const existente = departamentos.some(
      (item) => item.id !== departamentoEnEdicion.id && item.label.toLowerCase() === label.toLowerCase()
    );

    if (existente) {
      toast.error('Ya existe otro departamento con ese nombre.');
      return;
    }

    try {
      setLoading(true);

      const departamentosActualizados = departamentos.map((item) => {
        if (item.id !== departamentoEnEdicion.id) {
          return item;
        }

        return {
          ...item,
          label,
        };
      });

      await saveDepartamentosCatalogo(departamentosActualizados);

      if (usos > 0 && label.toLowerCase() !== labelAnterior.toLowerCase()) {
        const usuariosActualizados = usuarios.map((usuario) => {
          if (normalizeDepartamentoLabel(usuario.departamento || '').toLowerCase() !== labelAnterior.toLowerCase()) {
            return usuario;
          }

          return {
            ...usuario,
            departamento: label,
          };
        });

        await Promise.all(
          usuariosActualizados
            .filter((usuario, index) => usuario.departamento !== usuarios[index].departamento)
            .map((usuario) => update(ref(database, `usuarios/${usuario.id}`), { departamento: usuario.departamento }))
        );

        setUsuarios(usuariosActualizados);
      }

      toast.success('Departamento actualizado correctamente.');
      cerrarEdicionDepartamento();
    } catch (error) {
      console.error('Error al actualizar departamento:', error);
      toast.error('No se pudo actualizar el departamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarCargo = async () => {
    const label = normalizeCargoLabel(nuevoCargo);

    if (!label) {
      toast.error('Escribe un nombre de cargo.');
      return;
    }

    const existente = cargos.some((item) => item.label.toLowerCase() === label.toLowerCase());
    if (existente) {
      toast.error('Ese cargo ya existe en el catálogo.');
      return;
    }

    try {
      setLoading(true);
      const nextOrden = cargos.length > 0 ? Math.max(...cargos.map((item) => item.orden || 0)) + 1 : 1;
      const cargoRecord = resolveCargoRecord(label);
      await saveCargosCatalogo([
        ...cargos,
        {
          id: cargoRecord.cargoId,
          label: cargoRecord.cargo,
          activo: true,
          editable: true,
          orden: nextOrden,
          departamentoId: normalizeCargoDepartamentoId(nuevoCargoDepartamentoId),
        },
      ]);
      cerrarNuevoCargoDialog();
      toast.success('Cargo creado correctamente.');
    } catch (error) {
      console.error('Error al crear cargo:', error);
      toast.error('No se pudo crear el cargo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirEdicionCargo = (cargo) => {
    setCargoEnEdicion(cargo);
    setCargoEdicionForm({
      label: cargo.label || '',
      departamentoId: cargo.departamentoId || '',
      roleId: cargo.roleId || null,
    });
    setCargoEdicionAbierto(true);
  };

  const cerrarEdicionCargo = () => {
    setCargoEdicionAbierto(false);
    setCargoEnEdicion(null);
    setCargoEdicionForm({ label: '', departamentoId: '', roleId: null });
  };

  const handleCargoEdicionChange = (event) => {
    const { name, value } = event.target;
    setCargoEdicionForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleGuardarEdicionCargo = async () => {
    if (!cargoEnEdicion) {
      return;
    }

    const label = normalizeCargoLabel(cargoEdicionForm.label);
    const departamentoId = normalizeCargoDepartamentoId(cargoEdicionForm.departamentoId);
    const usos = cargosEnUso[cargoEnEdicion.id] || 0;

    if (!label) {
      toast.error('Escribe un nombre de cargo.');
      return;
    }

    if (usos > 0 && label.toLowerCase() !== cargoEnEdicion.label.toLowerCase()) {
      toast.error('No puedes cambiar el nombre de un cargo que ya está asignado a usuarios.');
      return;
    }

    const labelDuplicado = cargos.some(
      (item) => item.id !== cargoEnEdicion.id && item.label.toLowerCase() === label.toLowerCase()
    );

    if (labelDuplicado) {
      toast.error('Ya existe otro cargo con ese nombre.');
      return;
    }

    try {
      setLoading(true);
      const cargosActualizados = cargos.map((item) => {
        if (item.id !== cargoEnEdicion.id) {
          return item;
        }

        return {
          ...item,
          label,
          departamentoId,
          roleId: cargoEdicionForm.roleId || null,
        };
      });

      await saveCargosCatalogo(cargosActualizados);
      toast.success('Cargo actualizado correctamente.');
      cerrarEdicionCargo();
    } catch (error) {
      console.error('Error al actualizar cargo:', error);
      toast.error('No se pudo actualizar el cargo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarCargo = async (cargo) => {
    const usos = cargosEnUso[cargo.id] || 0;

    if (usos > 0) {
      toast.error('No puedes eliminar un cargo que ya tiene usuarios asignados.');
      return;
    }

    try {
      setLoading(true);
      await saveCargosCatalogo(cargos.filter((item) => item.id !== cargo.id));
      toast.success('Cargo eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar cargo:', error);
      toast.error('No se pudo eliminar el cargo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAprobador = async (cargo, value) => {
    try {
      setLoading(true);
      const cargosActualizados = cargos.map((item) => {
        if (item.id !== cargo.id) return item;
        return {
          ...item,
          aprobador: !!value,
        };
      });

      await saveCargosCatalogo(cargosActualizados);
      toast.success('Estado de aprobador actualizado.');
    } catch (error) {
      console.error('Error al actualizar aprobador:', error);
      toast.error('No se pudo actualizar el estado de aprobador: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirEdicionUsuario = (usuario) => {
    setUsuarioEnEdicion(usuario);
    setUsuarioEdicionForm({
      nombre: usuario.nombre || '',
      apellidos: usuario.apellidos || '',
      email: usuario.email || '',
      cargo: usuario.cargo || '',
      departamento: usuario.departamento || '',
      tipoContrato: usuario.tipoContrato || 'Operativo',
      rol: usuario.rol || null,
      activo: usuario.activo !== false,
    });
    setUsuarioEdicionAbierto(true);
  };

  const cerrarEdicionUsuario = () => {
    setUsuarioEdicionAbierto(false);
    setUsuarioEnEdicion(null);
    setUsuarioEdicionForm({ nombre: '', apellidos: '', email: '', cargo: '', departamento: '', tipoContrato: '', rol: null, activo: true });
  };

  const handleUsuarioEdicionChange = (event) => {
    const { name, value, type, checked } = event.target;
    const finalValue = type === 'checkbox' ? checked : value;
    setUsuarioEdicionForm((current) => ({ ...current, [name]: finalValue }));
  };

  const handleGuardarEdicionUsuario = async () => {
    if (!usuarioEnEdicion) return;

    try {
      setLoading(true);
      const targetUserId = usuarioEnEdicion.id;
      const cargoRecord = resolveCargoRecord(usuarioEdicionForm.cargo || '');

      const updateData = {
        nombre: usuarioEdicionForm.nombre,
        apellidos: usuarioEdicionForm.apellidos,
        email: usuarioEdicionForm.email,
        cargo: cargoRecord.cargo,
        cargoId: cargoRecord.cargoId,
        departamento: usuarioEdicionForm.departamento,
        tipoContrato: usuarioEdicionForm.tipoContrato,
        ...(puedeAsignarRoles(userData) && { rol: usuarioEdicionForm.rol }),
        activo: usuarioEdicionForm.activo !== false,
      };

      await update(ref(database, `usuarios/${targetUserId}`), updateData);

      setUsuarios((current) => current.map((u) => (u.id === targetUserId ? { ...u, ...updateData } : u)));
      if (usuarioSeleccionado && usuarioSeleccionado.id === targetUserId) {
        setUsuarioSeleccionado((prev) => ({ ...prev, ...updateData }));
      }

      toast.success('Usuario actualizado correctamente.');
      cerrarEdicionUsuario();
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      toast.error('No se pudo actualizar el usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarUsuario = async (usuario) => {
    try {
      setLoading(true);
      await remove(ref(database, `usuarios/${usuario.id}`));
      setUsuarios((current) => current.filter((u) => u.id !== usuario.id));
      toast.success('Usuario eliminado correctamente.');
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('No se pudo eliminar el usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCargoDepartamentoChange = (event) => {
    setNuevoCargoDepartamentoId(event.target.value);
  };

  const abrirNuevoCargoDialog = () => {
    if (!nuevoCargoDepartamentoId && departamentos.length > 0) {
      setNuevoCargoDepartamentoId(departamentos[0].id);
    }
    setNuevoCargo('');
    setCargoNuevoAbierto(true);
  };

  const cerrarNuevoCargoDialog = () => {
    setCargoNuevoAbierto(false);
    setNuevoCargo('');
    if (departamentos.length > 0) {
      setNuevoCargoDepartamentoId((current) => current || departamentos[0].id);
    }
  };

  const handleGuardarPermisosCargo = async () => {
    if (!rolSeleccionado) {
      toast.error('Selecciona un rol para administrar sus permisos.');
      return;
    }

    try {
      setLoading(true);
      const rolesActualizados = roles.map((role) => {
        if (role.id !== rolSeleccionado.id) return role;
        return {
          ...role,
          permisos: normalizeCargoPermissions(permisosRolForm),
        };
      });

      await saveRolesCatalogo(rolesActualizados);
      toast.success('Permisos del rol actualizados correctamente.');
    } catch (error) {
      console.error('Error al guardar permisos del rol:', error);
      toast.error('No se pudieron guardar los permisos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (module) => {
    const currentStates = {
      admin: adminModuleOpen,
      catalog: catalogModuleOpen,
      cargo: cargoModuleOpen,
      permisos: permisosModuleOpen,
      tipos: tiposModuleOpen,
      contratos: tiposContratoModuleOpen,
      jornadas: jornadasModuleOpen,
      feriados: feriadosModuleOpen,
    };

    const isCurrentlyOpen = currentStates[module];

    // Close all modules first
    setAdminModuleOpen(false);
    setCatalogModuleOpen(false);
    setCargoModuleOpen(false);
    setPermisosModuleOpen(false);
    setTiposModuleOpen(false);
    setTiposContratoModuleOpen(false);
    setJornadasModuleOpen(false);
    setFeriadosModuleOpen(false);

    // If the requested module was closed, open it; otherwise leave closed
    if (!isCurrentlyOpen) {
      if (module === 'admin') setAdminModuleOpen(true);
      if (module === 'catalog') setCatalogModuleOpen(true);
      if (module === 'cargo') setCargoModuleOpen(true);
      if (module === 'permisos') setPermisosModuleOpen(true);
      if (module === 'tipos') setTiposModuleOpen(true);
      if (module === 'contratos') setTiposContratoModuleOpen(true);
      if (module === 'jornadas') setJornadasModuleOpen(true);
      if (module === 'feriados') setFeriadosModuleOpen(true);
    }
  };

  useEffect(() => {
    if (!isAdmin || loading || loadingCargos || cargosSugeridosDesdeUsuarios.length === 0) {
      return;
    }

    const cargosExistentes = new Set(cargos.map((item) => item.id));
    const cargosFaltantes = cargosSugeridosDesdeUsuarios.filter((item) => !cargosExistentes.has(item.id));

    if (cargosFaltantes.length === 0) {
      return;
    }

    const siguienteOrden = cargos.length > 0 ? Math.max(...cargos.map((item) => item.orden || 0)) : 0;
    const cargosNormalizados = [
      ...cargos,
      ...cargosFaltantes.map((item, index) => ({
        ...item,
        orden: siguienteOrden + index + 1,
      })),
    ];

    saveCargosCatalogo(cargosNormalizados).catch((error) => {
      console.error('Error al sembrar cargos desde usuarios:', error);
      toast.error('No se pudo actualizar el catálogo de cargos: ' + error.message);
    });
  }, [isAdmin, loading, loadingCargos, cargos, cargosSugeridosDesdeUsuarios]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
          navigate('/');
          return;
        }

        if (!mountedRef.current) return;
        setCurrentUser(user);

        // Cargar datos del usuario actual
        const userRef = ref(database, `usuarios/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userDataFromDB = userSnapshot.val();
        
        if (!mountedRef.current) return;
        setUserData(userDataFromDB);
        setIsAdmin(userDataFromDB?.rol === ROLES.ADMINISTRADOR || 
                   userDataFromDB?.departamento === 'Talento Humano' ||
                   userDataFromDB?.email === 'admin@costaricacc.com');

        // Si es admin, cargar todos los usuarios
        if (userDataFromDB?.rol === ROLES.ADMINISTRADOR || 
            userDataFromDB?.departamento === 'Talento Humano' ||
            userDataFromDB?.email === 'admin@costaricacc.com') {
          const usuariosRef = ref(database, 'usuarios');
          const usuariosSnapshot = await get(usuariosRef);
          
          if (usuariosSnapshot.exists() && mountedRef.current) {
            const usuariosData = usuariosSnapshot.val();
            const usuariosArray = Object.entries(usuariosData).map(([id, data]) => ({
              id,
              ...data,
              tipoContrato: data.tipoContrato || 'Operativo' // Valor por defecto para usuarios existentes
            }));
            setUsuarios(usuariosArray);

            // Si hay un userId en la URL, seleccionar ese usuario
            if (userId) {
              const usuarioEncontrado = usuariosArray.find(u => u.id === userId);
              if (usuarioEncontrado) {
                setUsuarioSeleccionado(usuarioEncontrado);
                setFormData({
                  nombre: usuarioEncontrado.nombre || '',
                  apellidos: usuarioEncontrado.apellidos || '',
                  email: usuarioEncontrado.email || '',
                  cargo: usuarioEncontrado.cargo || '',
                  departamento: usuarioEncontrado.departamento || '',
                  tipoContrato: usuarioEncontrado.tipoContrato || 'Operativo',
                  rol: usuarioEncontrado.rol || null
                });
                // Abrir el modal de edición de usuario directamente
                setUsuarioEnEdicion(usuarioEncontrado);
                setUsuarioEdicionForm({
                  nombre: usuarioEncontrado.nombre || '',
                  apellidos: usuarioEncontrado.apellidos || '',
                  email: usuarioEncontrado.email || '',
                  cargo: usuarioEncontrado.cargo || '',
                  departamento: usuarioEncontrado.departamento || '',
                  tipoContrato: usuarioEncontrado.tipoContrato || 'Operativo',
                  rol: usuarioEncontrado.rol || null,
                });
                setUsuarioEdicionAbierto(true);
                setTabIndex(2); // Cambiar a la pestaña de administración
              }
            }
          }
        }

        // Inicializar formData con los datos del usuario actual
        if (!userId) {
          setFormData({
            nombre: userDataFromDB?.nombre || '',
            apellidos: userDataFromDB?.apellidos || '',
            email: userDataFromDB?.email || '',
            cargo: userDataFromDB?.cargo || '',
            departamento: userDataFromDB?.departamento || '',
            tipoContrato: userDataFromDB?.tipoContrato || 'Operativo',
            rol: userDataFromDB?.rol || null
          });
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar datos: ' + error.message);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    cargarDatos();
    
    return () => {
      mountedRef.current = false;
    };
  }, [navigate, userId]);

  const handleReautenticacion = async () => {
    try {
      setLoading(true);
      
      // Crear credencial
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        reautenticacionPassword
      );
      
      // Reautenticar
      await reauthenticateWithCredential(currentUser, credential);
      
      // Ejecutar acción pendiente
      if (accionPendiente === 'email') {
        await updateEmail(currentUser, formData.email);
        await update(ref(database, `usuarios/${currentUser.uid}`), { email: formData.email });
        toast.success('Email actualizado correctamente');
      } else if (accionPendiente === 'password') {
        await updatePassword(currentUser, passwordData.newPassword);
        toast.success('Contraseña actualizada correctamente');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
      
      setDialogoReautenticacion(false);
      setReautenticacionPassword('');
      setAccionPendiente(null);
    } catch (error) {
      console.error('Error en la reautenticación:', error);
      setError('Error en la reautenticación: ' + error.message);
      toast.error('Error en la reautenticación: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.dispatchEvent(new Event('closeUserMenu'));
  }, []);

  if (loading && !userData) {
    return (
      <PageContainer>
        <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
          <Skeleton variant="rounded" height={180} sx={{ borderRadius: 5, mb: 3 }} />
          <Skeleton variant="rounded" height={400} sx={{ borderRadius: 5 }} />
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        {/* Main Card */}
        <StyledCard>
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 3 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            {isAdmin ? (
              <>
                <AdminModuleCard elevation={0}>
                <AdminModuleHeader type="button" onClick={() => toggleModule('admin')}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#00830e', color: '#ffffff', fontWeight: 700 }}>
                      {usuarios.length}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }} noWrap>
                        Administración de Usuarios
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                        Gestiona usuarios desde esta tarjeta, sin abrir ventanas externas.
                      </Typography>
                    </Box>
                  </Box>
                  <ExpandMoreIcon
                    sx={{
                      color: '#00830e',
                      transition: 'transform 180ms ease',
                      transform: adminModuleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      flex: '0 0 auto',
                    }}
                  />
                </AdminModuleHeader>

                <Collapse in={adminModuleOpen} timeout="auto">
                  <Box sx={{ p: { xs: 2, md: 4 }, pt: 3 }}>
                    <TextField
                      fullWidth
                      label="Buscar usuario"
                      value={busquedaUsuarios}
                      onChange={(event) => setBusquedaUsuarios(event.target.value)}
                      placeholder="Nombre, correo, cargo o departamento"
                      sx={{ mb: 3 }}
                    />

                    <Box
                      sx={{
                        border: '1px solid rgba(15, 23, 42, 0.08)',
                        borderRadius: 3,
                        overflow: 'hidden',
                        background: '#ffffff',
                      }}
                    >
                      <Box
                        sx={{
                          display: { xs: 'none', md: 'grid' },
                          gridTemplateColumns: '2fr 1.2fr 1.2fr 0.9fr auto',
                          gap: 2,
                          px: 2.5,
                          py: 1.5,
                          bgcolor: 'rgba(248, 250, 252, 0.9)',
                          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                        }}
                      >
                        {renderSortableHeader('Nombre', 'nombre')}
                        {renderSortableHeader('Cargo', 'cargo')}
                        {renderSortableHeader('Departamento', 'departamento')}
                        {renderSortableHeader('Tipo', 'tipoContrato')}
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'right' }}>
                          Acciones
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {usuariosOrdenados.length === 0 ? (
                          <Box sx={{ p: 2.5 }}>
                            <Alert severity="info" sx={{ borderRadius: 3, mb: 0 }}>
                              No hay usuarios que coincidan con la búsqueda.
                            </Alert>
                          </Box>
                        ) : (
                          usuariosOrdenados.map((usuario, index) => (
                            <Box
                              key={usuario.id}
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '2fr 1.2fr 1.2fr 0.9fr auto' },
                                gap: { xs: 1.1, md: 2 },
                                px: 2.5,
                                py: 1.5,
                                borderBottom: index < usuariosOrdenados.length - 1 ? '1px solid rgba(15, 23, 42, 0.08)' : 'none',
                                alignItems: { xs: 'flex-start', md: 'center' },
                                background: '#ffffff',
                              }}
                            >
                              <Box sx={{ display: 'grid', gap: 0.4 }}>
                                <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                  Nombre
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#00830e', fontSize: '0.85rem' }}>
                                    {usuario.nombre?.charAt(0)}{usuario.apellidos?.charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                    {usuario.nombre} {usuario.apellidos}
                                  </Typography>
                                </Box>
                              </Box>

                              <Box sx={{ display: 'grid', gap: 0.4 }}>
                                <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                  Cargo
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                  {usuario.cargo}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'grid', gap: 0.4 }}>
                                <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                  Departamento
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                  {usuario.departamento}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'grid', gap: 0.4, justifyItems: 'center' }}>
                                <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                  Tipo
                                </Typography>
                                <TipoContratoChip value={usuario.tipoContrato || 'Operativo'} sx={{ width: '100%', maxWidth: 140 }} />
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 0.5 }}>
                                <IconButton
                                  aria-label={`Editar ${usuario.nombre}`}
                                  onClick={() => abrirEdicionUsuario(usuario)}
                                  disabled={loading}
                                  sx={{ color: '#00830e' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  aria-label={`Eliminar ${usuario.nombre}`}
                                  onClick={() => { setUsuarioAEliminar(usuario); setUsuarioEliminarAbierto(true); }}
                                  disabled={!isAdmin || loading}
                                  sx={{ color: '#dc2626', '&.Mui-disabled': { color: 'rgba(220, 38, 38, 0.35)' } }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  </Box>
                  </Collapse>
                </AdminModuleCard>

                <AdminModuleCard elevation={0} sx={{ mt: 3 }}>
                  <AdminModuleHeader type="button" onClick={() => toggleModule('tipos')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: '#7c3aed', color: '#ffffff', fontWeight: 700 }}>
                        { /* icon count */ }
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }} noWrap>
                          Tipos de Horario
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                          Administra el catálogo de tipos de horario.
                        </Typography>
                      </Box>
                    </Box>
                    <ExpandMoreIcon
                      sx={{
                        color: '#7c3aed',
                        transition: 'transform 180ms ease',
                        transform: tiposModuleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flex: '0 0 auto',
                      }}
                    />
                  </AdminModuleHeader>

                  <Collapse in={tiposModuleOpen} timeout="auto">
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <TiposHorarioManager />
                    </Box>
                  </Collapse>
                </AdminModuleCard>

                <AdminModuleCard elevation={0} sx={{ mt: 3 }}>
                  <AdminModuleHeader type="button" onClick={() => toggleModule('contratos')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: '#2563eb', color: '#ffffff', fontWeight: 700 }}>
                        {tiposContrato.length}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }} noWrap>
                          Tipos de Contrato
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                          Administra los tipos de contrato y sus horas máximas.
                        </Typography>
                      </Box>
                    </Box>
                    <ExpandMoreIcon
                      sx={{
                        color: '#2563eb',
                        transition: 'transform 180ms ease',
                        transform: tiposContratoModuleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flex: '0 0 auto',
                      }}
                    />
                  </AdminModuleHeader>

                  <Collapse in={tiposContratoModuleOpen} timeout="auto">
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <TiposContratoManager />
                    </Box>
                  </Collapse>
                </AdminModuleCard>

                <AdminModuleCard elevation={0} sx={{ mt: 3 }}>
                  <AdminModuleHeader type="button" onClick={() => toggleModule('jornadas')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: '#0f766e', color: '#ffffff', fontWeight: 700 }}>
                        {jornadas.length}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }} noWrap>
                          Jornadas de Trabajo
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                          Administra plantillas semanales reutilizables para horarios.
                        </Typography>
                      </Box>
                    </Box>
                    <ExpandMoreIcon
                      sx={{
                        color: '#0f766e',
                        transition: 'transform 180ms ease',
                        transform: jornadasModuleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flex: '0 0 auto',
                      }}
                    />
                  </AdminModuleHeader>

                  <Collapse in={jornadasModuleOpen} timeout="auto">
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <JornadasManager />
                    </Box>
                  </Collapse>
                </AdminModuleCard>

                <AdminModuleCard elevation={0} sx={{ mt: 3 }}>
                  <AdminModuleHeader type="button" onClick={() => toggleModule('feriados')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: '#dc2626', color: '#ffffff', fontWeight: 700 }}>
                        <CalendarMonthIcon />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }} noWrap>
                          Feriados por Año
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                          Administra los feriados oficiales por cada año calendario.
                        </Typography>
                      </Box>
                    </Box>
                    <ExpandMoreIcon
                      sx={{
                        color: '#dc2626',
                        transition: 'transform 180ms ease',
                        transform: feriadosModuleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flex: '0 0 auto',
                      }}
                    />
                  </AdminModuleHeader>

                  <Collapse in={feriadosModuleOpen} timeout="auto">
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <FeriadosManager />
                    </Box>
                  </Collapse>
                </AdminModuleCard>

                <AdminModuleCard elevation={0} sx={{ mt: 3 }}>
                  <AdminModuleHeader type="button" onClick={() => toggleModule('catalog')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: '#00830e', color: '#ffffff', fontWeight: 700 }}>
                        {departamentos.length}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }} noWrap>
                          Catálogo de Departamentos
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                          Agrega nuevos departamentos sin alterar los ya asignados.
                        </Typography>
                      </Box>
                    </Box>
                    <ExpandMoreIcon
                      sx={{
                        color: '#00830e',
                        transition: 'transform 180ms ease',
                        transform: catalogModuleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flex: '0 0 auto',
                      }}
                    />
                  </AdminModuleHeader>

                  <Collapse in={catalogModuleOpen} timeout="auto">
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        Los departamentos base y los que tienen usuarios quedan protegidos.
                      </Typography>

                      <TextField
                        fullWidth
                        label="Buscar departamento"
                        value={busquedaDepartamentos}
                        onChange={(event) => setBusquedaDepartamentos(event.target.value)}
                        placeholder="Filtra por nombre de departamento"
                        sx={{ mb: 2.5 }}
                      />

                      <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}>
                        <TextField
                          fullWidth
                          label="Nuevo departamento"
                          value={nuevoDepartamento}
                          onChange={(event) => setNuevoDepartamento(event.target.value)}
                          placeholder="Ej. Experiencia del Cliente"
                          disabled={loading || loadingDepartamentos}
                        />
                        <PrimaryButton
                          onClick={handleAgregarDepartamento}
                          disabled={loading || loadingDepartamentos}
                          sx={{ minWidth: { xs: '100%', sm: 220 } }}
                        >
                          Agregar departamento
                        </PrimaryButton>
                      </Box>

                      <Box
                        sx={{
                          border: '1px solid rgba(15, 23, 42, 0.08)',
                          borderRadius: 3,
                          overflow: 'hidden',
                          background: '#ffffff',
                        }}
                      >
                        <Box
                          sx={{
                            display: { xs: 'none', md: 'grid' },
                            gridTemplateColumns: '1.8fr 0.9fr auto',
                            gap: 2,
                            px: 2.5,
                            py: 1.5,
                            bgcolor: 'rgba(248, 250, 252, 0.9)',
                            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            Departamento
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            Usuarios
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'right' }}>
                            Acciones
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          {departamentosFiltrados.length === 0 ? (
                            <Box sx={{ p: 2.5 }}>
                              <Alert severity="info" sx={{ borderRadius: 3, mb: 0 }}>
                                No hay departamentos que coincidan con la búsqueda.
                              </Alert>
                            </Box>
                          ) : (
                            departamentosFiltrados.map((departamento, index) => {
                              const usos = departamentosEnUso[normalizeDepartamentoLabel(departamento.label).toLowerCase()] || 0;
                              const esBase = esDepartamentoBase(departamento.label);
                              const protegido = esBase || usos > 0;

                              return (
                                <Box
                                  key={departamento.id}
                                  sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: '1.8fr 0.9fr auto' },
                                    gap: { xs: 1.1, md: 2 },
                                    px: 2.5,
                                    py: 1.75,
                                    borderBottom: index < departamentosFiltrados.length - 1 ? '1px solid rgba(15, 23, 42, 0.08)' : 'none',
                                    alignItems: { xs: 'flex-start', md: 'center' },
                                    background: protegido ? 'rgba(248, 250, 252, 0.65)' : '#ffffff',
                                  }}
                                >
                                  <Box sx={{ display: 'grid', gap: 0.4 }}>
                                    <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                      Departamento
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }} noWrap>
                                      {departamento.label}
                                    </Typography>
                                  </Box>

                                  <Box sx={{ display: 'grid', gap: 0.4, justifyItems: 'center' }}>
                                    <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                      Usuarios
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        maxWidth: 88,
                                        minWidth: 48,
                                        px: 1.25,
                                        py: 0.55,
                                        borderRadius: 999,
                                        bgcolor: 'rgba(0, 131, 14, 0.08)',
                                        color: '#00830e',
                                        fontWeight: 700,
                                      }}
                                    >
                                      {usos}
                                    </Box>
                                  </Box>

                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: { xs: 'flex-start', md: 'flex-end' },
                                      gap: 0.5,
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase', mr: 0.5 }}>
                                      Acciones
                                    </Typography>
                                    <IconButton
                                      aria-label={`Editar ${departamento.label}`}
                                      onClick={() => abrirEdicionDepartamento(departamento)}
                                      disabled={loading || loadingDepartamentos}
                                      sx={{ color: '#00830e' }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      aria-label={`Eliminar ${departamento.label}`}
                                      onClick={() => handleEliminarDepartamento(departamento)}
                                      disabled={protegido || loading || loadingDepartamentos}
                                      sx={{ color: '#dc2626', '&.Mui-disabled': { color: 'rgba(220, 38, 38, 0.35)' } }}
                                    >
                                      <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              );
                            })
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Collapse>
                </AdminModuleCard>

                <Dialog open={departamentoEdicionAbierto} onClose={cerrarEdicionDepartamento} fullWidth maxWidth="sm">
                  <DialogTitle sx={{ fontWeight: 700 }}>Editar departamento</DialogTitle>
                  <DialogContent sx={{ pt: 1 }}>
                    <DialogContentText sx={{ mb: 2 }}>
                      Puedes cambiar el nombre del departamento. Si ya tiene usuarios asignados, sus registros se actualizarán automáticamente.
                    </DialogContentText>

                    <TextField
                      fullWidth
                      label="Nombre del departamento"
                      name="label"
                      value={departamentoEdicionForm.label}
                      onChange={handleDepartamentoEdicionChange}
                    />
                  </DialogContent>
                  <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={cerrarEdicionDepartamento} sx={{ textTransform: 'none' }}>
                      Cancelar
                    </Button>
                    <PrimaryButton onClick={handleGuardarEdicionDepartamento} disabled={loading} startIcon={<EditIcon />}>
                      Guardar cambios
                    </PrimaryButton>
                  </DialogActions>
                </Dialog>

                <Dialog open={usuarioEdicionAbierto} onClose={cerrarEdicionUsuario} fullWidth maxWidth="sm">
                  <DialogTitle sx={{ fontWeight: 700 }}>Editar usuario</DialogTitle>
                  <DialogContent sx={{ pt: 1 }}>
                    <DialogContentText sx={{ mb: 2 }}>
                      Modifica los datos del usuario. Los cambios se guardarán en su registro.
                    </DialogContentText>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          fullWidth
                          label="Nombre"
                          name="nombre"
                          value={usuarioEdicionForm.nombre}
                          onChange={handleUsuarioEdicionChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          fullWidth
                          label="Apellidos"
                          name="apellidos"
                          value={usuarioEdicionForm.apellidos}
                          onChange={handleUsuarioEdicionChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <StyledTextField
                          fullWidth
                          label="Correo Electrónico"
                          name="email"
                          type="email"
                          value={usuarioEdicionForm.email}
                          onChange={handleUsuarioEdicionChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Cargo</InputLabel>
                          <StyledSelect
                            name="cargo"
                            value={usuarioEdicionForm.cargo}
                            onChange={handleUsuarioEdicionChange}
                            label="Cargo"
                            disabled={loadingCargos}
                          >
                            {cargoOptions.length === 0 ? (
                              <MenuItem value="" disabled>
                                No hay cargos disponibles
                              </MenuItem>
                            ) : (
                              cargoOptions.map((cargo) => (
                                <MenuItem key={cargo} value={cargo}>
                                  {cargo}
                                </MenuItem>
                              ))
                            )}
                          </StyledSelect>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Departamento</InputLabel>
                          <StyledSelect
                            name="departamento"
                            value={usuarioEdicionForm.departamento}
                            onChange={handleUsuarioEdicionChange}
                            label="Departamento"
                          >
                            {departamentosActivos.map((depto) => (
                              <MenuItem key={depto} value={depto}>{depto}</MenuItem>
                            ))}
                          </StyledSelect>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Tipo de Contrato</InputLabel>
                          <StyledSelect
                            name="tipoContrato"
                            value={usuarioEdicionForm.tipoContrato}
                            onChange={handleUsuarioEdicionChange}
                            label="Tipo de Contrato"
                            disabled={!puedeModificarTipoContrato(userData) || tiposContratoOrdenados.length === 0}
                          >
                            {tiposContratoOrdenados.map((tipoContrato) => (
                              <MenuItem key={tipoContrato.key} value={tipoContrato.label}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                  <TipoContratoChip value={tipoContrato.key} label={tipoContrato.label} sx={{ minWidth: 120 }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatTipoContratoHoras(tipoContrato.key, tiposContratoMap)}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </StyledSelect>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              name="activo"
                              checked={Boolean(usuarioEdicionForm.activo)}
                              onChange={handleUsuarioEdicionChange}
                              color="primary"
                              disabled={loading}
                            />
                          }
                          label={usuarioEdicionForm.activo ? 'Activo' : 'Inactivo'}
                        />
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={cerrarEdicionUsuario} sx={{ textTransform: 'none' }}>
                      Cancelar
                    </Button>
                    <PrimaryButton onClick={handleGuardarEdicionUsuario} disabled={loading} startIcon={<EditIcon />}>
                      Guardar cambios
                    </PrimaryButton>
                  </DialogActions>
                </Dialog>

                <AdminModuleCard elevation={0} sx={{ mt: 3 }}>
                  <AdminModuleHeader type="button" onClick={() => toggleModule('cargo')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: '#00830e', color: '#ffffff', fontWeight: 700 }}>
                        {cargos.length}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }} noWrap>
                          Catálogo de Cargos
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                          Agrega cargos sin afectar los ya asignados.
                        </Typography>
                      </Box>
                    </Box>
                    <ExpandMoreIcon
                      sx={{
                        color: '#00830e',
                        transition: 'transform 180ms ease',
                        transform: cargoModuleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flex: '0 0 auto',
                      }}
                    />
                  </AdminModuleHeader>

                  <Collapse in={cargoModuleOpen} timeout="auto">
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        Los cargos asignados a usuarios quedan protegidos.
                      </Typography>

                      <TextField
                        fullWidth
                        label="Buscar cargo"
                        value={busquedaCargo}
                        onChange={(event) => setBusquedaCargo(event.target.value)}
                        placeholder="Filtra por nombre de cargo"
                        sx={{ mb: 2.5 }}
                      />

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                        <PrimaryButton onClick={abrirNuevoCargoDialog} disabled={loading || loadingCargos || loadingDepartamentos} sx={{ minWidth: { xs: '100%', sm: 220 } }}>
                          Agregar cargo
                        </PrimaryButton>
                      </Box>

                      <Box
                        sx={{
                          border: '1px solid rgba(15, 23, 42, 0.08)',
                          borderRadius: 3,
                          overflow: 'hidden',
                          background: '#ffffff',
                        }}
                      >
                        <Box
                          sx={{
                            display: { xs: 'none', md: 'grid' },
                            gridTemplateColumns: '1.3fr 1.3fr 0.9fr 0.9fr auto',
                            gap: 2,
                            px: 2.5,
                            py: 1.5,
                            bgcolor: 'rgba(248, 250, 252, 0.9)',
                            borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            Departamento
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            Cargo
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>
                            Aprobador
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                            Usuarios
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'right' }}>
                            Acciones
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        {cargosOrdenados.length === 0 ? (
                          <Box sx={{ p: 2.5 }}>
                            <Alert severity="info" sx={{ borderRadius: 3, mb: 0 }}>
                              Todavía no hay cargos creados.
                            </Alert>
                          </Box>
                        ) : cargosFiltrados.length === 0 ? (
                          <Box sx={{ p: 2.5 }}>
                            <Alert severity="info" sx={{ borderRadius: 3, mb: 0 }}>
                              No hay cargos que coincidan con la búsqueda.
                            </Alert>
                          </Box>
                        ) : (
                          cargosFiltrados.map((cargo, index) => {
                            const usos = cargosEnUso[cargo.id] || 0;
                            const protegido = usos > 0;
                            const departamentoLabel = departamentosPorId[cargo.departamentoId] || 'Sin departamento';

                            return (
                              <Box
                                key={cargo.id}
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: { xs: '1fr', md: '1.3fr 1.3fr 0.9fr 0.9fr auto' },
                                  gap: { xs: 1.1, md: 2 },
                                  px: 2.5,
                                  py: 1.75,
                                  borderBottom: index < cargosFiltrados.length - 1 ? '1px solid rgba(15, 23, 42, 0.08)' : 'none',
                                  alignItems: { xs: 'flex-start', md: 'center' },
                                  background: protegido ? 'rgba(248, 250, 252, 0.65)' : '#ffffff',
                                }}
                              >
                                <Box sx={{ display: 'grid', gap: 0.4 }}>
                                  <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                    Departamento
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }} noWrap>
                                    {departamentoLabel}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: 'grid', gap: 0.4 }}>
                                  <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                    Cargo
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }} noWrap>
                                    {cargo.label}
                                  </Typography>
                                </Box>

                                  <Box sx={{ display: 'grid', gap: 0.4, justifyItems: 'center' }}>
                                    <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                      Aprobador
                                    </Typography>
                                    <Checkbox
                                      checked={Boolean(cargo.aprobador)}
                                      onChange={(e) => toggleAprobador(cargo, e.target.checked)}
                                      disabled={loading || loadingCargos}
                                      inputProps={{ 'aria-label': `Aprobador ${cargo.label}` }}
                                    />
                                  </Box>

                                <Box sx={{ display: 'grid', gap: 0.4, justifyItems: 'center' }}>
                                  <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                    Usuarios
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '100%',
                                      maxWidth: 88,
                                      minWidth: 48,
                                      px: 1.25,
                                      py: 0.55,
                                      borderRadius: 999,
                                      bgcolor: 'rgba(0, 131, 14, 0.08)',
                                      color: '#00830e',
                                      fontWeight: 700,
                                    }}
                                  >
                                    {usos}
                                  </Box>
                                </Box>

                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: { xs: 'flex-start', md: 'flex-end' },
                                    gap: 0.5,
                                  }}
                                >
                                  <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, fontWeight: 700, color: '#475569', textTransform: 'uppercase', mr: 0.5 }}>
                                    Acciones
                                  </Typography>
                                  <IconButton
                                    aria-label={`Editar ${cargo.label}`}
                                    onClick={() => abrirEdicionCargo(cargo)}
                                    disabled={loading || loadingCargos}
                                    sx={{ color: '#00830e' }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    aria-label={`Eliminar ${cargo.label}`}
                                    onClick={() => handleEliminarCargo(cargo)}
                                    disabled={protegido || loading || loadingCargos}
                                    sx={{ color: '#dc2626', '&.Mui-disabled': { color: 'rgba(220, 38, 38, 0.35)' } }}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            );
                          })
                        )}
                        </Box>
                      </Box>
                    </Box>
                  </Collapse>
                </AdminModuleCard>

                <Dialog open={cargoNuevoAbierto} onClose={cerrarNuevoCargoDialog} fullWidth maxWidth="sm">
                  <DialogTitle sx={{ fontWeight: 700 }}>Nuevo cargo</DialogTitle>
                  <DialogContent sx={{ pt: 1 }}>
                    <DialogContentText sx={{ mb: 2 }}>
                      Agrega un cargo y relaciónalo con el departamento correspondiente.
                    </DialogContentText>

                    <TextField
                      fullWidth
                      label="Nuevo cargo"
                      value={nuevoCargo}
                      onChange={(event) => setNuevoCargo(event.target.value)}
                      placeholder="Ej. Coordinador de Operaciones"
                      disabled={loading || loadingCargos}
                      sx={{ mb: 2 }}
                    />

                    <FormControl fullWidth>
                      <InputLabel>Departamento</InputLabel>
                      <StyledSelect
                        value={nuevoCargoDepartamentoId}
                        onChange={handleCargoDepartamentoChange}
                        label="Departamento"
                        disabled={loading || loadingDepartamentos}
                      >
                        {departamentos.map((departamento) => (
                          <MenuItem key={departamento.id} value={departamento.id}>
                            {departamento.label}
                          </MenuItem>
                        ))}
                      </StyledSelect>
                    </FormControl>
                  </DialogContent>
                  <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={cerrarNuevoCargoDialog} sx={{ textTransform: 'none' }}>
                      Cancelar
                    </Button>
                    <PrimaryButton onClick={handleAgregarCargo} disabled={loading || loadingCargos}>
                      Guardar cargo
                    </PrimaryButton>
                  </DialogActions>
                </Dialog>

                <Dialog open={cargoEdicionAbierto} onClose={cerrarEdicionCargo} fullWidth maxWidth="sm">
                  <DialogTitle sx={{ fontWeight: 700 }}>Editar cargo</DialogTitle>
                  <DialogContent sx={{ pt: 1 }}>
                    <DialogContentText sx={{ mb: 2 }}>
                      Cambia el departamento del cargo. Si aún no está asignado a usuarios, también puedes renombrarlo.
                    </DialogContentText>

                    <TextField
                      fullWidth
                      label="Nombre del cargo"
                      name="label"
                      value={cargoEdicionForm.label}
                      onChange={handleCargoEdicionChange}
                      disabled={(cargosEnUso[cargoEnEdicion?.id] || 0) > 0}
                      helperText={(cargosEnUso[cargoEnEdicion?.id] || 0) > 0 ? 'Los cargos ya asignados no pueden renombrarse.' : 'Puedes cambiar el nombre si aún no tiene usuarios asignados.'}
                      sx={{ mb: 2 }}
                    />

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Departamento</InputLabel>
                          <StyledSelect
                            name="departamentoId"
                            value={cargoEdicionForm.departamentoId}
                            onChange={handleCargoEdicionChange}
                            label="Departamento"
                            disabled={loadingDepartamentos}
                          >
                            <MenuItem value="">Sin departamento</MenuItem>
                            {departamentos.map((departamento) => (
                              <MenuItem key={departamento.id} value={departamento.id}>
                                {departamento.label}
                              </MenuItem>
                            ))}
                          </StyledSelect>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Rol</InputLabel>
                          <StyledSelect
                            name="roleId"
                            value={cargoEdicionForm.roleId || ''}
                            onChange={handleCargoEdicionChange}
                            label="Rol"
                            disabled={loadingRoles}
                          >
                            <MenuItem value="">Sin rol</MenuItem>
                            {roles.map((role) => (
                              <MenuItem key={role.id} value={role.id}>{role.label}</MenuItem>
                            ))}
                          </StyledSelect>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </DialogContent>
                  <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={cerrarEdicionCargo} sx={{ textTransform: 'none' }}>
                      Cancelar
                    </Button>
                    <PrimaryButton onClick={handleGuardarEdicionCargo} disabled={loading} startIcon={<EditIcon />}>
                      Guardar cambios
                    </PrimaryButton>
                  </DialogActions>
                </Dialog>

                <AdminModuleCard elevation={0} sx={{ mt: 3 }}>
                  <AdminModuleHeader type="button" onClick={() => toggleModule('permisos')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: '#0f766e', color: '#ffffff', fontWeight: 700 }}>
                        {cargos.length}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }} noWrap>
                          Administración de permisos
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                          Vincula permisos funcionales al cargo seleccionado.
                        </Typography>
                      </Box>
                    </Box>
                    <ExpandMoreIcon
                      sx={{
                        color: '#0f766e',
                        transition: 'transform 180ms ease',
                        transform: permisosModuleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flex: '0 0 auto',
                      }}
                    />
                  </AdminModuleHeader>

                  <Collapse in={permisosModuleOpen} timeout="auto">
                    <Box sx={{ p: { xs: 2, md: 3 } }}>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        Estos permisos quedan guardados en el catálogo del cargo.
                      </Typography>

                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                          <StyledTextField
                            fullWidth
                            label="Nuevo rol"
                            value={nuevoRolLabel}
                            onChange={(e) => setNuevoRolLabel(e.target.value)}
                            placeholder="Ej. Aprobador"
                            disabled={loading || loadingRoles}
                          />
                          <PrimaryButton
                            onClick={async () => {
                              const label = (nuevoRolLabel || '').trim();
                              if (!label) {
                                toast.error('Escribe el nombre del rol.');
                                return;
                              }

                              try {
                                setLoading(true);
                                const nuevoId = label.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                                const nuevoRol = {
                                  id: nuevoId,
                                  label,
                                  permisos: normalizeCargoPermissions({}),
                                  editable: true,
                                  orden: roles.length + 1,
                                };
                                await saveRolesCatalogo([...roles, nuevoRol]);
                                setNuevoRolLabel('');
                                toast.success('Rol creado correctamente.');
                              } catch (error) {
                                console.error('Error al crear rol:', error);
                                toast.error('No se pudo crear el rol: ' + error.message);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading || loadingRoles}
                          >
                            Agregar
                          </PrimaryButton>
                        </Box>
                        <InputLabel>Rol a administrar</InputLabel>
                        <StyledSelect
                          value={roleSeleccionadoId}
                          onChange={(event) => setRoleSeleccionadoId(event.target.value)}
                          label="Rol a administrar"
                          disabled={loadingRoles || roles.length === 0}
                        >
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.label}
                            </MenuItem>
                          ))}
                        </StyledSelect>
                      </FormControl>

                      {rolSeleccionado ? (
                        <>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 3 }}>
                            {PERMISOS_CARGO.map((permiso) => (
                              <Paper
                                key={permiso.key}
                                elevation={0}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 3,
                                  border: '1px solid rgba(15, 23, 42, 0.08)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 2,
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                  {permiso.label}
                                </Typography>
                                <Switch
                                  checked={Boolean(permisosRolForm[permiso.key])}
                                  onChange={(event) =>
                                    setPermisosRolForm((current) => ({
                                      ...current,
                                      [permiso.key]: event.target.checked,
                                    }))
                                  }
                                  disabled={loading || loadingRoles}
                                />
                              </Paper>
                            ))}
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <PrimaryButton
                              onClick={handleGuardarPermisosCargo}
                              disabled={loading || loadingRoles}
                              sx={{ minWidth: { xs: '100%', sm: 260 } }}
                            >
                              Guardar permisos del rol
                            </PrimaryButton>
                          </Box>
                        </>
                      ) : (
                        <Alert severity="info" sx={{ borderRadius: 3 }}>
                          No hay roles disponibles para administrar permisos.
                        </Alert>
                      )}
                    </Box>
                  </Collapse>
                </AdminModuleCard>
              </>
            ) : (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                No tienes permisos para administrar usuarios.
              </Alert>
            )}
          </Box>
        </StyledCard>
      </Container>

      {/* Diálogo de reautenticación */}
      <Dialog 
        open={dialogoReautenticacion} 
        onClose={() => setDialogoReautenticacion(false)}
        PaperProps={{
          sx: { borderRadius: 4, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          🔒 Verificación de seguridad
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Para continuar, ingresa tu contraseña actual para verificar tu identidad.
          </DialogContentText>
          <StyledTextField
            autoFocus
            fullWidth
            label="Contraseña actual"
            type="password"
            value={reautenticacionPassword}
            onChange={(e) => setReautenticacionPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDialogoReautenticacion(false)} 
            sx={{ color: '#64748b', borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <PrimaryButton 
            onClick={handleReautenticacion} 
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Verificar'}
          </PrimaryButton>
        </DialogActions>
      </Dialog>
      {/* Confirmación eliminación de usuario */}
      <Dialog
        open={usuarioEliminarAbierto}
        onClose={() => { setUsuarioEliminarAbierto(false); setUsuarioAEliminar(null); }}
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#ef4444' }}>
          ⚠️ Confirmar eliminación de usuario
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar al usuario <strong>{usuarioAEliminar?.nombre} {usuarioAEliminar?.apellidos}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setUsuarioEliminarAbierto(false); setUsuarioAEliminar(null); }} sx={{ color: '#64748b', borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (!usuarioAEliminar) return;
              await handleEliminarUsuario(usuarioAEliminar);
              setUsuarioEliminarAbierto(false);
              setUsuarioAEliminar(null);
            }}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default Configuracion;