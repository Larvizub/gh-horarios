import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Box, CircularProgress, ThemeProvider, createTheme } from '@mui/material';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';

// Importación perezosa de componentes
const Login = lazy(() => import('./components/auth/Login'));
const Register = lazy(() => import('./components/auth/Register'));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const Horarios = lazy(() => import('./components/horarios/Horarios'));
const Personal = lazy(() => import('./components/personal/Personal'));
const Configuracion = lazy(() => import('./components/configuracion/Configuracion'));
const ConsultaHorarios = lazy(() => import('./components/consulta/ConsultaHorarios'));
const Navbar = lazy(() => import('./components/layout/Navbar'));

// Crear tema personalizado para Material-UI
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
      light: '#7986cb',
      dark: '#303f9f',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f50057',
      light: '#ff5983',
      dark: '#c51162',
      contrastText: '#fff',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
      contrastText: '#fff',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#fff',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#fff',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
      contrastText: '#fff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="App">
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      }>
        {currentUser && <Navbar user={currentUser} />}
        
        <Routes
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          {/* Rutas públicas */}
          <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <Login />} />
          {/* Ruta de registro accesible para administradores y desde login */}
          <Route path="/registro" element={<Register />} />
          
          {/* Rutas protegidas */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/horarios" element={
            <ProtectedRoute>
              <Horarios />
            </ProtectedRoute>
          } />
          <Route path="/consulta-horarios" element={
            <ProtectedRoute>
              <ConsultaHorarios />
            </ProtectedRoute>
          } />
          <Route path="/personal" element={
            <ProtectedRoute>
              <Personal />
            </ProtectedRoute>
          } />
          <Route path="/configuracion" element={
            <ProtectedRoute>
              <Configuracion />
            </ProtectedRoute>
          } />
          
          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
