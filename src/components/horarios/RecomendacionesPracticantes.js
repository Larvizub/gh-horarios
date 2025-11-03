import React from 'react';
import { Box, Typography, Chip, Alert } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

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
      <Alert severity="warning" icon={<WarningIcon />}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Recomendaciones para redistribuir horas excedentes:
        </Typography>
        {usuariosExcedidos.map(usuario => {
          // Redondear exceso a una cifra decimal para cálculos y presentación
          const rawExceso = calcularHorasExcedentes(usuario.id);
          const horasExceso = Math.round(rawExceso * 10) / 10;
          const practicantes = encontrarPracticantesDisponibles(horasExceso);

          return (
            <Box key={usuario.id} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {usuario.nombre} {usuario.apellidos} <Chip label={`+${horasExceso.toFixed(1)}h`} color="error" size="small" sx={{ ml: 1 }} />
              </Typography>
              {practicantes.length > 0 ? (
                <Box sx={{ ml: 2, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Practicantes sugeridos:
                  </Typography>
                  {practicantes.slice(0, 3).map(p => (
                    <Typography key={p.usuario.id} variant="body2" sx={{ ml: 1 }}>
                      • {p.usuario.nombre} {p.usuario.apellidos} ({p.horasDisponibles}h disponibles)
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                  No hay practicantes disponibles con suficientes horas.
                </Typography>
              )}
            </Box>
          );
        })}
      </Alert>
    </Box>
  );
};

export default RecomendacionesPracticantes;
