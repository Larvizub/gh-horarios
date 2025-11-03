import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Box, Alert, Grid } from '@mui/material';

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
  'dia-brigada': 'Día por Brigada'
};

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
    <Dialog 
      open={dialogoCopiar} 
      onClose={() => {
        setDialogoCopiar(false);
        setHorarioACopiar(null);
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Copiar Horario
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            Horario a copiar: {TIPO_LABEL[horarioACopiar.tipo] || horarioACopiar.tipo}
          </Typography>
          
          {horarioACopiar.horaInicio && horarioACopiar.horaFin && (
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Horario: {horarioACopiar.horaInicio} - {horarioACopiar.horaFin} ({horarioACopiar.horas?.toFixed(1)}h)
            </Typography>
          )}

          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Selecciona el día destino:
          </Typography>
          
          <Grid container spacing={1}>
            {diasSemana.map((dia, index) => {
              const diaKey = diasKeys[index];
              const horariosUsuario = editando ? horariosEditados[horarioACopiar.usuarioId] : horarios[horarioACopiar.usuarioId];
              const yaOcupado = horariosUsuario?.[diaKey] && horariosUsuario[diaKey].tipo !== 'libre';
              const esDiaOriginal = diaKey === horarioACopiar.diaOriginal;
              
              return (
                <Grid item xs={12} sm={6} md={4} key={diaKey}>
                  <Button
                    variant={yaOcupado ? "outlined" : "contained"}
                    fullWidth
                    disabled={esDiaOriginal}
                    onClick={() => handleSeleccionarDia(diaKey)}
                    sx={{
                      backgroundColor: yaOcupado ? 'transparent' : '#1976d2',
                      color: yaOcupado ? '#1976d2' : 'white',
                      borderColor: yaOcupado ? '#ff9800' : '#1976d2',
                      '&:hover': {
                        backgroundColor: yaOcupado ? 'rgba(255, 152, 0, 0.04)' : '#1565c0',
                        borderColor: yaOcupado ? '#ff9800' : '#1565c0'
                      },
                      '&:disabled': {
                        backgroundColor: '#f5f5f5',
                        color: '#999',
                        borderColor: '#ddd'
                      }
                    }}
                  >
                    {dia}
                    {esDiaOriginal && ' (Original)'}
                    {yaOcupado && !esDiaOriginal && ' (Ocupado)'}
                  </Button>
                </Grid>
              );
            })}
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              • Los días marcados como "Ocupado" ya tienen un horario asignado
            </Typography>
            <Typography variant="body2">
              • Seleccionar un día ocupado reemplazará el horario existente
            </Typography>
            <Typography variant="body2">
              • El día original está deshabilitado para evitar copia sobre sí mismo
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => {
            setDialogoCopiar(false);
            setHorarioACopiar(null);
          }}
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogoCopiar;
