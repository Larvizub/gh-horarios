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
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { notify as toast } from '../../services/notify';
import { getFeriadosAnio, saveFeriadosAnio } from '../../services/feriadosService';
import useFeriados from '../../hooks/useFeriados';
import {
  cambiarAnioFeriado,
  formatFeriadoFecha,
  sanitizeFeriadoFecha,
} from '../../utils/feriados';

const HIGHLIGHT_BLUE = '#dbeafe';

const buildEmptyForm = (anio = new Date().getFullYear()) => ({
  fecha: `${anio}-01-01`,
  label: '',
  observacion: '',
  activo: true,
});

const sortFeriados = (items) => {
  return [...items].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }));
};

const FeriadosManager = () => {
  const anioActual = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 7 }, (_, index) => anioActual - 2 + index), [anioActual]);
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
  const { feriados, loadingFeriados } = useFeriados(anioSeleccionado);
  const [form, setForm] = useState(buildEmptyForm(anioActual));
  const [editingKey, setEditingKey] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const sortedFeriados = useMemo(() => sortFeriados(feriados), [feriados]);

  const resetForm = (anio = anioSeleccionado) => {
    setForm(buildEmptyForm(anio));
    setEditingKey(null);
  };

  const openCreateModal = () => {
    resetForm(anioSeleccionado);
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    resetForm(anioSeleccionado);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    resetForm(anioSeleccionado);
  };

  const handleEdit = (feriado) => {
    setEditingKey(feriado.fecha);
    setForm({
      fecha: feriado.fecha || `${anioSeleccionado}-01-01`,
      label: feriado.label || '',
      observacion: feriado.observacion || '',
      activo: feriado.activo !== false,
    });
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    const fecha = sanitizeFeriadoFecha(form.fecha);
    const label = form.label.trim();
    const observacion = form.observacion.trim();

    if (!fecha) {
      toast.error('Selecciona una fecha válida.');
      return;
    }

    if (!fecha.startsWith(String(anioSeleccionado))) {
      toast.error('La fecha debe pertenecer al año seleccionado.');
      return;
    }

    if (!label) {
      toast.error('El nombre del feriado es obligatorio.');
      return;
    }

    const duplicate = sortedFeriados.some((feriado) => feriado.fecha === fecha && feriado.fecha !== editingKey);
    if (duplicate) {
      toast.error('Ya existe un feriado para esa fecha.');
      return;
    }

    const base = editingKey
      ? sortedFeriados.filter((feriado) => feriado.fecha !== editingKey)
      : [...sortedFeriados];

    const nextFeriados = sortFeriados([
      ...base,
      {
        fecha,
        label,
        observacion,
        activo: form.activo !== false,
        orden: base.length > 0 ? Math.max(...base.map((item) => item.orden || 0)) + 1 : 1,
        editable: true,
      },
    ]);

    try {
      setSaving(true);
      await saveFeriadosAnio(anioSeleccionado, nextFeriados);

      const message = editingKey
        ? `Se actualizó "${label}" para ${formatFeriadoFecha(fecha)}.`
        : `Se creó "${label}" para ${formatFeriadoFecha(fecha)}.`;

      setFeedback({ type: 'success', text: message });
      toast.success({
        title: editingKey ? 'Feriado actualizado' : 'Feriado creado',
        description: message,
      });

      if (editingKey) {
        closeEditModal();
      } else {
        closeCreateModal();
      }
    } catch (error) {
      const message = `No se pudo guardar el feriado: ${error.message}`;
      setFeedback({ type: 'error', text: message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPreviousYear = async () => {
    try {
      setSaving(true);
      const previousYear = anioSeleccionado - 1;
      const previousCatalog = await getFeriadosAnio(previousYear);
      const mergedMap = new Map(sortedFeriados.map((feriado) => [feriado.fecha, feriado]));

      previousCatalog.feriados.forEach((feriado) => {
        const fecha = cambiarAnioFeriado(feriado.fecha, anioSeleccionado);
        if (!fecha || mergedMap.has(fecha)) {
          return;
        }

        mergedMap.set(fecha, {
          ...feriado,
          fecha,
          activo: feriado.activo !== false,
          editable: true,
        });
      });

      await saveFeriadosAnio(anioSeleccionado, sortFeriados(Array.from(mergedMap.values())));
      toast.success('Se copiaron los feriados del año anterior.');
    } catch (error) {
      toast.error(`No se pudo copiar el año anterior: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (feriado) => {
    try {
      setSaving(true);
      const nextFeriados = sortedFeriados.filter((item) => item.fecha !== feriado.fecha);
      await saveFeriadosAnio(anioSeleccionado, nextFeriados);
      toast.success('Feriado eliminado correctamente.');
    } catch (error) {
      toast.error(`No se pudo eliminar el feriado: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingFeriados) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="body2" color="text.secondary">
          Cargando catálogo de feriados...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Feriados por Año
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define los feriados oficiales por año para que el control mensual use el calendario real.
      </Typography>

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Los feriados configurados reducen la meta estimada del mes y ayudan a evitar saldos falsos.
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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          select
          fullWidth
          label="Año"
          value={anioSeleccionado}
          onChange={(event) => {
            const nextYear = Number(event.target.value);
            setAnioSeleccionado(nextYear);
            resetForm(nextYear);
            setCreateModalOpen(false);
            setEditModalOpen(false);
          }}
        >
          {years.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </TextField>

        <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopyPreviousYear} disabled={saving}>
          Copiar año anterior
        </Button>

        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal} disabled={saving}>
          Crear feriado
        </Button>
      </Stack>

      <Dialog open={createModalOpen} onClose={closeCreateModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Crear feriado
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
              label="Fecha"
              type="date"
              value={form.fecha}
              onChange={(event) => setForm((current) => ({ ...current, fecha: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              helperText={`Debe corresponder al año ${anioSeleccionado}`}
            />
            <TextField
              fullWidth
              label="Nombre"
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              helperText="Ejemplo: Viernes Santo"
            />
            <TextField
              fullWidth
              label="Observación"
              value={form.observacion}
              onChange={(event) => setForm((current) => ({ ...current, observacion: event.target.value }))}
              helperText="Opcional"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.activo !== false}
                  onChange={(event) => setForm((current) => ({ ...current, activo: event.target.checked }))}
                />
              }
              label="Activo"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeCreateModal} disabled={saving} variant="outlined">
            Cancelar
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
            Guardar feriado
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editModalOpen} onClose={closeEditModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Editar feriado
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
              label="Fecha"
              type="date"
              value={form.fecha}
              onChange={(event) => setForm((current) => ({ ...current, fecha: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              helperText={`Debe corresponder al año ${anioSeleccionado}`}
            />
            <TextField
              fullWidth
              label="Nombre"
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
            />
            <TextField
              fullWidth
              label="Observación"
              value={form.observacion}
              onChange={(event) => setForm((current) => ({ ...current, observacion: event.target.value }))}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.activo !== false}
                  onChange={(event) => setForm((current) => ({ ...current, activo: event.target.checked }))}
                />
              }
              label="Activo"
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
        Feriados del {anioSeleccionado} ({sortedFeriados.length})
      </Typography>

      <Stack spacing={1.25}>
        {sortedFeriados.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Todavía no hay feriados configurados para este año.
          </Alert>
        ) : (
          sortedFeriados.map((feriado) => (
            <Paper
              key={feriado.fecha}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                borderColor: alpha('#2563eb', 0.18),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                opacity: feriado.activo === false ? 0.72 : 1,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                  {feriado.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {formatFeriadoFecha(feriado.fecha)} · {feriado.fecha}
                </Typography>
                {feriado.observacion && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    {feriado.observacion}
                  </Typography>
                )}
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, flexWrap: 'wrap' }}>
                <Chip size="small" label={feriado.activo === false ? 'Inactivo' : 'Activo'} variant="outlined" />
                <IconButton size="small" onClick={() => handleEdit(feriado)} aria-label={`Editar ${feriado.label}`}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(feriado)}
                  aria-label={`Eliminar ${feriado.label}`}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))
        )}
      </Stack>
    </Box>
  );
};

export default FeriadosManager;
