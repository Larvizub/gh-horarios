import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Box, Alert, Grid, Chip } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const diasKeys = ['dia1', 'dia2', 'dia3', 'dia4', 'dia5', 'dia6', 'dia7'];
const TIPO_LABEL = {
  personalizado: 'Presencial',
  teletrabajo: 'Teletrabajo',
  cambio: 'Cambio',
  descanso: 'Descanso',
  vacaciones: 'Vacaciones',
  feriado: 'Feriado',
  permiso: 'Permiso Otorgado por Jefatura',
  'tarde-libre': 'Tarde Libre',
  'dia-brigada': 'Día por Brigada',
  'beneficio-operaciones': 'Día libre - beneficio operaciones'
};

// Styled Components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
  color: 'white',
  padding: theme.spacing(2.5, 3),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  '& .MuiSvgIcon-root': {
    fontSize: 28,
  },
}));

const ContentBox = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: '#fafafa',
}));

const SourceCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: 16,
  padding: theme.spacing(2.5),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  marginBottom: theme.spacing(3),
  borderLeft: '4px solid #1976d2',
}));

const DayButton = styled(Button)(({ occupied, isoriginal }) => ({
  borderRadius: 12,
  padding: '12px 16px',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease',
  ...(isoriginal === 'true' && {
    backgroundColor: '#e0e0e0 !important',
    color: '#999 !important',
    borderColor: '#ddd !important',
  }),
  ...(occupied === 'true' && isoriginal !== 'true' && {
    backgroundColor: 'transparent',
    color: '#ff9800',
    borderColor: '#ff9800',
    borderWidth: 2,
    '&:hover': {
      backgroundColor: alpha('#ff9800', 0.08),
      borderColor: '#ff9800',
      borderWidth: 2,
      transform: 'translateY(-2px)',
    },
  }),
  ...(occupied !== 'true' && isoriginal !== 'true' && {
    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    color: 'white',
    '&:hover': {
      background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(25, 118, 210, 0.3)',
    },
  }),
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
  borderRadius: 12,
  '& .MuiAlert-icon': {
    alignItems: 'center',
  },
}));

const CancelButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 28px',
  fontWeight: 600,
  textTransform: 'none',
}));

const DialogoCopiar = ({
  dialogoCopiar,
  setDialogoCopiar,
  horarioACopiar,
  setHorarioACopiar,
  ejecutarCopiarHorario,
  editando,
  horariosEditados,
  horarios
}) => {
  if (!horarioACopiar) return null;

  const handleSeleccionarDia = (diaKey) => {
    ejecutarCopiarHorario(diaKey);
  };

  return (
    <StyledDialog 
      open={dialogoCopiar} 
      onClose={() => {
        setDialogoCopiar(false);
        setHorarioACopiar(null);
      }}
      fullWidth
      maxWidth="sm"
    >
      <StyledDialogTitle>
        <ContentCopyIcon />
        Copiar Horario
      </StyledDialogTitle>
      <ContentBox>
        <SourceCard>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
            Horario a copiar
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip 
              label={TIPO_LABEL[horarioACopiar.tipo] || horarioACopiar.tipo}
              color="primary"
              sx={{ fontWeight: 600 }}
            />
            {horarioACopiar.horaInicio && horarioACopiar.horaFin && (
              <Chip 
                icon={<AccessTimeIcon />}
                label={`${horarioACopiar.horaInicio} - ${horarioACopiar.horaFin} (${horarioACopiar.horas?.toFixed(1)}h)`}
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            )}
          </Box>
        </SourceCard>

        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
          Selecciona el día destino:
        </Typography>
        
        <Grid container spacing={1.5}>
          {diasSemana.map((dia, index) => {
            const diaKey = diasKeys[index];
            const horariosUsuario = editando ? horariosEditados[horarioACopiar.usuarioId] : horarios[horarioACopiar.usuarioId];
            const yaOcupado = horariosUsuario?.[diaKey] && horariosUsuario[diaKey].tipo !== 'libre';
            const esDiaOriginal = diaKey === horarioACopiar.diaOriginal;
            
            return (
              <Grid item xs={6} sm={4} key={diaKey}>
                <DayButton
                  variant={yaOcupado ? "outlined" : "contained"}
                  fullWidth
                  disabled={esDiaOriginal}
                  onClick={() => handleSeleccionarDia(diaKey)}
                  occupied={yaOcupado ? 'true' : 'false'}
                  isoriginal={esDiaOriginal ? 'true' : 'false'}
                >
                  {dia}
                  {esDiaOriginal && ' ✓'}
                  {yaOcupado && !esDiaOriginal && ' •'}
                </DayButton>
              </Grid>
            );
          })}
        </Grid>

        <StyledAlert severity="info" icon={<InfoIcon />} sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            • Los días con <strong>•</strong> ya tienen horario (será reemplazado)
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            • El día con <strong>✓</strong> es el origen
          </Typography>
        </StyledAlert>
      </ContentBox>
      <DialogActions sx={{ 
        p: 3, 
        backgroundColor: '#fafafa',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)'
      }}>
        <CancelButton 
          onClick={() => {
            setDialogoCopiar(false);
            setHorarioACopiar(null);
          }}
          startIcon={<CloseIcon />}
        >
          Cancelar
        </CancelButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default DialogoCopiar;
