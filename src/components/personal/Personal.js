import React, { useState, useEffect } from 'react';
import { ref, get, remove } from 'firebase/database';
import { database, auth } from '../../firebase/config';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  puedeModificarTipoContrato, 
  puedeAsignarRoles,
  obtenerColorRol,
  TIPOS_CONTRATO,
  ROLES 
} from '../../utils/contratoUtils';
import { ref as dbRef, update } from 'firebase/database';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Avatar,
  Chip,
  FormControl,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Skeleton,
  InputAdornment,
  TextField,
  Fab,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)',
  [theme.breakpoints.up('md')]: {
    paddingBottom: theme.spacing(4),
  },
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, #00830e 0%, #006c0b 50%, #005a09 100%)',
  color: 'white',
  borderRadius: 24,
  padding: theme.spacing(3),
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
    padding: theme.spacing(2.5),
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  overflow: 'hidden',
}));

const SearchBar = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 16,
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    },
    '&.Mui-focused': {
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
}));

// Card para vista móvil
const UserCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: 'none',
  border: '1px solid rgba(0, 0, 0, 0.04)',
  width: '100%',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  '& th': {
    color: '#1e293b',
    fontWeight: 600,
    fontSize: '0.85rem',
    border: 0,
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    padding: theme.spacing(1.5, 2),
    whiteSpace: 'nowrap',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: alpha('#00830e', 0.04),
  },
  '& td': {
    padding: theme.spacing(1.5, 2),
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: 10,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const FloatingButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: 'calc(env(safe-area-inset-bottom) + 80px)',
  right: 20,
  background: 'linear-gradient(135deg, #00830e 0%, #006c0b 100%)',
  boxShadow: '0 6px 20px rgba(0, 131, 14, 0.4)',
  '&:hover': {
    background: 'linear-gradient(135deg, #006c0b 0%, #005a09 100%)',
  },
  [theme.breakpoints.up('md')]: {
    display: 'none',
  },
}));

const puedeAgregarUsuarios = (usuario) => {
  return puedeAsignarRoles(usuario); // Reutilizar la lógica de roles
};

// Solo Talento Humano puede eliminar usuarios
const puedeEliminarUsuarios = (usuario) => {
  return usuario?.departamento === 'Talento Humano' ||
         usuario?.rol === ROLES.ADMINISTRADOR;
};

