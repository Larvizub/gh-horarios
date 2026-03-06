import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { Box, Container, Typography, Paper, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import CategoryIcon from '@mui/icons-material/Category';
import { auth, database } from '../../firebase/config';
import TiposHorarioManager from '../configuracion/TiposHorarioManager';
import { getTiposHorario, saveTiposHorario } from '../../services/tiposHorarioService';

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: '#f8fafc',
  paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
  [theme.breakpoints.up('md')]: {
    paddingBottom: theme.spacing(4),
  },
}));

const HeaderCard = styled(Paper)(({ theme }) => ({
  borderRadius: 20,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  background: 'linear-gradient(135deg, #00830e 0%, #006c0b 100%)',
  color: '#fff',
  boxShadow: '0 8px 24px rgba(0, 131, 14, 0.25)',
}));

const TiposHorarioPage = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const validarAcceso = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setAuthorized(false);
          return;
        }

        const snapshot = await get(ref(database, `usuarios/${user.uid}`));
        const userData = snapshot.exists() ? snapshot.val() : null;
        const canAccess = userData?.rol === 'Administrador' || userData?.departamento === 'Talento Humano';
        setAuthorized(Boolean(canAccess));

        // Sincroniza defaults corregidos de tipos base para evitar configuraciones viejas inconsistentes.
        if (canAccess) {
          const { tipos } = await getTiposHorario();
          await saveTiposHorario(tipos);
        }
      } catch (error) {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    validarAcceso();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <CircularProgress />
          </Box>
        </Container>
      </PageContainer>
    );
  }

  if (!authorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageContainer>
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        <HeaderCard elevation={0}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CategoryIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Tipos de Horario
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Administra tipos, iconos, colores y reglas de horas.
              </Typography>
            </Box>
          </Box>
        </HeaderCard>

        <TiposHorarioManager />
      </Container>
    </PageContainer>
  );
};

export default TiposHorarioPage;
