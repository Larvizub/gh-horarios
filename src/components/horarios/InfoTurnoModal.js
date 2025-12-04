import React from 'react';
import { format, addDays } from 'date-fns';
import { diasSemana } from '../../utils/horariosConstants';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  Chip
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import WorkIcon from '@mui/icons-material/Work';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CloseIcon from '@mui/icons-material/Close';

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #00830e 0%, #4caf50 100%)',
  color: 'white',
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

const DateChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  color: 'white',
  fontWeight: 600,
  fontSize: '0.875rem',
  '& .MuiChip-icon': {
    color: 'white',
  },
}));

const ContentBox = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: '#fafafa',
}));

const InfoCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: 16,
  padding: theme.spacing(2.5),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  marginBottom: theme.spacing(2),
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 0),
  '&:not(:last-child)': {
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
}));

const InfoLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontWeight: 500,
}));

const InfoValue = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  color: theme.palette.text.primary,
}));

const HoursChip = styled(Chip)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1rem',
  padding: theme.spacing(0.5, 1),
  '& .MuiChip-icon': {
    fontSize: '1.2rem',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 32px',
  fontWeight: 600,
  textTransform: 'none',
  background: 'linear-gradient(135deg, #00830e 0%, #4caf50 100%)',
  '&:hover': {
    background: 'linear-gradient(135deg, #006b0b 0%, #388e3c 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 20px rgba(0, 131, 14, 0.3)',
  },
}));

const getTipoIcon = (tipo) => {
  switch (tipo) {
    case 'teletrabajo':
      return <HomeWorkIcon sx={{ color: '#2196f3' }} />;
    case 'descanso':
    case 'vacaciones':
      return <EventBusyIcon sx={{ color: '#9e9e9e' }} />;
    default:
      return <WorkIcon sx={{ color: '#00830e' }} />;
  }
};

const getTipoLabel = (tipo) => {
  if (!tipo) return 'Descanso';
  if (tipo === 'personalizado') return 'Presencial';
  return tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/-/g, ' ');
};

const InfoTurnoModal = ({ open, onClose, usuario, turno, diaKey, semanaSeleccionada }) => {
  const getDiaInfo = () => {
    if (!diaKey) return { nombre: '', fecha: '' };
    const idx = parseInt(diaKey.replace('dia', ''), 10) - 1;
    const nombre = diasSemana[idx] || '';
    const fecha = format(addDays(semanaSeleccionada, idx), 'd');
    return { nombre, fecha };
  };

  const diaInfo = getDiaInfo();

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <HeaderBox>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Información del Turno
        </Typography>
        {diaKey && (
          <DateChip
            icon={<EventIcon />}
            label={`${diaInfo.nombre} ${diaInfo.fecha}`}
          />
        )}
      </HeaderBox>

      <ContentBox dividers>
        {usuario && (
          <InfoCard>
            <InfoRow>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: alpha('#00830e', 0.1),
                  color: '#00830e',
                  fontWeight: 700,
                }}
              >
                {usuario.nombre?.charAt(0)}{usuario.apellidos?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <InfoLabel>Colaborador</InfoLabel>
                <InfoValue>{usuario.nombre} {usuario.apellidos}</InfoValue>
              </Box>
            </InfoRow>
          </InfoCard>
        )}

        <InfoCard>
          <InfoRow>
            {getTipoIcon(turno?.tipo)}
            <Box sx={{ flex: 1 }}>
              <InfoLabel>Tipo de Turno</InfoLabel>
              <InfoValue>{getTipoLabel(turno?.tipo)}</InfoValue>
            </Box>
          </InfoRow>

          {turno && turno.tipo !== 'libre' && turno.tipo !== 'descanso' && turno.tipo !== 'vacaciones' && (
            <>
              <InfoRow>
                <AccessTimeIcon sx={{ color: 'text.secondary' }} />
                <Box sx={{ flex: 1 }}>
                  <InfoLabel>Horario</InfoLabel>
                  <InfoValue>
                    {turno.horaInicio || '--:--'} - {turno.horaFin || '--:--'}
                  </InfoValue>
                </Box>
              </InfoRow>

              <InfoRow>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    <InfoLabel>Horas Laboradas</InfoLabel>
                  </Box>
                  <HoursChip
                    icon={<AccessTimeIcon />}
                    label={`${turno.horas?.toFixed(1) || '0.0'}h`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              </InfoRow>
            </>
          )}
        </InfoCard>
      </ContentBox>

      <DialogActions sx={{ 
        p: 3, 
        backgroundColor: '#fafafa',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <ActionButton 
          onClick={onClose} 
          variant="contained"
          startIcon={<CloseIcon />}
        >
          Cerrar
        </ActionButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default InfoTurnoModal;
