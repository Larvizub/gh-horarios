import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, Box, IconButton } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
import CustomDateSelector from './CustomDateSelector';

/**
 * Componente de header con selector de departamento y navegación de semanas.
 */
export default function HeaderSemana({
  departamentos,
  departamentoSeleccionado,
  setDepartamentoSeleccionado,
  loading,
  semanaSeleccionada,
  setSemanaSeleccionada,
  yearSelected,
  setYearSelected,
  monthSelected,
  setMonthSelected,
  datePickerOpen,
  setDatePickerOpen,
  anchorEl,
  setAnchorEl,
  avanzarSemana,
  retrocederSemana
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3, md: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
            <InputLabel>Departamento</InputLabel>
            <Select value={departamentoSeleccionado} onChange={(e) => setDepartamentoSeleccionado(e.target.value)} disabled={loading}>
              {departamentos.map((depto) => (
                <MenuItem key={depto} value={depto}>{depto}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={8}>
          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, alignItems: 'center', flexWrap: 'wrap', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
            <IconButton onClick={retrocederSemana} disabled={loading} size={isMobile ? 'small' : 'medium'} sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
              <span style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>◀</span>
            </IconButton>
            <CustomDateSelector
              semanaSeleccionada={semanaSeleccionada}
              setSemanaSeleccionada={setSemanaSeleccionada}
              yearSelected={yearSelected}
              setYearSelected={setYearSelected}
              monthSelected={monthSelected}
              setMonthSelected={setMonthSelected}
              datePickerOpen={datePickerOpen}
              setDatePickerOpen={setDatePickerOpen}
              anchorEl={anchorEl}
              setAnchorEl={setAnchorEl}
            />
            <IconButton onClick={avanzarSemana} disabled={loading} size={isMobile ? 'small' : 'medium'} sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
              <span style={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>▶</span>
            </IconButton>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
