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
  Grid,
  Fade,
  InputAdornment,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BadgeIcon from '@mui/icons-material/Badge';
import { ref, get } from 'firebase/database';
import { puedeAsignarRoles, ROLES } from '../../utils/contratoUtils';
import { departamentos } from '../../utils/horariosConstants';

// Styled Components modernos
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #f8fafc 0%, #e8f5e9 50%, #f0f9ff 100%)',
  padding: theme.spacing(3),
  paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
}));

const RegisterCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: 24,
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0, 131, 14, 0.1)',
  maxWidth: 800,
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    background: 'linear-gradient(90deg, #00830e, #4caf50, #81c784)',
  },
  [theme.breakpoints.down('sm')]: {
    backdropFilter: 'none',
    background: '#ffffff',
    padding: theme.spacing(3),
    borderRadius: 20,
  },
}));

const Logo = styled('img')({
  width: 180,
  marginBottom: 24,
  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
});

const PageTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.75rem',
  color: '#1a1a2e',
  marginBottom: theme.spacing(0.5),
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.5rem',
  },
}));

const PageSubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(3),
  textAlign: 'center',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: '0 0 0 3px rgba(0, 131, 14, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: '0 0 0 3px rgba(0, 131, 14, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '14px 28px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 131, 14, 0.3)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

const BackButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  borderWidth: 2,
  '&:hover': {
    borderWidth: 2,
    transform: 'translateY(-2px)',
  },
}));

const SectionDivider = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  margin: theme.spacing(3, 0, 2),
  '& .line': {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(0, 131, 14, 0.2), transparent)',
  },
  '& .icon': {
    color: '#00830e',
    opacity: 0.6,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    cargo: '',
    departamento: '',
    tipoContrato: 'Operativo',
    rol: ROLES.VISOR,
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
      const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || auth.app.options.apiKey;
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
        const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://horarios-costaricacc-default-rtdb.firebaseio.com';
        
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
    <PageContainer>
      <Container maxWidth="md">
        <Fade in timeout={600}>
          <RegisterCard elevation={0}>
            <Logo 
              src="/costa-rica-logo.png" 
              alt="Costa Rica Centro de Convenciones" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            
            <PageTitle>
              Registro de Personal
            </PageTitle>
            <PageSubtitle variant="body2">
              Completa el formulario para crear una nueva cuenta
            </PageSubtitle>

            <Box component="form" onSubmit={handleRegister} sx={{ width: '100%' }}>
              {/* Sección: Información Personal */}
              <SectionDivider>
                <span className="line" />
                <PersonIcon className="icon" />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Información Personal
                </Typography>
                <span className="line" />
              </SectionDivider>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    name="nombre"
                    required
                    fullWidth
                    label="Nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    autoFocus
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    name="apellidos"
                    required
                    fullWidth
                    label="Apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <StyledTextField
                    name="email"
                    required
                    fullWidth
                    label="Correo Electrónico"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {/* Sección: Información Laboral */}
              <SectionDivider>
                <span className="line" />
                <WorkIcon className="icon" />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Información Laboral
                </Typography>
                <span className="line" />
              </SectionDivider>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    name="cargo"
                    required
                    fullWidth
                    label="Cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <WorkIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <StyledFormControl fullWidth required>
                    <InputLabel>Departamento</InputLabel>
                    <Select
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleChange}
                      label="Departamento"
                      startAdornment={
                        <InputAdornment position="start">
                          <BusinessIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      }
                    >
                      {departamentos.map((depto) => (
                        <MenuItem key={depto} value={depto}>
                          {depto}
                        </MenuItem>
                      ))}
                    </Select>
                  </StyledFormControl>
                </Grid>

                <Grid item xs={12}>
                  <StyledFormControl fullWidth>
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
                  </StyledFormControl>
                </Grid>

                {currentUserData && puedeAsignarRoles(currentUserData) && (
                  <Grid item xs={12}>
                    <StyledFormControl fullWidth>
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
                    </StyledFormControl>
                  </Grid>
                )}
              </Grid>

              {/* Sección: Seguridad */}
              <SectionDivider>
                <span className="line" />
                <LockIcon className="icon" />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  Seguridad
                </Typography>
                <span className="line" />
              </SectionDivider>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    name="password"
                    required
                    fullWidth
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    helperText="Mínimo 6 caracteres"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    name="confirmPassword"
                    required
                    fullWidth
                    label="Confirmar Contraseña"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {/* Botones de acción */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center', 
                mt: 4,
                flexDirection: { xs: 'column-reverse', sm: 'row' },
                alignItems: 'stretch'
              }}>
                <BackButton
                  onClick={volverAtras}
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  disabled={loading}
                  fullWidth={false}
                  sx={{ minWidth: { xs: '100%', sm: 140 } }}
                >
                  Volver
                </BackButton>
                
                <ActionButton
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 200 },
                    background: 'linear-gradient(135deg, #00830e 0%, #4caf50 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #006b0b 0%, #388e3c 100%)',
                    },
                  }}
                >
                  {loading ? 'Registrando...' : 'Registrar Usuario'}
                </ActionButton>
              </Box>
            </Box>
          </RegisterCard>
        </Fade>
      </Container>
    </PageContainer>
  );
};

export default Register;
