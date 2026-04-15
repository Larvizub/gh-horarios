import React from 'react';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import { formatTipoContratoHoras, getTipoContratoColorPalette, getTipoContratoLabel } from '../../utils/tiposContrato';

const TipoContratoChip = ({
  value,
  tiposMap = null,
  label,
  showRange = false,
  size = 'small',
  variant = 'outlined',
  sx = {},
  ...props
}) => {
  const palette = getTipoContratoColorPalette(value, tiposMap);
  const chipLabel = label || getTipoContratoLabel(value, tiposMap) || '';
  const rangeLabel = showRange ? formatTipoContratoHoras(value, tiposMap) : '';

  return (
    <Chip
      label={(
        <span>
          <Typography component="span" sx={{ display: 'block', width: '100%', textAlign: 'center', fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.1 }}>
            {chipLabel}
          </Typography>
          {rangeLabel && (
            <Typography component="span" sx={{ display: 'block', width: '100%', textAlign: 'center', fontSize: '0.62rem', fontWeight: 700, lineHeight: 1.05, mt: 0.15, opacity: 0.85 }}>
              {rangeLabel}
            </Typography>
          )}
        </span>
      )}
      size={size}
      variant={variant}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        fontWeight: 700,
        borderRadius: 999,
        color: palette.dark,
        bgcolor: alpha('#ffffff', 0.96),
        borderColor: alpha(palette.main, 0.22),
        borderWidth: 1,
        borderStyle: 'solid',
        minHeight: 34,
        height: 'auto',
        justifyContent: 'center',
        alignItems: 'center',
        '& .MuiChip-label': {
          display: 'block',
          px: 1.35,
          py: 0.55,
          whiteSpace: 'normal',
          lineHeight: 1,
          textAlign: 'center',
        },
        boxShadow: `inset 0 0 0 1px ${alpha(palette.main, 0.04)}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          background: `linear-gradient(180deg, ${palette.main}, ${palette.dark})`,
        },
        ...sx,
      }}
      {...props}
    />
  );
};

export default TipoContratoChip;