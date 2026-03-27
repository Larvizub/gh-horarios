import React, { useEffect, useMemo, useState } from 'react';
import { ref, update } from 'firebase/database';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import WorkIcon from '@mui/icons-material/Work';
import { database, auth } from '../../firebase/config';
import { notify as toast } from '../../services/notify';
import { puedeModificarTipoContrato } from '../../utils/contratoUtils';
import useDepartamentos from '../../hooks/useDepartamentos';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 24,
    width: 'min(760px, calc(100vw - 24px))',
    overflow: 'hidden',
  },
  [theme.breakpoints.down('sm')]: {
    '& .MuiDialog-paper': {
      margin: 12,
      width: 'calc(100vw - 24px)',
    },
  },
}));

const Header = styled(Box)(() => ({
  padding: '20px 24px',
  background: 'linear-gradient(135deg, #00830e 0%, #006c0b 50%, #005a09 100%)',
  color: '#ffffff',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.14), transparent 35%)',
    pointerEvents: 'none',
  },
}));

const SectionTitle = styled(Typography)(() => ({
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 16,
}));

const PrimaryButton = styled(Button)(() => ({
  borderRadius: 14,
  background: 'linear-gradient(135deg, #00830e 0%, #0a8f10 100%)',
  boxShadow: '0 8px 20px rgba(0, 131, 14, 0.28)',
  textTransform: 'none',
  fontWeight: 700,
  paddingInline: 20,
  minHeight: 48,
  color: '#ffffff',
  '&:hover': {
    background: 'linear-gradient(135deg, #006c0b 0%, #00830e 100%)',
    boxShadow: '0 10px 24px rgba(0, 131, 14, 0.34)',
  },
}));

const StyledTextField = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 14,
    background: '#ffffff',
  },
  '& .MuiInputLabel-root': {
    color: '#64748b',
  },
}));

const StyledSelect = styled(Select)(() => ({
  borderRadius: 14,
  background: '#ffffff',
}));

const UserAvatar = styled(Avatar)(() => ({
  background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.85) 100%)',
  color: '#00830e',
  fontWeight: 800,
  border: '2px solid rgba(255,255,255,0.35)',
}));

