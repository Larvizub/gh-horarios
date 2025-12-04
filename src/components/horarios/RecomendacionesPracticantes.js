import React from 'react';
import { Box, Typography, Chip, Alert, Avatar } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Styled Components
const StyledAlert = styled(Alert)(({ theme }) => ({
  borderRadius: 16,
  padding: theme.spacing(2),
  '& .MuiAlert-icon': {
    alignItems: 'flex-start',
    paddingTop: theme.spacing(0.5),
  },
  '& .MuiAlert-message': {
    width: '100%',
  },
}));

const UserCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: 12,
  padding: theme.spacing(2),
  marginTop: theme.spacing(1.5),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(255, 152, 0, 0.2)',
}));

const UserHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
}));

const SuggestionItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 1.5),
  backgroundColor: alpha(theme.palette.success.main, 0.08),
  borderRadius: 8,
  marginTop: theme.spacing(0.75),
}));

const ExcessChip = styled(Chip)(({ theme }) => ({
  fontWeight: 700,
  '& .MuiChip-icon': {
    fontSize: 16,
  },
}));

const RecomendacionesPracticantes = ({
  usuariosFiltrados,
  calcularHorasExcedentes,
  encontrarPracticantesDisponibles
}) => {
  // Filtra usuarios con horas excedentes usando tolerancia de 0.1h para evitar ruidos de punto flotante
  const usuariosExcedidos = usuariosFiltrados.filter(u => {
    const exceso = calcularHorasExcedentes(u.id);
    return Math.round(exceso * 10) / 10 > 0;
  });

  if (usuariosExcedidos.length === 0) return null;

  return (
    <Box sx={{ my: 2 }}>
      <StyledAlert severity="warning" icon={<WarningIcon />}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#e65100' }}>
          Redistribución de Horas Excedentes
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          Los siguientes colaboradores exceden sus horas semanales asignadas:
        </Typography>
        
        {usuariosExcedidos.map(usuario => {
          const rawExceso = calcularHorasExcedentes(usuario.id);
          const horasExceso = Math.round(rawExceso * 10) / 10;
          const practicantes = encontrarPracticantesDisponibles(horasExceso);

          return (
            <UserCard key={usuario.id}>
              <UserHeader>
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: alpha('#ff9800', 0.15),
                    color: '#e65100',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                  }}
                >
                  {usuario.nombre?.charAt(0)}{usuario.apellidos?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {usuario.nombre} {usuario.apellidos}
                  </Typography>
                </Box>
                <ExcessChip 
                  icon={<AccessTimeIcon />}
                  label={`+${horasExceso.toFixed(1)}h`} 
                  color="error" 
                  size="small" 
                />
              </UserHeader>
              
              {practicantes.length > 0 ? (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Practicantes sugeridos:
                  </Typography>
                  {practicantes.slice(0, 3).map(p => (
                    <SuggestionItem key={p.usuario.id}>
                      <PersonIcon sx={{ fontSize: 18, color: 'success.main' }} />
                      <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                        {p.usuario.nombre} {p.usuario.apellidos}
                      </Typography>
                      <Chip 
                        label={`${p.horasDisponibles}h`} 
                        size="small" 
                        color="success" 
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </SuggestionItem>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  No hay practicantes disponibles con suficientes horas.
                </Typography>
              )}
            </UserCard>
          );
        })}
      </StyledAlert>
    </Box>
  );
};

export default RecomendacionesPracticantes;
