import React from 'react';
import { Button, Popover, Box, Typography, Grid, IconButton, useMediaQuery, useTheme, Chip } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TodayIcon from '@mui/icons-material/Today';
import { format, addWeeks, startOfWeek, isSameWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// Styled Components
const DateButton = styled(Button)(({ theme }) => ({
  borderRadius: 14,
  padding: '10px 20px',
  fontWeight: 600,
  fontSize: '0.95rem',
  backgroundColor: 'white',
  color: theme.palette.primary.main,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  textTransform: 'none',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 131, 14, 0.15)',
  },
  '& .MuiButton-startIcon': {
    marginRight: 10,
  },
  [theme.breakpoints.down('sm')]: {
    padding: '8px 14px',
    fontSize: '0.85rem',
  },
}));

const StyledPopover = styled(Popover)(({ theme }) => ({
  '& .MuiPopover-paper': {
    borderRadius: 16,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
}));

const PopoverHeader = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #00830e 0%, #4caf50 100%)',
  color: 'white',
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const PopoverContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  minWidth: 280,
}));

const WeekNavButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  borderRadius: 10,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
    transform: 'scale(1.1)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: 18,
    color: theme.palette.primary.main,
  },
}));

const DateDisplay = styled(Box)(({ theme }) => ({
  flex: 1,
  textAlign: 'center',
  padding: theme.spacing(1.5, 2),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  borderRadius: 12,
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const TodayChip = styled(Chip)(({ theme }) => ({
  marginTop: theme.spacing(2),
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 131, 14, 0.2)',
  },
}));

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

  const today = new Date();
  const isCurrentWeek = isSameWeek(semanaSeleccionada, today, { weekStartsOn: 1 });

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
  };

  // Función para ir a la semana actual
  const goToCurrentWeek = () => {
    setSemanaSeleccionada(startOfWeek(today, { weekStartsOn: 1 }));
    handleClose();
  };

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      <DateButton
        startIcon={<CalendarTodayIcon sx={{ fontSize: isMobile ? 18 : 20 }} />}
        onClick={handleOpen}
        size={isMobile ? 'small' : 'medium'}
      >
        {format(semanaSeleccionada, "d 'de' MMMM yyyy", { locale: es })}
      </DateButton>
      
      <StyledPopover
        open={datePickerOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <PopoverHeader>
          <CalendarTodayIcon />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Seleccionar Semana
          </Typography>
        </PopoverHeader>
        
        <PopoverContent>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item>
              <WeekNavButton onClick={() => handleChangeSemana(-1)} size="small">
                <ArrowBackIosNewIcon />
              </WeekNavButton>
            </Grid>
            <Grid item xs>
              <DateDisplay>
                {format(semanaSeleccionada, "d 'de' MMMM yyyy", { locale: es })}
              </DateDisplay>
            </Grid>
            <Grid item>
              <WeekNavButton onClick={() => handleChangeSemana(1)} size="small">
                <ArrowForwardIosIcon />
              </WeekNavButton>
            </Grid>
          </Grid>
          
          {!isCurrentWeek && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <TodayChip
                icon={<TodayIcon />}
                label="Ir a semana actual"
                color="primary"
                variant="outlined"
                onClick={goToCurrentWeek}
              />
            </Box>
          )}
        </PopoverContent>
      </StyledPopover>
    </Box>
  );
};

export default CustomDateSelector;
