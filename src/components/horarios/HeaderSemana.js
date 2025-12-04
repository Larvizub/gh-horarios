import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem, Box, IconButton } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { useTheme, useMediaQuery } from '@mui/material';
import CustomDateSelector from './CustomDateSelector';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BusinessIcon from '@mui/icons-material/Business';

// Styled Components
const HeaderContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  background: 'linear-gradient(to right, rgba(0, 131, 14, 0.02), rgba(0, 131, 14, 0.05))',
  borderBottom: '1px solid rgba(0, 131, 14, 0.1)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5, 2),
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'white',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(0, 131, 14, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
}));

const NavButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 131, 14, 0.15)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
  },
}));

const NavigationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'center',
  justifyContent: 'flex-end',
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'center',
    marginTop: theme.spacing(1),
  },
}));

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
    <HeaderContainer>
      <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <StyledFormControl fullWidth size={isMobile ? 'small' : 'medium'}>
            <InputLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <BusinessIcon sx={{ fontSize: 18 }} />
                Departamento
              </Box>
            </InputLabel>
            <Select 
              value={departamentoSeleccionado} 
              onChange={(e) => setDepartamentoSeleccionado(e.target.value)} 
              disabled={loading}
              label="Departamento"
            >
              {departamentos.map((depto) => (
                <MenuItem key={depto} value={depto}>{depto}</MenuItem>
              ))}
            </Select>
          </StyledFormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={8}>
          <NavigationContainer>
            <NavButton 
              onClick={retrocederSemana} 
              disabled={loading} 
              size={isMobile ? 'small' : 'medium'}
            >
              <ChevronLeftIcon />
            </NavButton>
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
            <NavButton 
              onClick={avanzarSemana} 
              disabled={loading} 
              size={isMobile ? 'small' : 'medium'}
            >
              <ChevronRightIcon />
            </NavButton>
          </NavigationContainer>
        </Grid>
      </Grid>
    </HeaderContainer>
  );
}
