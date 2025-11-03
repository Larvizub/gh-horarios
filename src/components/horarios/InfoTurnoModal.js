import React from 'react';
import { format, addDays } from 'date-fns';
import { diasSemana } from '../../utils/horariosConstants';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

const InfoTurnoModal = ({ open, onClose, usuario, turno, diaKey, semanaSeleccionada }) => {

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle variant='strong'>Información del Turno</DialogTitle>
      {/* Mostrar día y fecha */}
      {diaKey && (
        <DialogTitle  sx={{ pl: 3, pt: 0.2 }}>
          {(() => {
            const idx = parseInt(diaKey.replace('dia', ''), 10) - 1;
            const nombre = diasSemana[idx] || '';
            const fecha = format(addDays(semanaSeleccionada, idx), 'd');
            return `${nombre} ${fecha}`;
          })()}
        </DialogTitle>
      )}
      <DialogContent dividers>
        {usuario && (
          <Typography variant="body1" gutterBottom>
            <strong>Usuario:</strong> {usuario.nombre} {usuario.apellidos}
          </Typography>
        )}
        <Typography variant="body1" gutterBottom>
          <strong>Tipo:</strong> {(() => {
            if (!turno?.tipo) return 'Descanso';
            if (turno.tipo === 'personalizado') return 'Presencial';
            return turno.tipo.charAt(0).toUpperCase() + turno.tipo.slice(1);
          })()}
        </Typography>
        {turno && turno.tipo !== 'libre' && (
          <>
            <Typography variant="body1" gutterBottom>
              <strong>Horario:</strong> {turno.horaInicio} - {turno.horaFin}
            </Typography>
            <Typography variant="body1">
              <strong>Horas:</strong> {turno.horas?.toFixed(1)}h
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InfoTurnoModal;
