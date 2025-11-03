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
  Container, 
  CircularProgress, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { ref, get, update } from 'firebase/database';

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
  backgroundColor: 'var(--primary-color)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: '#006c0b',
    transform: 'translateY(-3px)',
    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)'
  },
  '&:hover .MuiSvgIcon-root': {
    animation: 'pulse 1s infinite'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '5px',
    height: '5px',
    background: 'rgba(255, 255, 255, 0.5)',
    opacity: 0,
    borderRadius: '100%',
    transform: 'scale(1, 1) translate(-50%)',
    transformOrigin: '50% 50%'
  },
  '&:focus:not(:active)::after': {
    animation: 'ripple 1s ease-out'
  }
}));

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        // Mostrar diálogo para cambiar contraseña
        setOpenChangePassword(true);
        setLoading(false);
        return;
      }

      toast.success('Inicio de sesión exitoso');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
      toast.error('Error al iniciar sesión: ' + error.message);
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
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <StyledPaper elevation={6}>
          <Logo
            src="https://costaricacc.com/cccr/Logocccr.png"
            alt="Logo Centro de Convenciones"
          />
          <Typography component="h1" variant="h4" sx={{ mb: 3, color: 'var(--primary-color)', fontWeight: 'bold' }}>
            Iniciar Sesión
          </Typography>
          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
            <TextField
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
              variant="outlined"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
            />
            <AnimatedButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={<LockOpenIcon />}
            >
              {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </AnimatedButton>

            {/* Botón para crear usuario */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/registro')}
              sx={{ 
                mt: 2, 
                borderRadius: '8px',
                borderColor: 'var(--primary-color)',
                color: 'var(--primary-color)',
                '&:hover': {
                  borderColor: '#006c0b',
                  bgcolor: 'rgba(0, 108, 11, 0.04)'
                }
              }}
              startIcon={<PersonAddIcon />}
            >
              Crear Usuario
            </Button>

            {/* Botón para instrucciones */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setOpenInstructions(true)}
              sx={{ 
                mt: 1, 
                borderRadius: '8px',
                borderColor: 'var(--primary-color)',
                color: 'var(--primary-color)',
                '&:hover': {
                  borderColor: '#006c0b',
                  bgcolor: 'rgba(0, 108, 11, 0.04)'
                }
              }}
              startIcon={<HelpOutlineIcon />}
            >
              Instrucciones de Uso
            </Button>
          </Box>
        </StyledPaper>
      </Box>

      {/* Modal para cambiar contraseña */}
      <Dialog
        open={openChangePassword}
        onClose={() => {}}
        aria-labelledby="change-password-dialog-title"
      >
        <DialogTitle id="change-password-dialog-title">
          Cambio de Contraseña
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Por seguridad, debes cambiar tu contraseña inicial. Por favor, introduce una nueva contraseña de al menos 6 caracteres.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Nueva Contraseña"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            variant="outlined"
          />
          <TextField
            margin="dense"
            label="Confirmar Nueva Contraseña"
            type="password"
            fullWidth
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSkipPasswordChange} color="primary">
            Omitir por ahora
          </Button>
          <Button 
            onClick={handleChangePassword} 
            color="primary"
            disabled={loading}
            variant="contained"
          >
            {loading ? <CircularProgress size={24} /> : 'Cambiar Contraseña'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Instrucciones */}
      <Dialog
        open={openInstructions}
        onClose={() => setOpenInstructions(false)}
        aria-labelledby="instructions-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="instructions-dialog-title">
          Guía de Uso de la Plataforma de Horarios
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom variant="h6">1. Inicio de Sesión</Typography>
          <DialogContentText component="div" paragraph>
            - Ingresa tu correo electrónico y contraseña proporcionados.
            <br />
            - Si es tu primer inicio de sesión, el sistema te pedirá que cambies tu contraseña por una nueva y segura.
          </DialogContentText>

          <Typography gutterBottom variant="h6">2. Dashboard</Typography>
          <DialogContentText component="div" paragraph>
            - Al iniciar sesión, verás el Dashboard, que te muestra un resumen de tu información, horas trabajadas en la semana y otras estadísticas relevantes.
          </DialogContentText>

          <Typography gutterBottom variant="h6">3. Módulo de Horarios</Typography>
          <DialogContentText component="div" paragraph>
            - Aquí puedes ver y gestionar los horarios de tu departamento.
            <br />
            - Para hacer cambios, haz clic en el botón "Editar Horarios".
            <br />
            - Haz clic en una casilla de día/usuario para asignar o cambiar un turno (presencial, teletrabajo, descanso, etc.).
            <br />
            - Una vez finalizados los cambios, no olvides hacer clic en "Guardar Horarios".
          </DialogContentText>

          <Typography gutterBottom variant="h6">4. Módulo de Consulta de Horarios</Typography>
          <DialogContentText component="div" paragraph>
            - Esta sección te permite visualizar los horarios de todos los colaboradores de la empresa.
            <br />
            - Puedes usar los filtros por semana, departamento o buscar un colaborador específico para encontrar la información que necesitas.
          </DialogContentText>

          <Typography gutterBottom variant="h6">5. Módulo de Personal (Administradores y Talento Humano)</Typography>
          <DialogContentText component="div" paragraph>
            - Si tienes los permisos necesarios, aquí podrás gestionar a los usuarios del sistema. Puedes agregar nuevos usuarios, editar su información (nombre, cargo, departamento, rol) y eliminarlos.
          </DialogContentText>

          <Typography gutterBottom variant="h6">6. Configuración</Typography>
          <DialogContentText component="div" paragraph>
            - En la esquina superior derecha, al hacer clic en tu avatar, puedes acceder a tu "Perfil". Desde aquí puedes actualizar tu información personal y cambiar tu contraseña en cualquier momento.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInstructions(false)} color="primary" variant="contained">
            Entendido
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;