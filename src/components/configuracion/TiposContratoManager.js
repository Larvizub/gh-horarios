import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import useTiposContrato from '../../hooks/useTiposContrato';
import { notify as toast } from '../../services/notify';
import { saveTiposContrato } from '../../services/tiposContratoService';
import { sanitizeTipoContratoKey, formatTipoContratoHoras } from '../../utils/tiposContrato';

const HIGHLIGHT_BLUE = '#dbeafe';
const MAX_RANGOS = 3;

const createEmptyRango = () => ({
  min: '',
  max: '',
});

const createEmptyForm = () => ({
  label: '',
  aplicaHoras: true,
  rangosHoras: Array.from({ length: MAX_RANGOS }, () => createEmptyRango()),
});

const EMPTY_FORM = createEmptyForm();

const formatPreviewRango = (rango) => {
  if (rango.min === rango.max) {
    return `${rango.max} horas exactas`;
  }

  return `${rango.min} a ${rango.max}h`;
};

const getHorasPreview = (form) => {
  if (form.aplicaHoras === false) {
    return 'Sin límite';
  }

  const rangos = (form.rangosHoras || [])
    .map((rango) => {
      const min = Number(rango.min);
      const max = Number(rango.max);

      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return null;
      }

      return {
        min: Math.min(min, max),
        max: Math.max(min, max),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.min - b.min || a.max - b.max);

  if (rangos.length === 0) {
    return '';
  }

  return rangos.map((rango) => formatPreviewRango(rango)).join(' o ');
};

const TiposContratoManager = () => {
  const { tipos, loadingTipos } = useTiposContrato();
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState(createEmptyForm());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const sortedTipos = useMemo(() => {
    return [...tipos].sort((a, b) => a.orden - b.orden);
  }, [tipos]);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingKey(null);
  };

  const openCreateModal = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    resetForm();
  };

  const handleEdit = (tipo) => {
    setEditingKey(tipo.key);
    const sourceRangos = Array.isArray(tipo.rangosHoras) && tipo.rangosHoras.length > 0
      ? tipo.rangosHoras
      : (tipo.aplicaHoras === false ? [] : [{ min: tipo.horasMinimas, max: tipo.horasMaximas }]);
    const rangosHoras = Array.from({ length: MAX_RANGOS }, () => createEmptyRango());

    sourceRangos.slice(0, MAX_RANGOS).forEach((rango, index) => {
      rangosHoras[index] = {
        min: String(rango.min ?? ''),
        max: String(rango.max ?? ''),
      };
    });

    setForm({
      label: tipo.label || '',
      aplicaHoras: tipo.aplicaHoras !== false,
      rangosHoras,
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    const label = form.label.trim();
    const aplicaHoras = form.aplicaHoras !== false;
    const rangosHoras = [];

    if (!label) {
      toast.error('El nombre del tipo es obligatorio.');
      return;
    }

    if (aplicaHoras) {
      for (let index = 0; index < MAX_RANGOS; index += 1) {
        const rango = form.rangosHoras?.[index] || {};
        const tieneMin = String(rango.min ?? '').trim() !== '';
        const tieneMax = String(rango.max ?? '').trim() !== '';

        if (!tieneMin && !tieneMax) {
          continue;
        }

        if (!tieneMin || !tieneMax) {
          toast.error(`Completa ambos valores del rango ${index + 1}.`);
          return;
        }

        const min = Number(rango.min);
        const max = Number(rango.max);

        if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= 0) {
          toast.error(`El rango ${index + 1} debe usar números mayores que cero.`);
          return;
        }

        rangosHoras.push({ min: Math.min(min, max), max: Math.max(min, max) });
      }

      if (rangosHoras.length === 0) {
        toast.error('Agrega al menos un rango de horas.');
        return;
      }

      const rangosOrdenados = [...rangosHoras].sort((a, b) => a.min - b.min || a.max - b.max);
      for (let index = 1; index < rangosOrdenados.length; index += 1) {
        if (rangosOrdenados[index].min <= rangosOrdenados[index - 1].max) {
          toast.error('Los rangos de horas no pueden superponerse.');
          return;
        }
      }

      rangosHoras.splice(0, rangosHoras.length, ...rangosOrdenados);
    }

    const key = sanitizeTipoContratoKey(label);
    if (!key) {
      toast.error('El nombre del tipo no genera una clave válida.');
      return;
    }

    const duplicate = sortedTipos.some((tipo) => {
      if (tipo.key === editingKey) {
        return false;
      }

      return tipo.key === key || tipo.label.toLowerCase() === label.toLowerCase();
    });

    if (duplicate) {
      toast.error('Ya existe un tipo con ese nombre.');
      return;
    }

    try {
      setSaving(true);

      const nextTipos = (() => {
        if (editingKey) {
          return sortedTipos.map((tipo) => {
            if (tipo.key !== editingKey) {
              return tipo;
            }

            const horasMinimas = aplicaHoras ? rangosHoras[0].min : 0;
            const horasMaximas = aplicaHoras ? rangosHoras[rangosHoras.length - 1].max : 0;

            return {
              ...tipo,
              horasMinimas,
              horasMaximas,
              rangosHoras: aplicaHoras ? rangosHoras : [],
              aplicaHoras,
            };
          });
        }

        const nextOrder = sortedTipos.length > 0 ? Math.max(...sortedTipos.map((tipo) => tipo.orden || 0)) + 1 : 1;
        const horasMinimas = aplicaHoras ? rangosHoras[0].min : 0;
        const horasMaximas = aplicaHoras ? rangosHoras[rangosHoras.length - 1].max : 0;

        return [
          ...sortedTipos,
          {
            key,
            label,
            horasMinimas,
            horasMaximas,
            rangosHoras: aplicaHoras ? rangosHoras : [],
            aplicaHoras,
            orden: nextOrder,
            editable: true,
          },
        ];
      })();

      await saveTiposContrato(nextTipos);

      const rangoDescripcion = getHorasPreview({ aplicaHoras, rangosHoras }) || 'Sin límite de horas';
      const detail = editingKey
        ? `Se actualizó "${label}" con ${rangoDescripcion}.`
        : `Se creó "${label}" con ${rangoDescripcion}.`;

      toast.success({
        title: editingKey ? 'Tipo de contrato actualizado' : 'Tipo de contrato creado',
        description: detail,
        duration: 6000,
        position: 'top-center',
        fill: HIGHLIGHT_BLUE,
        styles: {
          title: 'sileo-title-dark',
          description: 'sileo-description-dark',
          badge: 'sileo-badge-hidden',
        },
      });

      setFeedback({ type: 'success', text: detail });

      if (editingKey) {
        closeEditModal();
      } else {
        closeCreateModal();
      }
    } catch (error) {
      const message = `No se pudo guardar el tipo de contrato: ${error.message}`;
      setFeedback({ type: 'error', text: message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingTipos) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="body2" color="text.secondary">
          Cargando catálogo de tipos de contrato...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Tipos de Contrato
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Crea tipos nuevos o ajusta los rangos de horas semanales para cada contrato. Los rangos no pueden traslaparse; por ejemplo, el operativo puede quedar como 36 a 42 y 48 horas exactas.
      </Typography>

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Los tipos base del sistema se pueden editar en horas, pero no eliminar.
      </Alert>

      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{
            mb: 2,
            borderRadius: 2,
            backgroundColor: HIGHLIGHT_BLUE,
            color: '#1e3a8a',
            '& .MuiAlert-icon': {
              color: '#2563eb',
            },
          }}
          onClose={() => setFeedback(null)}
        >
          {feedback.text}
        </Alert>
      )}

      <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal} sx={{ mb: 2 }}>
        Crear nuevo
      </Button>

      <Dialog open={createModalOpen} onClose={closeCreateModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Crear nuevo tipo de contrato
          <IconButton
            onClick={closeCreateModal}
            aria-label="Cerrar creación"
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nombre del tipo"
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              helperText="Ejemplo: Jornada parcial"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.aplicaHoras === false}
                  onChange={(event) => setForm((current) => ({ ...current, aplicaHoras: !event.target.checked }))}
                />
              }
              label="No aplican horas dentro del rango"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1, mb: 0.5 }}>
              Ejemplo operativo: primer rango 36 a 42, segundo rango 48 horas exactas.
            </Typography>
            {form.aplicaHoras !== false && form.rangosHoras.map((rango, index) => (
              <Stack key={`rango-${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <TextField
                  fullWidth
                  label={`Rango ${index + 1} - horas mínimas`}
                  type="number"
                  value={rango.min}
                  onChange={(event) => setForm((current) => {
                    const rangosHorasActualizados = [...current.rangosHoras];
                    rangosHorasActualizados[index] = { ...rangosHorasActualizados[index], min: event.target.value };
                    return { ...current, rangosHoras: rangosHorasActualizados };
                  })}
                  inputProps={{ min: 1, step: 1 }}
                  helperText={index === 0 ? 'Ejemplo: 36' : 'Opcional'}
                />
                <TextField
                  fullWidth
                  label={`Rango ${index + 1} - horas máximas`}
                  type="number"
                  value={rango.max}
                  onChange={(event) => setForm((current) => {
                    const rangosHorasActualizados = [...current.rangosHoras];
                    rangosHorasActualizados[index] = { ...rangosHorasActualizados[index], max: event.target.value };
                    return { ...current, rangosHoras: rangosHorasActualizados };
                  })}
                  inputProps={{ min: 1, step: 1 }}
                  helperText={index === 0 ? 'Ejemplo: 42' : 'Opcional'}
                />
              </Stack>
            ))}
            <Chip
              label={`${form.label || 'Vista previa'}${getHorasPreview(form) ? ` · ${getHorasPreview(form)}` : ''}`}
              sx={{ border: '1px solid rgba(37, 99, 235, 0.24)', fontWeight: 600, alignSelf: 'flex-start' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeCreateModal} disabled={saving} variant="outlined">
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleSave} disabled={saving}>
            Crear tipo
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editModalOpen} onClose={closeEditModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Editar tipo de contrato
          <IconButton
            onClick={closeEditModal}
            aria-label="Cerrar edición"
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nombre del tipo"
              value={form.label}
              disabled
              helperText="La etiqueta no se modifica desde aquí"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.aplicaHoras === false}
                  onChange={(event) => setForm((current) => ({ ...current, aplicaHoras: !event.target.checked }))}
                />
              }
              label="No aplican horas dentro del rango"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1, mb: 0.5 }}>
              Ejemplo operativo: primer rango 36 a 42, segundo rango 48 horas exactas.
            </Typography>
            {form.aplicaHoras !== false && form.rangosHoras.map((rango, index) => (
              <Stack key={`edit-rango-${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                <TextField
                  fullWidth
                  label={`Rango ${index + 1} - horas mínimas`}
                  type="number"
                  value={rango.min}
                  onChange={(event) => setForm((current) => {
                    const rangosHorasActualizados = [...current.rangosHoras];
                    rangosHorasActualizados[index] = { ...rangosHorasActualizados[index], min: event.target.value };
                    return { ...current, rangosHoras: rangosHorasActualizados };
                  })}
                  inputProps={{ min: 1, step: 1 }}
                  helperText={index === 0 ? 'Ejemplo: 36' : 'Opcional'}
                />
                <TextField
                  fullWidth
                  label={`Rango ${index + 1} - horas máximas`}
                  type="number"
                  value={rango.max}
                  onChange={(event) => setForm((current) => {
                    const rangosHorasActualizados = [...current.rangosHoras];
                    rangosHorasActualizados[index] = { ...rangosHorasActualizados[index], max: event.target.value };
                    return { ...current, rangosHoras: rangosHorasActualizados };
                  })}
                  inputProps={{ min: 1, step: 1 }}
                  helperText={index === 0 ? 'Ejemplo: 42' : 'Opcional'}
                />
              </Stack>
            ))}
            <Chip
              label={`${form.label || 'Vista previa'}${getHorasPreview(form) ? ` · ${getHorasPreview(form)}` : ''}`}
              sx={{ border: '1px solid rgba(37, 99, 235, 0.24)', fontWeight: 600, alignSelf: 'flex-start' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeEditModal} disabled={saving} variant="outlined">
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>

      <Divider sx={{ my: 2.5 }} />

      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
        Catálogo actual ({sortedTipos.length})
      </Typography>

      <Stack spacing={1.25}>
        {sortedTipos.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Todavía no hay tipos de contrato creados.
          </Alert>
        ) : (
          sortedTipos.map((tipo) => (
            <Paper
              key={tipo.key}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                borderColor: alpha('#2563eb', 0.18),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                  {tipo.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tipo.key}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                <Chip size="small" label={formatTipoContratoHoras(tipo.key, undefined)} color="primary" variant="outlined" />
                {!tipo.editable && <Chip size="small" label="Base" color="success" variant="outlined" />}
                <IconButton size="small" onClick={() => handleEdit(tipo)} aria-label={`Editar ${tipo.label}`}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))
        )}
      </Stack>
    </Box>
  );
};

export default TiposContratoManager;
