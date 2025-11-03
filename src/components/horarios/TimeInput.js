import React, { useState, useEffect } from 'react';
import { TextField } from '@mui/material';

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
    <TextField
      label={label}
      value={localValue}
  onChange={handleChange}
  onBlur={handleBlur}
      placeholder="Escribe en formato HH:mm"
      InputLabelProps={{ shrink: true }}
      fullWidth
      size={isMobile ? 'small' : 'medium'}
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
