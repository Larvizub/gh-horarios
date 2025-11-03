import React from 'react';
import { Button, Popover, Box, Typography, Grid, IconButton, useMediaQuery, useTheme } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { format, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

const CustomDateSelector = ({
  semanaSeleccionada,
  setSemanaSeleccionada,
  datePickerOpen,
  setDatePickerOpen,
  anchorEl,
  setAnchorEl
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Función para abrir el popover
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setDatePickerOpen(true);
  };

  // Función para cerrar el popover
  const handleClose = () => {
    setAnchorEl(null);
    setDatePickerOpen(false);
  };

  // Función para cambiar la semana seleccionada
  const handleChangeSemana = (weeks) => {
    setSemanaSeleccionada(addWeeks(semanaSeleccionada, weeks));
    handleClose();
  };

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      <Button
        startIcon={<CalendarTodayIcon />}
        onClick={handleOpen}
        size={isMobile ? 'small' : 'medium'}
        sx={{
          fontWeight: 'bold',
          fontSize: isMobile ? '0.85rem' : '1rem',
          px: isMobile ? 1 : 2,
          py: isMobile ? 0.5 : 1,
          minWidth: isMobile ? 0 : 120
        }}
      >
        {format(semanaSeleccionada, "d 'de' MMMM yyyy", { locale: es })}
      </Button>
      <Popover
        open={datePickerOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 220 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Selecciona semana
          </Typography>
          <Grid container spacing={1} alignItems="center">
            <Grid item>
              <IconButton onClick={() => handleChangeSemana(-1)} size="small">
                <ArrowBackIosNewIcon />
              </IconButton>
            </Grid>
            <Grid item>
              <Typography variant="body2">
                {format(semanaSeleccionada, "d 'de' MMMM yyyy", { locale: es })}
              </Typography>
            </Grid>
            <Grid item>
              <IconButton onClick={() => handleChangeSemana(1)} size="small">
                <ArrowForwardIosIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      </Popover>
    </Box>
  );
};

export default CustomDateSelector;
