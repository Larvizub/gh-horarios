import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
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
import { sanitizeTipoContratoKey } from '../../utils/tiposContrato';

const HIGHLIGHT_BLUE = '#dbeafe';

const EMPTY_FORM = {
  label: '',
  horasMaximas: '',
};

const TiposContratoManager = () => {
  const { tipos, loadingTipos } = useTiposContrato();
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const sortedTipos = useMemo(() => {
    return [...tipos].sort((a, b) => a.orden - b.orden);
  }, [tipos]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
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
    setForm({
      label: tipo.label || '',
      horasMaximas: String(tipo.horasMaximas ?? ''),
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    const label = form.label.trim();
    const horasMaximas = Number(form.horasMaximas);

    if (!label) {
      toast.error('El nombre del tipo es obligatorio.');
      return;
    }

    if (!Number.isFinite(horasMaximas) || horasMaximas <= 0) {
      toast.error('Las horas máximas deben ser un número mayor que cero.');
      return;
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

            return {
              ...tipo,
              horasMaximas,
            };
          });
        }

        const nextOrder = sortedTipos.length > 0 ? Math.max(...sortedTipos.map((tipo) => tipo.orden || 0)) + 1 : 1;

        return [
          ...sortedTipos,
          {
            key,
            label,
            horasMaximas,
            orden: nextOrder,
            editable: true,
          },
        ];
      })();

      await saveTiposContrato(nextTipos);

      const detail = editingKey
        ? `Se actualizó "${label}" con ${horasMaximas} horas máximas.`
        : `Se creó "${label}" con ${horasMaximas} horas máximas.`;

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
        Crea tipos nuevos o ajusta las horas máximas para cada contrato.
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
            <TextField
              fullWidth
              label="Horas máximas semanales"
              type="number"
              value={form.horasMaximas}
              onChange={(event) => setForm((current) => ({ ...current, horasMaximas: event.target.value }))}
              inputProps={{ min: 1, step: 1 }}
              helperText="Ejemplo: 30"
            />
            <Chip
              label={`${form.label || 'Vista previa'}${form.horasMaximas ? ` · ${form.horasMaximas} horas` : ''}`}
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
            <TextField
              fullWidth
              label="Horas máximas semanales"
              type="number"
              value={form.horasMaximas}
              onChange={(event) => setForm((current) => ({ ...current, horasMaximas: event.target.value }))}
              inputProps={{ min: 1, step: 1 }}
              helperText="Modifica el límite de horas para este tipo"
            />
            <Chip
              label={`${form.label || 'Vista previa'}${form.horasMaximas ? ` · ${form.horasMaximas} horas` : ''}`}
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
                <Chip size="small" label={`${tipo.horasMaximas} horas`} color="primary" variant="outlined" />
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
