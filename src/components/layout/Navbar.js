import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, database } from '../../firebase/config';
import { ref, get } from 'firebase/database';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { puedeAccederPersonal, puedeVerHorarios } from '../../utils/contratoUtils';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Button,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Fade,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Styled AppBar con glassmorphism
const GlassAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #00830e 0%, #006c0b 100%)',
  backdropFilter: 'blur(10px)',
  [theme.breakpoints.down('md')]: {
    backdropFilter: 'none',
  },
  boxShadow: '0 4px 30px rgba(0, 131, 14, 0.15)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}));

// Botón de navegación moderno
const NavButton = styled(Button)(({ theme, active }) => ({
  color: 'rgba(255, 255, 255, 0.9)',
  margin: theme.spacing(0, 0.5),
  padding: theme.spacing(1, 2),
  borderRadius: 12,
  fontSize: '0.875rem',
  fontWeight: 500,
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.1)',
    opacity: 0,
    transition: 'opacity 0.25s ease',
    borderRadius: 12,
  },
  '&:hover': {
    color: '#ffffff',
    transform: 'translateY(-2px)',
    '&::before': {
      opacity: 1,
    },
  },
  ...(active && {
    color: '#ffffff',
    background: 'rgba(255, 255, 255, 0.15)',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 4,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 24,
      height: 3,
      backgroundColor: '#ffffff',
      borderRadius: 3,
    },
  }),
  '& .MuiButton-startIcon': {
    marginRight: 6,
  },
}));

// Drawer moderno para móvil
const MobileDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 300,
    maxWidth: '85vw',
    background: '#ffffff',
    borderRadius: '0 16px 16px 0',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    border: 'none',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  },
}));

// Item del drawer mejorado
const DrawerListItem = styled(ListItem)(({ theme, active }) => ({
  margin: theme.spacing(0.5, 1.5),
  padding: theme.spacing(1.5, 2),
  borderRadius: 14,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  willChange: 'background-color',
  ...(active && {
    background: alpha('#00830e', 0.1),
    '& .MuiListItemIcon-root': {
      color: '#00830e',
    },
    '& .MuiListItemText-primary': {
      color: '#00830e',
      fontWeight: 600,
    },
  }),
  '&:hover': {
    background: alpha('#00830e', 0.08),
  },
  '&:active': {
    background: alpha('#00830e', 0.12),
  },
  '& .MuiListItemIcon-root': {
    minWidth: 44,
    color: active ? '#00830e' : '#64748b',
  },
}));

// Avatar estilizado
const StyledAvatar = styled(Avatar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e9 100%)',
  color: '#00830e',
  fontWeight: 700,
  border: '2px solid rgba(255, 255, 255, 0.5)',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
  },
}));

// Menu de usuario mejorado
const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 16,
    marginTop: 12,
    minWidth: 200,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    '& .MuiMenuItem-root': {
      padding: theme.spacing(1.5, 2),
      borderRadius: 10,
      margin: theme.spacing(0.5, 1),
      transition: 'all 0.15s ease',
      '&:hover': {
        background: alpha('#00830e', 0.08),
      },
    },
  },
}));

const menuItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Horarios', icon: <EventNoteIcon />, path: '/horarios' },
  { label: 'Consulta', icon: <HistoryIcon />, path: '/consulta-horarios' },
  { label: 'Personal', icon: <PersonIcon />, path: '/personal' },
];

