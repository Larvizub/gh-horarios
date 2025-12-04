import React from 'react';
import { Dialog, DialogContent, DialogActions, Typography, Button, Slide, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { useTheme, useMediaQuery } from '@mui/material';

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
}));

const IconContainer = styled(Box)(({ tipo }) => {
  const colors = {
    success: { bg: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' },
    error: { bg: 'rgba(244, 67, 54, 0.1)', color: '#f44336' },
    warning: { bg: 'rgba(255, 152, 0, 0.1)', color: '#ff9800' },
    info: { bg: 'rgba(33, 150, 243, 0.1)', color: '#2196f3' },
  };
  const colorSet = colors[tipo] || colors.info;
  
  return {
    width: 80,
    height: 80,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorSet.bg,
    marginBottom: 24,
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)' },
    },
    '& .MuiSvgIcon-root': {
      fontSize: 48,
      color: colorSet.color,
    },
  };
});

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 28px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
  },
}));

const PrimaryButton = styled(ActionButton)(({ theme, buttontype }) => {
  const styles = {
    success: {
      background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
      '&:hover': {
        background: 'linear-gradient(135deg, #43a047 0%, #4caf50 100%)',
        boxShadow: '0 8px 20px rgba(76, 175, 80, 0.3)',
      },
    },
    error: {
      background: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
      '&:hover': {
        background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)',
        boxShadow: '0 8px 20px rgba(244, 67, 54, 0.3)',
      },
    },
    warning: {
      background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
      '&:hover': {
        background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
        boxShadow: '0 8px 20px rgba(255, 152, 0, 0.3)',
      },
    },
    info: {
      background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
      '&:hover': {
        background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
        boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)',
      },
    },
    primary: {
      background: 'linear-gradient(135deg, #00830e 0%, #4caf50 100%)',
      '&:hover': {
        background: 'linear-gradient(135deg, #006b0b 0%, #388e3c 100%)',
        boxShadow: '0 8px 20px rgba(0, 131, 14, 0.3)',
      },
    },
  };
  return styles[buttontype] || styles.primary;
});

const ModalConfirmacion = ({
  modalConfirmacion,
  cerrarModalConfirmacion
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { abierto, tipo, titulo, mensaje, textoConfirmar, textoCancelar, onConfirmar, onCancelar, soloInfo } = modalConfirmacion;

    // Iconos según el tipo
    const iconos = {
      success: <CheckCircleIcon />,
      error: <ErrorIcon />,
      warning: <WarningIcon />,
      info: <InfoIcon />
    };

    return (
      <StyledDialog
        open={abierto}
        onClose={soloInfo ? cerrarModalConfirmacion : (onCancelar || cerrarModalConfirmacion)}
        fullScreen={isSmallMobile}
        maxWidth="xs"
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <DialogContent sx={{ 
          textAlign: 'center', 
          pt: 5, 
          pb: 3,
          px: isMobile ? 3 : 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <IconContainer tipo={tipo}>
            {iconos[tipo]}
          </IconContainer>
          
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              mb: 2,
              color: 'text.primary',
              fontSize: isMobile ? '1.25rem' : '1.5rem',
            }}
          >
            {titulo}
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              whiteSpace: 'pre-line',
              lineHeight: 1.7,
              maxWidth: 320,
            }}
          >
            {mensaje}
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ 
          justifyContent: 'center', 
          gap: 2, 
          pb: 4,
          px: 3,
          flexDirection: isSmallMobile ? 'column' : 'row'
        }}>
          {!soloInfo && (
            <ActionButton 
              onClick={onCancelar || cerrarModalConfirmacion}
              variant="outlined"
              size="large"
              fullWidth={isSmallMobile}
              sx={{ 
                minWidth: isSmallMobile ? '100%' : '130px',
                borderWidth: 2,
                '&:hover': { borderWidth: 2 }
              }}
            >
              {textoCancelar}
            </ActionButton>
          )}
          
          <PrimaryButton 
            onClick={soloInfo ? cerrarModalConfirmacion : (onConfirmar || cerrarModalConfirmacion)}
            variant="contained"
            size="large"
            fullWidth={isSmallMobile}
            buttontype={tipo === 'error' ? 'error' : 'primary'}
            sx={{ minWidth: isSmallMobile ? '100%' : '130px' }}
          >
            {soloInfo ? 'Entendido' : textoConfirmar}
          </PrimaryButton>
        </DialogActions>
      </StyledDialog>
    );
};

export default ModalConfirmacion;