const UserAccountDialog = ({ open, onClose, user, userData }) => {
  const { departamentosActivos } = useDepartamentos();
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [reautenticacionPassword, setReautenticacionPassword] = useState('');
  const [accionPendiente, setAccionPendiente] = useState(null);
  const [dialogoReautenticacion, setDialogoReautenticacion] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    cargo: '',
    departamento: '',
    tipoContrato: 'Operativo',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (open) {
      setTabIndex(0);
      setError('');
      setShowPasswords({ current: false, new: false, confirm: false });
      setReautenticacionPassword('');
      setAccionPendiente(null);
      setDialogoReautenticacion(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFormData({
        nombre: userData?.nombre || '',
        apellidos: userData?.apellidos || '',
        email: userData?.email || user?.email || '',
        cargo: userData?.cargo || '',
        departamento: userData?.departamento || '',
        tipoContrato: userData?.tipoContrato || 'Operativo',
      });
    }
  }, [open, user, userData]);

  const getUserInitials = useMemo(() => {
    const nombre = userData?.nombre?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';
    const apellido = userData?.apellidos?.charAt(0)?.toUpperCase() || '';
    return `${nombre}${apellido}`;
  }, [userData, user]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const guardarPerfil = async () => {
    try {
      setLoading(true);
      setError('');

      const userRef = ref(database, `usuarios/${user.uid}`);
      const updateData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        cargo: formData.cargo,
        departamento: formData.departamento,
      };

      if (puedeModificarTipoContrato(userData)) {
        updateData.tipoContrato = formData.tipoContrato;
      }

      await update(userRef, updateData);

      if (formData.email !== (userData?.email || user?.email)) {
        setAccionPendiente('email');
        setDialogoReautenticacion(true);
        return;
      }

      toast.success('Perfil actualizado correctamente');
      onClose();
    } catch (saveError) {
      console.error('Error al actualizar perfil:', saveError);
      setError('Error al actualizar perfil: ' + saveError.message);
      toast.error('Error al actualizar perfil: ' + saveError.message);
    } finally {
      setLoading(false);
    }
  };

  const cambiarContrasena = async () => {
    const { newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setAccionPendiente('password');
    setDialogoReautenticacion(true);
  };

  const handleReautenticacion = async () => {
    try {
      setLoading(true);
      setError('');

      const credential = EmailAuthProvider.credential(user.email, reautenticacionPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      if (accionPendiente === 'email') {
        await updateEmail(auth.currentUser, formData.email);
        await update(ref(database, `usuarios/${user.uid}`), { email: formData.email });
        toast.success('Email actualizado correctamente');
      } else if (accionPendiente === 'password') {
        await updatePassword(auth.currentUser, passwordData.newPassword);
        toast.success('Contraseña actualizada correctamente');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }

      setDialogoReautenticacion(false);
      setReautenticacionPassword('');
      setAccionPendiente(null);
      onClose();
    } catch (reauthError) {
      console.error('Error en la reautenticación:', reauthError);
      setError('Error en la reautenticación: ' + reauthError.message);
      toast.error('Error en la reautenticación: ' + reauthError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Header>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <UserAvatar sx={{ width: 64, height: 64, fontSize: '1.25rem' }}>
            {getUserInitials}
          </UserAvatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }} noWrap>
              {userData?.nombre || 'Usuario'} {userData?.apellidos || ''}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.92 }} noWrap>
              {userData?.cargo || user?.email || 'Acceso'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.86 }} noWrap>
              {userData?.departamento || 'Departamento no disponible'}
            </Typography>
            {userData?.rol && (
              <Box sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.75, bgcolor: 'rgba(255,255,255,0.16)', px: 1.25, py: 0.5, borderRadius: 2 }}>
                <SecurityIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {userData.rol}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Header>

      <DialogTitle sx={{ pb: 0 }}>
        <Tabs value={tabIndex} onChange={(_, value) => setTabIndex(value)} sx={{ minHeight: 48 }}>
          <Tab icon={<PersonIcon />} iconPosition="start" label="Perfil" />
          <Tab icon={<LockIcon />} iconPosition="start" label="Contraseña" />
        </Tabs>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

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
                  onChange={handleFormChange}
                  helperText="El correo electrónico se valida al guardar"
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
                  <StyledSelect name="departamento" value={formData.departamento} onChange={handleFormChange} label="Departamento">
                    {departamentosActivos.map((depto) => (
                      <MenuItem key={depto} value={depto}>
                        {depto}
                      </MenuItem>
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
                <PrimaryButton startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} onClick={guardarPerfil} disabled={loading}>
                  Guardar Cambios
                </PrimaryButton>
              </Grid>
            </Grid>
          </Box>
        )}

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
                        <IconButton onClick={() => setShowPasswords((state) => ({ ...state, current: !state.current }))} edge="end">
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
                        <IconButton onClick={() => setShowPasswords((state) => ({ ...state, new: !state.new }))} edge="end">
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
                        <IconButton onClick={() => setShowPasswords((state) => ({ ...state, confirm: !state.confirm }))} edge="end">
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
                <PrimaryButton startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockIcon />} onClick={cambiarContrasena} disabled={loading}>
                  Cambiar Contraseña
                </PrimaryButton>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: '#64748b', borderRadius: 2, textTransform: 'none' }}>
          Cerrar
        </Button>
      </DialogActions>

      <Dialog open={dialogoReautenticacion} onClose={() => setDialogoReautenticacion(false)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>🔒 Verificación de seguridad</DialogTitle>
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
            onChange={(event) => setReautenticacionPassword(event.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogoReautenticacion(false)} sx={{ color: '#64748b', borderRadius: 2, textTransform: 'none' }}>
            Cancelar
          </Button>
          <PrimaryButton onClick={handleReautenticacion} disabled={loading}>
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Verificar'}
          </PrimaryButton>
        </DialogActions>
      </Dialog>
    </StyledDialog>
  );
};

export default UserAccountDialog;
