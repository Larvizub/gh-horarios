import React, { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { database, auth } from '../../firebase/config';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { puedeModificarTipoContrato, puedeAsignarRoles, ROLES } from '../../utils/contratoUtils';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
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
  Skeleton,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import SecurityIcon from '@mui/icons-material/Security';
import { departamentos } from '../../utils/horariosConstants';

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
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

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: '#1e293b',
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '& svg': {
    color: '#00830e',
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
  
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
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

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) {
          navigate('/');
          return;
        }

        setCurrentUser(user);

        // Cargar datos del usuario actual
        const userRef = ref(database, `usuarios/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userDataFromDB = userSnapshot.val();
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
          
          if (usuariosSnapshot.exists()) {
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
        setLoading(false);
      }
    };

    cargarDatos();
  }, [navigate, userId, currentUser?.uid]);

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
      
      // Actualizar datos en la base de datos
      const updateData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        cargo: formData.cargo,
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
          ...formData
        });
      } else if (usuarioSeleccionado) {
        // Actualizar en la lista de usuarios
        setUsuarios(usuarios.map(u => 
          u.id === usuarioSeleccionado.id ? { ...u, ...formData } : u
        ));
        setUsuarioSeleccionado({
          ...usuarioSeleccionado,
          ...formData
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
        {/* Profile Header */}
        <ProfileHeader>
          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: { xs: 70, md: 90 },
                height: { xs: 70, md: 90 },
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: { xs: '1.8rem', md: '2.2rem' },
                fontWeight: 600,
                border: '3px solid rgba(255,255,255,0.3)',
              }}
            >
              {userData?.nombre?.charAt(0)}{userData?.apellidos?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, color: 'white' }}>
              <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700 }}>
                {userData?.nombre} {userData?.apellidos}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
                {userData?.cargo} • {userData?.departamento}
              </Typography>
              {userData?.rol && (
                <Box sx={{ 
                  mt: 1, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                }}>
                  <SecurityIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {userData.rol}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </ProfileHeader>

        {/* Main Card */}
        <StyledCard>
          <StyledTabs
            value={tabIndex}
            onChange={handleChangeTab}
            variant={isMobile ? 'fullWidth' : 'standard'}
            centered={!isMobile}
          >
            <Tab icon={<PersonIcon />} label={isMobile ? '' : 'Perfil'} iconPosition="start" />
            <Tab icon={<LockIcon />} label={isMobile ? '' : 'Contraseña'} iconPosition="start" />
            {isAdmin && (
              <Tab icon={<AdminPanelSettingsIcon />} label={isMobile ? '' : 'Administración'} iconPosition="start" />
            )}
          </StyledTabs>

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

            {/* Pestaña de Perfil */}
            {tabIndex === 0 && (
              <Box>
                <SectionTitle variant="h6">
                  <PersonIcon /> Información Personal
                </SectionTitle>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleFormChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon sx={{ color: '#64748b' }} />
                          </InputAdornment>
                        ),
                      }}
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
                      disabled
                      helperText="El correo electrónico no puede ser modificado"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: '#64748b' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Cargo"
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleFormChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkIcon sx={{ color: '#64748b' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Departamento</InputLabel>
                      <StyledSelect
                        name="departamento"
                        value={formData.departamento}
                        onChange={handleFormChange}
                        label="Departamento"
                        startAdornment={
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: '#64748b' }} />
                          </InputAdornment>
                        }
                      >
                        {departamentos.map((depto) => (
                          <MenuItem key={depto} value={depto}>{depto}</MenuItem>
                        ))}
                      </StyledSelect>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Contrato</InputLabel>
                      <StyledSelect
                        name="tipoContrato"
                        value={formData.tipoContrato}
                        onChange={handleFormChange}
                        label="Tipo de Contrato"
                        disabled={!puedeModificarTipoContrato(userData)}
                      >
                        <MenuItem value="Operativo">Operativo (48 horas semanales)</MenuItem>
                        <MenuItem value="Confianza">Confianza (72 horas semanales)</MenuItem>
                      </StyledSelect>
                    </FormControl>
                    {!puedeModificarTipoContrato(userData) && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Solo Talento Humano puede modificar este campo
                      </Typography>
                    )}
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
              </Box>
            )}

            {/* Pestaña de Contraseña */}
            {tabIndex === 1 && (
              <Box>
                <SectionTitle variant="h6">
                  <LockIcon /> Cambiar Contraseña
                </SectionTitle>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Contraseña Actual"
                      name="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                              edge="end"
                            >
                              {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Nueva Contraseña"
                      name="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                              edge="end"
                            >
                              {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Confirmar Contraseña"
                      name="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                              edge="end"
                            >
                              {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      La contraseña debe tener al menos 6 caracteres
                    </Typography>
                    <PrimaryButton
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
                      onClick={cambiarContrasena}
                      disabled={loading}
                    >
                      Cambiar Contraseña
                    </PrimaryButton>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Pestaña de Administración */}
            {tabIndex === 2 && isAdmin && (
              <Box>
                <SectionTitle variant="h6">
                  <AdminPanelSettingsIcon /> Administración de Usuarios
                </SectionTitle>
                
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Seleccionar Usuario</InputLabel>
                  <StyledSelect
                    value={usuarioSeleccionado ? usuarioSeleccionado.id : ''}
                    onChange={handleUsuarioChange}
                    label="Seleccionar Usuario"
                  >
                    {usuarios.map((usuario) => (
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
                        <StyledTextField
                          fullWidth
                          label="Cargo"
                          name="cargo"
                          value={formData.cargo}
                          onChange={handleFormChange}
                        />
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
                            {departamentos.map((depto) => (
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