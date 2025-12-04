import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Styled TextField
const StyledTimeField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'white',
    },
    '&.Mui-focused': {
      backgroundColor: 'white',
      boxShadow: '0 0 0 3px rgba(0, 131, 14, 0.1)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
  '& .MuiInputBase-input': {
    fontWeight: 500,
    letterSpacing: '0.5px',
  },
}));

const TimeInput = ({ label, value, onChange, isMobile }) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Propaga cuando el valor es válido (soporta 4 o 5 caracteres: 8:30 o 08:30)
    if (timeRegex.test(newValue)) {
      onChange({ target: { value: newValue } });
    }
  };

  const handleBlur = () => {
    // En blur, si es válido, asegura la propagación al padre
    if (timeRegex.test(localValue)) {
      onChange({ target: { value: localValue } });
    }
  };

  return (
    <StyledTimeField
      label={label}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="HH:mm"
      InputLabelProps={{ shrink: true }}
      fullWidth
      size={isMobile ? 'small' : 'medium'}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          </InputAdornment>
        ),
      }}
      sx={{ 
        mb: 2,
        '& .MuiInputBase-input': {
          fontSize: isMobile ? '0.875rem' : '1rem'
        }
      }}
    />
  );
};

export default TimeInput;
