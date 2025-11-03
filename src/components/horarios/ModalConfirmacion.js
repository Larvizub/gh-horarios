import React from 'react';
import { Dialog, DialogContent, DialogActions, Typography, Button, Slide } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { useTheme, useMediaQuery } from '@mui/material';

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
      success: <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 40, mb: 2 }} />,
      error: <ErrorIcon sx={{ color: '#f44336', fontSize: 40, mb: 2 }} />,
      warning: <WarningIcon sx={{ color: '#ff9800', fontSize: 40, mb: 2 }} />,
      info: <InfoIcon sx={{ color: '#2196f3', fontSize: 40, mb: 2 }} />
    };

    return (
      <Dialog
        open={abierto}
        onClose={soloInfo ? cerrarModalConfirmacion : (onCancelar || cerrarModalConfirmacion)}
        fullScreen={isSmallMobile}
        maxWidth={isMobile ? 'sm' : 'md'}
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <DialogContent sx={{ 
          textAlign: 'center', 
          pt: 4, 
          pb: 2,
          px: isMobile ? 2 : 4
        }}>
          {iconos[tipo]}
          
          <Typography 
            variant={isMobile ? 'h6' : 'h5'} 
            sx={{ 
              fontWeight: 'bold', 
              mb: 2,
              color: 'text.primary'
            }}
          >
            {titulo}
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              whiteSpace: 'pre-line',
              lineHeight: 1.6
            }}
          >
            {mensaje}
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ 
          justifyContent: 'center', 
          gap: 2, 
          pb: 3,
          px: 3,
          flexDirection: isSmallMobile ? 'column' : 'row'
        }}>
          {!soloInfo && (
            <Button 
              onClick={onCancelar || cerrarModalConfirmacion}
              variant="outlined"
              size={isMobile ? 'medium' : 'large'}
              fullWidth={isSmallMobile}
              sx={{ minWidth: isSmallMobile ? '100%' : '120px' }}
            >
              {textoCancelar}
            </Button>
          )}
          
          <Button 
            onClick={soloInfo ? cerrarModalConfirmacion : (onConfirmar || cerrarModalConfirmacion)}
            variant="contained"
            size={isMobile ? 'medium' : 'large'}
            fullWidth={isSmallMobile}
            color={tipo === 'error' ? 'error' : 'primary'}
            sx={{ minWidth: isSmallMobile ? '100%' : '120px' }}
          >
            {soloInfo ? 'Entendido' : textoConfirmar}
          </Button>
        </DialogActions>
      </Dialog>
    );
};

export default ModalConfirmacion;