const Navbar = memo(({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Flag para prevenir actualizaciones después de desmontar
  const mountedRef = React.useRef(true);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cargar datos del usuario para verificar permisos
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (user && mountedRef.current) {
        try {
          const userRef = ref(database, `usuarios/${user.uid}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists() && mountedRef.current) {
            const userDataFromDB = userSnapshot.val();
            setUserData({ ...userDataFromDB, email: user.email });
          }
        } catch (error) {
          console.error('Error al cargar datos del usuario:', error);
        }
      }
    };

    cargarDatosUsuario();
  }, [user]);
  
  // Cerrar drawer al cambiar de ruta para evitar problemas en móviles
  useEffect(() => {
    if (drawerOpen) {
      setDrawerOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Filtrar elementos del menú basándose en permisos
  const menuItemsFiltrados = React.useMemo(() => {
    return menuItems.filter(item => {
      switch (item.path) {
        case '/personal':
          return userData && puedeAccederPersonal(userData);
        case '/horarios':
        case '/consulta-horarios':
          return userData && puedeVerHorarios(userData);
        default:
          return true;
      }
    });
  }, [userData]);

  const handleOpenUserMenu = useCallback((event) => {
    setAnchorElUser(event.currentTarget);
  }, []);

  // Mantener la referencia estable para useEffect
  const handleCloseUserMenu = useCallback(() => {
    setAnchorElUser(null);
  }, []);

  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión: ' + error.message);
    }
  }, [logout, navigate]);

  const handleNavigateToProfile = useCallback(() => {
    handleCloseUserMenu();
    navigate('/configuracion');
  }, [handleCloseUserMenu, navigate]);

  const getUserInitials = useCallback(() => {
    if (userData?.nombre) {
      const nombre = userData.nombre.charAt(0).toUpperCase();
      const apellido = userData.apellidos ? userData.apellidos.charAt(0).toUpperCase() : '';
      return `${nombre}${apellido}`;
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  }, [userData, user]);

  const isPathActive = (path) => location.pathname === path;

  // Ejemplo de estado típico:
  // const [anchorUser, setAnchorUser] = useState(null);
  // const handleUserMenuOpen = (e) => setAnchorUser(e.currentTarget);
  // const handleUserMenuClose = () => setAnchorUser(null);

  // Cerrar el menú de usuario cuando cambia la ruta (soluciona el bug del menú flotante)
  useEffect(() => {
    // Cerrar inmediatamente el menú y el drawer cuando cambia la ubicación
    setAnchorElUser(null);
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Escucha el evento global 'closeUserMenu' y cierra correctamente el menú de usuario
    const onCloseUserMenu = () => {
      handleCloseUserMenu();
    };

    window.addEventListener('closeUserMenu', onCloseUserMenu);
    return () => window.removeEventListener('closeUserMenu', onCloseUserMenu);
  }, [handleCloseUserMenu]);

  return (
    <>
      <GlassAppBar position="sticky" elevation={0}>
        <Container maxWidth="xl">
          <Toolbar 
            disableGutters 
            sx={{ 
              minHeight: { xs: 56, md: 64 },
              display: 'flex', 
              justifyContent: 'space-between',
              px: { xs: 0, sm: 1 }
            }}
          >
            {/* Sección izquierda */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Menú hamburguesa móvil */}
              <IconButton
                aria-label="menu de navegación"
                onClick={handleDrawerToggle}
                sx={{ 
                  display: { xs: 'flex', md: 'none' },
                  color: 'white',
                  p: 1,
                }}
              >
                <MenuIcon />
              </IconButton>
              
              {/* Logo */}
              <Box
                component="img"
                sx={{
                  height: { xs: 32, md: 38 },
                  filter: 'brightness(0) invert(1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
                alt="Logo"
                src="https://costaricacc.com/cccr/Logocccr.png"
                onClick={() => navigate('/dashboard')}
              />
            </Box>
            
            {/* Navegación desktop */}
            <Box 
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {menuItemsFiltrados.map((item) => (
                <NavButton
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  active={isPathActive(item.path) ? 1 : 0}
                >
                  {item.label}
                </NavButton>
              ))}
            </Box>
            
            {/* Sección derecha - Usuario */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Nombre de usuario solo en desktop */}
              {!isMobile && userData?.nombre && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 500,
                    mr: 1,
                    display: { xs: 'none', lg: 'block' }
                  }}
                >
                  {userData.nombre}
                </Typography>
              )}
              
              <Tooltip title="Mi cuenta" arrow>
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <StyledAvatar sx={{ width: 40, height: 40 }}>
                    {getUserInitials()}
                  </StyledAvatar>
                </IconButton>
              </Tooltip>

              {anchorElUser && (
                <StyledMenu
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  TransitionComponent={Fade}
                  disableScrollLock
                  keepMounted={false}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                {/* Header del menú con info del usuario */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                    {userData?.nombre} {userData?.apellidos}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {userData?.cargo || user?.email}
                  </Typography>
                </Box>
                
                <MenuItem onClick={handleNavigateToProfile} sx={{ mt: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SettingsIcon fontSize="small" sx={{ color: '#64748b' }} />
                  </ListItemIcon>
                  <Typography variant="body2">Configuración</Typography>
                </MenuItem>
                
                <Divider sx={{ my: 1 }} />
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LogoutIcon fontSize="small" sx={{ color: '#dc3545' }} />
                  </ListItemIcon>
                  <Typography variant="body2" sx={{ color: '#dc3545' }}>
                    Cerrar sesión
                  </Typography>
                </MenuItem>
              </StyledMenu>
              )}
            </Box>
          </Toolbar>
        </Container>
      </GlassAppBar>
      
      {/* Drawer móvil mejorado */}
      <MobileDrawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerClose}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header del drawer */}
          <Box 
            sx={{ 
              p: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              background: 'linear-gradient(135deg, rgba(0, 131, 14, 0.05) 0%, transparent 100%)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar 
                sx={{ 
                  bgcolor: '#00830e', 
                  width: 44, 
                  height: 44,
                  fontWeight: 600,
                }}
              >
                {getUserInitials()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a2e', lineHeight: 1.2 }}>
                  {userData?.nombre || 'Usuario'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {userData?.cargo || 'Colaborador'}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleDrawerClose}
              sx={{ 
                color: '#64748b',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Navegación principal */}
          <List sx={{ flex: 1, py: 2 }}>
            {menuItemsFiltrados.map((item) => {
              const isActive = isPathActive(item.path);
              return (
                <DrawerListItem
                  key={item.path}
                  active={isActive ? 1 : 0}
                  onClick={() => {
                    handleDrawerClose();
                    setTimeout(() => navigate(item.path), 100);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.9375rem',
                    }}
                  />
                  {isActive && <ChevronRightIcon sx={{ color: '#00830e', fontSize: 20 }} />}
                </DrawerListItem>
              );
            })}
          </List>

          {/* Footer del drawer */}
          <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <DrawerListItem
              onClick={() => {
                handleDrawerClose();
                setTimeout(() => navigate('/configuracion'), 100);
              }}
              sx={{ mb: 1 }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Configuración"
                primaryTypographyProps={{ fontSize: '0.9375rem', fontWeight: 500 }}
              />
            </DrawerListItem>

            <DrawerListItem
              onClick={() => {
                handleDrawerClose();
                setTimeout(() => handleLogout(), 100);
              }}
              sx={{
                '&:hover': {
                  background: alpha('#dc3545', 0.08),
                },
                '& .MuiListItemIcon-root': {
                  color: '#dc3545',
                },
                '& .MuiListItemText-primary': {
                  color: '#dc3545',
                },
              }}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Cerrar sesión"
                primaryTypographyProps={{ fontSize: '0.9375rem', fontWeight: 500 }}
              />
            </DrawerListItem>
          </Box>
        </Box>
      </MobileDrawer>
    </>
  );
});

export default Navbar;