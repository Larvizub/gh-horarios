import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { get, ref } from 'firebase/database';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import CategoryIcon from '@mui/icons-material/Category';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import { database } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { notify as toast } from '../../services/notify';
import { puedeAccederPersonal, puedeVerHorarios } from '../../utils/contratoUtils';

const HEADER_HEIGHT = { xs: 56, md: 64 };
const SIDEBAR_COLLAPSED_WIDTH = 84;
const SIDEBAR_EXPANDED_WIDTH = 276;
const SIDEBAR_GAP = 16;

const HeaderBar = styled(AppBar)(() => ({
  background: '#ffffff',
  color: '#1a1a2e',
  boxShadow: '0 1px 0 rgba(15, 23, 42, 0.08)',
  borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
  zIndex: 1300,
}));

const FloatingSidebar = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})(({ expanded }) => ({
  position: 'fixed',
  left: SIDEBAR_GAP,
  top: 'calc(64px + 16px)',
  bottom: SIDEBAR_GAP,
  width: expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
  background: 'rgba(255, 255, 255, 0.88)',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  borderRadius: 28,
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
  overflow: 'hidden',
  zIndex: 1200,
  transition: 'width 220ms ease, box-shadow 220ms ease, transform 220ms ease',
  display: 'flex',
  flexDirection: 'column',
  '@media (hover: hover)': {
    '&:hover': {
      boxShadow: '0 28px 72px rgba(15, 23, 42, 0.16)',
    },
  },
}));

const SidebarSection = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}));

const SidebarItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'collapsed',
})(({ collapsed, theme }) => ({
  minHeight: 48,
  margin: theme.spacing(0.35, 1.1),
  borderRadius: 16,
  justifyContent: 'center',
  paddingLeft: collapsed ? theme.spacing(1.4) : theme.spacing(1.8),
  paddingRight: collapsed ? theme.spacing(1.4) : theme.spacing(1.6),
  color: '#64748b',
  transition: 'all 180ms ease',
  '& .MuiListItemIcon-root': {
    minWidth: 0,
    marginRight: collapsed ? 0 : theme.spacing(1.4),
    color: 'inherit',
  },
  '& .MuiListItemText-root': {
    opacity: collapsed ? 0 : 1,
    transform: collapsed ? 'translateX(-6px)' : 'translateX(0)',
    transition: 'opacity 180ms ease, transform 180ms ease',
    whiteSpace: 'nowrap',
  },
  '& .MuiListItemText-primary': {
    fontSize: '0.9375rem',
    fontWeight: 500,
  },
  '&:hover': {
    background: 'rgba(0, 131, 14, 0.06)',
    color: '#0f172a',
    transform: 'translateX(2px)',
  },
  '&.Mui-selected': {
    background: 'rgba(0, 131, 14, 0.11)',
    color: '#00830e',
    '&:hover': {
      background: 'rgba(0, 131, 14, 0.14)',
    },
  },
}));

const MobileDrawer = styled(Drawer)(() => ({
  '& .MuiDrawer-paper': {
    width: 320,
    maxWidth: '86vw',
    borderRadius: '0 24px 24px 0',
    background: '#ffffff',
    border: 'none',
  },
}));

const UserAvatar = styled(Avatar)(() => ({
  background: 'linear-gradient(135deg, #00830e 0%, #2e7d32 100%)',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '0.875rem',
}));

