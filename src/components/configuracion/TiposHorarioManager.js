import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  IconButton,
  Typography
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';
import { notify as toast } from '../../services/notify';
import useTiposHorario from '../../hooks/useTiposHorario';
import { saveTiposHorario } from '../../services/tiposHorarioService';
import {
  getTipoIconComponent,
  sanitizeTipoKey,
  TIPO_ICON_OPTIONS,
  TIPO_TEMPLATES
} from '../../utils/tiposHorario';

const HIGHLIGHT_YELLOW = '#fff59d';

const TEMPLATES_OPTIONS = [
  { value: TIPO_TEMPLATES.SIMPLE, label: 'Horario simple (inicio-fin)' },
  { value: TIPO_TEMPLATES.SIN_HORAS, label: 'Sin horas (solo etiqueta)' },
  { value: TIPO_TEMPLATES.TARDE_LIBRE, label: 'Media jornada libre' },
  { value: TIPO_TEMPLATES.TELE_MEDIA_LIBRE, label: 'Teletrabajo + media jornada libre' },
  { value: TIPO_TEMPLATES.TELE_PRESENCIAL, label: 'Teletrabajo + presencial' },
  { value: TIPO_TEMPLATES.HORARIO_DIVIDIDO, label: 'Horario dividido' },
  { value: TIPO_TEMPLATES.VIAJE_TRABAJO, label: 'Viaje de trabajo (08:00 - 18:00)' }
];

const EMPTY_FORM = {
  key: '',
  label: '',
  icon: 'Work',
  color: '#00830e',
  template: TIPO_TEMPLATES.SIMPLE,
  noSumaHoras: false,
  esBeneficio: false,
  horasCredito: ''
};

