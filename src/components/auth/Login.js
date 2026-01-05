import React, { useState } from 'react';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { auth, database } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Box,
  CircularProgress, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { ref, get, update } from 'firebase/database';

// Contenedor principal con fondo moderno
const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #f8fafc 0%, #e8f5e9 50%, #c8e6c9 100%)',
  position: 'relative',
  overflow: 'hidden',
  padding: theme.spacing(2),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-20%',
    width: '70%',
    height: '100%',
    background: 'radial-gradient(circle, rgba(0, 131, 14, 0.08) 0%, transparent 70%)',
    borderRadius: '50%',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-30%',
    left: '-10%',
    width: '50%',
    height: '80%',
    background: 'radial-gradient(circle, rgba(0, 131, 14, 0.05) 0%, transparent 70%)',
    borderRadius: '50%',
  },
}));

// Card de login con glassmorphism
const LoginCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: 28,
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  position: 'relative',
  zIndex: 1,
  maxWidth: 440,
  width: '100%',
  [theme.breakpoints.down('sm')]: {
    backdropFilter: 'none',
    background: '#ffffff',
    padding: theme.spacing(3.5),
    borderRadius: 24,
    margin: theme.spacing(1),
  },
}));

// Logo con animación sutil
const Logo = styled('img')({
  width: 180,
  marginBottom: 32,
  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
});

// Input estilizado
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 14,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(248, 250, 252, 1)',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 3px rgba(0, 131, 14, 0.1)',
    },
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.08)',
      borderWidth: 1.5,
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

// Botón principal con gradiente
const PrimaryButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.75),
  borderRadius: 14,
  background: 'linear-gradient(135deg, #00830e 0%, #006c0b 100%)',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 4px 14px rgba(0, 131, 14, 0.35)',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'linear-gradient(135deg, #006c0b 0%, #005a09 100%)',
    boxShadow: '0 6px 20px rgba(0, 131, 14, 0.45)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    background: 'rgba(0, 0, 0, 0.12)',
    boxShadow: 'none',
  },
}));

// Botón secundario
const SecondaryButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: 14,
  borderColor: 'rgba(0, 131, 14, 0.3)',
  borderWidth: 1.5,
  color: '#00830e',
  fontWeight: 500,
  textTransform: 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: '#00830e',
    borderWidth: 1.5,
    backgroundColor: alpha('#00830e', 0.04),
    transform: 'translateY(-1px)',
  },
}));

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [openInstructions, setOpenInstructions] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setCurrentUser(user);

      // Verificar si debe cambiar contraseña
      const userRef = ref(database, `usuarios/${user.uid}`);
      const userSnapshot = await get(userRef);
      let debeCambiarPassword = false;
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        debeCambiarPassword = userData.debeCambiarPassword;
      }

      if (debeCambiarPassword) {
        setOpenChangePassword(true);
        setLoading(false);
        return;
      }

      toast.success('¡Bienvenido de vuelta!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      toast.error('Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    try {
      if (newPassword !== confirmNewPassword) {
        toast.error('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        setLoading(false);
        return;
      }

      await updatePassword(currentUser, newPassword);
      const userRef = ref(database, `usuarios/${currentUser.uid}`);
      await update(userRef, { debeCambiarPassword: false });
      
      toast.success('Contraseña actualizada exitosamente');
      setOpenChangePassword(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast.error('Error al cambiar contraseña: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPasswordChange = () => {
    setOpenChangePassword(false);
    navigate('/dashboard');
  };

  return (
    <LoginContainer>
      <LoginCard elevation={0}>
        <Logo
          src="https://costaricacc.com/cccr/Logocccr.png"
          alt="Logo Centro de Convenciones"
        />
        
        <Typography 
          component="h1" 
          variant="h4" 
          sx={{ 
            mb: 1, 
            color: '#1a1a2e', 
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          ¡Bienvenido!
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4, 
            color: '#64748b',
            textAlign: 'center',
          }}
        >
          Ingresa tus credenciales para continuar
        </Typography>

        <Box 
          component="form" 
          onSubmit={handleLogin} 
          sx={{ width: '100%' }}
        >
          <StyledTextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo Electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
          />
          
          <StyledTextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: '#64748b' }}
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <PrimaryButton
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            startIcon={loading ? null : <LockOpenIcon />}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Iniciar Sesión'
            )}
          </PrimaryButton>

          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexDirection: isMobile ? 'column' : 'row' }}>
            <SecondaryButton
              fullWidth
              variant="outlined"
              onClick={() => navigate('/registro')}
              startIcon={<PersonAddIcon />}
            >
              Crear Usuario
            </SecondaryButton>

            <SecondaryButton
              fullWidth
              variant="outlined"
              onClick={() => setOpenInstructions(true)}
              startIcon={<HelpOutlineIcon />}
            >
              Ayuda
            </SecondaryButton>
          </Box>
        </Box>
      </LoginCard>

      {/* Texto inferior */}
      <Typography 
        variant="caption" 
        sx={{ 
          mt: 4, 
          color: '#94a3b8',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Centro de Convenciones de Costa Rica © {new Date().getFullYear()}
      </Typography>

      {/* Modal para cambiar contraseña */}
      <Dialog
        open={openChangePassword}
        onClose={() => {}}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          🔐 Cambio de Contraseña
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Por seguridad, debes cambiar tu contraseña inicial. Por favor, introduce una nueva contraseña de al menos 6 caracteres.
          </DialogContentText>
          <StyledTextField
            autoFocus
            margin="dense"
            label="Nueva Contraseña"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <StyledTextField
            margin="dense"
            label="Confirmar Nueva Contraseña"
            type="password"
            fullWidth
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleSkipPasswordChange} sx={{ color: '#64748b' }}>
            Omitir
          </Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Cambiar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Instrucciones */}
      <Dialog
        open={openInstructions}
        onClose={() => setOpenInstructions(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          📖 Guía de Uso de la Plataforma
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Box sx={{ '& > *': { mb: 3 } }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#00830e', fontWeight: 600, mb: 1 }}>
                1. Inicio de Sesión
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ingresa tu correo electrónico y contraseña proporcionados. Si es tu primer inicio de sesión, el sistema te pedirá que cambies tu contraseña.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ color: '#00830e', fontWeight: 600, mb: 1 }}>
                2. Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Al iniciar sesión, verás el Dashboard con un resumen de tu información, horas trabajadas y estadísticas relevantes.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ color: '#00830e', fontWeight: 600, mb: 1 }}>
                3. Módulo de Horarios
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aquí puedes ver y gestionar los horarios de tu departamento. Haz clic en "Editar Horarios" para hacer cambios y no olvides "Guardar Horarios" al finalizar.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ color: '#00830e', fontWeight: 600, mb: 1 }}>
                4. Consulta de Horarios
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visualiza los horarios de todos los colaboradores. Usa los filtros por semana, departamento o busca un colaborador específico.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ color: '#00830e', fontWeight: 600, mb: 1 }}>
                5. Módulo de Personal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Si tienes los permisos necesarios, aquí podrás gestionar usuarios: agregar, editar información o eliminar colaboradores.
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ color: '#00830e', fontWeight: 600, mb: 1 }}>
                6. Configuración
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accede a tu perfil haciendo clic en tu avatar en la esquina superior derecha. Desde ahí puedes actualizar tu información y cambiar tu contraseña.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenInstructions(false)} 
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </LoginContainer>
  );
};

export default Login;