import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ref, get, update } from 'firebase/database';
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
  Tabs,
  Tab,
  Divider,
  Alert,
  Avatar,
  Collapse,
  Skeleton,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import SecurityIcon from '@mui/icons-material/Security';
import useDepartamentos from '../../hooks/useDepartamentos';
import { saveDepartamentosCatalogo } from '../../services/departamentosService';
import { DEFAULT_DEPARTAMENTOS, normalizeDepartamentoLabel } from '../../utils/departamentos';
import useCargos from '../../hooks/useCargos';
import { saveCargosCatalogo } from '../../services/cargosService';
import { buildCargoIdFromLabel, normalizeCargoLabel, resolveCargoRecord } from '../../utils/cargos';

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: '#f8fafc',
  paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
  [theme.breakpoints.up('md')]: {
    paddingBottom: theme.spacing(4),
  },
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #00830e 0%, #006c0b 50%, #005a09 100%)',
  borderRadius: 24,
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 10px 40px rgba(0, 131, 14, 0.3)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-20%',
    width: '60%',
    height: '150%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
    borderRadius: '50%',
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: 0,
    marginLeft: theme.spacing(-2),
    marginRight: theme.spacing(-2),
    marginTop: theme.spacing(-2),
    padding: theme.spacing(3),
  },
}));

const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  overflow: 'hidden',
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  '& .MuiTabs-indicator': {
    height: 3,
    borderRadius: '3px 3px 0 0',
    backgroundColor: '#00830e',
  },
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.95rem',
    minHeight: 56,
    '&.Mui-selected': {
      color: '#00830e',
      fontWeight: 600,
    },
  },
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

const rolesDisponibles = [
  { value: null, label: 'Sin rol' },
  { value: ROLES.ADMINISTRADOR, label: 'Administrador' },
  { value: ROLES.MODIFICADOR, label: 'Modificador' }, 
  { value: ROLES.VISOR, label: 'Visor' }
];