const TiposHorarioManager = () => {
  const { tipos, loadingTipos } = useTiposHorario();
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const sortedTipos = useMemo(() => {
    return [...tipos].sort((a, b) => a.orden - b.orden);
  }, [tipos]);

  const tiposQueSuman = useMemo(() => {
    return sortedTipos.filter((tipo) => !tipo.noSumaHoras);
  }, [sortedTipos]);

  const tiposQueNoSuman = useMemo(() => {
    return sortedTipos.filter((tipo) => Boolean(tipo.noSumaHoras));
  }, [sortedTipos]);

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

  const handleKeyChange = (event) => {
    setForm((prev) => ({
      ...prev,
      key: sanitizeTipoKey(event.target.value)
    }));
  };

  const handleEdit = (tipo) => {
    setEditingKey(tipo.key);
    setForm({
      key: tipo.key,
      label: tipo.label,
      icon: tipo.icon,
      color: tipo.color,
      template: tipo.template,
      noSumaHoras: Boolean(tipo.noSumaHoras),
      esBeneficio: Boolean(tipo.esBeneficio),
      horasCredito: Number.isFinite(tipo.horasCredito) ? String(tipo.horasCredito) : ''
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!form.key || !form.label) {
      toast.error('La clave y la etiqueta son obligatorias.');
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(form.color)) {
      toast.error('El color debe ser hexadecimal, por ejemplo: #00830e');
      return;
    }

    try {
      setSaving(true);
      const found = sortedTipos.find((tipo) => tipo.key === form.key);
      const existsAndNotEditing = Boolean(found && found.key !== editingKey);

      if (existsAndNotEditing) {
        toast.error('La clave ya existe. Usa una diferente.');
        return;
      }

      const nextTipos = (() => {
        if (editingKey) {
          return sortedTipos.map((tipo) => {
            if (tipo.key !== editingKey) return tipo;
            return {
              ...tipo,
              label: form.label,
              icon: form.icon,
              color: form.color,
              template: form.template,
              esBeneficio: form.esBeneficio,
              noSumaHoras: form.esBeneficio ? false : form.noSumaHoras,
              horasCredito: form.esBeneficio ? (Number(form.horasCredito) || 0) : null
            };
          });
        }

        const nextOrder = sortedTipos.length > 0 ? Math.max(...sortedTipos.map((t) => t.orden || 0)) + 1 : 1;
        return [
          ...sortedTipos,
          {
            key: form.key,
            label: form.label,
            icon: form.icon,
            color: form.color,
            template: form.template,
            esBeneficio: form.esBeneficio,
            noSumaHoras: form.esBeneficio ? false : form.noSumaHoras,
            horasCredito: form.esBeneficio ? (Number(form.horasCredito) || 0) : null,
            orden: nextOrder,
            editable: true
          }
        ];
      })();

      await saveTiposHorario(nextTipos);

      if (editingKey) {
        const templateLabel = TEMPLATES_OPTIONS.find((item) => item.value === form.template)?.label || form.template;
        const detail = `Se actualizo "${form.label}" (${form.key}). Icono: ${form.icon}. Color: ${form.color}. Plantilla: ${templateLabel}. ${form.esBeneficio ? `Marcado como beneficio${form.esBeneficio && form.horasCredito ? ` (${form.horasCredito}h acreditadas)` : ''}.` : ''} ${form.noSumaHoras && !form.esBeneficio ? 'No suma horas.' : 'Si suma horas.'}`;
        toast.success({
          title: 'Tipo de horario actualizado',
          description: detail,
          duration: 7000,
          position: 'top-center',
          fill: HIGHLIGHT_YELLOW,
          styles: {
            title: 'sileo-title-dark',
            description: 'sileo-description-dark',
            badge: 'sileo-badge-hidden',
          },
        });
        setFeedback({ type: 'success', text: detail });
        closeEditModal();
      } else {
        const detail = `Se creo "${form.label}" con clave "${form.key}".`;
        toast.success({
          title: 'Tipo de horario creado',
          description: detail,
          duration: 6000,
          position: 'top-center',
          fill: HIGHLIGHT_YELLOW,
          styles: {
            title: 'sileo-title-dark',
            description: 'sileo-description-dark',
            badge: 'sileo-badge-hidden',
          },
        });
        setFeedback({ type: 'success', text: detail });
        closeCreateModal();
      }
    } catch (error) {
      setFeedback({ type: 'error', text: `No se pudo guardar el tipo: ${error.message}` });
      toast.error(`No se pudo guardar el tipo: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingTipos) {
    return (
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Typography variant="body2" color="text.secondary">Cargando catálogo de tipos...</Typography>
      </Paper>
    );
  }

  const PreviewIcon = getTipoIconComponent(form.icon);

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Tipos de Horario
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Aquí puedes crear tipos nuevos y editar sus etiquetas, iconos, color y comportamiento de horas.
      </Typography>

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Los tipos base del sistema se pueden editar, pero no eliminar.
      </Alert>

      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{
            mb: 2,
            borderRadius: 2,
            backgroundColor: HIGHLIGHT_YELLOW,
            color: '#4a3b00',
            '& .MuiAlert-icon': {
              color: '#7a5a00'
            }
          }}
          onClose={() => setFeedback(null)}
        >
          {feedback.text}
        </Alert>
      )}

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={openCreateModal}
        sx={{ mb: 2 }}
      >
        Crear nuevo
      </Button>

      <Dialog
        open={createModalOpen}
        onClose={closeCreateModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Crear nuevo tipo de horario
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
              label="Clave"
              value={form.key}
              onChange={handleKeyChange}
              helperText="Ejemplo: capacitacion-interna"
            />
            <TextField
              fullWidth
              label="Etiqueta"
              value={form.label}
              onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
              helperText="Texto que verá el usuario"
            />
            <FormControl fullWidth>
              <InputLabel>Icono</InputLabel>
              <Select
                value={form.icon}
                label="Icono"
                onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
              >
                {TIPO_ICON_OPTIONS.map((iconOption) => (
                  <MenuItem key={iconOption.value} value={iconOption.value}>{iconOption.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Color"
              value={form.color}
              onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
              helperText="Formato hexadecimal #RRGGBB"
            />
            <FormControl fullWidth>
              <InputLabel>Plantilla</InputLabel>
              <Select
                value={form.template}
                label="Plantilla"
                onChange={(event) => setForm((prev) => ({ ...prev, template: event.target.value }))}
              >
                {TEMPLATES_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.noSumaHoras}
                    onChange={(event) => setForm((prev) => ({ ...prev, noSumaHoras: event.target.checked }))}
                    disabled={form.esBeneficio}
                  />
                }
                label="No suma horas"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.esBeneficio}
                    onChange={(event) => setForm((prev) => ({
                      ...prev,
                      esBeneficio: event.target.checked,
                      noSumaHoras: event.target.checked ? false : prev.noSumaHoras,
                      horasCredito: event.target.checked ? (prev.horasCredito || '8') : prev.horasCredito
                    }))}
                  />
                }
                label="Es beneficio"
              />
              {form.esBeneficio && (
                <TextField
                  label="Horas acreditadas"
                  type="number"
                  inputProps={{ min: 0, step: 0.1 }}
                  value={form.horasCredito}
                  onChange={(event) => setForm((prev) => ({ ...prev, horasCredito: event.target.value }))}
                  helperText="Horas que sumará este tipo al guardarlo"
                  sx={{ maxWidth: 220 }}
                />
              )}
              <Chip
                icon={<PreviewIcon style={{ color: form.color }} />}
                label={form.label || 'Vista previa'}
                sx={{ border: `1px solid ${alpha(form.color, 0.4)}`, fontWeight: 600 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeCreateModal} disabled={saving} variant="outlined">
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            Crear tipo
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editModalOpen}
        onClose={closeEditModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Editar tipo de horario
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
              label="Clave"
              value={form.key}
              disabled
              helperText="La clave no se puede cambiar al editar"
            />
            <TextField
              fullWidth
              label="Etiqueta"
              value={form.label}
              onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
              helperText="Texto que verá el usuario"
            />
            <FormControl fullWidth>
              <InputLabel>Icono</InputLabel>
              <Select
                value={form.icon}
                label="Icono"
                onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
              >
                {TIPO_ICON_OPTIONS.map((iconOption) => (
                  <MenuItem key={iconOption.value} value={iconOption.value}>{iconOption.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Color"
              value={form.color}
              onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
              helperText="Formato hexadecimal #RRGGBB"
            />
            <FormControl fullWidth>
              <InputLabel>Plantilla</InputLabel>
              <Select
                value={form.template}
                label="Plantilla"
                onChange={(event) => setForm((prev) => ({ ...prev, template: event.target.value }))}
              >
                {TEMPLATES_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.noSumaHoras}
                    onChange={(event) => setForm((prev) => ({ ...prev, noSumaHoras: event.target.checked }))}
                    disabled={form.esBeneficio}
                  />
                }
                label="No suma horas"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.esBeneficio}
                    onChange={(event) => setForm((prev) => ({
                      ...prev,
                      esBeneficio: event.target.checked,
                      noSumaHoras: event.target.checked ? false : prev.noSumaHoras,
                      horasCredito: event.target.checked ? (prev.horasCredito || '8') : prev.horasCredito
                    }))}
                  />
                }
                label="Es beneficio"
              />
              {form.esBeneficio && (
                <TextField
                  label="Horas acreditadas"
                  type="number"
                  inputProps={{ min: 0, step: 0.1 }}
                  value={form.horasCredito}
                  onChange={(event) => setForm((prev) => ({ ...prev, horasCredito: event.target.value }))}
                  helperText="Horas que sumará este tipo al guardarlo"
                  sx={{ maxWidth: 220 }}
                />
              )}
              <Chip
                icon={<PreviewIcon style={{ color: form.color }} />}
                label={form.label || 'Vista previa'}
                sx={{ border: `1px solid ${alpha(form.color, 0.4)}`, fontWeight: 600 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeEditModal} disabled={saving} variant="outlined">
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>

      <Divider sx={{ my: 2.5 }} />

      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
        Catálogo actual ({sortedTipos.length})
      </Typography>
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, color: 'text.secondary' }}>
            Suman horas ({tiposQueSuman.length})
          </Typography>
          <Stack spacing={1.25}>
            {tiposQueSuman.map((tipo) => {
          const Icon = getTipoIconComponent(tipo.icon);
          return (
            <Paper
              key={tipo.key}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                borderColor: alpha(tipo.color || '#00830e', 0.3),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                <Icon sx={{ color: tipo.color || '#00830e' }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {tipo.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tipo.key}
                  </Typography>
                </Box>
                {tipo.esBeneficio && (
                  <Chip size="small" label="Beneficio" color="warning" variant="outlined" />
                )}
                {tipo.noSumaHoras && (
                  <Chip size="small" label="No suma horas" color="default" />
                )}
                {!tipo.editable && (
                  <Chip size="small" label="Base" color="success" variant="outlined" />
                )}
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => handleEdit(tipo)}
                  aria-label={`Editar ${tipo.label}`}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          );
            })}
          </Stack>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, color: 'text.secondary' }}>
            No suman horas ({tiposQueNoSuman.length})
          </Typography>
          <Stack spacing={1.25}>
            {tiposQueNoSuman.map((tipo) => {
          const Icon = getTipoIconComponent(tipo.icon);
          return (
            <Paper
              key={tipo.key}
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2,
                borderColor: alpha(tipo.color || '#00830e', 0.3),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
              }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                <Icon sx={{ color: tipo.color || '#00830e' }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {tipo.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tipo.key}
                  </Typography>
                </Box>
                <Chip size="small" label="No suma horas" color="default" />
                {!tipo.editable && (
                  <Chip size="small" label="Base" color="success" variant="outlined" />
                )}
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => handleEdit(tipo)}
                  aria-label={`Editar ${tipo.label}`}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          );
            })}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default TiposHorarioManager;