const Personal = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogoEliminar, setDialogoEliminar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filtrar usuarios cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsuarios(usuarios);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredUsuarios(usuarios.filter(u => 
        u.nombre?.toLowerCase().includes(term) ||
        u.apellidos?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.departamento?.toLowerCase().includes(term) ||
        u.cargo?.toLowerCase().includes(term)
      ));
    }
  }, [searchTerm, usuarios]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/');
          return;
        }
        const userRef = ref(database, `usuarios/${user.uid}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        const userEmail = user.email || '';
        const userDataWithEmail = { ...userData, email: userData?.email || userEmail };
        setCurrentUser(userDataWithEmail);

        if (
          userDataWithEmail.rol !== ROLES.ADMINISTRADOR &&
          userDataWithEmail.departamento !== 'Talento Humano' &&
          userDataWithEmail.email !== 'admin@costaricacc.com'
        ) {
          toast.error('No tienes permisos para acceder a esta página');
          navigate('/dashboard');
          return;
        }

        const usuariosRef = ref(database, 'usuarios');
        const usuariosSnapshot = await get(usuariosRef);
        if (usuariosSnapshot.exists()) {
          const usuariosData = usuariosSnapshot.val();
          const usuariosArray = Object.entries(usuariosData).map(([id, data]) => ({
            id,
            ...data,
            tipoContrato: data.tipoContrato || 'Operativo', // Valor por defecto para usuarios existentes
            rol: data.rol || null // Valor por defecto para roles
          }));
          setUsuarios(usuariosArray);
        } else {
          setUsuarios([]);
        }
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        toast.error('Error al cargar usuarios: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, [navigate]);

  const handleEliminarClick = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setDialogoEliminar(true);
  };

  const cerrarDialogoEliminar = () => {
    setDialogoEliminar(false);
    setUsuarioSeleccionado(null);
  };

  const eliminarUsuario = async () => {
    if (!usuarioSeleccionado) return;
    try {
      await remove(ref(database, `usuarios/${usuarioSeleccionado.id}`));
      setUsuarios(usuarios.filter(u => u.id !== usuarioSeleccionado.id));
      toast.success('Usuario eliminado correctamente');
      cerrarDialogoEliminar();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error('Error al eliminar usuario: ' + error.message);
    }
  };

  const irARegistro = () => {
    navigate('/registro');
  };

  const irAEdicion = (usuario) => {
    navigate(`/configuracion?userId=${usuario.id}`);
  };

  const handleCambiarTipoContrato = async (usuarioId, nuevoTipo) => {
    if (!puedeModificarTipoContrato(currentUser)) {
      toast.error('Solo personal de Talento Humano puede modificar el tipo de contrato');
      return;
    }

    try {
      await update(dbRef(database, `usuarios/${usuarioId}`), {
        tipoContrato: nuevoTipo
      });
      
      // Actualizar el estado local
      setUsuarios(usuarios.map(u => 
        u.id === usuarioId ? { ...u, tipoContrato: nuevoTipo } : u
      ));
      
      toast.success(`Tipo de contrato actualizado a ${nuevoTipo}`);
    } catch (error) {
      console.error('Error al actualizar tipo de contrato:', error);
      toast.error('Error al actualizar tipo de contrato: ' + error.message);
    }
  };

  const handleCambiarRol = async (usuarioId, nuevoRol) => {
    if (!puedeAsignarRoles(currentUser)) {
      toast.error('No tienes permisos para asignar roles');
      return;
    }

    try {
      const updateData = nuevoRol === 'Sin rol' ? { rol: null } : { rol: nuevoRol };
      
      await update(dbRef(database, `usuarios/${usuarioId}`), updateData);
      
      // Actualizar el estado local
      setUsuarios(usuarios.map(u => 
        u.id === usuarioId ? { ...u, rol: nuevoRol === 'Sin rol' ? null : nuevoRol } : u
      ));
      
      toast.success(`Rol actualizado ${nuevoRol === 'Sin rol' ? 'removido' : 'a ' + nuevoRol}`);
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      toast.error('Error al actualizar rol: ' + error.message);
    }
  };

  // Mostrar loading mientras se cargan los datos
  if (loading || !currentUser) {
    return (
      <PageContainer>
        <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
          <Skeleton variant="rounded" height={140} sx={{ borderRadius: 5, mb: 3 }} />
          <Skeleton variant="rounded" height={60} sx={{ borderRadius: 4, mb: 2 }} />
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: 4, mb: 2 }} />
          ))}
        </Container>
      </PageContainer>
    );
  }

  // Vista móvil con cards
  const renderMobileView = () => (
    <Box>
      {filteredUsuarios.map((usuario) => (
        <UserCard key={usuario.id}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Avatar 
                sx={{ 
                  width: 50, 
                  height: 50, 
                  bgcolor: '#00830e',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                {usuario.nombre?.charAt(0)}{usuario.apellidos?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {usuario.nombre} {usuario.apellidos}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <EmailIcon sx={{ fontSize: 14, color: '#64748b' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {usuario.email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  <Chip 
                    icon={<BusinessIcon sx={{ fontSize: '14px !important' }} />}
                    label={usuario.departamento} 
                    size="small" 
                    sx={{ height: 24, fontSize: '0.7rem' }}
                  />
                  <Chip 
                    label={usuario.tipoContrato || 'Operativo'} 
                    size="small" 
                    color={usuario.tipoContrato === 'Confianza' ? 'success' : 'info'}
                    sx={{ height: 24, fontSize: '0.7rem' }}
                  />
                  {usuario.rol && (
                    <Chip 
                      label={usuario.rol} 
                      size="small" 
                      color={obtenerColorRol(usuario.rol)}
                      sx={{ height: 24, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <ActionButton 
                  onClick={() => irAEdicion(usuario)} 
                  sx={{ bgcolor: alpha('#00830e', 0.1), color: '#00830e' }}
                >
                  <EditIcon fontSize="small" />
                </ActionButton>
                {puedeEliminarUsuarios(currentUser) && (
                  <ActionButton 
                    onClick={() => handleEliminarClick(usuario)} 
                    sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </ActionButton>
                )}
              </Box>
            </Box>
          </CardContent>
        </UserCard>
      ))}
    </Box>
  );

  // Vista desktop con tabla
  const renderDesktopView = () => (
    <StyledTableContainer>
      <Table>
        <StyledTableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Departamento</TableCell>
            <TableCell>Cargo</TableCell>
            <TableCell>Contrato</TableCell>
            <TableCell>Rol</TableCell>
            <TableCell>Autorizaciones</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </StyledTableHead>
        <TableBody>
          {filteredUsuarios.map((usuario) => (
            <StyledTableRow key={usuario.id}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#00830e', fontSize: '0.85rem' }}>
                    {usuario.nombre?.charAt(0)}{usuario.apellidos?.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {usuario.nombre} {usuario.apellidos}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">{usuario.email}</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={usuario.departamento}
                  size="small"
                  sx={{ 
                    fontWeight: 500, 
                    bgcolor: alpha('#00830e', 0.1),
                    color: '#00830e',
                  }}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">{usuario.cargo}</Typography>
              </TableCell>
              <TableCell>
                {puedeModificarTipoContrato(currentUser) ? (
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={usuario.tipoContrato || 'Operativo'}
                      onChange={(e) => handleCambiarTipoContrato(usuario.id, e.target.value)}
                      sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 2,
                        '& .MuiSelect-select': { py: 0.75, fontSize: '0.8rem' }
                      }}
                    >
                      <MenuItem value={TIPOS_CONTRATO.OPERATIVO}>Operativo</MenuItem>
                      <MenuItem value={TIPOS_CONTRATO.CONFIANZA}>Confianza</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={usuario.tipoContrato || 'Operativo'}
                    color={usuario.tipoContrato === 'Confianza' ? 'success' : 'info'}
                    size="small"
                  />
                )}
              </TableCell>
              <TableCell>
                {puedeAsignarRoles(currentUser) ? (
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={usuario.rol || 'Sin rol'}
                      onChange={(e) => handleCambiarRol(usuario.id, e.target.value)}
                      sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 2,
                        '& .MuiSelect-select': { py: 0.75, fontSize: '0.8rem' }
                      }}
                    >
                      <MenuItem value="Sin rol">Sin rol</MenuItem>
                      <MenuItem value={ROLES.ADMINISTRADOR}>Admin</MenuItem>
                      <MenuItem value={ROLES.MODIFICADOR}>Modificador</MenuItem>
                      <MenuItem value={ROLES.VISOR}>Visor</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={usuario.rol || 'Sin rol'}
                    color={obtenerColorRol(usuario.rol)}
                    size="small"
                  />
                )}
              </TableCell>
              <TableCell>
                {usuario.departamento === 'Practicantes/Crosstraining' ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {usuario.departamentosAutorizados?.slice(0, 2).map(dep => (
                      <Chip
                        key={dep}
                        label={dep}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 22 }}
                      />
                    ))}
                    {(usuario.departamentosAutorizados?.length || 0) > 2 && (
                      <Chip
                        label={`+${usuario.departamentosAutorizados.length - 2}`}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 22 }}
                      />
                    )}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.secondary">—</Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                  <ActionButton 
                    onClick={() => irAEdicion(usuario)} 
                    sx={{ bgcolor: alpha('#00830e', 0.1), color: '#00830e' }}
                  >
                    <EditIcon fontSize="small" />
                  </ActionButton>
                  {puedeEliminarUsuarios(currentUser) && (
                    <ActionButton 
                      onClick={() => handleEliminarClick(usuario)} 
                      sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </ActionButton>
                  )}
                </Box>
              </TableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );

  return (
    <PageContainer>
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        {/* Header */}
        <HeaderCard elevation={0}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 3, 
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
              }}>
                <PeopleIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700 }}>
                  Gestión de Personal
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {usuarios.length} usuarios registrados
                </Typography>
              </Box>
            </Box>
            
            {!isMobile && puedeAgregarUsuarios(currentUser) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={irARegistro}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: 0,
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: 3,
                  px: 3,
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                    transform: 'translateY(-50%)',
                  },
                }}
              >
                Agregar Usuario
              </Button>
            )}
          </Box>
        </HeaderCard>

        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <SearchBar
            fullWidth
            placeholder="Buscar por nombre, email, departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Content */}
        <StyledCard>
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {filteredUsuarios.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <PeopleIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                <Typography color="text.secondary">
                  {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                </Typography>
              </Box>
            ) : isMobile ? (
              renderMobileView()
            ) : (
              renderDesktopView()
            )}
          </Box>
        </StyledCard>

        {/* FAB para móvil */}
        {puedeAgregarUsuarios(currentUser) && (
          <FloatingButton color="primary" onClick={irARegistro}>
            <AddIcon />
          </FloatingButton>
        )}
      </Container>

      {/* Dialog de eliminación */}
      <Dialog
        open={dialogoEliminar}
        onClose={cerrarDialogoEliminar}
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#ef4444' }}>
          ⚠️ Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar al usuario <strong>{usuarioSeleccionado?.nombre} {usuarioSeleccionado?.apellidos}</strong>?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={cerrarDialogoEliminar} sx={{ color: '#64748b', borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button 
            onClick={eliminarUsuario} 
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

export default Personal;