const Configuracion = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { departamentos, departamentosActivos, loadingDepartamentos } = useDepartamentos();
  const { cargos, loadingCargos } = useCargos();
  const [busquedaCargo, setBusquedaCargo] = useState('');
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [busquedaDepartamentos, setBusquedaDepartamentos] = useState('');

  const mountedRef = useRef(true);
  
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [adminModuleOpen, setAdminModuleOpen] = useState(false);
  const [catalogModuleOpen, setCatalogModuleOpen] = useState(false);
  const [cargoModuleOpen, setCargoModuleOpen] = useState(false);
  const [nuevoDepartamento, setNuevoDepartamento] = useState('');
  const [nuevoCargo, setNuevoCargo] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
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
    return [...cargos].sort((a, b) => a.orden - b.orden || a.label.localeCompare(b.label));
  }, [cargos]);

  const cargoOptions = useMemo(() => cargosOrdenados.filter((cargo) => cargo.activo !== false).map((cargo) => cargo.label), [cargosOrdenados]);

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

  const usuariosFiltradosConSeleccion = useMemo(() => {
    if (!usuarioSeleccionado) {
      return usuariosFiltrados;
    }

    const existeSeleccionado = usuariosFiltrados.some((usuario) => usuario.id === usuarioSeleccionado.id);
    if (existeSeleccionado) {
      return usuariosFiltrados;
    }

    return [usuarioSeleccionado, ...usuariosFiltrados];
  }, [usuarioSeleccionado, usuariosFiltrados]);

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
        },
      ]);
      setNuevoCargo('');
      toast.success('Cargo creado correctamente.');
    } catch (error) {
      console.error('Error al crear cargo:', error);
      toast.error('No se pudo crear el cargo: ' + error.message);
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

  const handleChangeTab = (event, newValue) => {
    setTabIndex(newValue);
    if (newValue !== 2 && userData) {
      setUsuarioSeleccionado(null);
      setFormData({
        nombre: userData.nombre || '',
        apellidos: userData.apellidos || '',
        email: userData.email || '',
        cargo: userData.cargo || '',
        departamento: userData.departamento || '',
        tipoContrato: userData.tipoContrato || 'Operativo',
        rol: userData.rol || null
      });
      navigate('/configuracion');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name && value !== undefined) {
      // Manejar el caso especial del rol "Sin rol"
      const finalValue = name === 'rol' && value === 'Sin rol' ? null : value;
      setFormData(prev => ({
        ...prev,
        [name]: finalValue
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const handleUsuarioChange = (e) => {
    const usuarioId = e.target.value;
    const usuarioEncontrado = usuarios.find(u => u.id === usuarioId);
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
  };

  const guardarPerfil = async () => {
    try {
      setLoading(true);
      setError('');
      
      const targetUserId = userId || (usuarioSeleccionado ? usuarioSeleccionado.id : currentUser.uid);
      const userRef = ref(database, `usuarios/${targetUserId}`);
      const cargoRecord = resolveCargoRecord(formData.cargo);
      
      // Actualizar datos en la base de datos
      const updateData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        cargo: cargoRecord.cargo,
        cargoId: cargoRecord.cargoId,
        departamento: formData.departamento,
        ...(puedeAsignarRoles(userData) && { rol: formData.rol }) // Solo usuarios con permisos pueden cambiar roles
      };

      // Solo Talento Humano puede cambiar el tipo de contrato
      if (puedeModificarTipoContrato(userData)) {
        updateData.tipoContrato = formData.tipoContrato;
      }

      await update(userRef, updateData);

      // Si se cambió el email y es el usuario actual o un admin
      if (formData.email !== (usuarioSeleccionado ? usuarioSeleccionado.email : userData.email)) {
        if (targetUserId === currentUser.uid) {
          // Si es el usuario actual, necesitamos reautenticar
          setAccionPendiente('email');
          setDialogoReautenticacion(true);
          return;
        } else if (isAdmin) {
          // Si es admin cambiando el email de otro usuario, actualizar en la base de datos
          await update(userRef, { email: formData.email });
        }
      }

      toast.success('Perfil actualizado correctamente');
      
      // Actualizar datos locales
      if (targetUserId === currentUser.uid) {
        setUserData({
          ...userData,
          ...formData,
          cargoId: cargoRecord.cargoId,
        });
      } else if (usuarioSeleccionado) {
        // Actualizar en la lista de usuarios
        setUsuarios(usuarios.map(u => 
          u.id === usuarioSeleccionado.id ? { ...u, ...formData, cargoId: cargoRecord.cargoId } : u
        ));
        setUsuarioSeleccionado({
          ...usuarioSeleccionado,
          ...formData,
          cargoId: cargoRecord.cargoId,
        });
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setError('Error al actualizar perfil: ' + error.message);
      toast.error('Error al actualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const cambiarContrasena = async () => {
    const { newPassword, confirmPassword } = passwordData; // Removemos currentPassword ya que no se usa
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Reautenticar al usuario
      setAccionPendiente('password');
      setDialogoReautenticacion(true);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setError('Error al cambiar contraseña: ' + error.message);
      toast.error('Error al cambiar contraseña: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
                <AdminModuleHeader type="button" onClick={() => setAdminModuleOpen((current) => !current)}>
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

                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Seleccionar Usuario</InputLabel>
                      <StyledSelect
                        value={usuarioSeleccionado ? usuarioSeleccionado.id : ''}
                        onChange={handleUsuarioChange}
                        label="Seleccionar Usuario"
                      >
                        {usuariosFiltradosConSeleccion.map((usuario) => (
                          <MenuItem key={usuario.id} value={usuario.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#00830e' }}>
                                {usuario.nombre?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {usuario.nombre} {usuario.apellidos}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {usuario.email}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </StyledSelect>
                    </FormControl>

                    {busquedaUsuarios && usuariosFiltrados.length === 0 && (
                      <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
                        No hay usuarios que coincidan con la búsqueda.
                      </Alert>
                    )}

                    {usuarioSeleccionado && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: alpha('#00830e', 0.05), 
                          borderRadius: 3, 
                          mb: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}>
                          <Avatar sx={{ bgcolor: '#00830e' }}>
                            {usuarioSeleccionado.nombre?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              Editando: {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellidos}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {usuarioSeleccionado.email}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <StyledTextField
                              fullWidth
                              label="Nombre"
                              name="nombre"
                              value={formData.nombre}
                              onChange={handleFormChange}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <StyledTextField
                              fullWidth
                              label="Apellidos"
                              name="apellidos"
                              value={formData.apellidos}
                              onChange={handleFormChange}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <StyledTextField
                              fullWidth
                              label="Correo Electrónico"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleFormChange}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Cargo</InputLabel>
                              <StyledSelect
                                name="cargo"
                                value={formData.cargo}
                                onChange={handleFormChange}
                                label="Cargo"
                                disabled={loadingCargos}
                                startAdornment={
                                  <InputAdornment position="start">
                                    <WorkIcon sx={{ color: '#64748b' }} />
                                  </InputAdornment>
                                }
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
                                value={formData.departamento}
                                onChange={handleFormChange}
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
                                value={formData.tipoContrato}
                                onChange={handleFormChange}
                                label="Tipo de Contrato"
                                disabled={!puedeModificarTipoContrato(userData)}
                              >
                                <MenuItem value="Operativo">Operativo (48h)</MenuItem>
                                <MenuItem value="Confianza">Confianza (72h)</MenuItem>
                              </StyledSelect>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                              <InputLabel>Rol</InputLabel>
                              <StyledSelect
                                name="rol"
                                value={formData.rol || 'Sin rol'}
                                onChange={handleFormChange}
                                label="Rol"
                                disabled={!puedeAsignarRoles(userData)}
                              >
                                {rolesDisponibles.map((rol) => (
                                  <MenuItem key={rol.value || 'Sin rol'} value={rol.value || 'Sin rol'}>
                                    {rol.label}
                                  </MenuItem>
                                ))}
                              </StyledSelect>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12}>
                            <PrimaryButton
                              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                              onClick={guardarPerfil}
                              disabled={loading}
                            >
                              Guardar Cambios
                            </PrimaryButton>
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </Box>
                </Collapse>
                </AdminModuleCard>

                <AdminModuleCard elevation={0} sx={{ mt: 3 }}>
                  <AdminModuleHeader type="button" onClick={() => setCatalogModuleOpen((current) => !current)}>
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

                      <Grid container spacing={2}>
                        {departamentosFiltrados.length === 0 ? (
                          <Grid item xs={12}>
                            <Alert severity="info" sx={{ borderRadius: 3 }}>
                              No hay departamentos que coincidan con la búsqueda.
                            </Alert>
                          </Grid>
                        ) : (
                          departamentosFiltrados.map((departamento) => {
                          const usos = departamentosEnUso[normalizeDepartamentoLabel(departamento.label).toLowerCase()] || 0;
                          const esBase = esDepartamentoBase(departamento.label);
                          const protegido = esBase || usos > 0;

                          return (
                            <Grid item xs={12} sm={6} md={4} key={departamento.id}>
                              <Paper
                                elevation={0}
                                sx={{
                                  height: '100%',
                                  p: 2,
                                  borderRadius: 3,
                                  border: '1px solid rgba(15, 23, 42, 0.08)',
                                  background: protegido ? 'rgba(248, 250, 252, 0.9)' : '#ffffff',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 1.25,
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }} noWrap>
                                      {departamento.label}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                      {esBase ? 'Departamento base' : 'Departamento adicional'}
                                    </Typography>
                                  </Box>
                                  <Avatar sx={{ width: 34, height: 34, bgcolor: '#00830e', fontSize: '0.85rem', fontWeight: 700 }}>
                                    {usos}
                                  </Avatar>
                                </Box>

                                <Typography variant="body2" sx={{ color: '#64748b', minHeight: 40 }}>
                                  {usos > 0
                                    ? `Asignado a ${usos} usuario${usos === 1 ? '' : 's'}.`
                                    : 'Disponible para nuevas asignaciones.'}
                                </Typography>

                                <Button
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleEliminarDepartamento(departamento)}
                                  disabled={protegido || loading || loadingDepartamentos}
                                  sx={{
                                    textTransform: 'none',
                                    borderRadius: 2,
                                    alignSelf: 'flex-start',
                                  }}
                                >
                                  Eliminar
                                </Button>
                              </Paper>
                            </Grid>
                          );
                          })
                        )}
                      </Grid>
                    </Box>
                  </Collapse>
                </AdminModuleCard>

                <AdminModuleCard elevation={0} sx={{ mt: 3 }}>
                  <AdminModuleHeader type="button" onClick={() => setCargoModuleOpen((current) => !current)}>
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

                      <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}>
                        <TextField
                          fullWidth
                          label="Nuevo cargo"
                          value={nuevoCargo}
                          onChange={(event) => setNuevoCargo(event.target.value)}
                          placeholder="Ej. Coordinador de Operaciones"
                          disabled={loading || loadingCargos}
                        />
                        <PrimaryButton
                          onClick={handleAgregarCargo}
                          disabled={loading || loadingCargos}
                          sx={{ minWidth: { xs: '100%', sm: 220 } }}
                        >
                          Agregar cargo
                        </PrimaryButton>
                      </Box>

                      <Grid container spacing={2}>
                        {cargosOrdenados.length === 0 ? (
                          <Grid item xs={12}>
                            <Alert severity="info" sx={{ borderRadius: 3 }}>
                              Todavía no hay cargos creados.
                            </Alert>
                          </Grid>
                        ) : cargosFiltrados.length === 0 ? (
                          <Grid item xs={12}>
                            <Alert severity="info" sx={{ borderRadius: 3 }}>
                              No hay cargos que coincidan con la búsqueda.
                            </Alert>
                          </Grid>
                        ) : (
                          cargosFiltrados.map((cargo) => {
                            const usos = cargosEnUso[cargo.id] || 0;
                            const protegido = usos > 0;

                            return (
                              <Grid item xs={12} sm={6} md={4} key={cargo.id}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    height: '100%',
                                    p: 2,
                                    borderRadius: 3,
                                    border: '1px solid rgba(15, 23, 42, 0.08)',
                                    background: protegido ? 'rgba(248, 250, 252, 0.9)' : '#ffffff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1.25,
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }} noWrap>
                                        {cargo.label}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        Cargo disponible
                                      </Typography>
                                    </Box>
                                    <Avatar sx={{ width: 34, height: 34, bgcolor: '#00830e', fontSize: '0.85rem', fontWeight: 700 }}>
                                      {usos}
                                    </Avatar>
                                  </Box>

                                  <Typography variant="body2" sx={{ color: '#64748b', minHeight: 40 }}>
                                    {usos > 0
                                      ? `Asignado a ${usos} usuario${usos === 1 ? '' : 's'}.`
                                      : 'Disponible para nuevas asignaciones.'}
                                  </Typography>

                                  <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleEliminarCargo(cargo)}
                                    disabled={protegido || loading || loadingCargos}
                                    sx={{
                                      textTransform: 'none',
                                      borderRadius: 2,
                                      alignSelf: 'flex-start',
                                    }}
                                  >
                                    Eliminar
                                  </Button>
                                </Paper>
                              </Grid>
                            );
                          })
                        )}
                      </Grid>
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
    </PageContainer>
  );
};

export default Configuracion;