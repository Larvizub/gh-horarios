import React, { useState } from 'react';
import { auth, database } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Box, 
  Container, 
  CircularProgress, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ref, get } from 'firebase/database';
import { puedeAsignarRoles, ROLES } from '../../utils/contratoUtils';
import { departamentos } from '../../utils/horariosConstants';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
}));

const Logo = styled('img')({
  width: '200px',
  marginBottom: '24px'
});

const AnimatedButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
  },
}));

const rolesDisponibles = [
  { value: null, label: 'Sin rol' },
  { value: ROLES.ADMINISTRADOR, label: 'Administrador' },
  { value: ROLES.MODIFICADOR, label: 'Modificador' }, 
  { value: ROLES.VISOR, label: 'Visor' }
];

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    cargo: '',
    departamento: '',
    tipoContrato: 'Operativo',
    rol: ROLES.VISOR, // Rol por defecto según contrato Operativo
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  // Cargar datos del usuario actual para verificar permisos (solo si está logueado)
  React.useEffect(() => {
    const cargarUsuarioActual = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userRef = ref(database, `usuarios/${user.uid}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            setCurrentUserData({ ...userData, email: user.email });
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario actual:', error);
      }
    };

    cargarUsuarioActual();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'tipoContrato') {
      // Asignar rol según tipo de contrato
      setFormData(prev => ({
        ...prev,
        tipoContrato: value,
        rol: value === 'Confianza' ? ROLES.MODIFICADOR : ROLES.VISOR
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    let { nombre, apellidos, email, cargo, departamento, tipoContrato, rol, password, confirmPassword } = formData;

    // Validaciones básicas
    if (!nombre || !apellidos || !email || !cargo || !departamento || !password || !confirmPassword) {
      toast.error('Por favor completa todos los campos obligatorios');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Verificar si ya existe un usuario con ese email
      const usuariosRef = ref(database, 'usuarios');
      const usuariosSnapshot = await get(usuariosRef);
      let usuarioExistente = false;
      
      if (usuariosSnapshot.exists()) {
        const usuariosData = usuariosSnapshot.val();
        for (const userObj of Object.values(usuariosData)) {
          if (userObj && userObj.email && userObj.email.toLowerCase() === email.toLowerCase()) {
            usuarioExistente = true;
            break;
          }
        }
      }
      
      if (usuarioExistente) {
        toast.error('Ya existe un usuario con este correo electrónico');
        setLoading(false);
        return;
      }

      // Crear usuario en Firebase Auth usando la REST API
      const apiKey = process.env.REACT_APP_FIREBASE_API_KEY || auth.app.options.apiKey;
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
      
      console.log('Enviando solicitud a Firebase Auth...');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        let errorMessage = 'Error al crear usuario en Firebase';
        
        // Manejo de errores específicos de Firebase
        if (data.error?.message) {
          switch (data.error.message) {
            case 'EMAIL_EXISTS':
              errorMessage = 'Ya existe una cuenta con este correo electrónico';
              break;
            case 'INVALID_EMAIL':
              errorMessage = 'El formato del correo electrónico no es válido';
              break;
            case 'WEAK_PASSWORD':
              errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres';
              break;
            default:
              errorMessage = data.error.message;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Obtenemos el ID del usuario directamente de la respuesta
      const newUserUid = data.localId;
      if (!newUserUid) {
        throw new Error('No se pudo obtener el ID del usuario creado');
      }
      
      console.log('Usuario creado en Auth, guardando datos en Database...');
      
      // Guardar datos del usuario en la base de datos
      try {
        // Obtener la URL de la base de datos desde la configuración
        const databaseURL = process.env.REACT_APP_FIREBASE_DATABASE_URL || 'https://horarios-costaricacc-default-rtdb.firebaseio.com';
        
        // Estrategia 1: Intentar escribir sin autenticación (para registros públicos)
        let writeSuccess = false;
        
        try {
          const writeResponse = await fetch(
            `${databaseURL}/usuarios/${newUserUid}.json`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nombre,
                apellidos,
                email,
                cargo,
                departamento,
                tipoContrato,
                rol: rol || null,
                createdAt: new Date().toISOString(),
                debeCambiarPassword: true
              })
            }
          );
          
          if (writeResponse.ok) {
            writeSuccess = true;
            console.log('Datos de usuario guardados exitosamente sin token');
          }
        } catch (error) {
          console.log('Escritura sin token falló, intentando con token temporal...');
        }
        
        // Estrategia 2: Si la escritura sin token falló, intentar con token temporal
        if (!writeSuccess) {
          // Hacer login temporal con el usuario recién creado
          const tempAuth = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password,
              returnSecureToken: true
            })
          });
          
          if (!tempAuth.ok) {
            const tempError = await tempAuth.json();
            throw new Error(`Error en autenticación temporal: ${tempError.error?.message || 'Error desconocido'}`);
          }
          
          const tempData = await tempAuth.json();
          const tempUserAuth = tempData.idToken;
          
          // Hacer la escritura usando la REST API con el token del usuario
          const writeResponse = await fetch(
            `${databaseURL}/usuarios/${newUserUid}.json?auth=${tempUserAuth}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                nombre,
                apellidos,
                email,
                cargo,
                departamento,
                tipoContrato,
                rol: rol || null,
                createdAt: new Date().toISOString(),
                debeCambiarPassword: true
              })
            }
          );
          
          if (!writeResponse.ok) {
            const errorData = await writeResponse.json();
            throw new Error(`No se pudieron guardar los datos del usuario: ${errorData.error || writeResponse.statusText}`);
          }
          
          console.log('Datos de usuario guardados exitosamente usando autenticación temporal');
        }
        
      } catch (altError) {
        console.error('Error al guardar datos del usuario:', altError);
        throw new Error(`Error al guardar datos del usuario: ${altError.message}`);
      }

      toast.success('Usuario registrado exitosamente. El usuario puede iniciar sesión ahora.');
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        apellidos: '',
        email: '',
        cargo: '',
        departamento: '',
        tipoContrato: 'Operativo',
        rol: null,
        password: '',
        confirmPassword: ''
      });

      // Si hay un usuario logueado (admin), redirigir a personal
      if (auth.currentUser) {
        navigate('/personal');
      } else {
        // Si no hay usuario logueado, redirigir al login
        toast.success('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
        navigate('/');
      }

    } catch (error) {
      console.error('Error al registrar usuario:', error.message);
      toast.error('Error al registrar usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const volverAtras = () => {
    if (auth.currentUser) {
      navigate('/personal');
    } else {
      navigate('/');
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <StyledPaper elevation={6}>
          <Logo 
            src="/costa-rica-logo.png" 
            alt="Costa Rica Centro de Convenciones" 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          
          <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
            Registro de Personal
          </Typography>

          <Box component="form" onSubmit={handleRegister} sx={{ width: '100%' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="nombre"
                  required
                  fullWidth
                  label="Nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  autoFocus
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="apellidos"
                  required
                  fullWidth
                  label="Apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="email"
                  required
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="cargo"
                  required
                  fullWidth
                  label="Cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleChange}
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

              {/* Tipo de Contrato - Ancho completo */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Contrato</InputLabel>
                  <Select
                    name="tipoContrato"
                    value={formData.tipoContrato}
                    onChange={handleChange}
                    label="Tipo de Contrato"
                  >
                    <MenuItem value="Operativo">Operativo</MenuItem>
                    <MenuItem value="Confianza">Confianza</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Solo mostrar rol si el usuario actual puede asignar roles (registro interno). Si es público, no mostrar el selector y se asigna Visor automáticamente. */}
              {currentUserData && puedeAsignarRoles(currentUserData) && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Rol en el Sistema</InputLabel>
                    <Select
                      name="rol"
                      value={formData.rol || ''}
                      onChange={handleChange}
                      label="Rol en el Sistema"
                    >
                      {rolesDisponibles.map((rol) => (
                        <MenuItem key={rol.value || 'sin-rol'} value={rol.value || ''}>
                          {rol.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Campos de contraseña uno al lado del otro */}
              <Grid item xs={12} sm={6}>
                <TextField
                  name="password"
                  required
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  helperText="Mínimo 6 caracteres"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="confirmPassword"
                  required
                  fullWidth
                  label="Confirmar Contraseña"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  justifyContent: 'center', 
                  mt: 3,
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center'
                }}>
                  <Button
                    onClick={volverAtras}
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    disabled={loading}
                    sx={{ 
                      minWidth: { xs: '100%', sm: '140px' },
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    Volver
                  </Button>
                  
                  <AnimatedButton
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                    sx={{ 
                      minWidth: { xs: '100%', sm: '200px' },
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Registrando...' : 'Registrar Usuario'}
                  </AnimatedButton>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </StyledPaper>
      </Box>
    </Container>
  );
};

export default Register;