const menuItems = [
  { label: 'Inicio', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Horarios', icon: <EventNoteIcon />, path: '/horarios' },
  { label: 'Consulta', icon: <HistoryIcon />, path: '/consulta-horarios' },
  { label: 'Personal', icon: <PersonIcon />, path: '/personal' },
  { label: 'Tipos', icon: <CategoryIcon />, path: '/tipos-horario', onlyAdmin: true },
];

const Navbar = memo(({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [userData, setUserData] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    const cargarDatosUsuario = async () => {
      if (!user || !mountedRef.current) {
        return;
      }

      try {
        const userRef = ref(database, `usuarios/${user.uid}`);
        const userSnapshot = await get(userRef);
        if (userSnapshot.exists() && mountedRef.current) {
          setUserData({ ...userSnapshot.val(), email: user.email });
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };

    cargarDatosUsuario();
  }, [user]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const isPathActive = useCallback((path) => location.pathname === path, [location.pathname]);

  const menuItemsFiltrados = useMemo(() => {
    const esAdmin = Boolean(
      userData && (userData.rol === 'Administrador' || userData.departamento === 'Talento Humano')
    );

    return menuItems.filter((item) => {
      if (item.onlyAdmin) {
        return esAdmin;
      }

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

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success('Sesion cerrada exitosamente');
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
      toast.error('Error al cerrar sesion: ' + error.message);
    }
  }, [logout, navigate]);

  const getUserInitials = useCallback(() => {
    if (userData?.nombre) {
      const nombre = userData.nombre.charAt(0).toUpperCase();
      const apellido = userData.apellidos ? userData.apellidos.charAt(0).toUpperCase() : '';
      return `${nombre}${apellido}`;
    }

    return user?.email?.charAt(0).toUpperCase() || 'U';
  }, [userData, user]);

  const getUserDisplayName = useCallback(() => {
    const nombre = userData?.nombre || '';
    const apellidos = userData?.apellidos || '';
    const fullName = `${nombre} ${apellidos}`.trim();

    return fullName || user?.email || 'Usuario';
  }, [userData, user]);

  const navigateTo = useCallback((path) => {
    navigate(path);
    setDrawerOpen(false);
  }, [navigate]);

  const renderNavigationItems = (collapsed = false, onSelect = null) => (
    <List sx={{ px: 0, py: 1 }}>
      {menuItemsFiltrados.map((item) => {
        const selected = isPathActive(item.path);
        const button = (
          <SidebarItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={selected}
            collapsed={collapsed ? 1 : 0}
            onClick={onSelect}
            sx={{
              '& .MuiListItemIcon-root': {
                marginLeft: collapsed ? 0 : 0.5,
              },
              '& .MuiListItemText-root': {
                display: collapsed ? 'none' : 'block',
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </SidebarItemButton>
        );

        if (collapsed && !isMobile) {
          return (
            <Tooltip key={item.path} title={item.label} placement="right" arrow>
              {button}
            </Tooltip>
          );
        }

        return button;
      })}
    </List>
  );

  const sidebarFooter = (collapsed = false) => (
    <Box sx={{ px: 1.5, pb: 1.5, mt: 'auto' }}>
      <Divider sx={{ my: 1.5, opacity: 0.7 }} />

      <SidebarSection>
        <SidebarItemButton
          collapsed={collapsed ? 1 : 0}
          selected={isPathActive('/configuracion')}
          onClick={() => navigateTo('/configuracion')}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Configuracion" />
        </SidebarItemButton>

        {collapsed ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
            <Tooltip title={getUserDisplayName()} placement="right" arrow>
              <UserAvatar sx={{ width: 42, height: 42 }}>
                {getUserInitials()}
              </UserAvatar>
            </Tooltip>
          </Box>
        ) : (
          <Box
            sx={{
              my: 0.75,
              p: 1.6,
              borderRadius: 4,
              background: 'linear-gradient(180deg, rgba(0,131,14,0.06), rgba(0,131,14,0.02))',
              border: '1px solid rgba(0,131,14,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
            }}
          >
            <UserAvatar sx={{ width: 40, height: 40 }}>
              {getUserInitials()}
            </UserAvatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }} noWrap>
                {getUserDisplayName()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                {userData?.cargo || user?.email || 'Acceso'}
              </Typography>
            </Box>
          </Box>
        )}

        <SidebarItemButton
          collapsed={collapsed ? 1 : 0}
          onClick={handleLogout}
          sx={{
            color: '#dc3545',
            '&:hover': {
              background: alpha('#dc3545', 0.08),
              color: '#c82333',
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar sesion" />
        </SidebarItemButton>
      </SidebarSection>
    </Box>
  );

  return (
    <>
      <HeaderBar position="fixed" elevation={0}>
        <Toolbar
          disableGutters
          sx={{
            minHeight: HEADER_HEIGHT,
            px: { xs: 1.5, md: 3 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <IconButton
              aria-label="Abrir navegacion"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' }, color: '#1a1a2e' }}
            >
              <MenuIcon />
            </IconButton>
            <Box
              component="img"
              src="https://costaricacc.com/cccr/Logocccr.png"
              alt="Logo"
              sx={{
                height: { xs: 28, md: 32 },
                width: 'auto',
                flex: '0 0 auto',
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1a2e', lineHeight: 1.1 }} noWrap>
                GH Horarios
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                Centro de convenciones
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </HeaderBar>

      {!isMobile && (
        <FloatingSidebar
          expanded={sidebarExpanded ? 1 : 0}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
          onFocusCapture={() => setSidebarExpanded(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setSidebarExpanded(false);
            }
          }}
        >
          <Box
            sx={{
              px: sidebarExpanded ? 2.2 : 1.1,
              pt: 1.5,
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              minHeight: 72,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(0,131,14,0.1), rgba(0,131,14,0.03))',
                display: 'grid',
                placeItems: 'center',
                flex: '0 0 auto',
              }}
            >
              <Typography sx={{ fontWeight: 800, color: '#00830e', fontSize: '0.85rem' }}>GP</Typography>
            </Box>
            <Box sx={{ minWidth: 0, opacity: sidebarExpanded ? 1 : 0, transition: 'opacity 180ms ease' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a1a2e' }} noWrap>
                Navegacion
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                Accesos rapidos
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', pb: 1 }}>{renderNavigationItems(!sidebarExpanded)}</Box>
          {sidebarFooter(!sidebarExpanded)}
        </FloatingSidebar>
      )}

      <MobileDrawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              px: 2,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(15,23,42,0.06)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
              <Box component="img" src="https://costaricacc.com/cccr/Logocccr.png" alt="Logo" sx={{ height: 28, width: 'auto' }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1a1a2e' }} noWrap>
                  GH Horarios
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }} noWrap>
                  Menu
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ px: 1.2, pt: 1 }}>{renderNavigationItems(false, () => setDrawerOpen(false))}</Box>

          <Box sx={{ mt: 'auto', px: 1.2, pb: 1.5 }}>
            <Divider sx={{ mb: 1.5 }} />
            {sidebarFooter(false)}
          </Box>
        </Box>
      </MobileDrawer>
    </>
  );
});

export default Navbar;
