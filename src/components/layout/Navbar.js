import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, database } from '../../firebase/config';
import { ref, get } from 'firebase/database';
import { toast } from 'react-toastify';
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

// Botón animado para la navegación
const AnimatedNavButton = styled(Button)(({ theme, active }) => ({
  color: 'white',
  margin: theme.spacing(0, 1),
  transition: 'all 0.3s',
  position: 'relative',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateY(-3px)'
  },
  '&:hover .MuiSvgIcon-root': {
    animation: 'bounce 0.8s infinite'
  },
  '&::after': active ? {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '25%',
    width: '50%',
    height: '3px',
    backgroundColor: 'white',
    borderRadius: '3px'
  } : {}
}));

// Animado para menú lateral
const AnimatedListItem = styled(ListItem)(({ theme }) => ({
  transition: 'all 0.3s',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    transform: 'translateX(5px)'
  },
  '&:hover .MuiSvgIcon-root': {
    animation: 'pulse 1s infinite'
  }
}));

const menuItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Horarios', icon: <EventNoteIcon />, path: '/horarios' },
  { label: 'Consulta Horarios', icon: <HistoryIcon />, path: '/consulta-horarios' },
  { label: 'Personal', icon: <PersonIcon />, path: '/personal' },
  { label: 'Configuración', icon: <SettingsIcon />, path: '/configuracion' },
];

const Navbar = ({ user }) => {
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  // const location = useLocation();
  // Auto-cierre no necesario, se cierra manualmente antes de navegar
  // useEffect(() => {
  //   setDrawerOpen(false);
  // }, [location]);

  // Cargar datos del usuario para verificar permisos
  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (user) {
        try {
          const userRef = ref(database, `usuarios/${user.uid}`);
          const userSnapshot = await get(userRef);
          if (userSnapshot.exists()) {
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

  // Filtrar elementos del menú basándose en permisos
  const menuItemsFiltrados = menuItems.filter(item => {
    switch (item.path) {
      case '/personal':
        return userData && puedeAccederPersonal(userData);
      case '/horarios':
      case '/consulta-horarios':
        return userData && puedeVerHorarios(userData);
      default:
        return true; // Dashboard y Configuración son accesibles para todos
    }
  });

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Cerrar drawer explícitamente
  const handleDrawerClose = () => setDrawerOpen(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Sesión cerrada exitosamente');
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión: ' + error.message);
    }
  };

  // Nueva función para navegar al perfil (configuración)
  const handleNavigateToProfile = () => {
    handleCloseUserMenu(); // Cerrar el menú
    navigate('/configuracion'); // Navegar a configuración
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'var(--primary-color)' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Sección izquierda - Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              sx={{
                height: 40,
                display: { xs: 'none', md: 'flex' },
                filter: 'brightness(0) invert(1)', // Convierte el logo a blanco en desktop
              }}
              alt="Logo"
              src="https://costaricacc.com/cccr/Logocccr.png"
            />
            
            {/* Menú de hamburguesa móvil */}
            <IconButton
              size="large"
              aria-label="menu de navegación"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleDrawerToggle}
              color="inherit"
              sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
              className="icon-hover-pulse"
            >
              <MenuIcon />
            </IconButton>
            
            {/* Logo para móvil */}
            <Box
              component="img"
              sx={{
                height: 35,
                display: { xs: 'flex', md: 'none' },
              }}
              alt="Logo"
              src="https://costaricacc.com/cccr/Logocccr.png"
            />
          </Box>
          
          {/* Sección central - Menú de navegación en escritorio */}
          <Box 
            sx={{ 
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              flex: 1
            }}
          >
            {menuItemsFiltrados.map((item) => {
              const isActive = window.location.pathname === item.path;
              return (
                <AnimatedNavButton
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  active={isActive ? 1 : 0}
                >
                  {item.label}
                </AnimatedNavButton>
              );
            })}
          </Box>
          
          {/* Sección derecha - Perfil de usuario */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Abrir menú">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar 
                  alt={user?.email?.charAt(0).toUpperCase() || 'U'} 
                  src="/static/images/avatar/2.jpg"
                  sx={{ bgcolor: 'var(--secondary-color)' }}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={handleNavigateToProfile}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography textAlign="center">Perfil</Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography textAlign="center">Cerrar sesión</Typography>
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
      
      {/* Drawer para menú móvil */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem>
              <Box
                component="img"
                sx={{ height: 40, mx: 'auto', my: 2 }}
                alt="Logo"
                src="https://costaricacc.com/cccr/Logocccr.png"
              />
            </ListItem>
            <Divider />
            {menuItemsFiltrados.map((item) => {
              const isActive = window.location.pathname === item.path;
              return (
                <AnimatedListItem
                  button
                  key={item.path}
                  onClick={() => {
                    handleDrawerClose();
                    setTimeout(() => navigate(item.path), 150);
                  }}
                  sx={{
                    py: 1.5,
                    cursor: 'pointer',
                    bgcolor: isActive ? 'rgba(0, 0, 0, 0.08)' : 'transparent'
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </AnimatedListItem>
              );
            })}
            <Divider />
            <ListItem
              button
              onClick={() => {
                handleDrawerClose();
                setTimeout(() => navigate('/configuracion'), 150);
              }}
              sx={{ py: 1.5 }}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Perfil" />
            </ListItem>
            <AnimatedListItem
              button
              onClick={() => {
                handleDrawerClose();
                setTimeout(() => handleLogout(), 150);
              }}
              sx={{ mt: 1 }}
            >
              <ListItemIcon>
                <LogoutIcon className="icon-shake" />
              </ListItemIcon>
              <ListItemText primary="Cerrar sesión" />
            </AnimatedListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;