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

const normalizeDigits = (value = '') => String(value).replace(/\D/g, '').slice(0, 4);

const sanitizeRawTime = (value = '') => String(value).replace(/[^\d:]/g, '');

export const parseMilitaryTimeValue = (value = '') => {
  const raw = sanitizeRawTime(value);

  if (!raw) return null;

  if (raw.includes(':')) {
    const [hoursPart = '', minutesPart = ''] = raw.split(':');
    const hoursDigits = hoursPart.replace(/\D/g, '').slice(0, 2);
    const minutesDigits = minutesPart.replace(/\D/g, '').slice(0, 2);

    if (!hoursDigits && !minutesDigits) {
      return null;
    }

    const hours = hoursDigits.padStart(2, '0');
    const minutes = minutesDigits.padEnd(2, '0');
    const hoursNumber = Number(hours);
    const minutesNumber = Number(minutes);

    if (hoursNumber > 23 || minutesNumber > 59) {
      return null;
    }

    return { hours, minutes };
  }

  const digits = normalizeDigits(raw);
  if (!digits) return null;

  if (digits.length <= 2) {
    const hoursNumber = Number(digits);
    if (hoursNumber > 23) {
      return null;
    }

    return {
      hours: String(hoursNumber).padStart(2, '0'),
      minutes: '00',
    };
  }

  const padded = digits.length === 3 ? digits.padStart(4, '0') : digits.slice(0, 4);
  const hours = padded.slice(0, 2);
  const minutes = padded.slice(2, 4);
  const hoursNumber = Number(hours);
  const minutesNumber = Number(minutes);

  if (hoursNumber > 23 || minutesNumber > 59) {
    return null;
  }

  return { hours, minutes };
};

const formatMilitaryTime = (timeParts) => {
  if (!timeParts) return '';
  return `${timeParts.hours}:${timeParts.minutes}`;
};

const formatDisplayValue = (value = '') => {
  const raw = sanitizeRawTime(value);

  if (!raw) return '';

  if (raw.includes(':')) {
    const [hoursPart = '', minutesPart = ''] = raw.split(':');
    const hours = hoursPart.replace(/\D/g, '').slice(0, 2);
    const minutes = minutesPart.replace(/\D/g, '').slice(0, 2);

    if (raw.endsWith(':') && minutes.length === 0) {
      return `${hours}:`;
    }

    return `${hours}${hours ? ':' : ''}${minutes}`;
  }

  const digits = normalizeDigits(raw);
  if (!digits) return '';

  if (digits.length <= 2) {
    const hoursNumber = Number(digits);
    return hoursNumber <= 23 && digits.length === 2 ? `${digits}:` : digits;
  }

  const parsedTime = parseMilitaryTimeValue(raw);
  if (parsedTime) {
    return formatMilitaryTime(parsedTime);
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

export const completeTimeValue = (value = '') => {
  return formatMilitaryTime(parseMilitaryTimeValue(value));
};

const TimeInput = ({ label, value, onChange, isMobile, helperText = '' }) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const rawValue = e.target.value;
    const displayValue = formatDisplayValue(rawValue);
    setLocalValue(displayValue);

    const digits = normalizeDigits(rawValue);
    const hasManualColon = sanitizeRawTime(rawValue).includes(':');
    const minuteDigits = hasManualColon ? sanitizeRawTime(rawValue).split(':')[1]?.replace(/\D/g, '').length || 0 : 0;
    const parsedTime = parseMilitaryTimeValue(rawValue);

    if ((digits.length === 3 || digits.length === 4 || (hasManualColon && minuteDigits >= 2)) && parsedTime) {
      onChange({ target: { value: formatMilitaryTime(parsedTime) } });
    }
  };

  const handleBlur = () => {
    const completeValue = completeTimeValue(localValue);

    if (completeValue) {
      setLocalValue(completeValue);
      onChange({ target: { value: completeValue } });
      return;
    }

    setLocalValue(value || '');
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
      helperText={helperText}
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
