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

const USO_PERIODO_OPTIONS = [
  { value: '', label: 'Sin límite' },
  { value: 'mes', label: '1 vez por mes' },
  { value: 'anio', label: '1 vez por año' },
];

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
  horasCredito: '',
  limiteUsoPeriodo: '',
  limiteUsoCantidad: '',
  requiereMesNacimiento: false,
};

const TiposHorarioManager = () => {
  const { tipos, loadingTipos } = useTiposHorario();
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [colorPickerValue, setColorPickerValue] = useState(form.color || '#00830e');

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
      horasCredito: Number.isFinite(tipo.horasCredito) ? String(tipo.horasCredito) : '',
      limiteUsoPeriodo: tipo.limiteUsoPeriodo || '',
      limiteUsoCantidad: Number.isFinite(tipo.limiteUsoCantidad) ? String(tipo.limiteUsoCantidad) : '',
      requiereMesNacimiento: Boolean(tipo.requiereMesNacimiento),
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
              horasCredito: form.esBeneficio ? (Number(form.horasCredito) || 0) : null,
              limiteUsoPeriodo: form.limiteUsoPeriodo || null,
              limiteUsoCantidad: form.limiteUsoPeriodo ? (Number(form.limiteUsoCantidad) || 1) : null,
              requiereMesNacimiento: Boolean(form.requiereMesNacimiento),
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
            limiteUsoPeriodo: form.limiteUsoPeriodo || null,
            limiteUsoCantidad: form.limiteUsoPeriodo ? (Number(form.limiteUsoCantidad) || 1) : null,
            requiereMesNacimiento: Boolean(form.requiereMesNacimiento),
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
  const swatchColor = /^#[0-9A-Fa-f]{6}$/.test(String(form.color || '')) ? form.color : '#ffffff';
  

  const openColorPicker = () => {
    setColorPickerValue(form.color || '#00830e');
    setColorPickerOpen(true);
  };

  const normalizeHex = (v) => {
    if (!v) return null;
    let s = String(v).trim();
    if (!s.startsWith('#')) s = `#${s}`;
    if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
      s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toLowerCase();
    return null;
  };

  const handleApplyColor = () => {
    const normalized = normalizeHex(colorPickerValue);
    if (!normalized) {
      toast.error('Color inválido. Usa formato #RRGGBB');
      return;
    }
    setForm((prev) => ({ ...prev, color: normalized }));
    setColorPickerOpen(false);
  };

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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                label="Color"
                value={form.color}
                onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                helperText="Formato hexadecimal #RRGGBB"
                sx={{ flex: '1 1 auto', maxWidth: 260 }}
              />
              <Box
                onClick={openColorPicker}
                role="button"
                aria-label="Seleccionar color"
                title="Seleccionar color"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  border: '1px solid rgba(0,0,0,0.08)',
                  backgroundColor: swatchColor,
                  cursor: 'pointer',
                  '&:hover': { boxShadow: '0 0 0 4px rgba(0,0,0,0.04)' }
                }}
              />
            </Box>
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

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Reglas de uso
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Frecuencia</InputLabel>
                  <Select
                    value={form.limiteUsoPeriodo}
                    label="Frecuencia"
                    onChange={(event) => setForm((prev) => ({
                      ...prev,
                      limiteUsoPeriodo: event.target.value,
                      limiteUsoCantidad: event.target.value ? (prev.limiteUsoCantidad || '1') : '',
                    }))}
                  >
                    {USO_PERIODO_OPTIONS.map((option) => (
                      <MenuItem key={option.value || 'sin-limite'} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Cantidad permitida"
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  value={form.limiteUsoCantidad}
                  onChange={(event) => setForm((prev) => ({ ...prev, limiteUsoCantidad: event.target.value }))}
                  disabled={!form.limiteUsoPeriodo}
                  helperText="Ejemplo: 1 vez al mes"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.requiereMesNacimiento}
                      onChange={(event) => setForm((prev) => ({ ...prev, requiereMesNacimiento: event.target.checked }))}
                    />
                  }
                  label="Requiere mes de nacimiento"
                />
              </Stack>
            </Box>
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

      {/* Color picker dialog triggered by swatch */}
      <Dialog open={colorPickerOpen} onClose={() => setColorPickerOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Seleccionar color</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <input
              type="color"
              value={colorPickerValue}
              onChange={(e) => setColorPickerValue(e.target.value)}
              style={{ width: '100%', height: 140, border: 'none', padding: 0, background: 'transparent', cursor: 'pointer', borderRadius: 8 }}
            />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Hex"
                value={colorPickerValue}
                onChange={(e) => setColorPickerValue(e.target.value)}
                helperText="Formato #RRGGBB"
                fullWidth
              />
              <Box sx={{ width: 40, height: 40, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)', backgroundColor: colorPickerValue }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setColorPickerOpen(false)} variant="outlined">Cerrar</Button>
          <Button onClick={handleApplyColor} variant="contained">Aplicar</Button>
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
                label="Color"
                value={form.color}
                onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                helperText="Formato hexadecimal #RRGGBB"
                sx={{ flex: '1 1 auto', maxWidth: 260 }}
              />
              <Box
                onClick={openColorPicker}
                role="button"
                aria-label="Seleccionar color"
                title="Seleccionar color"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  border: '1px solid rgba(0,0,0,0.08)',
                  backgroundColor: swatchColor,
                  cursor: 'pointer',
                  '&:hover': { boxShadow: '0 0 0 4px rgba(0,0,0,0.04)' }
                }}
              />
            </Box>
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

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Reglas de uso
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Frecuencia</InputLabel>
                  <Select
                    value={form.limiteUsoPeriodo}
                    label="Frecuencia"
                    onChange={(event) => setForm((prev) => ({
                      ...prev,
                      limiteUsoPeriodo: event.target.value,
                      limiteUsoCantidad: event.target.value ? (prev.limiteUsoCantidad || '1') : '',
                    }))}
                  >
                    {USO_PERIODO_OPTIONS.map((option) => (
                      <MenuItem key={option.value || 'sin-limite'} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Cantidad permitida"
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  value={form.limiteUsoCantidad}
                  onChange={(event) => setForm((prev) => ({ ...prev, limiteUsoCantidad: event.target.value }))}
                  disabled={!form.limiteUsoPeriodo}
                  helperText="Ejemplo: 1 vez al mes"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.requiereMesNacimiento}
                      onChange={(event) => setForm((prev) => ({ ...prev, requiereMesNacimiento: event.target.checked }))}
                    />
                  }
                  label="Requiere mes de nacimiento"
                />
              </Stack>
            </Box>
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
                {tipo.limiteUsoPeriodo && (
                  <Chip
                    size="small"
                    label={tipo.limiteUsoPeriodo === 'mes' ? `1 vez/mes` : `1 vez/año`}
                    color="info"
                    variant="outlined"
                  />
                )}
                {tipo.requiereMesNacimiento && (
                  <Chip size="small" label="Cumpleaños" color="warning" variant="outlined" />
                )}
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
                {tipo.limiteUsoPeriodo && (
                  <Chip
                    size="small"
                    label={tipo.limiteUsoPeriodo === 'mes' ? `1 vez/mes` : `1 vez/año`}
                    color="info"
                    variant="outlined"
                  />
                )}
                {tipo.requiereMesNacimiento && (
                  <Chip size="small" label="Cumpleaños" color="warning" variant="outlined" />
                )}
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
