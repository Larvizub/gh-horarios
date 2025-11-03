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
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { departamentos } from '../../utils/horariosConstants';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
}));

const rolesDisponibles = [
  { value: null, label: 'Sin rol' },
  { value: ROLES.ADMINISTRADOR, label: 'Administrador' },
  { value: ROLES.MODIFICADOR, label: 'Modificador' }, 
  { value: ROLES.VISOR, label: 'Visor' }
];

const Configuracion = () => {
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
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

  if (loading && !userData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
        Configuración
      </Typography>

      <StyledPaper sx={{ mt: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={handleChangeTab}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab 
            icon={<PersonIcon />} 
            label="Perfil" 
            sx={{ '&.Mui-selected': { color: 'var(--primary-color)' } }}
          />
          <Tab 
            icon={<LockIcon />} 
            label="Contraseña" 
            sx={{ '&.Mui-selected': { color: 'var(--primary-color)' } }}
          />
          {isAdmin && (
            <Tab 
              icon={<AdminPanelSettingsIcon />} 
              label="Administración" 
              sx={{ '&.Mui-selected': { color: 'var(--primary-color)' } }}
            />
          )}
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Pestaña de Perfil */}
        {tabIndex === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'var(--primary-color)' }}>
              Información Personal
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleFormChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Apellidos"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleFormChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  InputProps={{
                    readOnly: true,
                  }}
                  disabled
                  helperText="El correo electrónico no puede ser modificado"
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cargo"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleFormChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="departamento-label">Departamento</InputLabel>
                  <Select
                    labelId="departamento-label"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleFormChange}
                    label="Departamento"
                  >
                    {departamentos.map((depto) => (
                      <MenuItem key={depto} value={depto}>
                        {depto}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="tipo-contrato-label">Tipo de Contrato</InputLabel>
                  <Select
                    labelId="tipo-contrato-label"
                    name="tipoContrato"
                    value={formData.tipoContrato}
                    onChange={handleFormChange}
                    label="Tipo de Contrato"
                    disabled={!puedeModificarTipoContrato(userData)}
                  >
                    <MenuItem value="Operativo">Operativo (48 horas semanales)</MenuItem>
                    <MenuItem value="Confianza">Confianza (72 horas semanales)</MenuItem>
                  </Select>
                </FormControl>
                {!puedeModificarTipoContrato(userData) && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Solo Talento Humano puede modificar este campo
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={guardarPerfil}
                  disabled={loading}
                  sx={{ mt: 2, borderRadius: '8px' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Pestaña de Contraseña */}
        {tabIndex === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'var(--primary-color)' }}>
              Cambiar Contraseña
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contraseña Actual"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Nueva Contraseña"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<LockIcon />}
                  onClick={cambiarContrasena}
                  disabled={loading}
                  sx={{ mt: 2, borderRadius: '8px' }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Cambiar Contraseña'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Pestaña de Administración (solo para admins) */}
        {tabIndex === 2 && isAdmin && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'var(--primary-color)' }}>
              Administración de Usuarios
            </Typography>
            <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
              <InputLabel id="usuario-select-label">Seleccionar Usuario</InputLabel>
              <Select
                labelId="usuario-select-label"
                value={usuarioSeleccionado ? usuarioSeleccionado.id : ''}
                onChange={handleUsuarioChange}
                label="Seleccionar Usuario"
              >
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.id} value={usuario.id}>
                    {usuario.nombre} {usuario.apellidos} - {usuario.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {usuarioSeleccionado && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Editando a: {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellidos}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleFormChange}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Apellidos"
                      name="apellidos"
                      value={formData.apellidos}
                      onChange={handleFormChange}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Correo Electrónico"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cargo"
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleFormChange}
                      margin="normal"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="departamento-label">Departamento</InputLabel>
                      <Select
                        labelId="departamento-label"
                        name="departamento"
                        value={formData.departamento}
                        onChange={handleFormChange}
                        label="Departamento"
                      >
                        {departamentos.map((depto) => (
                          <MenuItem key={depto} value={depto}>
                            {depto}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="tipo-contrato-admin-label">Tipo de Contrato</InputLabel>
                      <Select
                        labelId="tipo-contrato-admin-label"
                        name="tipoContrato"
                        value={formData.tipoContrato}
                        onChange={handleFormChange}
                        label="Tipo de Contrato"
                        disabled={!puedeModificarTipoContrato(userData)}
                      >
                        <MenuItem value="Operativo">Operativo (48 horas semanales)</MenuItem>
                        <MenuItem value="Confianza">Confianza (72 horas semanales)</MenuItem>
                      </Select>
                    </FormControl>
                    {!puedeModificarTipoContrato(userData) && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Solo Talento Humano puede modificar este campo
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="rol-label">Rol</InputLabel>
                      <Select
                        labelId="rol-label"
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
                      </Select>
                    </FormControl>
                    {!puedeAsignarRoles(userData) && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                        Solo Administradores y Talento Humano pueden modificar roles
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={guardarPerfil}
                      disabled={loading}
                      sx={{ mt: 2, borderRadius: '8px' }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
                    </Button>
                  </Grid>
                </Grid>
              </>
            )}
          </Box>
        )}
      </StyledPaper>

      {/* Diálogo de reautenticación */}
      <Dialog open={dialogoReautenticacion} onClose={() => setDialogoReautenticacion(false)}>
        <DialogTitle>Verificación de seguridad</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Para continuar, por favor ingresa tu contraseña actual para verificar tu identidad.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Contraseña actual"
            type="password"
            fullWidth
            variant="outlined"
            value={reautenticacionPassword}
            onChange={(e) => setReautenticacionPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoReautenticacion(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleReautenticacion} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Verificar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Configuracion;